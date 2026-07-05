import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {KineticsStateService} from "../kinetics/kinetics-state.service";
import {IKineticsModel} from "../kinetics/interface";

@Component({
  selector: 'app-kinetics-model-selector',
  templateUrl: './kinetics-model-selector.component.html',
  styleUrl: './kinetics-model-selector.component.css'
})
export class KineticsModelSelectorComponent implements OnInit {
  @Output() onSelectedModels: EventEmitter<number> = new EventEmitter();
  @Output() onLoadedModels: EventEmitter<IKineticsModel[]> = new EventEmitter();
  state = this.stateService.state;

  // TODO: reemplazar por KineticsModelSelectorService.getModels() -> GET /kinetics/models.
  // Hardcodeado temporalmente para poder ver las cards y navegar el flujo visual.
  private readonly kineticsModels: IKineticsModel[] = [
    {
      _id: 1,
      name: 'Pseudo primer orden',
      latex_formula: '$$q_t = q_e\\left(1 - e^{-k_1 t}\\right)$$',
      parameters: {qe: 'mg/g', k1: '1/min'}
    },
    {
      _id: 2,
      name: 'Pseudo segundo orden',
      latex_formula: '$$q_t = \\frac{k_2 q_e^2 t}{1 + k_2 q_e t}$$',
      parameters: {qe: 'mg/g', k2: 'g/(mg·min)'}
    },
    {
      _id: 3,
      name: 'Difusión intraparticular',
      latex_formula: '$$q_t = k_{id}\\sqrt{t} + C$$',
      parameters: {kid: 'mg/(g·min^0.5)', C: 'mg/g'}
    }
  ];

  constructor(protected stateService: KineticsStateService) {
  }

  ngOnInit() {
    if (this.state().models.length === 0) {
      this.onLoadedModels.emit(this.kineticsModels);
    }
  }

  selectModel(modelId: number) {
    this.onSelectedModels.emit(modelId);
  }

  areAllSelected(): boolean {
    return this.state().models.length > 0 &&
      this.state().models.every(model => this.state().selectedModels.includes(model._id));
  }

  toggleSelectAll(checked: boolean): void {
    const allModelIds = this.state().models.map(model => model._id);
    for (const id of allModelIds) {
      const isSelected = this.state().selectedModels.includes(id);
      if (checked === isSelected) {
        continue;
      }
      this.selectModel(id);
    }
  }
}
