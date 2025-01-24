import {Component} from '@angular/core';
import {Model} from "../model-selector/model";
import {MatSnackBar} from "@angular/material/snack-bar";
import {Investigation} from "../data-selector/data-sample";
import {IModelsConfigurations} from "../../common/common.interface";

@Component({
  selector: 'app-investigation',
  templateUrl: './investigation.component.html',
  styleUrl: './investigation.component.css',
})

export class InvestigationComponent {
  investigation: Investigation | undefined;
  stepId: number = 1;
  models: Model[] = [];
  selectedModels: number[] = [];
  modelConfiguration: IModelsConfigurations = {};
  modelConfigurationDone: boolean = false;

  constructor(private _snackBar: MatSnackBar) {
  }

  investigationCreated(investigation: Investigation) {
    this.investigation = investigation;
    this._snackBar.open("Investigación creada con éxito", "Aceptar", {
      duration: 3000,
      verticalPosition: 'top',
    });
  }

  addModel(modelId: number) {
    this.selectedModels = [...this.selectedModels, modelId]
    const model = this.models.find(model => model._id === modelId);
    this.modelConfiguration[modelId] = {
      automatedParams: !!model?.linearizations && model.linearizations.length > 0,
      paramValues: Object.keys(model?.parameters || {})
        .reduce((acc, key) => ({...acc, [key]: undefined}), {}),
      paramInfo: model?.parameters || {},
      selectedLinearizations: []
    };
  }

  onModelSelected(modelId: number) {
    if (this.selectedModels.includes(modelId)) {
      this.removeModel(modelId)
    } else {
      this.addModel(modelId);
    }
    this.checkConfigurationDone();

  }

  onLoadedModels(models: Model[]) {
    this.models = models;
  }

  onSelectedConfiguration(modelId: number) {
    this.modelConfiguration[modelId].automatedParams = !this.modelConfiguration[modelId].automatedParams;
  }

  onSelectedParams(modelsConfigurations: IModelsConfigurations) {
    this.modelConfiguration = modelsConfigurations;
    this.checkConfigurationDone();
  }

  private checkConfigurationDone() {
    let configurationDone = true;

    for (const modelId of Object.keys(this.modelConfiguration)) {

      const params = this.modelConfiguration[+modelId]?.paramValues;

      for (const paramName of Object.keys(params)) {

        if (!params[paramName]) {
          configurationDone = false;
        }

      }

    }
    this.modelConfigurationDone = configurationDone;
  }

  private removeModel(modelId: number) {
    this.selectedModels = this.selectedModels.filter(selectedModel => selectedModel !== modelId)
    delete this.modelConfiguration[modelId]
  }

  onStepChange($event: number) {
    this.stepId = $event;
  }
}
