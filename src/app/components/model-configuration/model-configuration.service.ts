import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {environment} from "../../../environments/environment";
import {Observable} from "rxjs";
import {ILinearizationRequest, ILinearizationResponse} from "./interface";

@Injectable({
  providedIn: 'root'
})
export class ModelConfigurationService {
  backendBaseUrl: string;

  constructor(private httpClient: HttpClient) {
    this.backendBaseUrl = environment.backendBaseUrl;
  }

  runLinearization(request: ILinearizationRequest): Observable<ILinearizationResponse> {
    return this.httpClient.post<ILinearizationResponse>(`${this.backendBaseUrl}/investigation/run-linearization`, request);
  }


  ///investigation/predict-seeds

}
