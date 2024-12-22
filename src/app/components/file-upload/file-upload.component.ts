import {Component, EventEmitter, Output} from '@angular/core';
import * as XLSX from 'xlsx';
import {DataSample, InvalidFileReason} from "../data-selector/data-sample";
import {faCircleCheck, faFileDownload, faFileUpload, faXmarkCircle} from '@fortawesome/free-solid-svg-icons';
import {TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent {
  isDragging = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;
  @Output() onDataSampleUploaded: EventEmitter<DataSample> = new EventEmitter();
  protected faUpload = faFileUpload;
  protected faDownload = faFileDownload;
  protected faCircleCheck = faCircleCheck;
  protected faXmarkCircle = faXmarkCircle;
  protected uploadedFile: { name?: string, valid?: boolean, reason?: InvalidFileReason } = {};
  protected dataSample: DataSample = {
    description: undefined, sample_id: undefined, title: undefined,
    ce: [],
    qe: []
  }

  constructor(private translate: TranslateService) {
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
    this.errorMessage = null;
    this.successMessage = null;
    this.uploadedFile = {name: file.name};

    const allowedTypes = ['application/vnd.ms-excel', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!allowedTypes.includes(file.type)) {
      this.uploadedFile.valid = false;
      this.uploadedFile.reason = InvalidFileReason.INVALID_FILE_TYPE;
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
    this.dataSample.ce = [];
    this.dataSample.qe = [];

    for (const line of lines) {
      const columns = line.split(',');
      if (columns.length !== 2) {
        this.setInvalidUploadedFile(InvalidFileReason.INVALID_FILE_STRUCTURE)
        return undefined;
      } else if (columns[0] === "" || columns[1] === "" || isNaN(Number(columns[0])) || isNaN(Number(columns[1]))) {
        this.setInvalidUploadedFile(InvalidFileReason.INVALID_DATA)
        return undefined;
      }
      this.dataSample.ce.push(Number(columns[0]))
      this.dataSample.qe.push(Number(columns[1]))
    }
    this.uploadedFile.valid = true;
  }

  onChange(event: Event) {

    this.dataSample.title = (event.target as HTMLInputElement).value
    this.onDataSampleUploaded.emit(this.dataSample);
  }

  downloadTemplateFile() {

    let link = document.createElement('a');
    link.setAttribute('type', 'hidden');
    link.href = '/assets/Template AdsoLab data.xlsx';
    link.download = 'Template AdsoLab data.xlsx';
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}
