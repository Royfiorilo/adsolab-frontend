import {ErrorHandler, Injectable, NgZone} from "@angular/core";
import {Router} from "@angular/router";

@Injectable({
  providedIn: 'root',
})
export class CustomErrorHandler implements ErrorHandler {

  constructor(private router: Router, private zone: NgZone) {
  }

  handleError(error: any): void {

    this.zone.run(() => {
      console.error(error);

      let errorMessage = '';

      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }

      this.router.navigateByUrl(`/error?message=${errorMessage}`);
    })

  }

}
