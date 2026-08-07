import {IGraph, ILinearStatistics, IParameter, IStatistics, ITransformedData} from "../../common/common.interface";

export type KineticsLinearizationStatus = 'OK' | 'ERROR';

export interface IKineticsModelLinearizationRequest {
  model: number;
  linearizations: number[];
  known_params?: { [name: string]: number };
}

export interface IKineticsLinearizationRequest {
  kinetic_sample_id: number;
  models: IKineticsModelLinearizationRequest[];
  filter: number[];
}

export interface IKineticsLinearizationItem {
  id: number;
  name: string;
  status: KineticsLinearizationStatus;
  reason?: string;
  slope?: number;
  intercept?: number;
  transformed?: ITransformedData;
  parameters?: IParameter[];
  statistics?: ILinearStatistics;
  assumed_params?: { [name: string]: number };
  dropped_points?: number;
}

export interface IKineticsLinearizationResult {
  model: number;
  best_result: number | null;
  linearizations: IKineticsLinearizationItem[];
}

export interface IKineticsLinearizationResponse {
  kinetic_sample_id: number;
  results: IKineticsLinearizationResult[];
}

export interface IKineticsLinearizationGraph {
  id: number;
  linearizationName: string;
  status: KineticsLinearizationStatus;
  isBestResult: boolean;
  reason?: string;
  parameters: IParameter[];
  statistics: Partial<IStatistics>;
  assumedParams: { name: string; value: number }[];
  droppedPoints: number;
  graph?: IGraph;
}
