import {IGraph, IParameter, IStatistics} from "../../common/common.interface";

export interface ILinearizationRequest {
  investigation_id: number;
  models: IModelLinearizationRequest[];
}

export interface IModelLinearizationRequest {
  model: string;
  linearizations: string[];
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
  name: string;
  formula: string;
  transformed: ITransformedData;
  slope: number;
  intercept: number;
  parameters: IParameter[];
  statistics: IStatistics;
}

export interface ITransformedData {
  x: number[];
  y: number[];
}


export interface ILinearizationGraph {
  isBestResult: boolean;
  parameters: IParameter[];
  statistics: IStatistics;
  linearizationName: string;
  graph: IGraph;
}

