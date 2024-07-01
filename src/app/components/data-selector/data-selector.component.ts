import {Component, EventEmitter, Output} from '@angular/core';

@Component({
  selector: 'app-data-selector',
  templateUrl: './data-selector.component.html',
  styleUrl: './data-selector.component.css'
})
export class DataSelectorComponent {
@Output() onFileSelected: EventEmitter<Event> = new EventEmitter();
@Output() onUploadFile: EventEmitter<File> = new EventEmitter();

  onChange(event: Event){
    console.log(event);
    this.onFileSelected.emit(event);
  }

  onUpload(){
    console.log("upload");
    this.onUploadFile.emit();
  }

}
