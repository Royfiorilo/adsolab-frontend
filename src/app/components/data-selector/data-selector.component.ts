import {Component, EventEmitter, Output} from '@angular/core';
import {DataSelectorService} from "./data-selector.service"
import {DataSample, Investigation} from "./data-sample";
import {Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {FormControl} from '@angular/forms';
import {SampleSelectorService} from "./sample-selector.service";

@Component({
  selector: 'app-data-selector',
  templateUrl: './data-selector.component.html',
  styleUrl: './data-selector.component.css'
})
export class DataSelectorComponent {
  @Output() onInvestigationCreated: EventEmitter<Investigation> = new EventEmitter();
  protected dataSample: DataSample | undefined;
  protected availableDataSamples: DataSample[] = [];
  protected loadingDataSample: boolean = false;
  protected inputControl = new FormControl();
  protected options: string[] = [];
  protected filteredOptions!: Observable<string[]>;

  constructor(
    private dataService: DataSelectorService,
    private sampleService: SampleSelectorService) {

    if (this.options.length === 0) {
      this.sampleService.getSamples().subscribe(response => {
        this.availableDataSamples.push(...response.samples);
        response.samples.forEach(sample => {
          if (sample.title) {
            this.options.push(sample.title);
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

  getDataSampleByTitle(title: string): DataSample | undefined {
    return this.availableDataSamples.find(sample => sample.title?.toString() === title);
  }


  onOptionSelected(event: any) {
    this.inputControl.setValue(event.option.value);
    let sample = this.getDataSampleByTitle(event.option.value);
    this.setDataSample(sample);
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.options.filter(option => option.toLowerCase().includes(filterValue));
  }

  createInvestigation() {
    if (this.dataSample) {
      this.loadingDataSample = true;
      this.dataService
        .createInvestigation(this.dataSample)
        .subscribe((response) => {
          let investigation: Investigation = {investigation_id: response.investigation_id, sample: this.dataSample!}
          this.loadingDataSample = false;
          this.onInvestigationCreated.emit(investigation);
        });
    }
  }

  setUploadDataSample(dataSample: DataSample) {
    if (dataSample.title !== undefined && dataSample.title !== '') {
      this.inputControl.setValue('');
      this.setDataSample(dataSample);
    } else {
      this.setDataSample(undefined);
    }

  }

  setDataSample(dataSample: DataSample | undefined) {
    this.dataSample = dataSample;
  }
}
