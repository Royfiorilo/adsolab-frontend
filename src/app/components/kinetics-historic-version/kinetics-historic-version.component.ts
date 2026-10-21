import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {forkJoin} from "rxjs";
import {faArrowLeft, faArrowUpRightFromSquare} from "@fortawesome/free-solid-svg-icons";
import {KineticsModelSelectorService} from "../kinetics-model-selector/kinetics-model-selector.service";
import {IKineticsSavedVersion} from "../kinetics-model-compare/interface";
import {KineticsStateService} from "../kinetics/kinetics-state.service";
import {IKineticsVersion} from "../kinetics-historic/interface";
import {
  KineticsHistoricService,
  toKineticsSample,
  toModelResult,
  toResumeState
} from "../kinetics-historic/kinetics-historic.service";

@Component({
  selector: 'app-kinetics-historic-version',
  templateUrl: './kinetics-historic-version.component.html',
})
export class KineticsHistoricVersionComponent implements OnInit {
  protected readonly faArrowLeft = faArrowLeft;
  protected readonly faResume = faArrowUpRightFromSquare;
  protected investigationId!: number;
  protected versionId!: number;
  protected savedVersion?: IKineticsSavedVersion;
  private version?: IKineticsVersion;
  protected loading = true;
  protected error = false;

  constructor(private route: ActivatedRoute,
              private historicService: KineticsHistoricService,
              private modelService: KineticsModelSelectorService,
              private stateService: KineticsStateService,
              private router: Router) {
  }

  ngOnInit(): void {
    const params = this.route.snapshot.paramMap;
    this.investigationId = Number(params.get('invId'));
    this.versionId = Number(params.get('verId'));
    const sampleId = Number(this.route.snapshot.queryParamMap.get('sample'));

    forkJoin({
      version: this.historicService.getVersion(this.investigationId, this.versionId),
      sample: this.historicService.getSample(sampleId),
      models: this.modelService.getModels(),
    }).subscribe({
      next: ({version, sample, models}) => {
        this.version = version;
        this.savedVersion = {
          sample: toKineticsSample(sample),
          models: models.models,
          results: version.fitted_models.map(toModelResult),
          comparison: version.comparison ?? {heuristic: null, ml: null},
        };
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      },
    });
  }

  canResume(): boolean {
    return !!this.savedVersion && !this.savedVersion.sample.deleted_at;
  }

  resume(): void {
    this.stateService.state.set(toResumeState(this.savedVersion!, this.version?.iterations ?? null,
      this.version?.steps ?? null));
    this.router.navigate(['/kinetics'], {queryParams: {fromHistoric: true}});
  }
}
