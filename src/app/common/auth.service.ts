import {effect, inject, Injectable, signal} from '@angular/core';
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

  user = signal<IUser | undefined>(this.loadUser());


  constructor(private httpClient: HttpClient, private router: Router) {
    this.backendBaseUrl = environment.backendBaseUrl;
  }

  loadUser() {
    try {
      const userInfo = sessionStorage.getItem('user-info');
      return userInfo ? JSON.parse(userInfo) as IUser : undefined;
    } catch (error) {
      return undefined;
    }
  }

  syncStorage = effect(() => {
    sessionStorage.setItem('user-info', JSON.stringify(this.user()));
  });

  loginData(redirectURL: string | null) {
    return this.httpClient.get<any>(`${this.backendBaseUrl}/login`, {withCredentials: true}).subscribe((response) => {
      if (response.response) {
        sessionStorage.setItem('XSRF-TOKEN', response.response.csrf_token)
      }
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
      this.user.set(undefined);
      sessionStorage.removeItem('XSRF-TOKEN');
      sessionStorage.removeItem('investigation');
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

  isAdmin(): boolean {
    if (!environment.authEnabled) {
      return false;
    } else {
      const userInfo = this.user();
      return userInfo ? userInfo.roles.includes('ADMIN') : false;
    }
  }
}

export const canActivate: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot,
) => {
  return inject(AuthService).canActivate(state.url);
};
