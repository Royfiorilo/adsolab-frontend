import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from "@angular/common/http";
import {Observable} from "rxjs";
import {environment} from "../../../environments/environment";
import {CreateKineticSampleResponse, IKineticsSample} from "../kinetics/interface";
import {IKineticsModelResult} from "../kinetics-model-compare/interface";
import {IKineticsFittedModel, IKineticsInvestigationsResponse, IKineticsVersion, IKineticsVersionsResponse} from "./interface";

@Injectable({
  providedIn: 'root'
})
export class KineticsHistoricService {

  private backendBaseUrl = environment.backendBaseUrl;

  constructor(private httpClient: HttpClient) {
  }

  // userId: only that user's investigations.
  getInvestigations(page: number, perPage: number, userId?: number): Observable<IKineticsInvestigationsResponse> {
    let params = new HttpParams().set('page', page).set('per_page', perPage);
    if (userId !== undefined) {
      params = params.set('user_id', userId);
    }
    return this.httpClient.get<IKineticsInvestigationsResponse>(
      `${this.backendBaseUrl}/kinetics/investigations`, {params, withCredentials: true}
    );
  }

  getVersions(investigationId: number): Observable<IKineticsVersionsResponse> {
    return this.httpClient.get<IKineticsVersionsResponse>(
      `${this.backendBaseUrl}/kinetics/investigation/${investigationId}/versions`, {withCredentials: true}
    );
  }

  getVersion(investigationId: number, versionId: number): Observable<IKineticsVersion> {
    return this.httpClient.get<IKineticsVersion>(
      `${this.backendBaseUrl}/kinetics/investigation/${investigationId}/version/${versionId}`, {withCredentials: true}
    );
  }

  getSample(sampleId: number): Observable<CreateKineticSampleResponse> {
    return this.httpClient.get<CreateKineticSampleResponse>(
      `${this.backendBaseUrl}/kinetics/sample/${sampleId}`, {withCredentials: true}
    );
  }

  deleteVersion(investigationId: number, versionId: number): Observable<unknown> {
    return this.httpClient.delete(
      `${this.backendBaseUrl}/kinetics/investigation/${investigationId}/version/${versionId}`, {withCredentials: true}
    );
  }

  deleteInvestigation(investigationId: number): Observable<unknown> {
    return this.httpClient.delete(
      `${this.backendBaseUrl}/kinetics/investigation/${investigationId}`, {withCredentials: true}
    );
  }
}

export function toKineticsSample(sample: CreateKineticSampleResponse): IKineticsSample {
  return {...sample, sample_id: sample.kinetic_sample_id};
}

// Same shape as a run result, keyed by kinetic_model_id.
export function toModelResult(fittedModel: IKineticsFittedModel): IKineticsModelResult {
  return {
    model: fittedModel.kinetic_model_id,
    best_adjust: fittedModel.best_adjust,
    adjustment_methods: fittedModel.adjustment_methods,
    seeds: fittedModel.seeds,
  };
}
