import {Component} from '@angular/core';
import {AuthService} from "../../common/auth.service";
import {EditUserComponent} from "../edit-user/edit-user.component";
import {SnackBarComponent} from "../snack-bar/snack-bar.component";
import {MatDialog} from "@angular/material/dialog";
import {MatSnackBar} from "@angular/material/snack-bar";

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.css'
})
export class NavigationComponent {

  constructor(protected authService: AuthService, private dialog: MatDialog, private _snackBar: MatSnackBar) {
  }

  logout() {
    this.authService.logout();
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
