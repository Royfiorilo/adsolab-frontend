import {Component} from '@angular/core';
import {InvestigationService} from "./investigation.service";
import {InvestigationResponse, InvestigationVersionsResponse} from "./interface";
import {faArrowUpRightFromSquare} from "@fortawesome/free-solid-svg-icons";
import {Router} from "@angular/router";
import {catchError, firstValueFrom} from "rxjs";
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
                    throw await firstValueFrom(
                        this.translateService.get('MODEL_SELECTOR.ERROR_LOADING_MODELS', error)
                    );
                })
            )
            .subscribe((response) => {
                this.models = response.models;
                this.investigationService.getInvestigations().subscribe((data: InvestigationResponse) => {
                    this.investigations = data;
                });
            });

    }

    fetchVersions(investigationId: number): void {
        const investigation = this.investigations?.investigations.find(
            (inv: any) => inv.investigation_id === investigationId
        );
        if (investigation && investigation.versions === undefined) {
            this.investigationService.getInvestigationVersions(investigationId).subscribe({
                next: (response: InvestigationVersionsResponse) => {
                    investigation.versions = response.versions;
                },
                error: (error) => {
                    console.error('Error fetching versions:', error);
                }
            });
        }

    }

    navigateToVersion(investigationId: number, versionId: number): void {
        const investigation = this.investigations?.investigations.find(inv => inv.investigation_id === investigationId);
        const version = investigation?.versions.find(v => v.version_id === versionId);
        if (version) {
            this.versionDataService.setVersionData(version);
            this.router.navigate(['/historic/version', investigationId, versionId]);
        }
    }

    protected readonly faArrowUpRightFromSquare = faArrowUpRightFromSquare;


}
