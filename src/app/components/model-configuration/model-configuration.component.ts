import {Component, EventEmitter, Input, Output, SimpleChanges} from '@angular/core';
import {Model} from "../model-selector/model";
import {IModelConfiguration} from "../investigation/interface";
import {DataSelectorService} from "../data-selector/data-selector.service";
import {ModelConfigurationService} from "./model-configuration.service";
import {ILinearizationRequest} from "./interface";

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

    this.modelConfigurationService.runLinearization(request).subscribe((results) => {
      console.log(results);

    });
  }

  selectConfiguration(event: Event,modelId:number): void {
    this.onSelectedConfiguration.emit(modelId);
  }
}
