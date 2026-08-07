import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {environment} from "../../../environments/environment";
import {Observable} from "rxjs";
import {IKineticsModel} from "../kinetics/interface";

export interface GetKineticsModelsResponse {
  models: IKineticsModel[];
}

@Injectable({
  providedIn: 'root'
})
export class KineticsModelSelectorService {

  backendBaseUrl: string;

  constructor(private httpClient: HttpClient) {
    this.backendBaseUrl = environment.backendBaseUrl;
  }

  getModels(): Observable<GetKineticsModelsResponse> {
    return this.httpClient.get<GetKineticsModelsResponse>(`${this.backendBaseUrl}/kinetics/models`);
  }

}
