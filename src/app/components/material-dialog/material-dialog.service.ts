import {Injectable} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';
import {TranslateService} from '@ngx-translate/core';
import {map, Observable} from 'rxjs';
import {IAdsorbate, IAdsorbent} from '../data-selector/data-sample';
import {SnackBarComponent} from '../snack-bar/snack-bar.component';
import {MaterialDialogComponent} from './material-dialog.component';
import {IMaterialDialogResult, MaterialKind} from './interface';

@Injectable({
  providedIn: 'root'
})
export class MaterialDialogService {

  constructor(private dialog: MatDialog, private snackBar: MatSnackBar, private translateService: TranslateService) {
  }

  // Opens the dialog; emits the created (or already existing) material, or undefined when cancelled.
  create(kind: MaterialKind): Observable<IAdsorbate | IAdsorbent | undefined> {
    return this.dialog.open<MaterialDialogComponent, unknown, IMaterialDialogResult>(
      MaterialDialogComponent, {data: {kind}, width: '480px'}
    ).afterClosed().pipe(map(result => {
      if (result?.existed) {
        this.snackBar.openFromComponent(SnackBarComponent, {
          duration: 4000,
          verticalPosition: 'top',
          data: {message: this.translateService.instant('MATERIALS.ALREADY_EXISTS')},
        });
      }
      return result?.material;
    }));
  }
}
