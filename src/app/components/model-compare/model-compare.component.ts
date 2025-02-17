import {Component, Input, QueryList, SimpleChanges, ViewChild, ViewChildren} from '@angular/core';
import {CommonUtilsService} from "../../common/common.service";
import {
  AllResultsViewOption,
  ComparisonViewOption,
  IComparison,
  INoLinearGraph,
  INoLinearRequest,
  INoLinearRequestModel,
  INoLinearRequestSeed,
  INoLinearResponse,
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
import {firstValueFrom} from "rxjs";
import {TranslateService} from "@ngx-translate/core";
import {PlotlyComponent} from "angular-plotly.js";
import {StateService} from "../investigation/state.service";


@Component({
  selector: 'app-model-compare',
  templateUrl: './model-compare.component.html',
  styleUrl: './model-compare.component.css',
})
export class ModelCompareComponent {
  @ViewChildren(MatAccordion) accordions!: QueryList<MatAccordion>;
  @ViewChild('comparisonPlot') comparisonPlot!: PlotlyComponent;
  @Input() modelConfiguration!: IModelsConfigurations;
  protected noLinearResults: { [key: number]: { bestAdjustment: string, adjustments: INoLinearGraph[] } } = {};
  protected noLinearCompareResult: IComparison | undefined;
  protected runningNoLinearAdjustment: boolean = true;
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
              private translateService: TranslateService) {
  }

  ngOnInit() {

    this.runNonLinearModels();

  }

  ngOnChanges(changes: SimpleChanges) {

    if (changes['selectedModels'] && changes['selectedModels'].currentValue !== changes['selectedModels'].previousValue) {
      this.selectedModelsChanged = true;
    }

    if (changes['stepId'] && !changes['stepId'].firstChange && changes['stepId'].currentValue === 3 && this.selectedModelsChanged) {
      this.runNonLinearModels();
    }

  }

  bestTransformedValue(modelId: number, index: number): number {
    const adjustments = this.noLinearResults[modelId].adjustments;
    const bestAdjustment = this.noLinearResults[modelId]?.bestAdjustment;
    const bestFit = adjustments.find(
      (adjustment) => adjustment.adjustment_name === bestAdjustment
    );
    return bestFit ? bestFit.graph.data[1].y[index] : 0
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
    const sampleStats = this.noLinearResults[this.state().selectedModels[0]]?.adjustments[0]?.statistics || {};
    return Object.keys(sampleStats);
  }

  getResidualsRows(): string[] {
    const sampleResiduals = this.noLinearResults[this.state().selectedModels[0]]?.adjustments[0]?.residuals || {};
    return Object.keys(sampleResiduals);
  }

  bestResidualValue(modelId: number, residualName: string): number {
    const adjustments = this.noLinearResults[modelId].adjustments;
    const bestAdjustment = this.noLinearResults[modelId]?.bestAdjustment;
    const bestFit = adjustments.find(
      (adjustment) => adjustment.adjustment_name === bestAdjustment
    );
    return bestFit ? (bestFit.residuals as any)[residualName] : 0
  }


  bestStatisticValue(modelId: number, statName: string): number {
    const adjustments = this.noLinearResults[modelId].adjustments;
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

    const investigationId = this.state().investigation?.investigation_id as number;
    const response = this.noLinearResponse as INoLinearResponse;

    const ridgeRequest: IRidgeSaveRequest = {
      best_model: response.comparison.ridge.best_model,
      residuals: response.comparison.ridge.residuals,
      results: response.comparison.ridge.results,
      statistics: response.comparison.ridge.statistics,
    };

    const request: ISaveRequest = {
      investigation_id: investigationId,
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
    });
  }

  runNonLinearModels() {

    this.selectedModelsChanged = false;

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
      investigation_id: this.state().investigation?.investigation_id!,
      models
    }

    this.modelCompareService.runNoLinearModel(request).subscribe({
      error: async (error) => {

        this.noLinearFailed = true;
        this.dialog.open(ErrorDialogComponent, {
          data: {
            main_message: await firstValueFrom(this.translateService.get('MODEL_COMPARE.ERROR_RUNNING_COMPARISON', error)),
            error_message: error.message,
          }
        });
        this.runningNoLinearAdjustment = false;
      },
      next: (response) => {

        this.noLinearResponse = response;
        this.noLinearCompareResult = response.comparison;

        let xPointX = this.state().investigation?.sample?.ce!
        let yPointX = this.state().investigation?.sample?.qe!

        this.xForCurvePlot = response.results[0].adjustment_methods[0].transformed.x;

        let baseData = {
          x: xPointX,
          y: yPointX,
          type: 'scatter',
          mode: 'markers',
          name: "Muestra",
          marker: {color: 'black'}
        }

        this.ridgeResult = response.comparison.ridge;

        let ridgeData = {
          x: this.xForCurvePlot,
          y: response.comparison.ridge.y_pred,
          type: 'scatter',
          mode: 'line+marker',
          name: 'Ridge',
          line: {shape: 'spline', color: 'grey'},
          marker: {color: 'grey'},

        }

        this.compareGraph = {
          data: [ridgeData], layout: {title: "Mejor ajuste por modelo", autosize: true}
        }

        for (const model of response.results) {

          this.noLinearResults[model.model] = {
            adjustments: [],
            bestAdjustment: model.best_adjust
          }


          this.summaryGraph[model.model] = {
            data: [], layout: {title: "Resumen de resultados", autosize: true}
          }

          for (const adjustment of model.adjustment_methods) {

            let resultData = {
              x: adjustment.transformed.x,
              y: adjustment.transformed.y,
              type: 'scatter',
              mode: 'line+marker',
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

            let noLinearGraph: INoLinearGraph = {
              parameters: adjustment.parameters,
              statistics: adjustment.statistics,
              adjustment_name: adjustment.name,
              residuals: adjustment.residuals,
              graph: {
                data: [
                  resultData,
                  baseData
                ],
                layout: {title: '', autosize: true} //TODO: poner algun titulo
              }
            }
            this.noLinearResults[model.model].adjustments.push(noLinearGraph)
          }

          this.summaryGraph[model.model].data.push(baseData)

        }
        this.compareGraph.data.push(baseData);

        this.runningNoLinearAdjustment = false;
        this.noLinearFailed = false;

      }
    })
  }

  getBestComparisonModelOverall(): string {

    if (this.noLinearCompareResult?.heuristic.best_model === this.noLinearCompareResult?.ridge.best_model) {

      return this.commonUtilsService.getModelById(this.noLinearCompareResult?.heuristic.best_model!, this.state().models).name;

    } else {

      return 'Indefinido'
    }

  }

  getBestAdjustmentDataByModel(modelId: number) {

    const adjustments = this.noLinearResults[modelId].adjustments;
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
}
