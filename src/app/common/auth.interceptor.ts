import {inject, Injectable} from "@angular/core";
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from "@angular/common/http";
import {Observable} from "rxjs";
import {CookieService} from "ngx-cookie-service";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  cookieService = inject(CookieService);

  intercept(req: HttpRequest<any>,
            next: HttpHandler): Observable<HttpEvent<any>> {

    const xsrfToken = this.cookieService.get("XSRF-TOKEN")

    if (xsrfToken) {
      const cloned = req.clone({
        headers: req.headers.set("X-XSRF-TOKEN", xsrfToken)
      });

      return next.handle(cloned);
    } else {
      return next.handle(req);
    }
  }
}
