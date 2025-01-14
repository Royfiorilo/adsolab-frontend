import {Component, Input} from '@angular/core';
import {DataSample} from "../data-selector/data-sample";
import {Model} from "../model-selector/model";
import {CommonUtilsService} from "../../common/common.service";
import {
  IComparison,
  INoLinearGraph,
  INoLinearRequest,
  INoLinearRequestModel,
  INoLinearRequestSeed,
  ViewOption
} from "./interface";
import {ModelCompareService} from "./model-compare.service";
import {IGraph, IModelsConfigurations} from "../../common/common.interface";


@Component({
  selector: 'app-model-compare',
  templateUrl: './model-compare.component.html',
  styleUrl: './model-compare.component.css',
})
export class ModelCompareComponent {
  @Input() investigationId: number | undefined;
  @Input() selectedModels!: number[];
  @Input() models!: Model[];
  @Input() dataSample: DataSample | undefined;
  @Input() modelConfiguration!: IModelsConfigurations;
  protected noLinearResults: { [key: number]: { bestAdjustment: string, adjustments: INoLinearGraph[] } } = {};
  protected noLinearCompareResult: IComparison | undefined;
  protected runningNoLinearAdjustment: boolean = false;
  protected summaryGraph: { [key: number]: IGraph } = {};
  protected compareGraph: IGraph | undefined;
  protected toggleValue: string = 'results';
  protected selectedViewOption: ViewOption = ViewOption.SIMPLIFIED;
  protected viewOptions = ViewOption;
  private colorByMethod: { [key: string]: string } = {
    cg: "blue",
    leastsq: "#8f3237",
    cobyla: "green",
    freundlich: "orange",
    langmuir: "green"
  }

  constructor(protected commonUtilsService: CommonUtilsService,
              protected modelCompareService: ModelCompareService) {
  }

  ngOnInit() {

    this.runNonLinearModels();

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
    const sampleStats = this.noLinearResults[this.selectedModels[0]]?.adjustments[0]?.statistics || {};
    return Object.keys(sampleStats);
  }

  getResidualsRows(): string[] {
    const sampleResiduals = this.noLinearResults[this.selectedModels[0]]?.adjustments[0]?.residuals || {};
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

  runNonLinearModels() {

    this.runningNoLinearAdjustment = true

    const models: INoLinearRequestModel[] = [];

    for (const modelId of Object.keys(this.modelConfiguration)) {

      const seeds: INoLinearRequestSeed[] = []

      for (const param of Object.entries(this.modelConfiguration[+modelId].paramValues)) {

        seeds.push({
          name: param[0],
          value: param[1]
        })
      }

      const modelRequest: INoLinearRequestModel = {
        model: +modelId,
        seeds
      }

      models.push(modelRequest)
    }


    const request: INoLinearRequest = {
      investigation_id: this.investigationId!,
      models
    }

    this.modelCompareService.runNoLinearModel(request).subscribe((response) => {

      this.noLinearCompareResult = response.comparison;

      let xPointX = this.dataSample?.ce!
      let yPointX = this.dataSample?.qe!

      let xForCurvePlot = response.results[0].adjustment_methods[0].transformed.x;

      let baseData = {
        x: xPointX,
        y: yPointX,
        type: 'scatter',
        mode: 'markers',
        name: "Muestra",
        marker: {color: 'black'}
      }

      let ridgeData = {
        x: xForCurvePlot,
        y: response.comparison.ridge.y_pred,
        type: 'scatter',
        mode: 'line+marker',
        name: 'Ridge',
        line: {shape: 'spline', color: 'grey'},
        marker: {color: 'grey'},

      }

      this.compareGraph = {
        data: [ridgeData], layout: {title: "Mejor ajuste por modelo"}
      }

      for (const model of response.results) {

        this.noLinearResults[model.model] = {
          adjustments: [],
          bestAdjustment: model.best_adjust
        }


        this.summaryGraph[model.model] = {
          data: [], layout: {title: "Resumen de resultados"}
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
            let modelName = this.commonUtilsService.getModelById(model.model, this.models).name;
            compareData.line = {shape: 'spline', color: this.colorByMethod[modelName]}
            compareData.marker = {color: this.colorByMethod[modelName]}
            compareData.name = modelName
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
              layout: {title: adjustment.name}
            }
          }
          console.log("Model: ", model.model);
          this.noLinearResults[model.model].adjustments.push(noLinearGraph)
        }

        this.summaryGraph[model.model].data.push(baseData)

      }
      this.compareGraph.data.push(baseData);

      console.log(this.noLinearResults)
      this.runningNoLinearAdjustment = false;

    })

  }


  getBestComparisonModelOverall(): string {

    if (this.noLinearCompareResult?.heuristic.best_model === this.noLinearCompareResult?.ridge.best_model) {

      return this.commonUtilsService.getModelById(this.noLinearCompareResult?.heuristic.best_model!, this.models).name;

    } else {

      return 'Indefinido'
    }

  }

  getRidgeStatistic(statName: string) {

    return (this.noLinearCompareResult!.ridge!.statistics as any)[statName]
  }

  toggleView(viewOption: ViewOption): void {
    this.selectedViewOption = viewOption;
  }


  protected readonly Object = Object;
}
