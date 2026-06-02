import {Component} from '@angular/core';
import {faSave} from "@fortawesome/free-solid-svg-icons";
import {KineticsStateService} from "../kinetics/kinetics-state.service";

@Component({
  selector: 'app-kinetics-model-compare',
  templateUrl: './kinetics-model-compare.component.html',
  styleUrl: './kinetics-model-compare.component.css'
})
export class KineticsModelCompareComponent {
  state = this.stateService.state;
  protected readonly faSave = faSave;

  constructor(protected stateService: KineticsStateService) {
  }

  getModelName(modelId: number): string | undefined {
    return this.state().models.find(model => model._id === modelId)?.name;
  }
}
