import {Component} from '@angular/core';
import {TranslateService} from "@ngx-translate/core";
import {AuthService} from "./common/auth.service";
import {Router} from "@angular/router";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  title = 'adsolab';

  constructor(translate: TranslateService, protected authService: AuthService, protected router: Router) {
    translate.setDefaultLang('es');
    translate.use('es');
  }

}
