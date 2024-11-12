import {Component, Input} from '@angular/core';
import {DataSample} from "../data-selector/data-sample";
import {Model} from "../model-selector/model";
import {CommonUtilsService} from "../../common/common.service";
import {INoLinearGraph, INoLinearRequest, INoLinearRequestModel, INoLinearRequestSeed} from "./interface";
import {ModelCompareService} from "./model-compare.service";
import {IModelsConfigurations} from "../../common/common.interface";

@Component({
  selector: 'app-model-compare',
  templateUrl: './model-compare.component.html',
  styleUrl: './model-compare.component.css'
})
export class ModelCompareComponent {
  @Input() investigationId: number | undefined;
  @Input() selectedModels!: number[];
  @Input() models!: Model[];
  @Input() dataSample: DataSample | undefined;
  @Input() modelConfiguration!: IModelsConfigurations;
  protected noLinearResults: { [key: number]: INoLinearGraph[] } = {};

  constructor(protected commonUtilsService: CommonUtilsService,
              protected modelCompareService: ModelCompareService) {
  }

  ngOnInit() {

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
        model: this.commonUtilsService.getModelById(+modelId, this.models).name,
        seeds
      }

      models.push(modelRequest)
    }


    const request: INoLinearRequest = {
      investigation_id: this.investigationId!,
      models
    }

    console.info(request);

    this.modelCompareService.runNoLinearModel(request).subscribe((response) => {

      let xPointX = this.dataSample?.ce.sort()!
      let yPointX = this.dataSample?.qe.sort()!
      for (const model of response.results) {

        this.noLinearResults[model.model] = []

        for (const adjustment of model.adjustment_methods) {

          let noLinearGraph: INoLinearGraph = {
            parameters: adjustment.parameters,
            statistics: adjustment.statistics,
            best: adjustment.name === model.best_adjust,
            adjustment_name: adjustment.name,
            graph: {
              data: [
                {
                  x: xPointX,
                  y: yPointX,
                  type: 'scatter',
                  mode: 'markers',
                  marker: {color: 'red'}
                },
                {
                  x: xPointX,
                  y: adjustment.transformed.y.sort(),
                  type: 'scatter',
                  mode: 'line+marker',
                  line: {shape: 'spline', color: 'blue'},
                  marker: {color: 'blue'},
                },
              ],
              layout: {title: adjustment.name}
            }
          }

          this.noLinearResults[model.model].push(noLinearGraph)
        }

      }
      console.log(this.noLinearResults);
    })


  }


}
