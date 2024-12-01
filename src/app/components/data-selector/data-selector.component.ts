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
          if (sample.sample_id) {
            this.options.push(sample.sample_id.toString());//Despues hay que cambiar sampleId por el Label cuando se empiece a usar
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

  getDataSampleByLabel(label: string): DataSample | undefined {
    return this.availableDataSamples.find(sample => sample.sample_id?.toString() === label);//Despues hay que cambiar sampleId por el Label cuando se empiece a usar
  }


  onOptionSelected(event: any) {
    this.inputControl.setValue(event.option.value);
    let sample = this.getDataSampleByLabel(event.option.value);
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
    this.inputControl.setValue('');
    this.setDataSample(dataSample);
  }

  setDataSample(dataSample: DataSample | undefined) {
    if (dataSample) {
      this.dataSample = dataSample;
      console.log("se ha seleccionado la siguiente muestra: ", dataSample)
    }
  }
}
