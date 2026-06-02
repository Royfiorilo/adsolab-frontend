import {Component, EventEmitter, Input, Output} from '@angular/core';
import {faFileUpload} from "@fortawesome/free-solid-svg-icons";
import {IKineticsSample} from "../kinetics/interface";

@Component({
  selector: 'app-kinetics-data-selector',
  templateUrl: './kinetics-data-selector.component.html',
  styleUrl: './kinetics-data-selector.component.css'
})
export class KineticsDataSelectorComponent {
  @Input() kineticsSample: IKineticsSample | undefined;
  @Output() onSampleLoaded: EventEmitter<IKineticsSample> = new EventEmitter();

  protected readonly faFileUpload = faFileUpload;

  // TODO: reemplazar por carga real (KineticsFileUploadComponent + POST /kinetics/sample).
  // Por ahora solo carga una muestra de ejemplo para poder navegar el flujo visual.
  loadDemoSample(): void {
    const demoSample: IKineticsSample = {
      time: [0, 5, 10, 20, 30, 60, 90, 120],
      qt: [0, 3.2, 5.1, 6.8, 7.4, 7.8, 7.9, 8.0],
      title: 'Muestra de ejemplo',
      description: 'Datos cinéticos de demostración',
      temperature: 298,
      time_unit: 'min',
      measure_unit: 'mg/g'
    };
    this.onSampleLoaded.emit(demoSample);
  }
}
