import {Component, EventEmitter, Input, Output} from '@angular/core';
import {DataSelectorService} from "./data-selector.service"
import {DataSample, Investigation} from "./data-sample";
import {catchError, finalize, firstValueFrom, Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {FormControl} from '@angular/forms';
import {SampleSelectorService} from "./sample-selector.service";
import {TranslateService} from '@ngx-translate/core';
import {MatDialog} from "@angular/material/dialog";
import {ErrorDialogComponent} from "../error-dialog/error-dialog.component";
import {faTrash} from "@fortawesome/free-solid-svg-icons";

@Component({
  selector: 'app-data-selector',
  templateUrl: './data-selector.component.html',
  styleUrl: './data-selector.component.css'
})
export class DataSelectorComponent {
  @Output() onInvestigationCreated: EventEmitter<Investigation> = new EventEmitter();
  @Input() investigation!: Investigation | undefined;
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
        .subscribe({
          error: async (error) => {

            this.creatingInvestigation = false;
            this.dialog.open(ErrorDialogComponent, {
              data: {
                main_message: await firstValueFrom(this.translateService.get('DATA_SELECTOR.CREATE_INVESTIGATION_ERROR')),
                error_message: error.message,
              }
            })

          },
          next: async (response) => {

            this.creatingInvestigation = false;

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

  protected readonly faTrash = faTrash;

  deleteSample(sampleId: number | undefined) {
    //agregar modal estas seguro

    this.loadingDataSamples = true;
    if (sampleId) {
      this.sampleService.deleteSample(sampleId)
        .pipe(finalize(() => this.loadingDataSamples = false))
        .subscribe({
          next: (response) => {
            console.log('Version deleted successfully:', response);
          },
          error: (error) => {
            console.error('Error deleting version:', error);
          }
        });
    } else {
      this.loadingDataSamples = false;

    }

  }
}
