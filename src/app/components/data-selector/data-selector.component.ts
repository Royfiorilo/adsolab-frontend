import {Component, EventEmitter, Input, Output, TemplateRef, ViewChild} from '@angular/core';
import {DataSelectorService} from "./data-selector.service"
import {DataSample, Investigation} from "./data-sample";
import {catchError, finalize, firstValueFrom, Observable} from 'rxjs';
import {map, startWith} from 'rxjs/operators';
import {FormControl} from '@angular/forms';
import {SampleSelectorService} from "./sample-selector.service";
import {TranslateService} from '@ngx-translate/core';
import {MatDialog} from "@angular/material/dialog";
import {faTrash} from "@fortawesome/free-solid-svg-icons";
import {ErrorDialogComponent} from "../error-dialog/error-dialog.component";

@Component({
  selector: 'app-data-selector',
  templateUrl: './data-selector.component.html',
  styleUrl: './data-selector.component.css'
})
export class DataSelectorComponent {
  @Output() onInvestigationStarted: EventEmitter<Investigation> = new EventEmitter();
  @ViewChild("deleteSampleDialog") deleteSampleDialog!: TemplateRef<any>;
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
    this.creatingInvestigation = true;
    if (this.dataSample && this.dataSample.sample_id === undefined) {
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
            if (this.dataSample) {
              this.dataSample.sample_id = response.sample_id;
            }
            this.creatingInvestigation = false;
            this.onInvestigationStarted.emit({sample: this.dataSample!, investigation_id: undefined});

          }
        });
    } else {
      this.creatingInvestigation = false;
      this.onInvestigationStarted.emit({sample: this.dataSample!, investigation_id: undefined});
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

  deleteSample(optionValue: string) {
    this.loadingDataSamples = true;
    let sample = this.getDataSampleByTitle(optionValue);
    if (sample !== undefined) {
      this.sampleService.deleteSample(sample.sample_id)
        .pipe(finalize(() => this.loadingDataSamples = false))
        .subscribe({
          next: (response) => {
            console.log('Sample deleted successfully:', response);

            this.availableDataSamples = this.availableDataSamples.filter(
              s => s.sample_id !== sample?.sample_id
            );

            this.options = this.options.filter(option => option !== optionValue);

            if (this.dataSample?.sample_id === sample?.sample_id) {
              this.setDataSample(undefined);
              this.inputControl.setValue('');
            }

            this.filteredOptions = this.inputControl.valueChanges.pipe(
              startWith(this.inputControl.value || ''),
              map(value => this._filter(value))
            );
          },
          error: async (error) => {
            this.dialog.open(ErrorDialogComponent, {
              data: {
                main_message: await firstValueFrom(this.translateService.get('DATA_SELECTOR.SAMPLE_ERROR')),
                error_message: error.message,
              }
            })
          }
        });
    } else {
      this.loadingDataSamples = false;
    }
  }

  openDeleteSampleDialog(optionValue: string): void {
    this.dialog.open(this.deleteSampleDialog, {
      data: {
        optionValue: optionValue
      }
    })
  }
}
