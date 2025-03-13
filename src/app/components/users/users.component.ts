import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {MatTableDataSource} from "@angular/material/table";
import {IUser, IUserPageResponse} from "../../common/common.interface";
import {UserService} from "../../common/user.service";
import {MatDialog} from "@angular/material/dialog";
import {MatSnackBar} from "@angular/material/snack-bar";
import {SnackBarComponent} from "../snack-bar/snack-bar.component";
import {CreateUserComponent} from "../create-user/create-user.component";
import {EditUserComponent} from "../edit-user/edit-user.component";

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
  protected displayedColumns: string[] = ['id', 'email', 'roles', 'active', 'actions'];
  protected dataSource = new MatTableDataSource<IUser>();
  protected loadingUsers: boolean = false;
  protected deleteUserError: string | undefined = undefined;
  @ViewChild("deleteUserDialog") deleteUserDialog!: TemplateRef<any>;
  private roleMap: { [key: string]: string } = {
    "RESEARCHER": "Investigador",
    "ADMIN": "Administrador",
  };

  constructor(private userService: UserService, private dialog: MatDialog, private _snackBar: MatSnackBar) {
  }

  ngOnInit(): void {
    this.loadUsers(1, 10);
  }

  private loadUsers(page: number, perPage: number) {
    this.loadingUsers = true;
    this.userService.getUsers(page, perPage).subscribe({
      next: (response: IUserPageResponse) => {
        this.dataSource.data = response.users;
        this.loadingUsers = false;
      },
      error: () => {
        this.loadingUsers = false;
        this._snackBar.openFromComponent(SnackBarComponent, {
          duration: 3000,
          verticalPosition: 'top',
          data: {
            message: "Error al cargar los usuarios"
          }
        });
      }
    });
  }

  deleteUser(userId: number): void {
    this.loadingUsers = true;
    this.userService.deleteUser(userId).subscribe({
      next: () => {
        this.loadUsers(1, 10);
        this._snackBar.openFromComponent(SnackBarComponent, {
          duration: 3000,
          verticalPosition: 'top',
          data: {
            message: "Usuario eliminado"
          }
        });
      },
      error: error => {
        let message = "Error al eliminar al usuario";

        if (error.status === 400) {
          message = "No se puede eliminar el usuario.";
        }

        this._snackBar.openFromComponent(SnackBarComponent, {
          duration: 3000,
          verticalPosition: 'top',
          data: {
            message: message
          }
        });
        this.loadingUsers = false;
      }
    });
  }

  openDeleteUserDialog(userId: number, email: string): void {
    this.dialog.open(this.deleteUserDialog, {
      data: {
        userId: userId,
        email: email
      }
    })
  }

  openCreateUserDialog(): void {

    const createUserDialogRef = this.dialog.open(CreateUserComponent);

    createUserDialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers(1, 10);
        this._snackBar.openFromComponent(SnackBarComponent, {
          duration: 3000,
          verticalPosition: 'top',
          data: {
            message: "Usuario creado con éxito"
          }
        });
      }
    });
  }

  parseUserRole(roles: string[]) {
    return roles.map(role => this.roleMap[role]).join(", ");
  }

  openEditUserDialog(user: IUser) {

    const editUserDialogRef = this.dialog.open(EditUserComponent, {
      data: user
    });

    editUserDialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadUsers(1, 10);
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
