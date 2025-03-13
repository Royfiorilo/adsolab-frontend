import {Component, Inject} from '@angular/core';
import {AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators} from "@angular/forms";
import {UserService} from "../../common/user.service";
import {TranslateService} from "@ngx-translate/core";
import {MAT_DIALOG_DATA, MatDialogRef} from "@angular/material/dialog";
import {firstValueFrom, merge} from "rxjs";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {IUser, IUserEditRequest} from "../../common/common.interface";

function validatePassword(form: FormGroup): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {

    let passwordValid = true;

    const value = control.value;

    if (!value && form.controls['changePassword'].value) {
      passwordValid = false;
    }

    return !passwordValid ? {required: true} : null;
  }
}

@Component({
  selector: 'app-edit-user',
  templateUrl: './edit-user.component.html',
  styleUrl: './edit-user.component.css'
})
export class EditUserComponent {

  protected form: FormGroup;
  protected emailErrorMessage: string | null = null;
  protected passwordErrorMessage: string | null = null;
  protected userEditErrorMessage: string | null = null;
  protected editingUser: boolean = false;

  protected password: string | undefined = undefined;


  constructor(
    @Inject(MAT_DIALOG_DATA) protected user: IUser,
    private fb: FormBuilder,
    private userService: UserService,
    private translateService: TranslateService,
    private dialogRef: MatDialogRef<EditUserComponent>
  ) {
    this.form = this.fb.group({
      email: [user.email, [Validators.required, Validators.email]],
      userRole: [user.roles[0]],
      active: [user.active],
      changePassword: [false],
      password: [''],
    });

    this.form.get('password')?.setValidators(validatePassword(this.form))

    let emailControl = this.form.controls['email']
    let passwordControl = this.form.controls['password']

    merge(emailControl.statusChanges, emailControl.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateEmailErrorMessage());

    merge(passwordControl.statusChanges, passwordControl.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updatePasswordErrorMessage());
  }


  async updateEmailErrorMessage() {

    let emailControl = this.form.controls['email'];

    if (emailControl.hasError('required')) {
      this.emailErrorMessage = await firstValueFrom(this.translateService.get('MUST_ENTER_VALUE'));
    } else if (emailControl.hasError('email')) {
      this.emailErrorMessage = await firstValueFrom(this.translateService.get('INVALID_FORMAT'));
    } else {
      this.emailErrorMessage = null;
    }
  }

  async updatePasswordErrorMessage() {

    let passwordControl = this.form.controls['password'];

    if (passwordControl.hasError('required')) {
      this.passwordErrorMessage = await firstValueFrom(this.translateService.get('MUST_ENTER_VALUE'));
    } else {
      this.passwordErrorMessage = null;
    }
  }


  editUser() {

    for (const control of Object.values(this.form.controls)) {

      control.updateValueAndValidity();

    }

    if (!this.form.invalid) {

      this.editingUser = true;

      let userEditRequest: IUserEditRequest = {
        email: this.form.controls['email'].value,
        password: this.form.controls['password'].value,
        role: this.form.controls['userRole'].value,
        active: this.form.controls['active'].value
      }

      this.userService.editUser(this.user.id, userEditRequest).subscribe({
        next: () => {
          this.dialogRef.close(true);
          this.editingUser = false;
        },
        error: error => {
          this.userEditErrorMessage = error.message;
          this.editingUser = false;
        }
      })

    } else {
      console.log(this.form.errors)
      this.updateEmailErrorMessage()
      this.updatePasswordErrorMessage()
    }

  }

}
