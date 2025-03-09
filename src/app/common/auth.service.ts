import {inject, Injectable, signal} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {environment} from "../../environments/environment";
import {ActivatedRouteSnapshot, CanActivateFn, Router, RouterStateSnapshot} from "@angular/router";
import {map} from "rxjs/operators";
import {ILoginRequest, ILoginResponse, IUser} from "./common.interface";

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  backendBaseUrl: string;

  user = signal<IUser | null>(null);

  constructor(private httpClient: HttpClient, private router: Router) {
    this.backendBaseUrl = environment.backendBaseUrl;
  }

  loginData(redirectURL: string | null) {
    return this.httpClient.get<any>(`${this.backendBaseUrl}/login`, {withCredentials: true}).subscribe((response) => {
      if (response.user) {
        this.user.set(response.user as IUser);
        if (redirectURL) {
          this.router.navigateByUrl(redirectURL);
        }
      }
    })
  }

  login(request: ILoginRequest) {
    return this.httpClient.post<ILoginResponse>(`${this.backendBaseUrl}/login`, request, {withCredentials: true})
      .pipe(
        map((res: ILoginResponse) => {
          this.user.set(res.user);
          return res;
        }));
  }

  logout() {
    return this.httpClient.post<void>(`${this.backendBaseUrl}/logout`, null, {withCredentials: true}).subscribe(() => {
      this.user.set(null);
      this.router.navigateByUrl('/login')
    });
  }

  isAuth() {
    return !!this.user();
  }

  getAuthUserInfo() {
    return this.user();
  }


  canActivate(redirectURL: string | null) {

    if (!environment.authEnabled) {
      return true;

    } else {

      if (this.isAuth()) {
        return true;
      } else {
        this.router.navigate(['login'], {queryParams: {redirectURL}});
        return false;
      }

    }


  }
}

export const canActivate: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  return inject(AuthService).canActivate(state.url);
};
