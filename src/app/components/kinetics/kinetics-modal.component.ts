import {Component} from '@angular/core';
import {MatDialogRef} from '@angular/material/dialog';

@Component({
  selector: 'app-kinetics-modal',
  template: `
    <h2 mat-dialog-title>
      {{ 'KINETICS.CONTINUE_INVESTIGATION_TITLE' | translate }}
    </h2>
    <mat-dialog-content class="mat-typography">
      <p>
        {{ 'KINETICS.ONGOING_INVESTIGATION_DETECTED' | translate }}
        <br>
        {{ 'KINETICS.CONTINUE_INVESTIGATION_QUESTION' | translate }}
      </p>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button color="primary" (click)="close()">
        {{ 'KINETICS.CONTINUE' | translate }}
      </button>
      <button mat-flat-button color="primary" class="text-white" (click)="createNew()">
        {{ 'KINETICS.CREATE_NEW' | translate }}
      </button>
    </mat-dialog-actions>
  `
})
export class KineticsModalComponent {
  constructor(private dialogRef: MatDialogRef<KineticsModalComponent>) {
  }

  close() {
    this.dialogRef.close();
  }

  createNew() {
    this.dialogRef.close(true);
  }
}
