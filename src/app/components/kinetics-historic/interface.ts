import {CreateKineticSampleResponse} from "../kinetics/interface";
import {IKineticsAdjustmentMethod, IKineticsComparison, IKineticsSavedSeed} from "../kinetics-model-compare/interface";

// ---- Backend contract for GET /kinetics/investigations ----

export interface IKineticsInvestigation {
  kinetic_investigation_id: number;
  kinetic_sample_id: number;
  sample: CreateKineticSampleResponse;
  user_id: number;
  user: { id: number; email: string };
  versions?: IKineticsVersion[];   // loaded lazily when the row is expanded
}

export interface IKineticsInvestigationsResponse {
  investigations: IKineticsInvestigation[];
  page: number;
  per_page: number;
  total: number;
  pages: number;
}

// ---- Backend contract for GET /kinetics/investigation/:id/version(s) ----

export interface IKineticsFittedModel {
  kinetic_fitted_model_id: number;
  kinetic_model_id: number;
  best_adjust: string;
  seeds: IKineticsSavedSeed[];
  adjustment_methods: IKineticsAdjustmentMethod[];
}

export interface IKineticsVersion {
  version_id: number;
  kinetic_investigation_id: number;
  iterations: number | null;
  steps: number | null;
  created_at: string;
  fitted_models: IKineticsFittedModel[];
  comparison: IKineticsComparison | null;
}

export interface IKineticsVersionsResponse {
  versions: IKineticsVersion[];
}
