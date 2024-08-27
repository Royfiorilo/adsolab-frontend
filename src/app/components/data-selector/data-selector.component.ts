import {Component, EventEmitter, Output} from '@angular/core';
import {DataSelectorService} from "./data-selector.service"
import {DataSample} from "./data-sample";


@Component({
  selector: 'app-data-selector',
  templateUrl: './data-selector.component.html',
  styleUrl: './data-selector.component.css'
})
export class DataSelectorComponent {
@Output() onFileSelected: EventEmitter<Event> = new EventEmitter();
@Output() onUploadFile: EventEmitter<File> = new EventEmitter();

  private dataSample: DataSample = { "ce" : [4.4, 7.7, 9.9], "qe": [16.16, 32.32, 62.62]};

  constructor(private dataService: DataSelectorService) {}

  onChange(event: Event){
    console.log(event);
    this.onFileSelected.emit(event);
  }

  onUpload(){
    console.log("upload");
    this.dataService
      .setDataSample(this.dataSample)
      .subscribe((results) => {
        console.log(results);
      });
    //this.onUploadFile.emit();
  }



}
