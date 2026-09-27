import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {Router} from "@angular/router";
import {animate, state, style, transition, trigger} from "@angular/animations";
import {TranslateService} from "@ngx-translate/core";
import {MatDialog} from "@angular/material/dialog";
import {MatSnackBar} from "@angular/material/snack-bar";
import {MatPaginatorIntl, PageEvent} from "@angular/material/paginator";
import {faArrowUpRightFromSquare, faTrash} from "@fortawesome/free-solid-svg-icons";
import {finalize} from "rxjs";
import {AuthService} from "../../common/auth.service";
import {CustomTablePaginator} from "../../common/custom-table-paginator";
import {SnackBarComponent} from "../snack-bar/snack-bar.component";
import {ErrorDialogComponent} from "../error-dialog/error-dialog.component";
import {KineticsModelSelectorService} from "../kinetics-model-selector/kinetics-model-selector.service";
import {IKineticsModel} from "../kinetics/interface";
import {IKineticsFittedParameter} from "../kinetics-model-compare/interface";
import {KineticsHistoricService} from "./kinetics-historic.service";
import {IKineticsFittedModel, IKineticsInvestigation, IKineticsVersion} from "./interface";

type InvestigationScope = 'all' | 'mine';

@Component({
  selector: 'app-kinetics-historic',
  templateUrl: './kinetics-historic.component.html',
  styleUrl: './kinetics-historic.component.css',
  providers: [{provide: MatPaginatorIntl, useClass: CustomTablePaginator}],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class KineticsHistoricComponent implements OnInit {
  @ViewChild('deleteInvestigationDialog') private deleteInvestigationDialog!: TemplateRef<any>;
  @ViewChild('deleteVersionDialog') private deleteVersionDialog!: TemplateRef<any>;

  protected readonly faArrowUpRightFromSquare = faArrowUpRightFromSquare;
  protected readonly faTrash = faTrash;
  protected readonly displayedColumns = ['kinetic_investigation_id', 'user', 'title', 'description', 'actions'];

  protected investigations: IKineticsInvestigation[] = [];
  protected rows: IKineticsInvestigation[] = [];
  protected models: IKineticsModel[] = [];
  protected expanded: IKineticsInvestigation | null = null;
  protected loading = true;
  protected scope: InvestigationScope = 'all';
  protected filter = '';
  protected total = 0;
  protected pageIndex = 0;
  protected pageSize = 10;

  constructor(private historicService: KineticsHistoricService,
              private modelService: KineticsModelSelectorService,
              private authService: AuthService,
              private router: Router,
              private translate: TranslateService,
              private dialog: MatDialog,
              private snackBar: MatSnackBar) {
  }

  ngOnInit(): void {
    this.modelService.getModels().subscribe({
      next: response => this.models = response.models,
      error: () => this.openSnackBar('KINETICS_HISTORIC.ERROR_LOADING_MODELS'),
    });
    this.loadInvestigations();
  }

  loadInvestigations(): void {
    this.loading = true;
    this.expanded = null;
    const userId = this.scope === 'mine' ? this.authService.user()?.id : undefined;
    this.historicService.getInvestigations(this.pageIndex + 1, this.pageSize, userId)
      .pipe(finalize(() => this.loading = false))
      .subscribe({
        next: response => {
          this.investigations = response.investigations;
          this.total = response.total;
          this.applyFilter();
        },
        error: () => {
          this.investigations = [];
          this.applyFilter();
          this.openSnackBar('KINETICS_HISTORIC.ERROR_LOADING_INVESTIGATIONS');
        },
      });
  }

  onScopeChange(scope: InvestigationScope): void {
    this.scope = scope;
    this.pageIndex = 0;
    this.loadInvestigations();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadInvestigations();
  }

  onFilterChange(event: Event): void {
    this.filter = (event.target as HTMLInputElement).value.trim().toLowerCase();
    this.applyFilter();
  }

  // Filters the current page only, like the equilibrium historic.
  private applyFilter(): void {
    if (!this.filter) {
      this.rows = this.investigations;
      return;
    }
    this.rows = this.investigations.filter(investigation =>
      investigation.kinetic_investigation_id.toString() === this.filter
      || [investigation.sample?.title, investigation.sample?.description, investigation.user?.email]
        .some(field => field?.toLowerCase().includes(this.filter))
    );
  }

  toggleRow(investigation: IKineticsInvestigation): void {
    this.expanded = this.expanded === investigation ? null : investigation;
    if (this.expanded && investigation.versions === undefined) {
      this.fetchVersions(investigation);
    }
  }

  private fetchVersions(investigation: IKineticsInvestigation): void {
    this.historicService.getVersions(investigation.kinetic_investigation_id).subscribe({
      next: response => investigation.versions = response.versions.sort((a, b) => b.version_id - a.version_id),
      error: () => {
        investigation.versions = [];
        this.openSnackBar('KINETICS_HISTORIC.ERROR_LOADING_VERSIONS');
      },
    });
  }

  isOwner(investigation: IKineticsInvestigation): boolean {
    const user = this.authService.user();
    return !!user && user.id === investigation.user_id;
  }

  getModelName(modelId: number): string {
    return this.models.find(model => model._id === modelId)?.name ?? `#${modelId}`;
  }

  // A winner only when heuristic and ML agree.
  bestModelOverall(version: IKineticsVersion): string | undefined {
    const heuristic = version.comparison?.heuristic?.best_model;
    const ml = version.comparison?.ml?.best_model;
    if (heuristic === undefined || ml === undefined || heuristic !== ml) {
      return undefined;
    }
    return this.getModelName(heuristic);
  }

  // created_at comes from utcnow() without an offset.
  createdAt(version: IKineticsVersion): Date {
    const hasOffset = /(Z|[+-]\d{2}:?\d{2})$/.test(version.created_at);
    return new Date(hasOffset ? version.created_at : `${version.created_at}Z`);
  }

  bestParameters(fittedModel: IKineticsFittedModel): IKineticsFittedParameter[] {
    const methods = fittedModel.adjustment_methods ?? [];
    const best = methods.find(method => method.name === fittedModel.best_adjust) ?? methods[0];
    return best?.parameters ?? [];
  }

  openVersion(investigation: IKineticsInvestigation, versionId: number): void {
    this.router.navigate(
      ['/kinetics/historic', investigation.kinetic_investigation_id, 'version', versionId],
      {queryParams: {sample: investigation.kinetic_sample_id}}
    );
  }

  openDeleteInvestigationDialog(investigationId: number, event: Event): void {
    event.stopPropagation();
    this.dialog.open(this.deleteInvestigationDialog, {data: {investigationId}});
  }

  openDeleteVersionDialog(investigationId: number, versionId: number): void {
    this.dialog.open(this.deleteVersionDialog, {data: {investigationId, versionId}});
  }

  // Reload so the next item fills the gap; step back if the page was emptied.
  deleteInvestigation(investigationId: number): void {
    this.loading = true;
    this.historicService.deleteInvestigation(investigationId).subscribe({
      next: () => {
        if (this.investigations.length === 1 && this.pageIndex > 0) {
          this.pageIndex--;
        }
        this.loadInvestigations();
      },
      error: error => {
        this.loading = false;
        this.handleDeleteError(error);
      },
    });
  }

  hasNoInvestigations(): boolean {
    return !this.loading && this.investigations.length === 0;
  }

  hasNoFilterMatches(): boolean {
    return !this.loading && this.investigations.length > 0 && this.rows.length === 0;
  }

  deleteVersion(investigationId: number, versionId: number): void {
    const investigation = this.investigations.find(
      candidate => candidate.kinetic_investigation_id === investigationId
    );
    this.historicService.deleteVersion(investigationId, versionId).subscribe({
      next: () => {
        if (investigation?.versions) {
          investigation.versions = investigation.versions.filter(version => version.version_id !== versionId);
        }
      },
      error: error => this.handleDeleteError(error),
    });
  }

  private handleDeleteError(error: any): void {
    if (error.status === 403) {
      this.openSnackBar('VERSIONS.NOT_AUTHORIZED');
      return;
    }
    this.dialog.open(ErrorDialogComponent, {
      data: {
        main_message: this.translate.instant('ERROR.UNEXPECTED_ERROR'),
        error_message: error.error?.message ?? error.message,
      }
    });
  }

  private openSnackBar(key: string): void {
    this.snackBar.openFromComponent(SnackBarComponent, {
      duration: 3000,
      verticalPosition: 'top',
      data: {message: this.translate.instant(key)},
    });
  }
}
