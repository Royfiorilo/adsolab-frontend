import {Component, EventEmitter, Output, OnInit, output} from '@angular/core';
import {DataSelectorService} from "./data-selector.service"
import {DataSample} from "./data-sample";
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { FormControl } from '@angular/forms';
import {SampleSelectorService} from "./sample-selector.service";

@Component({
  selector: 'app-data-selector',
  templateUrl: './data-selector.component.html',
  styleUrl: './data-selector.component.css'
})
export class DataSelectorComponent {
  @Output() onDataSampleUploaded: EventEmitter<number> = new EventEmitter();
  @Output() onSelectedDataSample: EventEmitter<DataSample> = new EventEmitter();
    protected dataSample: DataSample | undefined;
  protected dataSamples: DataSample[] = [];
  protected loadingDataSample: boolean = false;
  protected inputControl = new FormControl();
  protected options: string[] = [];
  protected filteredOptions!: Observable<string[]>;

  constructor(
    private dataService: DataSelectorService,
    private sampleService: SampleSelectorService) {

    if (this.options.length === 0) {
      this.sampleService.getSamples().subscribe(response => {
        this.dataSamples.push(...response);
        response.forEach(sample => {
          if (sample.label) {
            this.options.push(sample.label);
          }
        });
      });
    }
  }

  ngOnInit() {
    this.inputControl.valueChanges.subscribe(value => {
    });

    this.filteredOptions = this.inputControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filter(value))
    );
  }

  getDataSampleByLabel(label: string): DataSample | undefined{
    return this.dataSamples.find(sample => sample.label === label);
  }


  onOptionSelected(event: any) {
    this.inputControl.setValue(event.option.value);
    let sample = this.getDataSampleByLabel(event.option.value);
    if (sample) {
      this.setDataSample(sample);
      this.onDataSampleUploaded.emit(sample.investigation_id);
      this.onSelectedDataSample.emit(sample);
    }

  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.options.filter(option => option.toLowerCase().includes(filterValue));
  }

  uploadDataSample() {
    if (this.dataSample) {
      this.loadingDataSample = true;
      this.dataService
        .setDataSample(this.dataSample)
        .subscribe((response) => {
          this.loadingDataSample = false;
          this.onDataSampleUploaded.emit(response.investigation_id);
          this.onSelectedDataSample.emit(this.dataSample);

        });
    }
  }
  setUploadDataSample(dataSample: DataSample) {
  this.inputControl.setValue('');
  this.setDataSample(dataSample);
  }

  setDataSample(dataSample: DataSample | undefined) {
    if (dataSample){
      this.dataSample = dataSample;
      console.log("se ha seleccionado la siguiente muestra: ", dataSample)
    }
  }
}
