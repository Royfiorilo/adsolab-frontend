import {Component} from '@angular/core';
import {TranslateService} from "@ngx-translate/core";
import {AuthService} from "../../common/auth.service";
import {faFlaskVial, faHistory, faUsers} from "@fortawesome/free-solid-svg-icons";

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


  protected readonly faHistory = faHistory;
  protected readonly faUsers = faUsers;
  protected readonly faFlaskVial = faFlaskVial;
}
