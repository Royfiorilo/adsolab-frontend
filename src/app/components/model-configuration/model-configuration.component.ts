import {Component, EventEmitter, Input, Output, SimpleChanges} from '@angular/core';
import {Model} from "../model-selector/model";
import {IModelConfiguration} from "../investigation/interface";
import {DataSelectorService} from "../data-selector/data-selector.service";
import {ModelConfigurationService} from "./model-configuration.service";
import {ILinearizationGraph, ILinearizationRequest, ILinearizationResponse} from "./interface";

@Component({
  selector: 'app-model-configuration',
  templateUrl: './model-configuration.component.html',
  styleUrl: './model-configuration.component.css'
})
export class ModelConfigurationComponent {
  @Input() selectedModels!: number[];
  @Input() investigationId!: number;
  @Input() modelConfiguration!: { [modelId: number]:  IModelConfiguration};
  @Input() models!: Model[];
  @Output() onSelectedConfiguration = new EventEmitter<number>();
  protected linearizationGraphs: {[key: number]: ILinearizationGraph[]} = {};

  constructor(private modelConfigurationService: ModelConfigurationService) {}

 getParamsArray(modelId: number): number[] {
    // let model  = this.models.find(m => m.name === modelName);
    let model: number[] = [];
    // return model === undefined ? [] : Array(model.params).fill(0).map((x, i) => i);
    return model;
  }

  getModelById(modelId: number): Model {
   return this.models.filter(model => model._id === modelId).pop()!;
  }

  runLinearization(modelId: number) {
    let model: Model = this.getModelById(modelId);
    let request: ILinearizationRequest = {investigation_id: this.investigationId, models: [{
        model: model.name,
        linearizations: model.linearizations.map(linearization => linearization.name)
      }]};

    this.modelConfigurationService.runLinearization(request).subscribe((response) => {

      console.log(JSON.stringify(response));

      this.linearizationGraphs[model._id] = [];

      for ( const linearization of response.results[0].linearizations){

        let slope:number = linearization.slope;
        let intercept:number= linearization.intercept;
        let xMin:number= linearization.transformed.x[0];
        let xMax:number= linearization.transformed.x[linearization.transformed.x.length - 1]!;
        let linearizationGraph:ILinearizationGraph = {
          linearizationName: linearization.name,
        graph: {
          data: [
            {x: linearization.transformed.x, y: linearization.transformed.y, type: 'scatter', mode: 'markers', marker: {color: 'red'}},
            {x: [xMin, xMax], y: [(slope*xMin+intercept),(slope*xMax+intercept)], type: 'scatter', mode: 'line', marker: {color: 'blue'}},
          ],
            layout: {title: linearization.name}
        }
        }
        this.linearizationGraphs[modelId].push(linearizationGraph);
      }
    });
  }

  selectConfiguration(event: Event,modelId:number): void {
    this.onSelectedConfiguration.emit(modelId);
  }
}
