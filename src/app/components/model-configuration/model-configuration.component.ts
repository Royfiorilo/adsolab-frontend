import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-model-configuration',
  templateUrl: './model-configuration.component.html',
  styleUrl: './model-configuration.component.css'
})
export class ModelConfigurationComponent {
  @Input() selectedModels!: string[];
  @Input() modelSelections!: { [p: string]: number };
  @Input() models!: { name: string; description: string; params: number }[];
  getParamsArray(modelName: string): number[] {
    let model  = this.models.find(m => m.name === modelName);
    return model === undefined ? [] : Array(model.params).fill(0).map((x, i) => i);
  }

  runModel(model: string) {
    console.log(model);

  }
}
