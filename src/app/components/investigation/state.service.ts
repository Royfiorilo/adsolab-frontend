import {effect, Injectable, signal} from '@angular/core';
import {IInvestigationState} from "../../common/common.interface";

@Injectable({
  providedIn: 'root'
})
export class StateService {

  private readonly INVESTIGATION = 'investigation';

  private readonly initialState: IInvestigationState = {
    shouldRender: true, // Ensure components render initially
    investigation: undefined,
    stepId: 0,
    models: [],
    selectedModels: [],
    modelConfiguration: {},
    modelConfigurationDone: false
  };

  state = signal<IInvestigationState>(this.loadState());

  constructor() {
    this.syncStorage();
  }

  private loadState(): IInvestigationState {
    try {
      const storedState = localStorage.getItem(this.INVESTIGATION);
      return storedState ? JSON.parse(storedState) as IInvestigationState : this.initialState;
    } catch (error) {
      return this.initialState;
    }
  }

  private syncStorage() {
    effect(() => {
      localStorage.setItem(this.INVESTIGATION, JSON.stringify(this.state()));
    });
  }

  resetState() {
    this.state.set({...this.initialState});
  }
}
