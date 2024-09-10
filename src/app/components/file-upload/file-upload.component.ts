import {Component, EventEmitter, Output} from '@angular/core';
import * as XLSX from 'xlsx';
import {DataSample} from "../data-selector/data-sample";

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

    const allowedTypes = ['application/vnd.ms-excel', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (!allowedTypes.includes(file.type)) {
      this.errorMessage = 'Solo se admiten archivos en formato Excel o CSV.';
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
          const workbook = XLSX.read(content, { type: 'binary' });
          const sheetName = workbook.SheetNames[0];
          const sheet = workbook.Sheets[sheetName];
          content = XLSX.utils.sheet_to_csv(sheet);
        }
        this.onDataSampleUploaded.emit(this.validateCSVContent(content));
      } catch (e: any) {
        this.errorMessage = e.message;
      }

    };

    reader.onerror = () => {
      this.errorMessage = 'Error en la lectura del archivo.';
    };

    if (isCSV) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }

  }

  validateCSVContent(content: string): DataSample {
    const lines = content.split('\n');
    const dataSample: DataSample = {
      ce: [],
      qe: []
    }

    for (const line of lines) {
      const columns = line.split(',');
      if (columns.length !== 2){
        throw new Error('Formato invalido. El archivo debe tener exactamente dos columnas.');
      } else if (columns[0] === "" || columns[1] === "" || isNaN(Number(columns[0])) || isNaN(Number(columns[1]))) {
        throw new Error('Formato invalido. El archivo debe tener exclusivamente valores numericos.');
      }
      dataSample.ce.push(Number(columns[0]))
      dataSample.qe.push(Number(columns[1]))
    }
    this.successMessage = 'Archivo valido!';
    return dataSample;
  }
}
