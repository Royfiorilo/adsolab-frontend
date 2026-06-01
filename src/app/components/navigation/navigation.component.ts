import {Component} from '@angular/core';
import {AuthService} from "../../common/auth.service";
import {EditUserComponent} from "../edit-user/edit-user.component";
import {SnackBarComponent} from "../snack-bar/snack-bar.component";
import {MatDialog} from "@angular/material/dialog";
import {MatSnackBar} from "@angular/material/snack-bar";
import {MatSidenav} from "@angular/material/sidenav";
import {BreakpointObserver, Breakpoints} from "@angular/cdk/layout";
import {map} from "rxjs/operators";
import {Observable, shareReplay} from "rxjs";
import {faClock, faFlaskVial, faGauge, faHistory, faUsers} from "@fortawesome/free-solid-svg-icons";

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.css'
})
export class NavigationComponent {

  isMobile$: Observable<boolean>;
  private isMobile = false;

  // Sidebar navigation icons
  protected readonly faGauge = faGauge;
  protected readonly faFlaskVial = faFlaskVial;
  protected readonly faClock = faClock;
  protected readonly faHistory = faHistory;
  protected readonly faUsers = faUsers;

  constructor(protected authService: AuthService, private dialog: MatDialog, private _snackBar: MatSnackBar, breakpointObserver: BreakpointObserver) {
    this.isMobile$ = breakpointObserver.observe([Breakpoints.XSmall, Breakpoints.Small])
      .pipe(
        map(result => result.matches),
        shareReplay()
      );
    this.isMobile$.subscribe(isMobile => this.isMobile = isMobile);
  }

  logout() {
    this.authService.logout();
  }

  // On desktop the sidebar is persistent (side mode); only close it on mobile overlays.
  closeOnMobile(snav: MatSidenav) {
    if (this.isMobile) {
      snav.close();
    }
  }

  isAdmin(): boolean {
    return this.authService.isAdmin()
  }

  openEditUserDialog() {

    const editUserDialogRef = this.dialog.open(EditUserComponent, {
      data: {user: this.authService.user(), ownUserEditing: true}
    });

    editUserDialogRef.afterClosed().subscribe(result => {
      if (result) {
        this._snackBar.openFromComponent(SnackBarComponent, {
          duration: 3000,
          verticalPosition: 'top',
          data: {
            message: "Usuario actualizado con éxito"
          }
        });
      }
    });

  }
}
