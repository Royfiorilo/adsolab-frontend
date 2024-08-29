import { Component, inject, TemplateRef, EventEmitter } from '@angular/core';
import {elementAt} from "rxjs";
import {Model} from "../model-selector/model";

@Component({
  selector: 'app-investigation',
  templateUrl: './investigation.component.html',
  styleUrl: './investigation.component.css',
})

export class InvestigationComponent {
  selectedFile: File | null = null;
  stepId: number = 1;
  models: Model[] = [];
  sheetData: any[] = [];
  sheetHeaders: string[] = [];
  selectedModels: string[] = [];
  modelSelections: { [key: string]: number } = {};

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
  addModel(model: string){
    this.selectedModels.push(model);
    this.modelSelections[model] = 1;
  }

  onModelSelected(modelName: string) {
  this.selectedModels.includes(modelName) ? this.selectedModels.splice(this.selectedModels.indexOf(modelName),1) : this.addModel(modelName);
  }

  onLoadedModels(models: Model[]){
    console.log("Investigation Component:",JSON.stringify(models));
    this.models = models;
  }

}
