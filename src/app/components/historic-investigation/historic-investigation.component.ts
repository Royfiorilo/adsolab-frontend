import {Component} from '@angular/core';
import {InvestigationService} from "./investigation.service";
import {InvestigationResponse, InvestigationVersionsResponse} from "./interface";
import {faArrowUpRightFromSquare, faTrash} from "@fortawesome/free-solid-svg-icons";
import {Router} from "@angular/router";
import {catchError, finalize, firstValueFrom} from "rxjs";
import {ModelSelectorServiceService} from "../model-selector/model-selector-service.service";
import {TranslateService} from "@ngx-translate/core";
import {Model} from "../model-selector/model";
import {CommonUtilsService} from "../../common/common.service";
import {VersionDataService} from "../historic-version/version.service";

@Component({
  selector: 'app-historic-investigation',
  templateUrl: './historic-investigation.component.html',
  styleUrl: './historic-investigation.component.css'
})
export class HistoricInvestigationComponent {
  investigations: InvestigationResponse | undefined;
  models: Model[] = [];
  protected loadingHistoric: boolean = true;

  constructor(private investigationService: InvestigationService, private router: Router,
              private translateService: TranslateService,
              protected commonUtilsService: CommonUtilsService,
              private modelService: ModelSelectorServiceService,
              private versionDataService: VersionDataService
  ) {
  }

  ngOnInit(): void {

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
          this.loadingHistoric = false;
        });
      });

  }

  fetchVersions(investigationId: number): void {
    this.loadingHistoric = true;
    const investigation = this.investigations?.investigations.find(
      (inv: any) => inv.investigation_id === investigationId
    );
    if (investigation && investigation.versions === undefined) {
      this.investigationService.getInvestigationVersions(investigationId).subscribe({
        next: (response: InvestigationVersionsResponse) => {
          investigation.versions = response.versions.sort((a, b) => b.version_id - a.version_id);
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

  protected readonly faArrowUpRightFromSquare = faArrowUpRightFromSquare;
  protected readonly faTrash = faTrash;

  deleteVersion(investigationId: number, versionId: number): void {
    if (!confirm("Al continuar, se borrara la version seleccionada.")) {
      return;
    }

    this.loadingHistoric = true;
    this.investigationService.deleteInvestigationVersion(investigationId, versionId)
      .pipe(finalize(() => this.loadingHistoric = false))
      .subscribe({
        next: (response) => {
          this.investigations?.investigations.forEach(investigation => {
            if (investigation.investigation_id === investigationId) {
              investigation.versions = investigation.versions.filter(
                version => version.version_id !== versionId
              );
            }
          });

        },
        error: (error) => {
          console.error('Error deleting version:', error);
        }
      });
  }

  deleteInvestigation(investigationId: number): void {
    if (!confirm("Al continuar, se borrara la investigacion seleccionada.")) {
      return;
    }

    this.loadingHistoric = true;
    this.investigationService.deleteInvestigation(investigationId)
      .pipe(finalize(() => this.loadingHistoric = false))
      .subscribe({
        next: (response) => {
          this.investigations!.investigations = this.investigations!.investigations.filter(
            investigation => investigation.investigation_id !== investigationId
          );
        },
        error: (error) => {
          console.error('Error deleting investigation:', error);
        }
      });
  }

}
