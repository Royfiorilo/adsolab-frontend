import {AfterViewInit, Component, TemplateRef, ViewChild} from '@angular/core';
import {MatTableDataSource} from "@angular/material/table";
import {IUser, IUserPageResponse} from "../../common/common.interface";
import {UserService} from "../../common/user.service";
import {MatDialog} from "@angular/material/dialog";
import {MatSnackBar} from "@angular/material/snack-bar";
import {SnackBarComponent} from "../snack-bar/snack-bar.component";
import {CreateUserComponent} from "../create-user/create-user.component";
import {EditUserComponent} from "../edit-user/edit-user.component";
import {catchError, merge, of} from 'rxjs';
import {MatPaginator, MatPaginatorIntl} from "@angular/material/paginator";
import {map, startWith, switchMap} from "rxjs/operators";
import {CustomTablePaginator} from "../../common/custom-table-paginator";

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrl: './users.component.css',
  providers: [{provide: MatPaginatorIntl, useClass: CustomTablePaginator}],
})
export class UsersComponent implements AfterViewInit {
  protected displayedColumns: string[] = ['id', 'email', 'roles', 'active', 'actions'];
  protected dataSource = new MatTableDataSource<IUser>();
  protected resultsLength: number = 0;
  protected loadingUsers: boolean = true;
  @ViewChild("deleteUserDialog") deleteUserDialog!: TemplateRef<any>;
  @ViewChild(MatPaginator) paginator!: MatPaginator

  private roleMap: { [key: string]: string } = {
    "RESEARCHER": "Investigador",
    "ADMIN": "Administrador",
  };

  private DEFAULT_PAGE = 1;
  private DEFAULT_PAGE_SIZE = 10;

  constructor(private userService: UserService, private dialog: MatDialog, private _snackBar: MatSnackBar) {
  }

  ngAfterViewInit(): void {
    merge(this.paginator.page)
      .pipe(
        startWith({}),
        switchMap(() => {
          this.loadingUsers = true;
          return this.userService.getUsers(this.paginator.pageIndex + 1, this.paginator.pageSize)
            .pipe(catchError(() => {
              this._snackBar.openFromComponent(SnackBarComponent, {
                duration: 3000,
                verticalPosition: 'top',
                data: {
                  message: "Error al cargar los usuarios"
                }
              });
              return of(null);
            }));
        }),
        map(data => {
          this.loadingUsers = false;

          if (data === null) {
            return [];
          }

          this.resultsLength = data.total;
          return data.users;
        }),
      )
      .subscribe(data => (this.dataSource.data = data));
  }

  private loadUsers(page: number, perPage: number) {
    this.loadingUsers = true;
    this.userService.getUsers(page, perPage).subscribe({
      next: (response: IUserPageResponse) => {
        this.dataSource.data = response.users;
        this.resultsLength = response.total;
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
        this.paginator.firstPage();
        this.loadUsers(this.DEFAULT_PAGE, this.paginator.pageSize);
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
        this.paginator.firstPage();
        this.loadUsers(this.DEFAULT_PAGE, this.paginator.pageSize);
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
        this.paginator.firstPage();
        this.loadUsers(this.DEFAULT_PAGE, this.paginator.pageSize);
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
