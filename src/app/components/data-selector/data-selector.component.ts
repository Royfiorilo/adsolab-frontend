import {Component, EventEmitter, Output} from '@angular/core';
import {DataSelectorService} from "./data-selector.service"
import {DataSample} from "./data-sample";


@Component({
  selector: 'app-data-selector',
  templateUrl: './data-selector.component.html',
  styleUrl: './data-selector.component.css'
})
export class DataSelectorComponent {
  @Output() onDataSampleUploaded: EventEmitter<number> = new EventEmitter();

  protected dataSample: DataSample | undefined;
  protected loadingDataSample: boolean = false;

  constructor(private dataService: DataSelectorService) {
  }

  uploadDataSample() {
    if (this.dataSample) {
      this.loadingDataSample = true;
      this.dataService
        .setDataSample(this.dataSample)
        .subscribe((response) => {
          this.loadingDataSample = false;
          this.onDataSampleUploaded.emit(response.investigation_id);
        });
    }
  }

  setDataSample(dataSample: DataSample) {
    this.dataSample = dataSample;
  }
}
