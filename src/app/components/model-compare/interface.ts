import {IGraph, IParameter, ITransformedData} from "../../common/common.interface";

export interface INoLinearGraph {
  parameters: IParameter[];
  statistics: INoLinearResultStats;
  graph: IGraph;
  best: boolean;
  adjustment_name: string;
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
  // CV_RMSE: number;
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
  r: number;
  stderr: number
}

export interface AdjustmentMethod {
  name: string;
  parameters: IParameter[];
  statistics: INoLinearResultStats;
  transformed: ITransformedData;
}

export interface INoLinearResult {
  adjustment_methods: AdjustmentMethod[];
  best_adjust: string,
  model: number;
}

export interface INoLinearResponse {
  investigation_id: number;
  best_model: string,
  results: INoLinearResult[];
}
