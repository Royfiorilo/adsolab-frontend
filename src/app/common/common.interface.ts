import {IModelConfiguration} from "../components/investigation/interface";
import {Investigation} from "../components/data-selector/data-sample";
import {Model} from "../components/model-selector/model";

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
  name?: string;
  marker: IMarker;
  line?: { [key: string]: any };
}

export interface IMarker {
  color: string;
}

export interface IGraphLayout {
  title: string;
  autosize: boolean;
  xaxis: { title: string };
  yaxis: { title: string };
}

export interface IParameter {
  name: string;
  value: number;
  std_err: number;
}

export interface ILinearStatistics {
  r_squared: number;
}

export interface IStatistics {
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

export interface ITransformedData {
  x: number[];
  y: number[];
}

export interface IErrorDialogData {
  main_message: string;
  error_message: string;
}

export interface IInvestigationState {
  shouldRender: boolean;
  investigation: Investigation | undefined;
  stepId: number;
  models: Model[];
  selectedModels: number[];
  modelConfiguration: IModelsConfigurations;
  modelConfigurationDone: boolean;
}

export interface IUser {
  id: number;
  email: string;
  roles: string[];
  active: boolean;
}

export interface IUserPageResponse {
  users: IUser[];
  page: number;
  per_page: number,
  total: number,
  pages: number
}

export interface ILoginRequest {
  email: string;
  password: string;
  remember: boolean;
}

export interface ILoginResponse {
  user: IUser;
}
