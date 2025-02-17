import {Component, OnInit, QueryList, TemplateRef, ViewChild, ViewChildren} from '@angular/core';
import {Model} from "../model-selector/model";
import {MatSnackBar} from "@angular/material/snack-bar";
import {Investigation} from "../data-selector/data-sample";
import {IModelsConfigurations} from "../../common/common.interface";
import {DEFAULT_ITERATIONS} from '../../common/common.service';
import {StateService} from "./state.service";
import {MatStep} from "@angular/material/stepper";
import {MatDialog} from "@angular/material/dialog";
import {InvestigationModalComponent} from "./investigation-modal.component";

@Component({
  selector: 'app-investigation',
  templateUrl: './investigation.component.html',
  styleUrl: './investigation.component.css',
})
export class InvestigationComponent implements OnInit {
  state = this.stateService.state;

  @ViewChildren(MatStep) steps!: QueryList<MatStep>;
  @ViewChild("loadOnGoingInvestigationModal") loadOnGoingInvestigationModal!: TemplateRef<any>;

  constructor(private _snackBar: MatSnackBar, protected stateService: StateService, private dialog: MatDialog) {
  }

  ngOnInit() {
    if (this.state().investigation) {

      const dialogRef = this.dialog.open(InvestigationModalComponent);

      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          this.resetInvestigation();
        } else {
          this.steps.get(this.state().stepId)?.select();
        }
      });
    }
  }

  investigationCreated(investigation: Investigation) {
    this.stateService.state.set({
      ...this.state(),
      investigation: investigation,
    });
    this._snackBar.open("Investigación creada con éxito", "Aceptar", {
      duration: 3000,
      verticalPosition: 'top',
    });
  }

  addModel(modelId: number) {
    const newSelectedModels = [...this.state().selectedModels, modelId];
    const model = this.state().models.find(m => m._id === modelId);

    const newModelConfiguration = {
      ...this.state().modelConfiguration,
      [modelId]: {
        automatedParams: !!model?.linearizations && model.linearizations.length > 0,
        paramValues: Object.keys(model?.parameters || {}).reduce((acc, key) => ({
          ...acc,
          [key]: {value: 0, stderr: 0}
        }), {}),
        paramInfo: model?.parameters || {},
        selectedLinearizations: [],
        paramSaved: undefined,
        iterations: DEFAULT_ITERATIONS
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

  onLoadedModels(models: Model[]) {
    this.stateService.state.set({
      ...this.state(),
      models: models,
    });
    console.log("LoadedModels: ", this.state())
  }

  onSelectedModels(modelId: number) {
    if (this.state().selectedModels.includes(modelId)) {
      this.removeModel(modelId);
    } else {
      this.addModel(modelId);
    }
    this.checkConfigurationDone();
  }

  onSelectedParams(modelsConfigurations: IModelsConfigurations) {
    this.stateService.state.set({
      ...this.state(),
      modelConfiguration: modelsConfigurations,
    });
    this.checkConfigurationDone();
  }

  private checkConfigurationDone() {
    let configurationDone = Object.values(this.state().modelConfiguration).every(config =>
      Object.values(config.paramValues as Record<string, {
        value: number | null
      }>).every(param => param.value)
    );
    this.stateService.state.set({
      ...this.state(),
      modelConfigurationDone: configurationDone,
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
