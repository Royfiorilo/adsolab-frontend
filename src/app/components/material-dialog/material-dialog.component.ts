import {Component, Inject} from '@angular/core';
import {AbstractControl, FormControl, FormGroup, ValidationErrors, ValidatorFn} from '@angular/forms';
import {MAT_DIALOG_DATA, MatDialog, MatDialogRef} from '@angular/material/dialog';
import {TranslateService} from '@ngx-translate/core';
import {Observable} from 'rxjs';
import {IAdsorbate, IAdsorbent} from '../data-selector/data-sample';
import {ErrorDialogComponent} from '../error-dialog/error-dialog.component';
import {SampleSelectorService} from '../data-selector/sample-selector.service';
import {
  IAdsorbateCreation, IAdsorbentCreation, IMaterialDialogData, IMaterialDialogResult, MATERIAL_FIELD_LIMITS, MaterialField,
  normalizeMaterialText,
} from './interface';

const FIELDS_BY_KIND: { [kind: string]: MaterialField[] } = {
  adsorbate: ['ion_name', 'iupac_name', 'formula'],
  adsorbent: ['name'],
};

// Required and within the limit once trimmed, like the backend checks it.
export function materialTextValidator(max: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const text = normalizeMaterialText(control.value ?? '');
    if (!text) {
      return {required: true};
    }
    return text.length > max ? {maxlength: {requiredLength: max, actualLength: text.length}} : null;
  };
}

@Component({
  selector: 'app-material-dialog',
  templateUrl: './material-dialog.component.html',
})
export class MaterialDialogComponent {
  protected readonly fields: MaterialField[];
  protected readonly limits = MATERIAL_FIELD_LIMITS;
  protected readonly form: FormGroup;
  protected saving = false;

  constructor(@Inject(MAT_DIALOG_DATA) protected data: IMaterialDialogData,
              private dialogRef: MatDialogRef<MaterialDialogComponent, IMaterialDialogResult>,
              private sampleService: SampleSelectorService,
              private dialog: MatDialog,
              private translateService: TranslateService) {
    this.fields = FIELDS_BY_KIND[data.kind];
    this.form = new FormGroup(Object.fromEntries(
      this.fields.map(field => [field, new FormControl('', materialTextValidator(MATERIAL_FIELD_LIMITS[field]))])
    ));
  }

  length(field: MaterialField): number {
    return normalizeMaterialText(this.form.get(field)?.value ?? '').length;
  }

  submit(): void {
    if (this.form.invalid || this.saving) {
      this.form.markAllAsTouched();
      return;
    }
    const payload = Object.fromEntries(
      this.fields.map(field => [field, normalizeMaterialText(this.form.get(field)?.value ?? '')])
    );
    const request: Observable<IAdsorbate | IAdsorbent> = this.data.kind === 'adsorbate'
      ? this.sampleService.createAdsorbate(payload as unknown as IAdsorbateCreation)
      : this.sampleService.createAdsorbent(payload as unknown as IAdsorbentCreation);

    this.saving = true;
    request.subscribe({
      next: material => this.dialogRef.close({material, existed: false}),
      error: error => {
        this.saving = false;
        // The backend answers 409 with the material that already exists: use it.
        if (error.status === 409 && error.error?.existing) {
          this.dialogRef.close({material: error.error.existing, existed: true});
          return;
        }
        this.dialog.open(ErrorDialogComponent, {
          data: {
            main_message: this.translateService.instant('MATERIALS.CREATE_ERROR'),
            error_message: error.error?.message ?? error.message,
          }
        });
      },
    });
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
