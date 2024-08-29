import {Component, Input} from '@angular/core';
import {Model} from "../model-selector/model";

@Component({
  selector: 'app-model-configuration',
  templateUrl: './model-configuration.component.html',
  styleUrl: './model-configuration.component.css'
})
export class ModelConfigurationComponent {
  @Input() selectedModels!: string[];
  @Input() modelSelections!: { [p: string]: number };
  @Input() models!: Model[];
  getParamsArray(modelName: string): number[] {
    // let model  = this.models.find(m => m.name === modelName);
    let model: number[] = [];
    // return model === undefined ? [] : Array(model.params).fill(0).map((x, i) => i);
    return model;
  }


  runModel(model: string) {
    console.log(this.models);

  }
}
