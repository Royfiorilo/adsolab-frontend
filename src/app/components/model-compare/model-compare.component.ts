import {Component, Input} from '@angular/core';
import {DataSample} from "../data-selector/data-sample";
import {Model} from "../model-selector/model";
import {CommonUtilsService} from "../../common/common.service";
import {IComparison, INoLinearGraph, INoLinearRequest, INoLinearRequestModel, INoLinearRequestSeed} from "./interface";
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

      let baseData = {
        x: xPointX,
        y: yPointX,
        type: 'scatter',
        mode: 'markers',
        name: "Muestra",
        marker: {color: 'red'}
      }
      this.compareGraph = {
        data: [baseData], layout: {title: "Mejor ajuste por modelo"}
      }

      for (const model of response.results) {

        this.noLinearResults[model.model] = {
          adjustments: [],
          bestAdjustment: model.best_adjust
        }


        this.summaryGraph[model.model] = {
          data: [baseData], layout: {title: "Resumen de resultados"}
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
            graph: {
              data: [
                baseData,
                resultData,
              ],
              layout: {title: adjustment.name}
            }
          }

          this.noLinearResults[model.model].adjustments.push(noLinearGraph)
        }

      }


      this.runningNoLinearAdjustment = false;

    })

  }


}
