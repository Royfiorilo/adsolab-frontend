import {Component, EventEmitter, Output} from '@angular/core';
import * as XLSX from 'xlsx';
import {IAdsorbate, IAdsorbent, InvalidFileReason} from "../data-selector/data-sample";
import {IKineticsSample} from "../kinetics/interface";
import {faCircleCheck, faFileUpload, faXmarkCircle} from '@fortawesome/free-solid-svg-icons';
import {TranslateService} from "@ngx-translate/core";
import {SampleSelectorService} from "../data-selector/sample-selector.service";
import {catchError, firstValueFrom} from "rxjs";

const MIN_SAMPLE_POINTS = 2;

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
  protected dataSample: IKineticsSample = {
    adsorbate_id: undefined, adsorbent_id: undefined,
    temperature: undefined, description: undefined,
    time_unit: 'min', measure_unit: 'mg/g',
    time: [],
    qt: []
  }
  protected adsorbents: IAdsorbent[] = [];
  protected adsorbates: IAdsorbate[] = [];

  constructor(private translateService: TranslateService, private sampleService: SampleSelectorService) {

    this.sampleService.getMaterials()
      .pipe(
        catchError(async error => {
          if (error.status === 404) {
            await firstValueFrom(this.sampleService.syncMaterials())
            return await firstValueFrom(this.sampleService.getMaterials());
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
      let content: string | ArrayBuffer | null | undefined = e.target?.result;

      try {
        if (isCSV) {
          content = content as string;
        } else {
          const workbook = XLSX.read(content, {type: 'binary'});
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          content = XLSX.utils.sheet_to_csv(sheet);
        }
        this.validateCSVContent(content)
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

  validateCSVContent(content: string): void {
    const lines = content.split('\n');
    this.dataSample.time = [];
    this.dataSample.qt = [];

    for (const line of lines) {
      if (!line.trim() || line.trim() === ',') {
        continue;
      }

      const quotedPattern = /^"([\d,]+)","([\d,]+)"$/;
      const match = line.match(quotedPattern);

      if (match) {
        const value1 = match[1].replace(',', '.');
        const value2 = match[2].replace(',', '.');

        const num1 = Number(value1);
        const num2 = Number(value2);

        if (isNaN(num1) || isNaN(num2)) {
          this.setInvalidUploadedFile(InvalidFileReason.INVALID_DATA);
          return undefined;
        }

        this.dataSample.time.push(num1);
        this.dataSample.qt.push(num2);
      } else {
        const columns = line.split(',');
        if (columns.length !== 2) {
          this.setInvalidUploadedFile(InvalidFileReason.INVALID_FILE_STRUCTURE);
          return undefined;
        }

        const value1 = columns[0].trim();
        const value2 = columns[1].trim();

        if (value1 === "" || value2 === "") {
          this.setInvalidUploadedFile(InvalidFileReason.INVALID_DATA);
          return undefined;
        }

        const num1 = Number(value1);
        const num2 = Number(value2);

        if (isNaN(num1) || isNaN(num2)) {
          this.setInvalidUploadedFile(InvalidFileReason.INVALID_DATA);
          return undefined;
        }

        this.dataSample.time.push(num1);
        this.dataSample.qt.push(num2);
      }
    }

    if (this.dataSample.time.length < MIN_SAMPLE_POINTS || this.dataSample.qt.length < MIN_SAMPLE_POINTS) {
      this.setInvalidUploadedFile(InvalidFileReason.INVALID_DATA);
      return undefined;
    }

    if (this.dataSample.time.some(value => value < 0) || this.dataSample.qt.some(value => value < 0)) {
      this.setInvalidUploadedFile(InvalidFileReason.INVALID_DATA);
      return undefined;
    }

    this.uploadedFile.valid = true;
  }

  onUnitChange(event: any, type: string): void {
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

  onChange(event: Event) {
    // @ts-ignore
    this.dataSample[(event.target as HTMLInputElement).id] = (event.target as HTMLInputElement).value
    this.onDataSampleUploaded.emit(this.dataSample);
  }
}
