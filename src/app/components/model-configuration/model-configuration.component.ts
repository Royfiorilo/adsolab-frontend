import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  TemplateRef,
  viewChild
} from '@angular/core';
import {Model} from "../model-selector/model";
import {ModelConfigurationService} from "./model-configuration.service";
import {
  ILinearizationGraph,
  ILinearizationRequest,
  IPredictionRequest,
  IPredictionResponse,
  ISeedParamOption,
  SeedParamOption
} from "./interface";
import {faInfoCircle} from "@fortawesome/free-solid-svg-icons";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {CommonUtilsService} from "../../common/common.service";
import {IModelsConfigurations} from "../../common/common.interface";
import {finalize, firstValueFrom, takeUntil} from "rxjs";
import {MatDialog} from "@angular/material/dialog";
import {ErrorDialogComponent} from "../error-dialog/error-dialog.component";
import {TranslateService} from "@ngx-translate/core";
import {StateService} from "../investigation/state.service";
import {MatAccordion} from "@angular/material/expansion";
import {RequestCancellationService} from "../../common/request-cancellation.service";

@Component({
  selector: 'app-model-configuration',
  templateUrl: './model-configuration.component.html',
  styleUrl: './model-configuration.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ModelConfigurationComponent implements OnChanges, AfterViewInit {
  state = this.stateService.state;
  @Input() modelConfiguration!: IModelsConfigurations;
  @Output() onSelectedParams = new EventEmitter<IModelsConfigurations>();
  protected linearizationGraphs: { [key: number]: { graphs: ILinearizationGraph[], error?: string } } = {};
  private modalService = inject(NgbModal);
  protected runningLinearization: boolean = false;
  protected seedParamOptions: ISeedParamOption[] = []
  private currentRequestId: string | null = null;
  accordion = viewChild.required(MatAccordion);

  constructor(private modelConfigurationService: ModelConfigurationService,
              protected commonUtilsService: CommonUtilsService,
              private dialog: MatDialog, private translateService: TranslateService,
              protected stateService: StateService, private cancellationService: RequestCancellationService) {

  }

  async ngAfterViewInit() {

    this.seedParamOptions.push({
      name: SeedParamOption.AUTOMATED,
      value: await firstValueFrom(this.translateService.get('MODEL_CONFIGURATION.AUTOMATED_PARAMS'))
    });

    this.seedParamOptions.push({
      name: SeedParamOption.MANUAL,
      value: await firstValueFrom(this.translateService.get('MODEL_CONFIGURATION.MANUAL_PARAMS'))
    });

  }

  ngOnChanges(changes: SimpleChanges) {

    this.cleanLinearizationGraphs(changes);

  }

  private cleanLinearizationGraphs(changes: SimpleChanges) {
    if (changes['modelConfiguration'] &&
      !changes['modelConfiguration'].firstChange &&
      changes['modelConfiguration'].currentValue !== changes['modelConfiguration'].previousValue) {

      const currentModels = Object.keys(changes['modelConfiguration'].currentValue).map(Number);
      const previousModels = changes['modelConfiguration'].previousValue
        ? Object.keys(changes['modelConfiguration'].previousValue).map(Number)
        : [];

      let modelSelectionDiff = [
        ...currentModels.filter(modelId => !previousModels.includes(modelId)),
        ...previousModels.filter(modelId => !currentModels.includes(modelId))
      ];

      modelSelectionDiff.forEach(modelId => delete this.linearizationGraphs[modelId]);
    }
  }

  open(content: TemplateRef<any>) {
    this.modalService.open(content)
  }

  predictSeeds(modelId: number) {
    let request: IPredictionRequest = {
      sample_id: this.state().investigation?.sample.sample_id as number, models: [{model: modelId, linearizations: []}]
    };
    this.runningLinearization = true;

    this.modelConfigurationService.runPrediction(request).subscribe({
      error: async (error) => {
        this.runningLinearization = false;
        this.dialog.open(ErrorDialogComponent, {
          data: {
            main_message: await firstValueFrom(this.translateService.get('MODEL_CONFIGURATION.PREDICTION_ERROR')),
            error_message: error.message,
          }
        });
        this.modelConfiguration[modelId].automatedParams = false;

      },
      next: (response: IPredictionResponse) => {
        let responseSeeds = response.results[0].seeds;
        for (const seed of responseSeeds) {
          this.modelConfiguration[modelId].paramValues[seed.name] = {
            stderr: 0,
            value: seed.value
          }
        }


        this.runningLinearization = false;


        this.onSelectedParams.emit(this.modelConfiguration);
      }
    });
  }


  runLinearization(modelId: number) {
    let model: Model = this.commonUtilsService.getModelById(modelId, this.state().models);
    if (this.state().investigation) {
      let request: ILinearizationRequest = {
        sample_id: this.state().investigation?.sample.sample_id as number, models: [{ //As number porque a esta altura tengo al certeza de que viene con un valor
          model: model._id,
          linearizations: model.linearizations.map(linearization => linearization.linearization_id)
        }]
      };

      this.runningLinearization = true;

      this.linearizationGraphs[modelId] = {
        graphs: []
      }

      this.currentRequestId = `request-${Date.now()}`;
      const cancellationSubject = this.cancellationService.getCancellationSubject(this.currentRequestId);

      this.modelConfigurationService.runLinearization(request)
        .pipe(
          takeUntil(cancellationSubject), // This will cancel the subscription when cancellationSubject emits
          finalize(() => {
            this.runningLinearization = false;
            if (this.currentRequestId) {
              this.cancellationService.finishRequest(this.currentRequestId);
              this.currentRequestId = null;
            }
          })
        )
        .subscribe({
          error: async (error) => {

            this.runningLinearization = false;
            this.dialog.open(ErrorDialogComponent, {
              data: {
                main_message: await firstValueFrom(this.translateService.get('MODEL_CONFIGURATION.LINEARIZATION_ERROR')),
                error_message: error.message,
              }
            });
            this.modelConfiguration[modelId].automatedParams = false;

          },
          next: (response) => {

            this.runningLinearization = false;

            this.linearizationGraphs[model._id].graphs = [];
            let linearizations = response.results[0].linearizations;

            for (const linearization of linearizations) {

              let slope: number = linearization.slope;
              let intercept: number = linearization.intercept;
              let xTransformed = linearization.transformed.x;
              let xMin: number = this.getMinValue(xTransformed!);
              let xMax: number = this.getMaxValue(xTransformed!);
              let linearizationGraph: ILinearizationGraph = {
                parameters: linearization.parameters,
                statistics: linearization.statistics,
                isBestResult: linearization.id === +response.results[0].best_result,
                linearizationName: linearization.name,
                graph: {
                  data: [
                    {
                      x: xTransformed,
                      y: linearization.transformed.y,
                      type: 'scatter',
                      mode: 'markers',
                      name: 'Muestra',
                      marker: {color: 'black'}
                    },
                    {
                      x: [xMin, xMax],
                      y: [(slope * xMin + intercept), (slope * xMax + intercept)],
                      type: 'scatter',
                      mode: 'line',
                      name: 'Linealización',
                      marker: {color: 'blue'}
                    },
                  ],
                  layout: {title: '', autosize: true, xaxis: {title: 'Ce'}, yaxis: {title: 'Qe'}}
                }
              }

              //asign param values
              if (linearizationGraph.isBestResult) {
                for (const parameter of linearization.parameters) {
                  this.modelConfiguration[modelId].paramValues[parameter.name] = {
                    value: parameter.value,
                    stderr: parameter.std_err
                  }
                }
              }

              this.linearizationGraphs[modelId].graphs.push(linearizationGraph);
            }

            this.onSelectedParams.emit(this.modelConfiguration);
          }
        });
    }
  }

  private getMaxValue(numbers: number[]) {
    return Math.max(...numbers);
  }

  private getMinValue(numbers: number[]) {
    return Math.min(...numbers);
  }

  protected readonly faInfoCircle = faInfoCircle;

  onChange(event: Event, modelId: number, key: string) {

    this.onSelectedParams.emit(this.modelConfiguration)

  }


  protected readonly SeedParamOption = SeedParamOption;

  cancelCurrentRequest(): void {
    if (this.currentRequestId) {
      this.cancellationService.cancelRequest(this.currentRequestId);
      this.currentRequestId = null;
    }
  }
}
