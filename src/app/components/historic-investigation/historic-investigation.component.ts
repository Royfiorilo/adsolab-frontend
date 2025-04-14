import {AfterViewInit, Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {InvestigationService} from "./investigation.service";
import {Investigation, InvestigationResponse} from "./interface";
import {faArrowUpRightFromSquare, faTrash} from "@fortawesome/free-solid-svg-icons";
import {Router} from "@angular/router";
import {catchError, finalize, firstValueFrom, merge, of} from "rxjs";
import {ModelSelectorServiceService} from "../model-selector/model-selector-service.service";
import {TranslateService} from "@ngx-translate/core";
import {Model} from "../model-selector/model";
import {CommonUtilsService} from "../../common/common.service";
import {VersionDataService} from "../historic-version/version.service";
import {MatDialog} from "@angular/material/dialog";
import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator, MatPaginatorIntl} from "@angular/material/paginator";
import {animate, state, style, transition, trigger} from "@angular/animations";
import {CustomTablePaginator} from "../../common/custom-table-paginator";
import {map, startWith, switchMap} from "rxjs/operators";
import {SnackBarComponent} from "../snack-bar/snack-bar.component";
import {MatSnackBar} from "@angular/material/snack-bar";
import {AuthService} from "../../common/auth.service";
import {MatTabChangeEvent} from "@angular/material/tabs";
import {ErrorDialogComponent} from "../error-dialog/error-dialog.component";

@Component({
  selector: 'app-historic-investigation',
  templateUrl: './historic-investigation.component.html',
  styleUrl: './historic-investigation.component.css',
  providers: [{provide: MatPaginatorIntl, useClass: CustomTablePaginator}],

  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class HistoricInvestigationComponent implements OnInit, AfterViewInit {
  investigations: InvestigationResponse | undefined;
  models: Model[] = [];
  protected resultsLength: number = 0;
  protected loadingHistoric: boolean = true;

  dataSource = new MatTableDataSource<Investigation>([]);
  allInvestigationsDisplayedColumns: string[] = ['investigation_id', 'user', 'title', 'description'];
  myInvestigationsDisplayedColumns: string[] = ['investigation_id', 'user', 'title', 'description', 'actions'];
  expandedElement: Investigation | null = null;
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild("deleteVersionDialog") deleteVersionDialog!: TemplateRef<any>;
  @ViewChild("deleteInvestigationDialog") deleteInvestigationDialog!: TemplateRef<any>;

  constructor(private authService: AuthService,
              private _snackBar: MatSnackBar,
              private investigationService: InvestigationService,
              private router: Router,
              private translateService: TranslateService,
              protected commonUtilsService: CommonUtilsService,
              private modelService: ModelSelectorServiceService,
              private versionDataService: VersionDataService,
              private dialog: MatDialog
  ) {
  }

  ngOnInit(): void {
    this.loadData();

  }

  ngAfterViewInit() {
    this.setupPaginator();
  }

  loadData(): void {
    this.modelService
      .getModels()
      .pipe(
        catchError(async (error) => {
          this.loadingHistoric = false;
          throw await firstValueFrom(
            this.translateService.get('MODEL_SELECTOR.ERROR_LOADING_MODELS', error)
          );
        })
      )
      .subscribe((response) => {
        this.models = response.models;
      });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  toggleRow(element: Investigation) {
    this.expandedElement = this.expandedElement === element ? null : element;
    if (this.expandedElement) {
      this.fetchVersions(element.investigation_id);
    }
  }

  fetchVersions(investigationId: number): void {
    this.loadingHistoric = true;
    const investigation = this.investigations?.investigations.find(
      (inv: any) => inv.investigation_id === investigationId
    );
    if (investigation && investigation.versions === undefined) {
      this.investigationService.getInvestigationVersions(investigationId).subscribe({
        next: (response) => {
          investigation.versions = response.versions.sort((a, b) => b.version_id - a.version_id);
          this.dataSource.data.forEach(item => {
            if (item.versions && Array.isArray(item.versions)) {
              item.versions.forEach(version => {
                if (version.created_at) {
                  version.created_at = new Date(version.created_at).toLocaleString(
                    this.getDateFormatLang(),
                    {
                      hour12: false
                    });
                }
              });
            }
          });
          this.dataSource.data = [...this.dataSource.data];
          this.loadingHistoric = false;
          setTimeout(() => {
            if (this.paginator) {
              this.dataSource.paginator = this.paginator;
            }
          });
        },
        error: (error) => {
          console.error('Error fetching versions:', error);
          this.loadingHistoric = false;
        }
      });
    } else {
      this.loadingHistoric = false;
    }
  }

  private getDateFormatLang() {

    const langMap: { [key: string]: string } = {
      'es': 'es-ES',
      'en': 'en-US'
    }

    return langMap[this.translateService.currentLang];
  }

  navigateToVersion(investigationId: number, versionId: number): void {
    const investigation = this.investigations?.investigations.find(inv => inv.investigation_id === investigationId);
    const version = investigation?.versions.find(v => v.version_id === versionId);
    const sample = investigation?.sample;
    if (sample) {
      this.versionDataService.setSampleData(sample);
    }
    if (version) {
      this.versionDataService.setVersionData(version);
      this.router.navigate(['/historic/version', investigationId, versionId]);
    }
  }

  setupPaginator() {
    merge(this.paginator.page)
      .pipe(
        startWith({}),
        switchMap(() => {
          this.loadingHistoric = true;
          return this.investigationService.getInvestigations(this.paginator.pageIndex + 1, this.paginator.pageSize)
            .pipe(catchError(() => {
              this._snackBar.openFromComponent(SnackBarComponent, {
                duration: 3000,
                verticalPosition: 'top',
                data: {
                  message: this.translateService.instant('VERSIONS.ERROR_LOADING_INVESTIGATIONS')
                }
              });
              return of(null);
            }));
        }),
        map(data => {
          this.loadingHistoric = false;

          if (data === null) {
            return [];
          }

          this.resultsLength = data.total;
          this.investigations = data;
          return data.investigations;
        }),
      )
      .subscribe(data => (this.dataSource.data = data));

    if (this.dataSource) {
      this.dataSource.paginator = this.paginator;
    }
  }

  openDeleteInvestigationDialog(investigationId: number, event: Event) {
    event.stopPropagation();
    this.dialog.open(this.deleteInvestigationDialog, {
      data: {
        investigationId: investigationId,
      }
    });
  }

  openDeleteVersionDialog(investigationId: number, versionId: number, event: Event) {
    event.stopPropagation();
    this.dialog.open(this.deleteVersionDialog, {
      data: {
        investigationId: investigationId,
        versionId: versionId,
      }
    });
  }

  deleteInvestigation(investigationId: number): void {
    this.loadingHistoric = true;
    this.investigationService.deleteInvestigation(investigationId)
      .pipe(finalize(() => this.loadingHistoric = false))
      .subscribe({
        next: () => {
          if (this.investigations) {
            this.investigations.investigations = this.investigations.investigations.filter(
              investigation => investigation.investigation_id !== investigationId
            );
            this.dataSource.data = this.investigations.investigations;
          }
        },
        error: (error) => {
          if (error.status === 403) {
            this._snackBar.openFromComponent(SnackBarComponent, {
              duration: 3000,
              verticalPosition: 'top',
              data: {
                message: this.translateService.instant('VERSIONS.NOT_AUTHORIZED')
              }
            });
          } else {
            this.dialog.open(ErrorDialogComponent, {
              data: {
                main_message: this.translateService.instant('ERROR.UNEXPECTED_ERROR'),
                error_message: error.message,
              }
            })
          }
        }
      });
  }

  deleteVersion(investigationId: number, versionId: number): void {
    this.loadingHistoric = true;
    this.investigationService.deleteInvestigationVersion(investigationId, versionId)
      .pipe(finalize(() => this.loadingHistoric = false))
      .subscribe({
        next: () => {
          if (this.investigations) {
            this.investigations.investigations.forEach(investigation => {
              if (investigation.investigation_id === investigationId && investigation.versions) {
                investigation.versions = investigation.versions.filter(
                  version => version.version_id !== versionId
                );
              }
            });
            this.dataSource.data = [...this.dataSource.data];
          }
        },
        error: (error) => {
          if (error.status === 403) {
            this._snackBar.openFromComponent(SnackBarComponent, {
              duration: 3000,
              verticalPosition: 'top',
              data: {
                message: this.translateService.instant('VERSIONS.NOT_AUTHORIZED')
              }
            });
          } else {
            this.dialog.open(ErrorDialogComponent, {
              data: {
                main_message: this.translateService.instant('ERROR.UNEXPECTED_ERROR'),
                error_message: error.message,
              }
            })
          }
        }
      });
  }

  onTabChange(event: MatTabChangeEvent) {
    if (event.index === 1) {
      this.dataSource.data = this.dataSource.data.filter(investigation => {
        return investigation.user.id === this.authService.user()?.id
      })
    } else {
      this.setupPaginator()

    }
  }

  protected readonly faArrowUpRightFromSquare = faArrowUpRightFromSquare;
  protected readonly faTrash = faTrash;

  isLoggedUserInvestigation(user_id: number) {

    if (this.authService.user()) {
      return user_id === this.authService.user()?.id
    } else {
      return false
    }

  }
}
