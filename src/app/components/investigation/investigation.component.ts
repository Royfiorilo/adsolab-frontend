import { Component, inject, TemplateRef, EventEmitter } from '@angular/core';
import {elementAt} from "rxjs";
import {Model} from "../model-selector/model";
import {IModelConfiguration} from "./interface";

@Component({
  selector: 'app-investigation',
  templateUrl: './investigation.component.html',
  styleUrl: './investigation.component.css',
})

export class InvestigationComponent {
  investigationId: number = 1;
  selectedFile: File | null = null;
  stepId: number = 1;
  models: Model[] = [];
  sheetData: any[] = [];
  sheetHeaders: string[] = [];
  selectedModels: number[] = [];
  modelConfiguration: { [modelId: number]:  IModelConfiguration} = {};

  setStepId(value: number){
    this.stepId = value;
  }

  selectFile(event: any) {
    if (event.target == null){
      console.log("null file");
    } else{
        this.selectedFile = event.target.files[0];
    }
  }

  uploadFile(){
    if (this.selectedFile) {
      console.log(`File selected: ${this.selectedFile.name}`);
    } else {
      alert('Please select a file first');
    }
  }
  addModel(modelId: number){
    this.selectedModels.push(modelId);
    this.modelConfiguration[modelId] = {automatedParams: true, paramValues: {}, selectedLinearizations: []};
  }

  onModelSelected(modelId: number) {
  this.selectedModels.includes(modelId) ? this.selectedModels.splice(this.selectedModels.indexOf(modelId),1) : this.addModel(modelId);
  }

  onLoadedModels(models: Model[]){
    this.models = models;
  }

  onSelectedConfiguration(modelId: number) {
    this.modelConfiguration[modelId].automatedParams = !this.modelConfiguration[modelId].automatedParams;
  }
}
