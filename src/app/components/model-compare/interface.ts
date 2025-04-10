import {IGraph, IParameter, IStatistics, ITransformedData} from "../../common/common.interface";

export interface INoLinearAdjustmentResult {
  adjustment_name: string;
}

export interface INoLinearAdjustmentSuccessResult extends INoLinearAdjustmentResult {
  parameters: IParameter[];
  statistics: IStatistics;
  residuals: IResiduals;
  graph: IGraph;
  best?: boolean;
}

export interface INoLinearAdjustmentErrorResult extends INoLinearAdjustmentResult {
  error: string;
}

export interface INoLinearRequestSeed {
  name: string;
  value: number;
  stderr: number;
}

export interface INoLinearRequestModel {
  model: number;
  iteration: number | undefined;
  seeds: INoLinearRequestSeed[];
  step: number;
}

export interface INoLinearRequest {
  sample_id: number;
  models: INoLinearRequestModel[];
}


interface IResidualsAnalysis {
  normality_pvalue: number;
  homoscedasticity_pvalue: number;
  durbin_watson: number;
  passes_normality: number;
  passes_homoscedasticity: number;
  passes_independence: number;
}

export interface IResiduals {
  analysis: IResidualsAnalysis
  values: number[];
  graph?: IGraph;
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
  success: boolean;
  error?: string;
  parameters: IParameter[];
  statistics: IStatistics;
  transformed: ITransformedData;
  residuals: IResiduals;
}

export interface INoLinearResult {
  adjustment_methods: AdjustmentMethod[];
  best_adjust: string,
  model: number;
  seeds: INoLinearRequestSeed[] | undefined;

}

export interface INoLinearResponse {
  sample_id: number;
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
  transformed: ITransformedData;
  statistics: IStatistics;
  residuals: IResiduals;
  results: ModelRidgeResult[];
}

export interface IComparison {
  heuristic: Heuristic;
  ridge: Ridge;
}

export enum AllResultsViewOption {
  DETAILED = 'DETAILED',
  SIMPLIFIED = 'SIMPLIFIED'
}

export enum ComparisonViewOption {
  ONE_COLUMN = 'ONE_COLUMN',
  TWO_COLUMNS = 'TWO_COLUMNS',
}

export interface ISaveRequest {
  investigation_id: number | undefined;
  sample_id: number;
  comparison: {
    heuristic: Heuristic,
    ridge: IRidgeSaveRequest
  };
  results: INoLinearResult[];
}

export interface ISaveResponse {
  investigation_id: number;
}

export interface IRidgeSaveRequest {
  best_model: number;
  statistics: IStatistics;
  residuals: IResidualsAnalysis;
  results: ModelRidgeResult[];
}
