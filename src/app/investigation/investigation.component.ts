import { Component } from '@angular/core';

@Component({
  selector: 'app-investigation',
  templateUrl: './investigation.component.html',
  styleUrl: './investigation.component.css',
})

export class InvestigationComponent {
  selectedFile: File | null = null;
  progressBarValue: number = 0;
  stepId: number = 0;
  models: { name: string, description: string }[] = [{
    name: "Langmuir",
    description: "The Langmuir adsorption model explains adsorption by assuming an adsorbate behaves as an ideal gas at isothermal conditions. According to the model, adsorption and desorption are reversible processes."
  },{
    name: "Freundlich",
    description: "The Freundlich equation or Freundlich adsorption isotherm, an adsorption isotherm, is an empirical relationship between the quantity of a gas adsorbed into a solid surface and the gas pressure. The same relationship is also applicable for the concentration of a solute adsorbed onto the surface of a solid and the concentration of the solute in the liquid phase."
  }]

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
  }

  onUpload() {
    if (this.selectedFile) {
      console.log(`File selected: ${this.selectedFile.name}`);
    } else {
      alert('Please select a file first');
    }
  }

  updateProgressBar(status: number) {
    this.progressBarValue = status
  }
}
