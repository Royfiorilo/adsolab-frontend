import {AfterViewInit, Component, OnInit, QueryList, TemplateRef, ViewChild, ViewChildren} from '@angular/core';
import {Model} from "../model-selector/model";
import {MatSnackBar} from "@angular/material/snack-bar";
import {Investigation} from "../data-selector/data-sample";
import {IInvestigationState, IModelsConfigurations} from "../../common/common.interface";
import {DEFAULT_ITERATIONS} from '../../common/common.service';
import {StateService} from "./state.service";
import {MatStep} from "@angular/material/stepper";
import {MatDialog} from "@angular/material/dialog";


@Component({
  selector: 'app-investigation',
  templateUrl: './investigation.component.html',
  styleUrl: './investigation.component.css',
})


export class InvestigationComponent implements OnInit, AfterViewInit {
  investigation: Investigation | undefined;
  stepId: number = 0;
  models: Model[] = [];
  selectedModels: number[] = [];
  modelConfiguration: IModelsConfigurations = {};
  modelConfigurationDone: boolean = false;
  @ViewChildren(MatStep) steps!: QueryList<MatStep>;
  @ViewChild("loadOnGoingInvestigationModal") loadOnGoingInvestigationModal!: TemplateRef<any>;

  constructor(private _snackBar: MatSnackBar, private stateService: StateService, private dialog: MatDialog) {
  }

  ngOnInit() {

    let state: IInvestigationState = this.stateService.state();

    if (state) {
      this.investigation = state.investigation;
      this.stepId = state.stepId;
      this.models = state.models;
      this.selectedModels = state.selectedModels;
      this.modelConfiguration = state.modelConfiguration;
      this.modelConfigurationDone = state.modelConfigurationDone;
    }

  }

  ngAfterViewInit() {

    if (this.stepId) {
      this.steps.get(this.stepId)?.select()
      this.dialog.open(this.loadOnGoingInvestigationModal);
    }

  }

  investigationCreated(investigation: Investigation) {
    this.investigation = investigation;
    this.stateService.state.set({
      ...this.stateService.state(),
      investigation: this.investigation,
    })
    this._snackBar.open("Investigación creada con éxito", "Aceptar", {
      duration: 3000,
      verticalPosition: 'top',
    });
  }

  addModel(modelId: number) {
    this.selectedModels = [...this.selectedModels, modelId]
    const model = this.models.find(model => model._id === modelId);
    this.modelConfiguration[modelId] = {
      automatedParams: !!model?.linearizations && model.linearizations.length > 0,
      paramValues: Object.keys(model?.parameters || {})
        .reduce((acc, key) => ({...acc, [key]: {value: 0, stderr: 0}}), {}),
      paramInfo: model?.parameters || {},
      selectedLinearizations: [],
      paramSaved: undefined,
      iterations: DEFAULT_ITERATIONS
    };
    console.log(this.modelConfiguration);
    this.stateService.state.set({
        ...this.stateService.state(),
        selectedModels: this.selectedModels,
        modelConfiguration: this.modelConfiguration,
      }
    )
  }

  onModelSelected(modelId: number) {
    if (this.selectedModels.includes(modelId)) {
      this.removeModel(modelId)
    } else {
      this.addModel(modelId);
    }
    this.checkConfigurationDone();

  }

  onLoadedModels(models: Model[]) {
    this.models = models;
    this.stateService.state.set({
        ...this.stateService.state(),
        models: this.models,
      }
    )
  }

  onSelectedParams(modelsConfigurations: IModelsConfigurations) {
    this.modelConfiguration = modelsConfigurations;
    this.checkConfigurationDone();
    this.stateService.state.set({
        ...this.stateService.state(),
        modelConfiguration: this.modelConfiguration,
      }
    )
  }

  private checkConfigurationDone() {
    let configurationDone = true;

    for (const modelId of Object.keys(this.modelConfiguration)) {

      const params = this.modelConfiguration[+modelId]?.paramValues;

      for (const paramName of Object.keys(params)) {

        if (!params[paramName].value) {
          configurationDone = false;
        }

      }

    }
    this.modelConfigurationDone = configurationDone;
    this.stateService.state.set({
        ...this.stateService.state(),
        modelConfigurationDone: this.modelConfigurationDone,
      }
    )
  }

  private removeModel(modelId: number) {
    this.selectedModels = this.selectedModels.filter(selectedModel => selectedModel !== modelId)
    delete this.modelConfiguration[modelId]
    this.stateService.state.set({
        ...this.stateService.state(),
        selectedModels: this.selectedModels,
        modelConfiguration: this.modelConfiguration,
      }
    )
  }

  onStepChange($event: number) {
    this.stepId = $event;
    this.stateService.state.set({
        ...this.stateService.state(),
        stepId: this.stepId,
      }
    )
  }

  resetInvestigation() {
    this.investigation = undefined;
    this.modelConfiguration = {};
    this.modelConfigurationDone = false;
    this.models = [];
    this.selectedModels = [];
    this.stepId = 0

    this.stateService.state.set({
      investigation: this.investigation,
      modelConfiguration: this.modelConfiguration,
      modelConfigurationDone: this.modelConfigurationDone,
      models: this.models,
      selectedModels: this.selectedModels,
      stepId: this.stepId
    });

    this.steps.get(this.stepId)?.select();
  }
}
