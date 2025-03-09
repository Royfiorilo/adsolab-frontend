import {Component} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {ActivatedRoute, Router} from "@angular/router";
import {AuthService} from "../../common/auth.service";
import {HttpErrorResponse} from "@angular/common/http";
import {firstValueFrom, merge} from "rxjs";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  form: FormGroup;

  private redirectURL: string | null = null;

  protected loginErrorMessage: string | null = null;

  protected emailErrorMessage: string | null = null;
  protected passwordErrorMessage: string | null = null;

  constructor(private fb: FormBuilder,
              private authService: AuthService,
              private router: Router,
              private route: ActivatedRoute,
              private translateService: TranslateService) {

    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      remember: [''],
    });

    let emailControl = this.form.controls['email']
    let passwordControl = this.form.controls['password']

    merge(emailControl.statusChanges, emailControl.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updateEmailErrorMessage());

    merge(passwordControl.statusChanges, passwordControl.valueChanges)
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.updatePasswordErrorMessage());
  }

  ngOnInit(): void {

    let params = this.route.snapshot.queryParams;
    if (params['redirectURL']) {
      this.redirectURL = params['redirectURL'];
    }

    this.authService.loginData(this.redirectURL ?? '/');
  }

  async login() {
    const val = this.form.value;

    for (const control of Object.values(this.form.controls)) {

      if (control.hasError('incorrect')) {
        control.setErrors({'incorrect': null});
        control.updateValueAndValidity();
      }

    }

    if (!this.form.invalid) {
      this.authService.login({
        email: val.email,
        password: val.password,
        remember: val.remember,
      })
        .subscribe({
            next: () => {
              if (this.redirectURL) {
                this.router.navigateByUrl(this.redirectURL)
                  .catch(() => this.router.navigate(['/']))
              } else {
                this.router.navigate(['/'])
              }
            },
            error: async (error: HttpErrorResponse) => {
              if (error.status === 400) {
                this.loginErrorMessage = await firstValueFrom(this.translateService.get('LOGIN.BAD_CREDENTIALS'));

                for (const control of Object.values(this.form.controls)) {
                  control.setErrors({'incorrect': true});
                }

              } else {
                throw error;
              }
            }
          }
        );
    } else {
      await this.updatePasswordErrorMessage()
      await this.updateEmailErrorMessage()
    }
  }

  async updateEmailErrorMessage() {

    let emailControl = this.form.controls['email'];

    if (emailControl.hasError('required')) {
      this.emailErrorMessage = await firstValueFrom(this.translateService.get('LOGIN.MUST_ENTER_VALUE'));
    } else if (emailControl.hasError('email')) {
      this.emailErrorMessage = await firstValueFrom(this.translateService.get('LOGIN.INVALID_EMAIL'));
    } else {
      this.emailErrorMessage = null;
    }
  }

  async updatePasswordErrorMessage() {

    let passwordControl = this.form.controls['password'];

    if (passwordControl.hasError('required')) {
      this.passwordErrorMessage = await firstValueFrom(this.translateService.get('LOGIN.MUST_ENTER_VALUE'));
    } else {
      this.passwordErrorMessage = null;
    }
  }

}
