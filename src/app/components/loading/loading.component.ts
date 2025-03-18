import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'app-loading',
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.css'
})
export class LoadingComponent {
  @Input() cancellable: boolean = false;
  @Output() cancelRequestEvent = new EventEmitter<void>();

  cancelRequest(): void {
    this.cancelRequestEvent.emit();
  }

}
