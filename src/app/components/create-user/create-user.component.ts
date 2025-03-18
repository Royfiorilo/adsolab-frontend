import {Component} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {UserService} from '../../common/user.service';
import {firstValueFrom, merge} from "rxjs";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {TranslateService} from "@ngx-translate/core";
import {IUserCreationRequest} from '../../common/common.interface';
import {MatDialogRef} from "@angular/material/dialog";

@Component({
  selector: 'app-create-user',
  templateUrl: './create-user.component.html',
  styleUrl: './create-user.component.css'
})
export class CreateUserComponent {

  protected form: FormGroup;
  protected emailErrorMessage: string | null = null;
  protected passwordErrorMessage: string | null = null;
  protected userRoleErrorMessage: string | null = null;
  protected userCreationErrorMessage: string | null = null;
  protected showPassword: boolean = false;
  protected creatingUser: boolean = false;


  constructor(
    private fb: FormBuilder,
    private userService: UserService,
    private translateService: TranslateService,
    private dialogRef: MatDialogRef<CreateUserComponent>
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      userRole: ['', Validators.required]
    });

    let emailControl = this.form.controls['email']
    let passwordControl = this.form.controls['password']
    let userRoleControl = this.form.controls['userRole']

    merge(emailControl.statusChanges, emailControl.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateEmailErrorMessage());

    merge(passwordControl.statusChanges, passwordControl.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updatePasswordErrorMessage());

    merge(userRoleControl.statusChanges, userRoleControl.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateRoleErrorMessage());
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

  async updateRoleErrorMessage() {

    let userRoleControl = this.form.controls['userRole'];

    if (userRoleControl.hasError('required')) {
      this.userRoleErrorMessage = await firstValueFrom(this.translateService.get('MUST_ENTER_VALUE'));
    } else {
      this.userRoleErrorMessage = null;
    }
  }

  createUser() {

    if (!this.form.invalid) {

      this.creatingUser = true;

      let user: IUserCreationRequest = {
        email: this.form.controls['email'].value,
        password: this.form.controls['password'].value,
        role: this.form.controls['userRole'].value
      }

      this.userService.createUser(user).subscribe({
        next: () => {
          this.dialogRef.close(true);
          this.creatingUser = false;
        },
        error: error => {
          this.userCreationErrorMessage = error.message;
          this.creatingUser = false;
        }
      })

    } else {
      this.updateEmailErrorMessage()
      this.updatePasswordErrorMessage()
      this.updateRoleErrorMessage()
    }

  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

}
