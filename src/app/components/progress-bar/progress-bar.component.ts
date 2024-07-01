import {Component, EventEmitter, Input, Output} from '@angular/core';

@Component({
  selector: 'app-progress-bar',
  templateUrl: './progress-bar.component.html',
  styleUrl: './progress-bar.component.css'
})
export class ProgressBarComponent {
  progressBarValue: number = 0;
  @Input() stepId!: number;
  @Output() onStepIdChange: EventEmitter<number> = new EventEmitter();

  updateProgressBar(status: number) {
    this.progressBarValue = status;
  }

  setStepId(value: number) {
    this.onStepIdChange.emit(value);
  }

}
