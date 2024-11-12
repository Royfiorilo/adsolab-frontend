import {IModelConfiguration} from "../components/investigation/interface";

export interface IModelsConfigurations {
  [modelId: number]: IModelConfiguration
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

export interface IParameter {
  name: string;
  value: number;
}

export interface IStatistics {
  r: number;
  std_err: number;
}

export interface ITransformedData {
  x: number[];
  y: number[];
}
