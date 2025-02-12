import {Component} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: 'app-investigation-modal',
  template: `
    <h2 mat-dialog-title>
      {{ 'INVESTIGATION.CONTINUE_INVESTIGATION_TITLE' | translate }}
    </h2>
    <mat-dialog-content class="mat-typography">
      <p>
        {{ 'INVESTIGATION.ONGOING_INVESTIGATION_DETECTED' | translate }}
        <br>
        {{ 'INVESTIGATION.CONTINUE_INVESTIGATION_QUESTION' | translate }}
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button color="primary" (click)="close()">
        {{ 'INVESTIGATION.CONTINUE' | translate }}
      </button>
      <button mat-flat-button color="primary" class="text-white" (click)="createNew()">
        {{ 'INVESTIGATION.CREATE_NEW' | translate }}
      </button>
    </mat-dialog-actions>
  `
})
export class InvestigationModalComponent {
  constructor(private dialogRef: MatDialogRef<InvestigationModalComponent>) {
  }

  close() {
    this.dialogRef.close();
  }

  createNew() {
    this.dialogRef.close(true);
  }
}
