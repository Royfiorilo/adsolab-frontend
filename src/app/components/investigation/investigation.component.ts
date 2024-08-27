import { Component, inject, TemplateRef, EventEmitter } from '@angular/core';
import {elementAt} from "rxjs";

@Component({
  selector: 'app-investigation',
  templateUrl: './investigation.component.html',
  styleUrl: './investigation.component.css',
})

export class InvestigationComponent {
  selectedFile: File | null = null;
  stepId: number = 1;
  models: { name: string, description: string, params: number }[] = [{
    name: "Langmuir",
    description: "The Langmuir adsorption model explains adsorption by assuming an adsorbate behaves as an ideal gas at isothermal conditions. According to the model, adsorption and desorption are reversible processes.",
    params: 4

  },{
    name: "Freundlich",
    description: "The Freundlich equation or Freundlich adsorption isotherm, an adsorption isotherm, is an empirical relationship between the quantity of a gas adsorbed into a solid surface and the gas pressure. The same relationship is also applicable for the concentration of a solute adsorbed onto the surface of a solid and the concentration of the solute in the liquid phase.",
    params: 2
  },{
    name: "Temkin",
    description: "The Temkin isotherm model assumes that the adsorption heat of all molecules decreases linearly with the increase in coverage of the adsorbent surface, and that adsorption is characterized by a uniform distribution of binding energies, up to a maximum binding energy.",
    params: 3
  }];
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


}
