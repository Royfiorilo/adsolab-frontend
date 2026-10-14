import {Component, EventEmitter, Input, OnInit, Output, TemplateRef, ViewChild} from '@angular/core';
import {catchError, finalize, forkJoin, Observable, of, switchMap, throwError} from "rxjs";
import {faTrash} from "@fortawesome/free-solid-svg-icons";
import {TranslateService} from "@ngx-translate/core";
import {MatDialog} from "@angular/material/dialog";
import {MatSnackBar} from "@angular/material/snack-bar";
import {AuthService} from "../../common/auth.service";
import {MIN_FIT_POINTS} from "../../common/common.service";
import {SnackBarComponent} from "../snack-bar/snack-bar.component";
import {ErrorDialogComponent} from "../error-dialog/error-dialog.component";
import {GetMaterialsResponse} from "../data-selector/data-sample";
import {SampleSelectorService} from "../data-selector/sample-selector.service";
import {toKineticsSample} from "../kinetics-historic/kinetics-historic.service";
import {CreateKineticSampleResponse, GetKineticSamplesResponse, IKineticsSample} from "../kinetics/interface";
import {KineticsFileUploadComponent} from "../kinetics-file-upload/kinetics-file-upload.component";
import {KineticsSampleService} from "./kinetics-sample.service";

export interface IKineticsSampleOption {
  sample: IKineticsSample;
  points: number;
  tooShort: boolean;
}

@Component({
  selector: 'app-kinetics-data-selector',
  templateUrl: './kinetics-data-selector.component.html',
  styleUrl: './kinetics-data-selector.component.css'
})
export class KineticsDataSelectorComponent implements OnInit {
  @Input() kineticsSample: IKineticsSample | undefined;
  @Output() onSampleLoaded: EventEmitter<IKineticsSample> = new EventEmitter();
  @Output() onSampleDeleted: EventEmitter<number> = new EventEmitter();
  @ViewChild('deleteSampleDialog') private deleteSampleDialog!: TemplateRef<any>;
  @ViewChild(KineticsFileUploadComponent) private fileUpload?: KineticsFileUploadComponent;

  protected readonly faTrash = faTrash;
  protected readonly minPoints = MIN_FIT_POINTS;
  protected options: IKineticsSampleOption[] = [];
  protected loadingSamples = false;
  protected filterText = '';

  constructor(
    private kineticsSampleService: KineticsSampleService,
    private sampleSelectorService: SampleSelectorService,
    private authService: AuthService,
    private translateService: TranslateService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar) {
  }

  ngOnInit(): void {
    this.loadSamples();
  }

  // Only the logged user's samples, newest first.
  private loadSamples(): void {
    const userId = this.authService.user()?.id;
    if (userId === undefined) {
      return;
    }

    this.loadingSamples = true;
    forkJoin({
      materials: this.fetchMaterials(),
      response: this.kineticsSampleService.getSamples(userId).pipe(
        // The backend answers 404 when the user has no samples yet.
        catchError(error => error.status === 404 ? of<GetKineticSamplesResponse>({samples: []}) : throwError(() => error))
      ),
    }).pipe(finalize(() => this.loadingSamples = false)).subscribe({
      next: ({materials, response}) => this.options = this.buildOptions(response.samples, materials),
      error: error => this.openError('KINETICS_DATA_SELECTOR.ERROR_LOADING_SAMPLES', error),
    });
  }

  // Materials are synced from the external source and retried when the first read finds none.
  private fetchMaterials(): Observable<GetMaterialsResponse> {
    return this.sampleSelectorService.getMaterials().pipe(
      catchError(error => error.status === 404
        ? this.sampleSelectorService.syncMaterials().pipe(switchMap(() => this.sampleSelectorService.getMaterials()))
        : throwError(() => error))
    );
  }

  private buildOptions(samples: CreateKineticSampleResponse[], materials: GetMaterialsResponse): IKineticsSampleOption[] {
    return [...samples]
      .sort((a, b) => b.kinetic_sample_id - a.kinetic_sample_id)
      .map(dto => {
        const sample: IKineticsSample = {
          ...toKineticsSample(dto),
          time: [...dto.time],
          qt: [...dto.qt],
          adsorbate: materials.adsorbates.find(adsorbate => adsorbate.id === dto.adsorbate_id)?.iupac_name,
          adsorbent: materials.adsorbents.find(adsorbent => adsorbent.id === dto.adsorbent_id)?.name,
        };
        return {sample, points: dto.time.length, tooShort: dto.time.length < MIN_FIT_POINTS};
      });
  }

  get filteredOptions(): IKineticsSampleOption[] {
    const text = this.filterText.trim().toLowerCase();
    return text ? this.options.filter(option => (option.sample.title ?? '').toLowerCase().includes(text)) : this.options;
  }

  onFilterChange(event: Event): void {
    this.filterText = (event.target as HTMLInputElement).value;
  }

  isSelected(option: IKineticsSampleOption): boolean {
    return this.kineticsSample?.sample_id !== undefined && this.kineticsSample.sample_id === option.sample.sample_id;
  }

  selectSample(option: IKineticsSampleOption): void {
    if (option.tooShort) {
      return;
    }
    this.fileUpload?.reset();
    this.onSampleLoaded.emit({...option.sample, time: [...option.sample.time], qt: [...option.sample.qt]});
  }

  openDeleteDialog(option: IKineticsSampleOption, event: Event): void {
    event.stopPropagation();
    this.dialog.open(this.deleteSampleDialog, {data: {optionValue: option.sample.title, sampleId: option.sample.sample_id}});
  }

  deleteSample(sampleId: number): void {
    this.kineticsSampleService.deleteSample(sampleId).subscribe({
      next: () => {
        this.options = this.options.filter(option => option.sample.sample_id !== sampleId);
        if (this.kineticsSample?.sample_id === sampleId) {
          this.onSampleDeleted.emit(sampleId);
        }
      },
      error: error => {
        if (error.status === 403) {
          this.openSnackBar('KINETICS_DATA_SELECTOR.DELETE_NOT_AUTHORIZED');
          return;
        }
        this.openError('KINETICS_DATA_SELECTOR.DELETE_ERROR', error);
      },
    });
  }

  private openSnackBar(key: string): void {
    this.snackBar.openFromComponent(SnackBarComponent, {
      duration: 3000,
      verticalPosition: 'top',
      data: {message: this.translateService.instant(key)},
    });
  }

  private openError(key: string, error: { message?: string }): void {
    this.dialog.open(ErrorDialogComponent, {
      data: {
        main_message: this.translateService.instant(key),
        error_message: error.message,
      }
    });
  }

  private isSampleReadyToSubmit(sample: IKineticsSample): boolean {
    return sample.description !== undefined && sample.description !== '' &&
      sample.adsorbate_id !== undefined &&
      sample.adsorbent_id !== undefined &&
      sample.temperature !== undefined;
  }

  onUploadDataSample(sample: IKineticsSample) {
    if (!this.isSampleReadyToSubmit(sample)) {
      return;
    }

    this.kineticsSampleService.createKineticSample(sample).subscribe({
      error: (error) => this.openError('KINETICS_DATA_SELECTOR.CREATE_SAMPLE_ERROR', error),
      next: (response) => {
        sample.title = response.title;
        sample.sample_id = response.kinetic_sample_id;
        this.onSampleLoaded.emit(sample);
        this.loadSamples();
      }
    });
  }
}
