import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {KineticsStateService} from "../kinetics/kinetics-state.service";
import {IKineticsModel} from "../kinetics/interface";
import {KineticsModelSelectorService} from "./kinetics-model-selector.service";
import {catchError, firstValueFrom} from "rxjs";
import {TranslateService} from "@ngx-translate/core";

@Component({
  selector: 'app-kinetics-model-selector',
  templateUrl: './kinetics-model-selector.component.html',
  styleUrl: './kinetics-model-selector.component.css'
})
export class KineticsModelSelectorComponent implements OnInit {
  @Output() onSelectedModels: EventEmitter<number> = new EventEmitter();
  @Output() onLoadedModels: EventEmitter<IKineticsModel[]> = new EventEmitter();
  state = this.stateService.state;
  protected loadingModels = false;

  constructor(
    protected stateService: KineticsStateService,
    private modelService: KineticsModelSelectorService,
    private translateService: TranslateService) {
  }

  ngOnInit() {
    if (this.state().models.length === 0) {
      this.loadingModels = true;
      this.modelService.getModels()
        .pipe(catchError(async (error) => {
          throw await firstValueFrom(this.translateService.get('KINETICS_MODEL_SELECTOR.ERROR_LOADING_MODELS', error));
        }))
        .subscribe(response => {
          this.loadingModels = false;
          this.onLoadedModels.emit(response.models);
        });
    }
  }

  // Backend kinetic seeds store latex_formula without $ delimiters (unlike
  // isotherms). app-latex-paragraph needs them to render math instead of raw
  // text, so we add them when missing.
  latexFormula(model: IKineticsModel): string {
    const formula = model.latex_formula ?? '';
    return formula.includes('$') ? formula : `$${formula}$`;
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
