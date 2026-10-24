import {Component, ElementRef, EventEmitter, Output, ViewChild} from '@angular/core';
import * as XLSX from 'xlsx';
import {IAdsorbate, IAdsorbent, InvalidFileReason} from "../data-selector/data-sample";
import {IKineticsSample} from "../kinetics/interface";
import {faCircleCheck, faFileUpload, faXmarkCircle} from '@fortawesome/free-solid-svg-icons';
import {TranslateService} from "@ngx-translate/core";
import {SampleSelectorService} from "../data-selector/sample-selector.service";
import {catchError, firstValueFrom} from "rxjs";
import {MatSelectChange} from "@angular/material/select";
import {MaterialDialogService} from "../material-dialog/material-dialog.service";
import {MaterialKind, NEW_MATERIAL, withMaterial} from "../material-dialog/interface";
import {IKineticsSeries, IKineticsSheet} from "./interface";
import {hasNegativeValues, parseWorkbook} from "./kinetics-sheet-parser";

@Component({
  selector: 'app-kinetics-file-upload',
  templateUrl: './kinetics-file-upload.component.html',
  styleUrls: ['./kinetics-file-upload.component.css']
})
export class KineticsFileUploadComponent {
  isDragging = false;
  @Output() onDataSampleUploaded: EventEmitter<IKineticsSample> = new EventEmitter();
  protected faUpload = faFileUpload;
  protected faCircleCheck = faCircleCheck;
  protected faXmarkCircle = faXmarkCircle;
  protected uploadedFile: { name?: string, valid?: boolean, reason?: InvalidFileReason } = {};
  @ViewChild('fileInput') private fileInput?: ElementRef<HTMLInputElement>;
  protected dataSample: IKineticsSample = this.emptySample();
  protected adsorbents: IAdsorbent[] = [];
  protected adsorbates: IAdsorbate[] = [];
  protected sheets: IKineticsSheet[] = [];
  protected selectedSheet = 0;
  protected selectedSeries = 0;

  protected readonly NEW_MATERIAL = NEW_MATERIAL;

  constructor(private translateService: TranslateService, private sampleService: SampleSelectorService,
              private materialDialog: MaterialDialogService) {

    this.sampleService.getMaterials()
      .pipe(
        catchError(async error => {
          // 404 means an empty table (a database without the seed).
          if (error.status === 404) {
            return {adsorbates: [], adsorbents: []};
          } else {
            throw await firstValueFrom(this.translateService.get('DATA_SELECTOR.ERROR_LOADING_PREVIOUS_SAMPLES', error));
          }
        })
      )
      .subscribe(response => {
        this.adsorbates = response.adsorbates
        this.adsorbents = response.adsorbents
      })

  }

  private emptySample(): IKineticsSample {
    return {
      adsorbate_id: undefined, adsorbent_id: undefined,
      temperature: undefined, description: undefined,
      time_unit: 'min', measure_unit: 'mg/g',
      time: [],
      qt: []
    };
  }

  // A created sample cannot be edited, so every new file starts a new sample from scratch.
  reset(): void {
    this.dataSample = this.emptySample();
    this.uploadedFile = {};
    this.sheets = [];
    this.selectedSheet = 0;
    this.selectedSeries = 0;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  get isSampleCreated(): boolean {
    return this.dataSample.sample_id !== undefined;
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragging = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  handleFile(file: File) {
    this.reset();
    this.uploadedFile = {name: file.name};

    const allowedTypes = ['application/vnd.ms-excel', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!allowedTypes.includes(file.type)) {
      this.setInvalidUploadedFile(InvalidFileReason.INVALID_FILE_TYPE);
      return;
    }

    this.validateFileStructure(file);
  }

  validateFileStructure(file: File) {
    const reader = new FileReader();
    let isCSV = file.type === 'text/csv';

    reader.onload = (e) => {
      const content: string | ArrayBuffer | null | undefined = e.target?.result;

      try {
        if (isCSV) {
          this.validateCSVContent(content as string);
        } else {
          this.loadSheets(parseWorkbook(XLSX.read(content, {type: 'array'})));
        }
      } catch (e: any) {
        this.setInvalidUploadedFile(InvalidFileReason.READ_ERROR);
      }

    };

    reader.onerror = () => {
      this.setInvalidUploadedFile(InvalidFileReason.READ_ERROR);
    };

    if (isCSV) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  }

  setInvalidUploadedFile(reason: InvalidFileReason) {
    this.uploadedFile.valid = false;
    this.uploadedFile.reason = reason;
  }

  // raw: CSV cells stay text so decimal commas ("0,5") are parsed by us, not split or misread.
  validateCSVContent(content: string): void {
    this.loadSheets(parseWorkbook(XLSX.read(content, {type: 'string', raw: true})));
  }

  loadSheets(sheets: IKineticsSheet[]): void {
    this.sheets = sheets;
    const usable = sheets.findIndex(sheet => !sheet.error);
    this.selectSheet(usable === -1 ? 0 : usable);
  }

  selectSheet(index: number): void {
    this.selectedSheet = index;
    const sheet = this.sheets[index];
    if (!sheet || sheet.error) {
      this.dataSample.time = [];
      this.dataSample.qt = [];
      this.setInvalidUploadedFile(sheet?.error ?? InvalidFileReason.INVALID_DATA);
      return;
    }
    this.selectSeries(0);
  }

  selectSeries(index: number): void {
    this.selectedSeries = index;
    const series = this.currentSheet!.series[index];
    this.dataSample.time = [...series.time];
    this.dataSample.qt = [...series.qt];
    if (hasNegativeValues(series)) {
      this.setInvalidUploadedFile(InvalidFileReason.INVALID_DATA);
      return;
    }
    this.uploadedFile.valid = true;
    this.uploadedFile.reason = undefined;
  }

  get currentSheet(): IKineticsSheet | undefined {
    return this.sheets[this.selectedSheet];
  }

  get showSheetSelector(): boolean {
    return this.sheets.length > 1;
  }

  get showSeriesSelector(): boolean {
    return (this.currentSheet?.series.length ?? 0) > 1;
  }

  seriesLabel(series: IKineticsSeries, index: number): string {
    const label = series.label || this.translateService.instant('KINETICS_DATA_SELECTOR.SERIES_N', {n: index + 1});
    return `${label} (${this.translateService.instant('KINETICS_DATA_SELECTOR.POINTS', {points: series.time.length})})`;
  }

  onUnitChange(event: any, type: string): void {
    if (event.value === NEW_MATERIAL) {
      this.addMaterial(event, type as MaterialKind);
      return;
    }
    const selectedValue = event.value;
    if (type === 'adsorbate') {
      this.dataSample.adsorbate_id = selectedValue;
      this.dataSample.adsorbate = this.adsorbates.find(adsorbate => adsorbate.id === selectedValue)?.iupac_name;
    } else if (type === 'adsorbent') {
      this.dataSample.adsorbent_id = selectedValue;
      this.dataSample.adsorbent = this.adsorbents.find(adsorbent => adsorbent.id === selectedValue)?.name;
    }
    this.onDataSampleUploaded.emit(this.dataSample);
  }

  // "Agregar nuevo..." keeps the previous choice while the dialog is open and selects the result.
  private addMaterial(event: MatSelectChange, kind: MaterialKind): void {
    event.source.value = kind === 'adsorbate' ? this.dataSample.adsorbate_id : this.dataSample.adsorbent_id;
    this.materialDialog.create(kind).subscribe(material => {
      if (!material) {
        return;
      }
      if (kind === 'adsorbate') {
        this.adsorbates = withMaterial(this.adsorbates, material as IAdsorbate);
      } else {
        this.adsorbents = withMaterial(this.adsorbents, material as IAdsorbent);
      }
      this.onUnitChange({value: material.id}, kind);
    });
  }

  onChange(event: Event) {
    // @ts-ignore
    this.dataSample[(event.target as HTMLInputElement).id] = (event.target as HTMLInputElement).value
    this.onDataSampleUploaded.emit(this.dataSample);
  }
}
