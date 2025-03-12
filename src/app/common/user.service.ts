import {HttpClient} from "@angular/common/http";
import {Injectable} from "@angular/core";
import {Observable} from "rxjs";
import {IUser, IUserPageResponse} from "./common.interface";
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
    return this.http.get<IUserPageResponse>(`${this.backendBaseUrl}/users?page=${page}&perPage=${perPage}`, {withCredentials: true});
  }

  getUser(userId: number): Observable<IUser> {
    return this.http.get<IUser>(`${this.backendBaseUrl}/${userId}`);
  }

  updateUser(userId: number, userData: Partial<IUser>): Observable<IUser> {
    return this.http.put<IUser>(`${this.backendBaseUrl}/${userId}`, userData);
  }

  deleteUser(userId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.backendBaseUrl}/users/${userId}`, {withCredentials: true});
  }
}
