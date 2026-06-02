import {effect, Injectable, signal} from '@angular/core';
import {IKineticsState} from "./interface";

@Injectable({
  providedIn: 'root'
})
export class KineticsStateService {

  private readonly KINETICS = 'kinetics';

  private readonly initialState: IKineticsState = {
    shouldRender: true,
    kineticsSample: undefined,
    stepId: 0,
    models: [],
    selectedModels: [],
    modelConfiguration: {},
    modelConfigurationDone: false
  };

  state = signal<IKineticsState>(this.loadState());

  constructor() {
    this.syncStorage();
  }

  private loadState(): IKineticsState {
    try {
      const storedState = sessionStorage.getItem(this.KINETICS);
      return storedState ? JSON.parse(storedState) as IKineticsState : this.initialState;
    } catch (error) {
      return this.initialState;
    }
  }

  private syncStorage() {
    effect(() => {
      sessionStorage.setItem(this.KINETICS, JSON.stringify(this.state()));
    });
  }

  resetState() {
    this.state.set({...this.initialState});
  }
}
