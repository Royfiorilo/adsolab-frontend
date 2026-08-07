import {AfterViewInit, Component, inject, QueryList, ViewChildren} from '@angular/core';
import {MatSnackBar} from "@angular/material/snack-bar";
import {DEFAULT_ITERATIONS, DEFAULT_STEPS} from '../../common/common.service';
import {KineticsStateService} from "./kinetics-state.service";
import {MatStep} from "@angular/material/stepper";
import {MatDialog} from "@angular/material/dialog";
import {KineticsModalComponent} from "./kinetics-modal.component";
import {SnackBarComponent} from "../snack-bar/snack-bar.component";
import {IKineticsModel, IKineticsModelsConfigurations, IKineticsSample} from "./interface";
import {Observable, shareReplay} from "rxjs";
import {BreakpointObserver, Breakpoints} from "@angular/cdk/layout";
import {map} from "rxjs/operators";
import {ActivatedRoute} from "@angular/router";

@Component({
  selector: 'app-kinetics',
  templateUrl: './kinetics.component.html',
  styleUrl: './kinetics.component.css',
})
export class KineticsComponent implements AfterViewInit {
  private breakpointObserver = inject(BreakpointObserver);
  isMobile$: Observable<boolean>;
  state = this.stateService.state;
  @ViewChildren(MatStep) steps!: QueryList<MatStep>;

  constructor(private _snackBar: MatSnackBar, protected stateService: KineticsStateService, private dialog: MatDialog, private route: ActivatedRoute) {
    this.isMobile$ = this.breakpointObserver.observe([Breakpoints.XSmall, Breakpoints.Small])
      .pipe(
        map(result => result.matches),
        shareReplay()
      );
  }

  ngAfterViewInit() {
    if (this.state().kineticsSample) {
      const dialogRef = this.dialog.open(KineticsModalComponent);

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.resetInvestigation();
        } else {
          this.steps.get(this.state().stepId)?.select();
        }
      });
    }
  }

  sampleLoaded(sample: IKineticsSample) {
    this.stateService.state.set({
      ...this.state(),
      kineticsSample: sample,
    });
    this._snackBar.openFromComponent(SnackBarComponent, {
      duration: 3000,
      verticalPosition: 'top',
      data: {
        message: "Muestra cargada con éxito"
      }
    });
  }

  private removeModel(modelId: number) {
    const updatedModelConfiguration = {...this.state().modelConfiguration};
    delete updatedModelConfiguration[modelId];

    this.stateService.state.set({
      ...this.state(),
      selectedModels: this.state().selectedModels.filter(selectedModel => selectedModel !== modelId),
      modelConfiguration: updatedModelConfiguration,
    });
  }

  addModel(modelId: number) {
    const newSelectedModels = [...this.state().selectedModels, modelId];
    const model = this.state().models.find(m => m._id === modelId);

    const newModelConfiguration = {
      ...this.state().modelConfiguration,
      [modelId]: {
        paramValues: Object.keys(model?.parameters || {}).reduce((acc, key) => ({
          ...acc,
          [key]: {value: null}
        }), {}),
        iterations: DEFAULT_ITERATIONS,
        step: DEFAULT_STEPS,
        automatedParams: true,
        selectedLinearizations: (model?.linearizations ?? []).map(linearization => linearization.linearization_id),
        knownParams: {}
      }
    };

    this.stateService.state.set({
      ...this.state(),
      selectedModels: newSelectedModels,
      modelConfiguration: newModelConfiguration
    });
  }

  onModelSelected(modelId: number) {
    if (this.state().selectedModels.includes(modelId)) {
      this.removeModel(modelId);
    } else {
      this.addModel(modelId);
    }
    this.checkConfigurationDone();
  }

  onLoadedModels(models: IKineticsModel[]) {
    this.stateService.state.set({
      ...this.state(),
      models: models,
    });
  }

  onSelectedParams(modelsConfigurations: IKineticsModelsConfigurations) {
    this.stateService.state.set({
      ...this.state(),
      modelConfiguration: modelsConfigurations,
    });
    this.checkConfigurationDone();
  }

  private checkConfigurationDone() {
    let configurationDone = this.state().selectedModels.length > 0 &&
      Object.values(this.state().modelConfiguration).every(config =>
        Object.values(config.paramValues as Record<string, { value: number | null }>)
          .every(param => param.value !== null && param.value !== undefined)
      );
    this.stateService.state.set({
      ...this.state(),
      modelConfigurationDone: configurationDone,
    });
  }

  onStepChange(stepId: number) {
    this.stateService.state.set({
      ...this.state(),
      stepId,
    });
  }

  resetInvestigation() {
    this.stateService.resetState();
  }
}
