import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges
} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {TranslateService} from '@ngx-translate/core';
import {finalize, takeUntil} from 'rxjs';
import {KineticsStateService} from '../kinetics/kinetics-state.service';
import {IKineticsLinearization, IKineticsModel, IKineticsModelsConfigurations} from '../kinetics/interface';
import {ErrorDialogComponent} from '../error-dialog/error-dialog.component';
import {RequestCancellationService} from '../../common/request-cancellation.service';
import {ISeedParamOption, SeedParamOption} from '../model-configuration/interface';
import {KineticsModelConfigurationService} from './kinetics-model-configuration.service';
import {
  IKineticsLinearizationGraph,
  IKineticsLinearizationItem,
  IKineticsLinearizationRequest,
  IKineticsLinearizationResponse
} from './interface';

const MEASURED_VARIABLES = ['time', 'qt'];

@Component({
  selector: 'app-kinetics-model-configuration',
  templateUrl: './kinetics-model-configuration.component.html',
  styleUrl: './kinetics-model-configuration.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KineticsModelConfigurationComponent implements OnChanges {
  state = this.stateService.state;
  @Input() modelConfiguration!: IKineticsModelsConfigurations;
  @Output() onSelectedParams = new EventEmitter<IKineticsModelsConfigurations>();

  protected linearizationGraphs: { [modelId: number]: IKineticsLinearizationGraph[] } = {};
  protected runningLinearization = false;
  protected seedParamOptions: ISeedParamOption[] = [];
  protected readonly SeedParamOption = SeedParamOption;
  private currentRequestId: string | null = null;

  constructor(protected stateService: KineticsStateService,
              private linearizationService: KineticsModelConfigurationService,
              private cancellationService: RequestCancellationService,
              private dialog: MatDialog,
              private translateService: TranslateService,
              private changeDetector: ChangeDetectorRef) {
    this.seedParamOptions = [
      {
        name: SeedParamOption.AUTOMATED,
        value: this.translateService.instant('KINETICS_MODEL_CONFIGURATION.AUTOMATED_PARAMS')
      },
      {
        name: SeedParamOption.MANUAL,
        value: this.translateService.instant('KINETICS_MODEL_CONFIGURATION.MANUAL_PARAMS')
      }
    ];
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.cleanLinearizationGraphs(changes);
    this.restorePersistedLinearizations();
  }

  /** El contenido del paso es lazy (`matStepContent`), así que al volver hay que rearmar los gráficos desde el estado. */
  private restorePersistedLinearizations(): void {
    for (const modelId of this.state().selectedModels) {
      const persisted = this.modelConfiguration?.[modelId]?.linearization;
      if (!persisted || this.linearizationGraphs[modelId]?.length) {
        continue;
      }
      this.linearizationGraphs[modelId] = persisted.linearizations.map(
        linearization => this.buildGraph(linearization, persisted.bestResult)
      );
    }
  }

  getModelById(modelId: number): IKineticsModel | undefined {
    return this.state().models.find(model => model._id === modelId);
  }

  getLinearizations(modelId: number): IKineticsLinearization[] {
    return this.getModelById(modelId)?.linearizations ?? [];
  }

  /** Parámetros del modelo que aparecen en las fórmulas x/y y por lo tanto deben conocerse antes de transformar. */
  requiredKnownParams(modelId: number): string[] {
    const model = this.getModelById(modelId);
    if (!model) {
      return [];
    }

    const formulas = this.getLinearizations(modelId)
      .flatMap(linearization => [linearization.parameters?.['x'], linearization.parameters?.['y']])
      .filter((formula): formula is string => !!formula);

    return Object.keys(model.parameters ?? {})
      .filter(name => !MEASURED_VARIABLES.includes(name))
      .filter(name => formulas.some(formula => new RegExp(`\\b${name}\\b`).test(formula)));
  }

  runLinearization(modelId: number): void {
    const kineticSampleId = this.state().kineticsSample?.sample_id;
    const linearizationIds = this.getLinearizations(modelId).map(l => l.linearization_id);

    if (!kineticSampleId || linearizationIds.length === 0) {
      return;
    }

    const request: IKineticsLinearizationRequest = {
      kinetic_sample_id: kineticSampleId,
      models: [{
        model: modelId,
        linearizations: linearizationIds,
        known_params: this.buildKnownParams(modelId),
      }],
      filter: [],
    };

    this.runningLinearization = true;
    this.linearizationGraphs[modelId] = [];
    delete this.modelConfiguration[modelId].linearization;
    this.currentRequestId = `kinetics-linearization-${Date.now()}`;
    const cancellationSubject = this.cancellationService.getCancellationSubject(this.currentRequestId);

    this.linearizationService.runLinearization(request)
      .pipe(
        takeUntil(cancellationSubject),
        finalize(() => {
          this.runningLinearization = false;
          if (this.currentRequestId) {
            this.cancellationService.finishRequest(this.currentRequestId);
            this.currentRequestId = null;
          }
          this.changeDetector.markForCheck();
        })
      )
      .subscribe({
        next: (response: IKineticsLinearizationResponse) => this.applyLinearizationResponse(modelId, response),
        error: (error) => {
          this.modelConfiguration[modelId].automatedParams = false;
          this.dialog.open(ErrorDialogComponent, {
            data: {
              main_message: this.translateService.instant('KINETICS_MODEL_CONFIGURATION.LINEARIZATION_ERROR'),
              error_message: error.message,
            }
          });
        }
      });
  }

  applyLinearizationResponse(modelId: number, response: IKineticsLinearizationResponse): void {
    const result = response.results.find(r => r.model === modelId) ?? response.results[0];
    if (!result) {
      return;
    }

    this.linearizationGraphs[modelId] = result.linearizations.map(
      linearization => this.buildGraph(linearization, result.best_result)
    );
    this.modelConfiguration[modelId].linearization = {
      bestResult: result.best_result,
      linearizations: result.linearizations,
    };

    const best = result.linearizations.find(
      linearization => linearization.status === 'OK' && linearization.id === result.best_result
    );
    if (best) {
      this.fillParamValues(modelId, best);
    }

    this.onSelectedParams.emit(this.modelConfiguration);
  }

  private buildKnownParams(modelId: number): { [name: string]: number } | undefined {
    const knownParams = this.modelConfiguration[modelId]?.knownParams ?? {};
    const entries = Object.entries(knownParams)
      .filter(([, value]) => value !== null && value !== undefined);

    return entries.length ? Object.fromEntries(entries.map(([name, value]) => [name, Number(value)])) : undefined;
  }

  private fillParamValues(modelId: number, linearization: IKineticsLinearizationItem): void {
    for (const parameter of linearization.parameters ?? []) {
      if (this.modelConfiguration[modelId].paramValues[parameter.name]) {
        this.modelConfiguration[modelId].paramValues[parameter.name] = {
          value: parameter.value,
          stderr: parameter.std_err,
        };
      }
    }
  }

  private buildGraph(linearization: IKineticsLinearizationItem, bestResultId: number | null): IKineticsLinearizationGraph {
    const graph: IKineticsLinearizationGraph = {
      id: linearization.id,
      linearizationName: linearization.name,
      status: linearization.status,
      isBestResult: linearization.status === 'OK' && linearization.id === bestResultId,
      reason: linearization.reason,
      parameters: linearization.parameters ?? [],
      statistics: linearization.statistics ?? {},
      assumedParams: Object.entries(linearization.assumed_params ?? {}).map(([name, value]) => ({name, value})),
      droppedPoints: linearization.dropped_points ?? 0,
    };

    if (linearization.status !== 'OK' || !linearization.transformed) {
      return graph;
    }

    const x = linearization.transformed.x;
    const xMin = Math.min(...x);
    const xMax = Math.max(...x);
    const slope = linearization.slope ?? 0;
    const intercept = linearization.intercept ?? 0;

    graph.graph = {
      data: [
        {
          x,
          y: linearization.transformed.y,
          type: 'scatter',
          mode: 'markers',
          name: this.translateService.instant('KINETICS_MODEL_CONFIGURATION.SAMPLE_SERIES'),
          marker: {color: 'black'}
        },
        {
          x: [xMin, xMax],
          y: [slope * xMin + intercept, slope * xMax + intercept],
          type: 'scatter',
          mode: 'line',
          name: this.translateService.instant('KINETICS_MODEL_CONFIGURATION.LINEARIZATION_SERIES'),
          marker: {color: 'blue'}
        },
      ],
      layout: {
        title: '',
        autosize: true,
        xaxis: {title: this.axisLabel(linearization.id, 'x')},
        yaxis: {title: this.axisLabel(linearization.id, 'y')},
      }
    };

    return graph;
  }

  private axisLabel(linearizationId: number, axis: 'x' | 'y'): string {
    const linearization = this.state().models
      .flatMap(model => model.linearizations ?? [])
      .find(l => l.linearization_id === linearizationId);
    return linearization?.parameters?.[axis] ?? axis;
  }

  private cleanLinearizationGraphs(changes: SimpleChanges): void {
    const change = changes['modelConfiguration'];
    if (!change || change.firstChange || change.currentValue === change.previousValue) {
      return;
    }

    const currentModels = Object.keys(change.currentValue ?? {}).map(Number);
    Object.keys(this.linearizationGraphs)
      .map(Number)
      .filter(modelId => !currentModels.includes(modelId))
      .forEach(modelId => delete this.linearizationGraphs[modelId]);
  }

  onParamChange(): void {
    this.onSelectedParams.emit(this.modelConfiguration);
  }

  validateStepsValue(modelId: number): void {
    const value = this.modelConfiguration[modelId].step;
    if (value > 1) {
      this.modelConfiguration[modelId].step = 1;
    } else if (value < 0) {
      this.modelConfiguration[modelId].step = 0;
    } else {
      this.modelConfiguration[modelId].step = Math.round(value * 10) / 10;
    }
  }

  cancelCurrentRequest(): void {
    if (this.currentRequestId) {
      this.cancellationService.cancelRequest(this.currentRequestId);
      this.currentRequestId = null;
    }
  }
}
