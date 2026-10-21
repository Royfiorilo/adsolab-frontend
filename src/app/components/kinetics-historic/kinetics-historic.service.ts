import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from "@angular/common/http";
import {Observable} from "rxjs";
import {environment} from "../../../environments/environment";
import {DEFAULT_ITERATIONS, DEFAULT_STEPS} from "../../common/common.service";
import {
  CreateKineticSampleResponse,
  IKineticsModel,
  IKineticsModelsConfigurations,
  IKineticsSample,
  IKineticsSeedValue,
  IKineticsState
} from "../kinetics/interface";
import {IKineticsModelResult, IKineticsSavedVersion} from "../kinetics-model-compare/interface";
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

// The configuration step of the stepper, where a resumed version opens.
const CONFIGURATION_STEP = 2;

// Rebuilds the stepper state from a saved version, with its seeds as manual parameters.
export function toResumeState(version: IKineticsSavedVersion, iterations: number | null,
                              step: number | null): IKineticsState {
  const modelConfiguration: IKineticsModelsConfigurations = {};
  for (const result of version.results) {
    const model = version.models.find(item => item._id === result.model);
    modelConfiguration[result.model] = {
      paramValues: seedValues(result, model),
      iterations: iterations ?? DEFAULT_ITERATIONS,
      step: step ?? DEFAULT_STEPS,
      automatedParams: false,
      selectedLinearizations: (model?.linearizations ?? []).map(linearization => linearization.linearization_id),
      knownParams: {},
    };
  }
  return {
    shouldRender: true,
    kineticsSample: version.sample,
    stepId: CONFIGURATION_STEP,
    models: version.models,
    selectedModels: version.results.map(result => result.model),
    modelConfiguration,
    modelConfigurationDone: Object.values(modelConfiguration).every(config =>
      Object.values<IKineticsSeedValue>(config.paramValues).every(param => param.value !== null)),
  };
}

function seedValues(result: IKineticsModelResult, model: IKineticsModel | undefined): { [name: string]: IKineticsSeedValue } {
  const values: { [name: string]: IKineticsSeedValue } = {};
  for (const name of Object.keys(model?.parameters ?? {})) {
    values[name] = {value: null};
  }
  for (const seed of result.seeds ?? []) {
    values[seed.name] = {value: seed.value, stderr: seed.stderr ?? null};
  }
  return values;
}
