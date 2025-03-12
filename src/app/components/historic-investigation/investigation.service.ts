import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {HttpClient} from "@angular/common/http";
import {environment} from "../../../environments/environment";
import {InvestigationResponse, InvestigationVersionsResponse} from "./interface";

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

  getInvestigationVersions(investigationId: number): Observable<InvestigationVersionsResponse> {
    return this.httpClient.get<InvestigationVersionsResponse>(`${this.backendBaseUrl}/investigation/${investigationId}/versions`);
  }

  deployDatasetVersion(investigationId: string, versionId: string): Observable<any> {
    return this.httpClient.get(`${this.backendBaseUrl}/investigation/${investigationId}/version/${versionId}`);
  }

  deleteInvestigationVersion(investigationId: number, versionId: number) {
    return this.httpClient.delete(`${this.backendBaseUrl}/investigation/${investigationId}/version/${versionId}`);
  }

  deleteInvestigation(investigationId: number) {
    return this.httpClient.delete(`${this.backendBaseUrl}/investigation/${investigationId}`);

  }
}
