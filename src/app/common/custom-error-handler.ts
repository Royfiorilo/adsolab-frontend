import {ErrorHandler, Injectable, NgZone} from "@angular/core";
import {Router} from "@angular/router";

@Injectable({
  providedIn: 'root',
})
export class CustomErrorHandler implements ErrorHandler {

  constructor(private router: Router, private zone: NgZone) {
  }

  handleError(error: string): void {

    this.zone.run(() => {
      this.router.navigateByUrl(`/error?message=${error}`);
    })

  }

}
