import {Component, Inject} from '@angular/core';
import {MAT_SNACK_BAR_DATA, MatSnackBarRef} from "@angular/material/snack-bar";

@Component({
  selector: 'app-snack-bar',
  templateUrl: './snack-bar.component.html',
  styleUrl: './snack-bar.component.css'
})
export class SnackBarComponent {

  constructor(protected snackBarRef: MatSnackBarRef<any>, @Inject(MAT_SNACK_BAR_DATA) protected data: any) {
  }

}
