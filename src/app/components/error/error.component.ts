import {Component} from '@angular/core';
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-error',
  templateUrl: './error.component.html',
  styleUrl: './error.component.css'
})
export class ErrorComponent {

  protected errorMessage: string | null;

  constructor(private route: ActivatedRoute) {

    this.errorMessage = this.route.snapshot.queryParamMap.get('message');

  }

}
