import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient} from "@angular/common/http";
import {environment} from "../../../environments/environment";
import {InvestigationResponse} from "./interface";

@Injectable({
  providedIn: 'root'
})
export class InvestigationService {

  backendBaseUrl: string;

  constructor(private httpClient: HttpClient) {
    this.backendBaseUrl = environment.backendBaseUrl;
  }

  getInvestigations(): Observable<InvestigationResponse> {
    return this.httpClient.get<InvestigationResponse>(`${this.backendBaseUrl}/investigations`);
  }

}
