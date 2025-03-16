import {AfterViewInit, Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {InvestigationService} from "./investigation.service";
import {Investigation, InvestigationResponse} from "./interface";
import {faArrowUpRightFromSquare, faTrash} from "@fortawesome/free-solid-svg-icons";
import {Router} from "@angular/router";
import {catchError, finalize, firstValueFrom} from "rxjs";
import {ModelSelectorServiceService} from "../model-selector/model-selector-service.service";
import {TranslateService} from "@ngx-translate/core";
import {Model} from "../model-selector/model";
import {CommonUtilsService} from "../../common/common.service";
import {VersionDataService} from "../historic-version/version.service";
import {MatDialog} from "@angular/material/dialog";
import {MatTableDataSource} from "@angular/material/table";
import {MatPaginator} from "@angular/material/paginator";
import {animate, state, style, transition, trigger} from "@angular/animations";

@Component({
  selector: 'app-historic-investigation',
  templateUrl: './historic-investigation.component.html',
  styleUrl: './historic-investigation.component.css',
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
  protected loadingHistoric: boolean = true;

  // Table properties
  dataSource = new MatTableDataSource<Investigation>([]);
  displayedColumns: string[] = ['actions', 'investigation_id', 'title', 'description'];
  expandedElement: Investigation | null = null;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild("deleteVersionDialog") deleteVersionDialog!: TemplateRef<any>;
  @ViewChild("deleteInvestigationDialog") deleteInvestigationDialog!: TemplateRef<any>;

  constructor(
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
    if (this.dataSource) {
      this.dataSource.paginator = this.paginator;
    }
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
        this.investigationService.getInvestigations().subscribe((data: InvestigationResponse) => {
          this.investigations = data;
          this.dataSource.data = data.investigations;
          setTimeout(() => {
            if (this.paginator) {
              this.dataSource.paginator = this.paginator;
            }
          });
          this.loadingHistoric = false;
        });
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
          this.dataSource.data = [...this.dataSource.data];
          this.loadingHistoric = false;
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
          console.error('Error deleting investigation:', error);
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
          console.error('Error deleting version:', error);
        }
      });
  }

  protected readonly faArrowUpRightFromSquare = faArrowUpRightFromSquare;
  protected readonly faTrash = faTrash;
}
