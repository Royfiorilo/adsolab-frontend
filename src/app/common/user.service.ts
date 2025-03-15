import {HttpClient} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {IUser, IUserCreationRequest, IUserEditRequest, IUserPageResponse} from "./common.interface";
import {environment} from "../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class UserService {
  backendBaseUrl: string;

  constructor(private http: HttpClient) {
    this.backendBaseUrl = environment.backendBaseUrl;
  }

  getUsers(page: number, perPage: number): Observable<IUserPageResponse> {
    return this.http.get<IUserPageResponse>(`${this.backendBaseUrl}/users?page=${page}&per_page=${perPage}`, {withCredentials: true});
  }

  createUser(userData: Partial<IUserCreationRequest>): Observable<IUser> {
    return this.http.post<IUser>(`${this.backendBaseUrl}/users`, userData, {withCredentials: true});
  }

  editUser(userId: number, userData: Partial<IUserEditRequest>): Observable<IUser> {
    return this.http.put<IUser>(`${this.backendBaseUrl}/users/${userId}`, userData, {withCredentials: true});
  }

  deleteUser(userId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.backendBaseUrl}/users/${userId}`, {withCredentials: true});
  }
}
