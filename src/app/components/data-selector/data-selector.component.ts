import {Component, EventEmitter, Output} from '@angular/core';
import {DataSelectorService} from "./data-selector.service"
import {CreateInvestigationResponse, DataSample, Investigation} from "./data-sample";
import {catchError, firstValueFrom, Observable, of} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {FormControl} from '@angular/forms';
import {SampleSelectorService} from "./sample-selector.service";
import {TranslateService} from '@ngx-translate/core';
import {MatDialog} from "@angular/material/dialog";
import {ErrorDialogComponent} from "../error-dialog/error-dialog.component";

@Component({
  selector: 'app-data-selector',
  templateUrl: './data-selector.component.html',
  styleUrl: './data-selector.component.css'
})
export class DataSelectorComponent {
  @Output() onInvestigationCreated: EventEmitter<Investigation> = new EventEmitter();
  protected dataSample: DataSample | undefined;
  protected availableDataSamples: DataSample[] = [];
  protected creatingInvestigation: boolean = false;
  protected loadingDataSamples: boolean = false;
  protected inputControl = new FormControl();
  protected options: string[] = [];
  protected filteredOptions!: Observable<string[]>;

  constructor(
    private dataService: DataSelectorService,
    private sampleService: SampleSelectorService,
    private translateService: TranslateService,
    private dialog: MatDialog) {

    if (this.options.length === 0) {
      this.loadingDataSamples = true;
      this.sampleService.getSamples()
        .pipe(catchError(async (error) => {
          if (error.status === 404) {
            return {samples: []};
          } else {
            throw await firstValueFrom(translateService.get('FILE_UPLOAD.ERROR_LOADING_MATERIALS', error));
          }
        }))
        .subscribe(response => {
          this.loadingDataSamples = false;
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
      this.creatingInvestigation = true;
      this.dataService
        .createInvestigation(this.dataSample)
        .pipe(catchError((error) => {
          let errorResponse: CreateInvestigationResponse = {
            error: error.message,
            investigation_id: 0,
            sample_id: 0
          }
          return of(errorResponse);
        }))
        .subscribe(async (response) => {

          this.creatingInvestigation = false;

          if (response.error) {

            this.dialog.open(ErrorDialogComponent, {
              data: {
                main_message: await firstValueFrom(this.translateService.get('DATA_SELECTOR.CREATE_INVESTIGATION_ERROR')),
                error_message: response.error,
              }
            })

          } else {

            let investigation: Investigation = {investigation_id: response.investigation_id, sample: this.dataSample!}
            this.onInvestigationCreated.emit(investigation);

          }

        });
    }
  }

  validateUploadedDataSample(dataSample: DataSample): boolean {
    return dataSample.title !== undefined && dataSample.title !== '' && dataSample.description !== undefined && dataSample.description !== '' && dataSample.adsorbent_id !== undefined && true && dataSample.temperature !== undefined;
  }

  setUploadDataSample(dataSample: DataSample) {
    if (this.validateUploadedDataSample(dataSample)) {
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
