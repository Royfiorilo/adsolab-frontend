import {Component} from '@angular/core';
import {TranslateService} from "@ngx-translate/core";
import {AuthService} from "../../common/auth.service";

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.css'
})
export class MainPageComponent {

  constructor(translate: TranslateService, private authService: AuthService) {
    translate.setDefaultLang('es');
    translate.use('es');
  }

  isAdmin(): boolean {
    return this.authService.isAdmin()
  }
}
