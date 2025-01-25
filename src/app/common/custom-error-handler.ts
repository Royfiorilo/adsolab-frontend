import {ErrorHandler, Injectable} from "@angular/core";
import {Router} from "@angular/router";

@Injectable({
  providedIn: 'root',
})
export class CustomErrorHandler implements ErrorHandler {

  constructor(private router: Router) {
  }

  handleError(error: string): void {

    this.router.navigateByUrl(`/error?message=${error}`);
  }

}
