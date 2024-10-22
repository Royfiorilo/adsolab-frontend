import {Component} from '@angular/core';
import {Model} from "../model-selector/model";
import {IModelConfiguration} from "./interface";
import {MatSnackBar} from "@angular/material/snack-bar";
import {Investigation} from "../data-selector/data-sample";

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
  modelConfiguration: { [modelId: number]: IModelConfiguration } = {};

  constructor(private _snackBar: MatSnackBar) {
  }

  investigationCreated(investigation: Investigation) {
    this.investigation = investigation;
    this.stepId = 2;
    this._snackBar.open("Investigación cargada con éxito", "Aceptar", {
      duration: 3000,
      verticalPosition: 'top',
    });
  }

  addModel(modelId: number) {
    this.selectedModels.push(modelId);
    this.modelConfiguration[modelId] = {
      automatedParams: true,
      paramValues: Object.keys(this.models.find(model => model._id === modelId)?.parameters || {})
        .reduce((acc, key) => ({...acc, [key]: undefined}), {}),
      paramInfo: this.models.find(model => model._id === modelId)?.parameters || {},
      selectedLinearizations: []
    };
  }

  onModelSelected(modelId: number) {
    this.selectedModels.includes(modelId) ? this.selectedModels.splice(this.selectedModels.indexOf(modelId), 1) : this.addModel(modelId);
  }

  onLoadedModels(models: Model[]) {
    this.models = models;
  }

  onSelectedConfiguration(modelId: number) {
    this.modelConfiguration[modelId].automatedParams = !this.modelConfiguration[modelId].automatedParams;
  }

}
