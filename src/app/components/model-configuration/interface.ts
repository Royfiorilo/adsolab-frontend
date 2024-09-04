export interface ILinearizationRequest {
  investigation_id :number;
  models: IModelLinearizationRequest[];
}

export interface IModelLinearizationRequest {
  model :string;
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

export interface IParameter {
  name: string;
  value: number;
}

export interface IStatistics {
  r: number;
  stderr: number;
}


export interface ILinearizationGraph {
  linearizationName: string;
  graph: IGraph;
}

export interface IGraph {
  data: IGraphData[];
  layout: IGraphLayout;
}

export interface IGraphData {
  x: (number)[];  // Supports both numbers and strings (for variables)
  y: (number)[];
  type: string;            // e.g., 'scatter'
  mode: string;            // e.g., 'markers', 'line'
  marker: IMarker;
}

export interface IMarker {
  color: string;
}

export interface IGraphLayout {
  title: string;
}

