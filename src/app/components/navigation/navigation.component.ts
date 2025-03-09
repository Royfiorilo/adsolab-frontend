import {Component} from '@angular/core';
import {AuthService} from "../../common/auth.service";

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.css'
})
export class NavigationComponent {

  constructor(protected authService: AuthService) {
  }

  logout() {
    this.authService.logout();
  }
}
