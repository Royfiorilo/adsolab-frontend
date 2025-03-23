import {inject, Injectable} from "@angular/core";
import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from "@angular/common/http";
import {catchError, Observable, throwError} from "rxjs";
import {CookieService} from "ngx-cookie-service";
import {Router} from "@angular/router";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  cookieService = inject(CookieService);

  router = inject(Router);

  intercept(req: HttpRequest<any>,
            next: HttpHandler): Observable<HttpEvent<any>> {

    let xsrfToken: string | null = this.cookieService.get("XSRF-TOKEN")

    let observable: Observable<HttpEvent<any>>;

    if (!xsrfToken) {
      xsrfToken = sessionStorage.getItem("XSRF-TOKEN");
    }

    if (xsrfToken) {
      const cloned = req.clone({
        headers: req.headers.set("X-XSRF-TOKEN", xsrfToken)
      });

      observable = next.handle(cloned);
    } else {
      observable = next.handle(req);
    }

    return observable.pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          this.router.navigateByUrl('/login');
        }
        return throwError(() => error)
      })
    );
    ;
  }
}
