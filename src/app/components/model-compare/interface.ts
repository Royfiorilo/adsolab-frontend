import {IGraph, IParameter, IStatistics, ITransformedData} from "../../common/common.interface";

export interface INoLinearGraph {
  parameters: IParameter[];
  statistics: IStatistics;
  residuals: IResiduals;
  graph: IGraph;
  best?: boolean;
  adjustment_name: string;
}

export interface INoLinearRequestSeed {
  name: string;
  value: number;
}

export interface INoLinearRequestModel {
  model: number;
  seeds: INoLinearRequestSeed[];
}

export interface INoLinearRequest {
  investigation_id: number;
  models: INoLinearRequestModel[];
}


export interface IResiduals {
  normality_pvalue: number;
  homoscedasticity_pvalue: number;
  durbin_watson: number;
  passes_normality: number;
  passes_homoscedasticity: number;
  passes_independence: number;
  values: number[];
}


export interface INoLinearResultStats {
  r_squared: number;
  adjust_r_squared: number;
  chi_squared: number;
  adjust_chi_squeared: number;
  RMSE: number;
  SSE: number;
  HYBRID: number;
  AIC: string | number;
  BIC: string | number;
}


export interface AdjustmentMethod {
  name: string;
  description: string;
  status: boolean;
  parameters: IParameter[];
  statistics: IStatistics;
  transformed: ITransformedData;
  residuals: IResiduals;
}

export interface INoLinearResult {
  adjustment_methods: AdjustmentMethod[];
  best_adjust: string,
  model: number;
}

export interface INoLinearResponse {
  investigation_id: number;
  results: INoLinearResult[];
  comparison: IComparison;
}


export interface ModelHeuristicResult {
  model: number;
  score: number;
}

export interface ModelRidgeResult {
  model: number;
  coef: number;
}

export interface Heuristic {
  best_model: number;
  results: ModelHeuristicResult[];
}

export interface Ridge {
  best_model: number;
  y_pred: number[];
  statistics: IStatistics;
  results: ModelRidgeResult[];
}

export interface IComparison {
  heuristic: Heuristic;
  ridge: Ridge;
}

export enum ViewOption {
  DETAILED = 'DETAILED',
  SIMPLIFIED = 'SIMPLIFIED'
}

