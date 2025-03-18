import {Component, Input, QueryList, SimpleChanges, ViewChild, ViewChildren} from '@angular/core';
import {CommonUtilsService} from "../../common/common.service";
import {
  AllResultsViewOption,
  ComparisonViewOption,
  IComparison,
  INoLinearAdjustmentErrorResult,
  INoLinearAdjustmentSuccessResult,
  INoLinearRequest,
  INoLinearRequestModel,
  INoLinearRequestSeed,
  INoLinearResponse,
  IResiduals,
  IRidgeSaveRequest,
  ISaveRequest,
  Ridge
} from "./interface";
import {ModelCompareService} from "./model-compare.service";
import {IGraph, IModelsConfigurations} from "../../common/common.interface";
import {MatAccordion} from "@angular/material/expansion";
import {faCloudArrowUp} from "@fortawesome/free-solid-svg-icons";
import {MatDialog} from "@angular/material/dialog";
import {ErrorDialogComponent} from "../error-dialog/error-dialog.component";
import {finalize, firstValueFrom, takeUntil} from "rxjs";
import {TranslateService} from "@ngx-translate/core";
import {PlotlyComponent} from "angular-plotly.js";
import {StateService} from "../investigation/state.service";
import {MatSnackBar} from "@angular/material/snack-bar";
import {SnackBarComponent} from "../snack-bar/snack-bar.component";
import {RequestCancellationService} from "../../common/request-cancellation.service";


@Component({
  selector: 'app-model-compare',
  templateUrl: './model-compare.component.html',
  styleUrl: './model-compare.component.css',
})
export class ModelCompareComponent {
  @ViewChildren(MatAccordion) accordions!: QueryList<MatAccordion>;
  @ViewChild('comparisonPlot') comparisonPlot!: PlotlyComponent;
  @Input() modelConfiguration!: IModelsConfigurations;
  protected noLinearResults: {
    [key: number]: {
      bestAdjustment: string,
      successful_fits: INoLinearAdjustmentSuccessResult[],
      error_fits: INoLinearAdjustmentErrorResult[]
    };
  } = {};
  protected noLinearCompareResult: IComparison | undefined;
  protected runningNoLinearAdjustment: boolean = true;
  protected savingInvestigation: boolean = false;
  protected summaryGraph: { [key: number]: IGraph } = {};
  protected compareGraph: IGraph | undefined;
  protected toggleValue: string = 'results';
  protected selectedAllResultsViewOption: AllResultsViewOption = AllResultsViewOption.SIMPLIFIED;
  protected selectedComparisonLayout: ComparisonViewOption = ComparisonViewOption.TWO_COLUMNS;
  protected allResultsViewOption = AllResultsViewOption;
  protected comparisonViewOptions = ComparisonViewOption;
  protected selectedModelsChanged: boolean = false;
  protected ridgeResult: Ridge | undefined;
  protected xForCurvePlot: number[] = [];
  protected noLinearResponse: INoLinearResponse | undefined;
  protected noLinearFailed: boolean = false;
  private currentRequestId: string | null = null;
  state = this.stateService.state;

  private colorByMethod: { [key: string]: string } = {
    cg: "blue",
    leastsq: "#8f3237",
    cobyla: "green",
    freundlich: "orange",
    langmuir: "green"
  }

  constructor(protected stateService: StateService,
              protected commonUtilsService: CommonUtilsService,
              protected modelCompareService: ModelCompareService,
              private dialog: MatDialog,
              private translateService: TranslateService,
              private _snackBar: MatSnackBar, private cancellationService: RequestCancellationService) {
  }

  ngOnInit() {

    this.runNonLinearModels();

  }

  ngOnChanges(changes: SimpleChanges) {


    //TODO: fix
    if (changes['selectedModels'] && changes['selectedModels'].currentValue !== changes['selectedModels'].previousValue) {
      this.selectedModelsChanged = true;
    }

    if (changes['stepId'] && !changes['stepId'].firstChange && changes['stepId'].currentValue === 3 && this.selectedModelsChanged) {
      this.runNonLinearModels();
    }

  }

  bestTransformedValue(modelId: number, value: number): number {
    const adjustments = this.noLinearResults[modelId].successful_fits;
    const bestAdjustment = this.noLinearResults[modelId]?.bestAdjustment;
    const bestFit = adjustments.find(
      (adjustment) => adjustment.adjustment_name === bestAdjustment
    );

    let index = bestFit?.graph.data[0]?.x.indexOf(value);

    return bestFit && index ? bestFit?.graph.data[0]?.y[index] : 0;
  }

  parseResiduals(residualValue: number): string | number {
    if (residualValue === 0) {
      return "False"
    } else if (residualValue === 1) {
      return "True"
    } else {
      return residualValue
    }
  }

  getStatisticsRows(): string[] {
    const sampleStats = this.noLinearResults[this.state().selectedModels[0]]?.successful_fits[0]?.statistics || {};
    return Object.keys(sampleStats);
  }

  getResidualsRows(): string[] {
    const sampleResiduals = this.noLinearResults[this.state().selectedModels[0]]?.successful_fits[0]?.residuals || {};
    return sampleResiduals && sampleResiduals.analysis ? Object.keys(sampleResiduals.analysis) : [];
  }

  bestResidualValue(modelId: number, residualName: string): number {
    const adjustments = this.noLinearResults[modelId].successful_fits;
    const bestAdjustment = this.noLinearResults[modelId]?.bestAdjustment;
    const bestFit = adjustments.find(
      (adjustment) => adjustment.adjustment_name === bestAdjustment
    );
    return bestFit ? (bestFit.residuals.analysis as any)[residualName] : 0
  }


  bestStatisticValue(modelId: number, statName: string): number {
    const adjustments = this.noLinearResults[modelId].successful_fits;
    const bestAdjustment = this.noLinearResults[modelId]?.bestAdjustment;
    const bestFit = adjustments.find(
      (adjustment) => adjustment.adjustment_name === bestAdjustment
    );
    return bestFit ? (bestFit.statistics as any)[statName] : 0
  }

  toggleChange(value: string) {
    this.toggleValue = value;
  }

  saveInvestigation() {

    this.savingInvestigation = true;


    let investigationId = this.state().investigation?.investigation_id ? this.state().investigation?.investigation_id : undefined;
    const response = this.noLinearResponse as INoLinearResponse;

    const ridgeRequest: IRidgeSaveRequest = {
      best_model: response.comparison.ridge.best_model,
      residuals: response.comparison.ridge.residuals.analysis,
      results: response.comparison.ridge.results,
      statistics: response.comparison.ridge.statistics,
    };
    let sample_id = this.state().investigation?.sample.sample_id!

    let request: ISaveRequest = {
      investigation_id: investigationId,
      sample_id: sample_id,
      comparison: {
        heuristic: response.comparison.heuristic,
        ridge: ridgeRequest,
      },
      results: response.results.map(result => {
        const modelId = result.model;
        const seeds: INoLinearRequestSeed[] = Object.entries(this.modelConfiguration[modelId]?.paramValues || {}).map(([paramName, paramValue]) => ({
          name: paramName,
          value: +paramValue.value,
          stderr: paramValue.stderr
        }));
        return {
          ...result,
          seeds,
        }
      })
    }


    this.modelCompareService.saveInvestigation(request).subscribe({
      error: async (error) => {
        this.dialog.open(ErrorDialogComponent, {
          data: {
            main_message: await firstValueFrom(this.translateService.get('MODEL_COMPARE.ERROR_SAVING_RESULTS', error)),
            error_message: error.message,
          }
        })
      },
      next: (response) => {
        this._snackBar.openFromComponent(SnackBarComponent, {
          duration: 3000,
          verticalPosition: 'top',
          data: {
            message: 'Resultados guardados con éxito'
          }
        });
        this.stateService.state.set({
          ...this.state(),
          investigation: {investigation_id: response.investigation_id, sample: this.state().investigation?.sample!},
        });
        this.savingInvestigation = false
      },
    });
  }

  runNonLinearModels() {

    this.noLinearResults = {};

    this.runningNoLinearAdjustment = true

    const models: INoLinearRequestModel[] = [];

    for (const modelId of Object.keys(this.modelConfiguration)) {

      const seeds: INoLinearRequestSeed[] = []

      for (const [paramName, paramValue] of Object.entries(this.modelConfiguration[+modelId].paramValues)) {
        seeds.push({
          name: paramName,
          value: +paramValue.value,
          stderr: paramValue.stderr
        });
      }


      const modelRequest: INoLinearRequestModel = {
        model: +modelId,
        iteration: this.modelConfiguration[+modelId].iterations,
        seeds
      }

      models.push(modelRequest)
    }


    const request: INoLinearRequest = {
      sample_id: this.state().investigation?.sample.sample_id!,
      models
    }

    this.currentRequestId = `request-${Date.now()}`;
    const cancellationSubject = this.cancellationService.getCancellationSubject(this.currentRequestId);

    this.modelCompareService.runNoLinearModel(request)
      .pipe(takeUntil(cancellationSubject),
        finalize(() => {
          this.runningNoLinearAdjustment = false;
          if (this.currentRequestId) {
            this.cancellationService.finishRequest(this.currentRequestId);
            this.currentRequestId = null;
          }
        })
      ).subscribe({
      error: async (error) => {

        this.noLinearFailed = true;
        this.dialog.open(ErrorDialogComponent, {
          data: {
            main_message: await firstValueFrom(this.translateService.get('MODEL_COMPARE.ERROR_RUNNING_COMPARISON', error)),
            error_message: error.message,
          }
        });
      },
      next: async (response) => {

        this.noLinearResponse = response;
        this.noLinearCompareResult = response.comparison;

        let xPointX = this.state().investigation?.sample?.ce!
        let yPointX = this.state().investigation?.sample?.qe!

        this.xForCurvePlot = response.results[0].adjustment_methods[0].transformed.x;

        let axisTitles = {
          xaxis: {
            title: await firstValueFrom(this.translateService.get('CE'))
          },
          yaxis: {
            title: await firstValueFrom(this.translateService.get('QE'))
          },
        }

        let baseData = {
          x: xPointX,
          y: yPointX,
          type: 'scatter',
          mode: 'markers',
          name: await firstValueFrom(this.translateService.get('SAMPLE')),
          marker: {color: 'black'}
        }

        this.ridgeResult = response.comparison.ridge;

        let ridgeData = {
          x: this.xForCurvePlot,
          y: response.comparison.ridge.y_pred,
          type: 'scatter',
          mode: 'lines',
          name: await firstValueFrom(this.translateService.get("MODEL_COMPARE.RIDGE")),
          line: {shape: 'spline', color: 'grey'},
          marker: {color: 'grey'},

        }

        this.compareGraph = {
          data: [ridgeData],
          layout: {
            title: await firstValueFrom(this.translateService.get("MODEL_COMPARE.PLOT.BEST_FIT_BY_MODEL")),
            autosize: true,
            xaxis: axisTitles.xaxis,
            yaxis: axisTitles.yaxis
          }
        }

        for (const model of response.results) {

          this.noLinearResults[model.model] = {
            successful_fits: [],
            error_fits: [],
            bestAdjustment: model.best_adjust
          }


          this.summaryGraph[model.model] = {
            data: [],
            layout: {
              title: await firstValueFrom(this.translateService.get('MODEL_COMPARE.PLOT.RESULTS_SUMMARY_TITLE')),
              autosize: true,
              xaxis: axisTitles.xaxis,
              yaxis: axisTitles.yaxis
            }
          }

          for (const adjustment of model.adjustment_methods) {

            if (adjustment.success) {

              let resultData = {
                x: adjustment.transformed.x,
                y: adjustment.transformed.y,
                type: 'scatter',
                mode: 'lines',
                name: adjustment.name,
                line: {shape: 'spline', color: this.colorByMethod[adjustment.name]},
                marker: {color: this.colorByMethod[adjustment.name]},
              }


              if (adjustment.name === model.best_adjust) {
                let compareData = {...resultData};
                let modelName = this.commonUtilsService.getModelById(model.model, this.state().models).name;
                compareData.line = {shape: 'spline', color: this.colorByMethod[modelName]}
                compareData.marker = {color: this.colorByMethod[modelName]}
                compareData.name = modelName + ` (${model.best_adjust})`
                this.compareGraph.data.push(compareData);
              }

              this.summaryGraph[model.model].data.push(resultData)

              let noLinearGraph: INoLinearAdjustmentSuccessResult = {
                parameters: adjustment.parameters,
                statistics: adjustment.statistics,
                adjustment_name: adjustment.name,
                residuals: await this.buildResidualsGraph(adjustment.residuals, xPointX),
                graph: {
                  data: [
                    resultData,
                    baseData
                  ],
                  layout: {
                    title: await firstValueFrom(this.translateService.get('MODEL_COMPARE.FIT')),
                    autosize: true,
                    xaxis: axisTitles.xaxis,
                    yaxis: axisTitles.yaxis
                  }
                }
              }
              this.noLinearResults[model.model].successful_fits.push(noLinearGraph)

            } else {

              this.noLinearResults[model.model].error_fits.push({
                adjustment_name: adjustment.name,
                error: adjustment.error ?? 'error' //TODO: create generic error msg
              })

            }

          }

          this.summaryGraph[model.model].data.push(baseData)

        }
        this.compareGraph.data.push(baseData);

        this.noLinearFailed = false;

      }
    })
  }

  async buildResidualsGraph(residuals: IResiduals, ce: number[]) {

    let response = residuals;

    response.graph = {
      data: [
        {
          x: [...ce].sort((a, b) => a - b),
          y: residuals.values,
          type: 'scatter',
          mode: 'markers',
          marker: {color: 'red'},
        }
      ],
      layout: {
        title: await firstValueFrom(this.translateService.get('MODEL_COMPARE.RESIDUALS')),
        autosize: true,
        xaxis: {
          title: await firstValueFrom(this.translateService.get('CE'))
        },
        yaxis: {
          title: `${await firstValueFrom(this.translateService.get('QE'))} - ${await firstValueFrom(this.translateService.get('QE_PRED'))}`
        }
      }
    }

    return response;

  }


  getBestComparisonModelOverall(): string | undefined {

    if (this.noLinearCompareResult?.heuristic.best_model === this.noLinearCompareResult?.ridge.best_model) {

      return this.commonUtilsService.getModelById(this.noLinearCompareResult?.heuristic.best_model!, this.state().models).name;

    } else {

      return undefined;
    }

  }

  getBestAdjustmentDataByModel(modelId: number) {

    const adjustments = this.noLinearResults[modelId].successful_fits;
    const bestAdjustment = this.noLinearResults[modelId]?.bestAdjustment;
    const bestFit = adjustments.find(
      (adjustment) => adjustment.adjustment_name === bestAdjustment
    );
    if (bestFit) {
      return bestFit;
    } else {
      throw new Error("Best Fit not found")
    }

  }

  getRidgeStatistic(statName: string) {

    return (this.noLinearCompareResult!.ridge!.statistics as any)[statName]
  }

  toggleAllResultsViewOption(viewOption: AllResultsViewOption): void {
    this.selectedAllResultsViewOption = viewOption;
  }

  toggleComparisonViewOption(viewOption: ComparisonViewOption): void {
    this.selectedComparisonLayout = viewOption;
    setTimeout(() => {
      if (this.comparisonPlot) {
        this.comparisonPlot.updatePlot();
      }
    }, 0);
  }

  toggleAccordion(index: number, action: string): void {
    const accordionArray = this.accordions.toArray();
    if (accordionArray[index]) {
      const accordion = accordionArray[index];
      if (action === 'collapse') {
        accordion.closeAll();
      } else {
        accordion.openAll();
      }
    }
  }

  getNoLinearResultsModelIds(): number[] {
    return Object.keys(this.noLinearResults).map(key => +key);
  }


  protected readonly Object = Object;
  protected readonly faSave = faCloudArrowUp;

  cancelCurrentRequest(): void {
    this.noLinearFailed = true;
    if (this.currentRequestId) {
      this.cancellationService.cancelRequest(this.currentRequestId);
      this.currentRequestId = null;
    }
  }
}
