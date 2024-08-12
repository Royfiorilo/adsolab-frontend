import { Component } from '@angular/core';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-file-upload',
  templateUrl: './file-upload.component.html',
  styleUrls: ['./file-upload.component.css']
})
export class FileUploadComponent {
  isDragging = false;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
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

    reader.onload = (e) => {
      let content: string | ArrayBuffer | null | undefined = e.target?.result;
      let isCSV = file.type === 'text/csv';

      if (isCSV) {
        content = content as string;
        this.validateCSVContent(content);
      } else {
        const workbook = XLSX.read(content, { type: 'binary' });
        console.log(workbook);
        const sheetName = workbook.SheetNames[0];
        console.log(sheetName);
        const sheet = workbook.Sheets[sheetName];
        console.log(sheet);
        const csv = XLSX.utils.sheet_to_csv(sheet);
        this.validateCSVContent(csv);
      }
    };

    reader.onerror = () => {
      this.errorMessage = 'Error en la lectura del archivo.';
    };

    reader.readAsArrayBuffer(file);
  }

  validateCSVContent(content: string) {
    const lines = content.split('\n');

    for (const line of lines) {
      const columns = line.split(',');
      if (columns.length !== 2){
        this.errorMessage = 'Formato invalido. El archivo debe tener exactamente dos columnas.';
      } else if (isNaN(Number(columns[0])) || isNaN(Number(columns[1]))) {
        this.errorMessage = 'Formato invalido. El archivo debe tener exclusivamente valores numericos.';
        return;
      }
    }
    this.successMessage = 'Archivo valido!';
  }

}
