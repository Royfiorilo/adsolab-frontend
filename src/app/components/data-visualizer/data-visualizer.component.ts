import {Component, Input} from '@angular/core';
import {DataSample} from "../data-selector/data-sample";

@Component({
  selector: 'app-data-visualizer',
  templateUrl: './data-visualizer.component.html',
  styleUrl: './data-visualizer.component.css'
})
export class DataVisualizerComponent {
  @Input() data!: DataSample;

}
