import {Component, EventEmitter, Input, Output, SimpleChanges} from '@angular/core';
import {Model} from "../model-selector/model";
import {IModelConfiguration} from "../investigation/interface";

@Component({
  selector: 'app-model-configuration',
  templateUrl: './model-configuration.component.html',
  styleUrl: './model-configuration.component.css'
})
export class ModelConfigurationComponent {
  @Input() selectedModels!: number[];
  @Input() modelConfiguration!: { [modelId: number]:  IModelConfiguration};
  @Input() models!: Model[];
  @Output() onSelectedConfiguration = new EventEmitter<number>();

 getParamsArray(modelId: number): number[] {
    // let model  = this.models.find(m => m.name === modelName);
    let model: number[] = [];
    // return model === undefined ? [] : Array(model.params).fill(0).map((x, i) => i);
    return model;
  }

  getModelById(modelId: number): Model {
   return this.models.filter(model => model._id === modelId).pop()!;
  }


  runModel(model: number) {

  }

  selectConfiguration(event: Event,modelId:number): void {
    this.onSelectedConfiguration.emit(modelId);
  }
}
