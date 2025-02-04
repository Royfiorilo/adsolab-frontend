import {effect, Injectable, signal} from '@angular/core';
import {IInvestigationState} from "../../common/common.interface";

@Injectable({
  providedIn: 'root'
})
export class StateService {

  private INVESTIGATION = 'investigation';

  state = signal<IInvestigationState>(
    JSON.parse(localStorage.getItem(this.INVESTIGATION)!) as IInvestigationState
  );

  syncStorage = effect(() => {
    localStorage.setItem(this.INVESTIGATION, JSON.stringify(this.state()));
  });
}
