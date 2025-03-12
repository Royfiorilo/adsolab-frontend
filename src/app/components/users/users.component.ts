import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {MatTableDataSource} from "@angular/material/table";
import {IUser, IUserPageResponse} from "../../common/common.interface";
import {UserService} from "../../common/user.service";
import {MatDialog} from "@angular/material/dialog";
import {MatSnackBar} from "@angular/material/snack-bar";
import {SnackBarComponent} from "../snack-bar/snack-bar.component";

@Component({
  selector: 'app-users',
  templateUrl: './users.component.html',
  styleUrl: './users.component.css'
})
export class UsersComponent implements OnInit {
  protected displayedColumns: string[] = ['id', 'email', 'roles', 'active', 'actions'];
  protected dataSource = new MatTableDataSource<IUser>();
  protected loadingUsers: boolean = false;
  @ViewChild("deleteUserDialog") deleteUserDialog!: TemplateRef<any>;

  constructor(private userService: UserService, private dialog: MatDialog, private _snackBar: MatSnackBar) {
  }

  ngOnInit(): void {
    this.loadingUsers = true;
    this.userService.getUsers(1, 10).subscribe((response: IUserPageResponse) => {
      this.dataSource.data = response.users;
      this.loadingUsers = false;
    });
  }

  deleteUser(userId: number): void {
    this.loadingUsers = true;
    this.userService.deleteUser(userId).subscribe(() => {
      this.dataSource.data = this.dataSource.data.filter(user => user.id !== userId);
      this.loadingUsers = false;
      this._snackBar.openFromComponent(SnackBarComponent, {
        duration: 3000,
        verticalPosition: 'top',
        data: {
          message: "Usuario eliminado"
        }
      });
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
}
