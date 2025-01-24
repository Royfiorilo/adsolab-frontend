import {IGraph, IParameter, IStatistics, ITransformedData} from "../../common/common.interface";

export interface ILinearizationRequest {
  investigation_id: number;
  models: IModelLinearizationRequest[];
}

export interface IModelLinearizationRequest {
  model: number;
  linearizations: number[];
}

export interface ILinearizationResponse {
  investigation_id: number;
  results: IResult[];
}

export interface IResult {
  model: string;
  best_result: string;
  linearizations: ILinearization[];
}

export interface ILinearization {
  id: number;
  name: string;
  formula: string;
  transformed: ITransformedData;
  slope: number;
  intercept: number;
  parameters: IParameter[];
  statistics: IStatistics;
}


export interface ILinearizationGraph {
  isBestResult: boolean;
  parameters: IParameter[];
  statistics: IStatistics;
  linearizationName: string;
  graph: IGraph;
}

