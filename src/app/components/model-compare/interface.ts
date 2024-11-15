import {IGraph, IParameter, ITransformedData} from "../../common/common.interface";

export interface INoLinearGraph {
  parameters: IParameter[];
  statistics: INoLinearResultStats;
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

export interface INoLinearResultStats {
  r_squared: number;
  adjust_r_squared: number;
  chi_squared: number;
  adjust_chi_squeared: number;
  RMSE: number;
  SSE: number;
  HYBRID: number;
}

export interface AdjustmentMethod {
  name: string;
  description: string;
  status: boolean;
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
