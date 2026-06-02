import {ChangeDetectionStrategy, Component, EventEmitter, Input, Output} from '@angular/core';
import {KineticsStateService} from "../kinetics/kinetics-state.service";
import {IKineticsModel, IKineticsModelsConfigurations} from "../kinetics/interface";

@Component({
  selector: 'app-kinetics-model-configuration',
  templateUrl: './kinetics-model-configuration.component.html',
  styleUrl: './kinetics-model-configuration.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KineticsModelConfigurationComponent {
  state = this.stateService.state;
  @Input() modelConfiguration!: IKineticsModelsConfigurations;
  @Output() onSelectedParams = new EventEmitter<IKineticsModelsConfigurations>();

  constructor(protected stateService: KineticsStateService) {
  }

  getModelById(modelId: number): IKineticsModel | undefined {
    return this.state().models.find(model => model._id === modelId);
  }

  onParamChange(): void {
    this.onSelectedParams.emit(this.modelConfiguration);
  }

  validateStepsValue(modelId: number): void {
    const value = this.modelConfiguration[modelId].step;
    if (value > 1) {
      this.modelConfiguration[modelId].step = 1;
    } else if (value < 0) {
      this.modelConfiguration[modelId].step = 0;
    } else {
      this.modelConfiguration[modelId].step = Math.round(value * 10) / 10;
    }
  }
}
