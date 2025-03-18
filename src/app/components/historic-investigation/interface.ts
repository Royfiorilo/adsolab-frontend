export interface InvestigationResponse {
  investigations: Investigation[];
  total: number;
  pages: number;
  page: number;
  per_page: number;
}

export interface Investigation {
  investigation_id: number;
  sample: Sample;
  sample_id: number;
  versions: Version[];
}

export interface Sample {
  adsorbate_id: number;
  adsorbent_id: number;
  ce: number[];
  description: string;
  measure_unit: string;
  qe: number[];
  sample_id: number;
  temperature: number;
  title: string;
}

export interface Seed {
  name: string;
  stderr: number;
  value: number;
}

export interface FittedModel {
  best_adjust: string;
  model_id: number;
  seeds: Seed[];
}

export interface Version {
  best_model_heuristic: number;
  best_model_ml: number;
  created_at: string;
  fitted_models: FittedModel[];
  version_id: number;
}

export interface InvestigationVersionsResponse {
  investigation_id: number;
  versions: Version[];
}
