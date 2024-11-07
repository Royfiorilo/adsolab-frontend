import {IGraph, IParameter, IStatistics} from "../../common/common.interface";

export interface INoLinearGraph {
  parameters: IParameter;
  statistics: IStatistics;
  graphs: IGraph[]
}

export interface INoLinearRequestSeed {
  name: string;
  value: number;
}

export interface INoLinearRequestModel {
  model: string;
  seeds: INoLinearRequestSeed[];
}

export interface INoLinearRequest {
  investigation_id: number;
  models: INoLinearRequestModel[];
}

export interface INoLinearResultStats {
  CV_RMSE: number;
  Chi_squared: number;
  Chi_squared_reduced: number;
  HYBRID: number;
  R2: number;
  R2_adjusted: number;
  RMSE: number;
  SSE: number;
  Std_error: number;
  n_params: number;
  n_points: number;
}

export interface AdjustmentMethod {
  AIC: number;
  BIC: number;
  description: string;
  params: IParameter[];
  stats: INoLinearResultStats;
  success: boolean;
}

export interface AdjustmentMethods {
  [method: string]: AdjustmentMethod;
}

export interface INoLinearResult {
  adjustment_methods: AdjustmentMethods;
  model: string;
}

export interface INoLinearResponse {
  investigation_id: number;
  results: INoLinearResult[];
}
