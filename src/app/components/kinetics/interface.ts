export interface IKineticsModel {
  _id: number;
  name: string;
  latex_formula: string;
  parameters: { [key: string]: string };
}

export interface IKineticsSample {
  time: number[];
  qt: number[];
  sample_id?: number;
  title?: string;
  description?: string;
  temperature?: number;
  time_unit?: string;
  measure_unit?: string;
  adsorbate_id: number | undefined;
  adsorbate?: string;
  adsorbent_id: number | undefined;
  adsorbent?: string;
}

export interface CreateKineticSampleResponse {
  kinetic_sample_id: number;
  user_id: number;
  time: number[];
  qt: number[];
  adsorbate_id: number;
  adsorbent_id: number;
  title: string;
  description?: string;
  temperature?: number;
  time_unit?: string;
  measure_unit?: string;
}

export interface IKineticsModelConfiguration {
  paramValues: { [key: string]: { value: number | null } };
  iterations: number;
  step: number;
}

export interface IKineticsModelsConfigurations {
  [modelId: number]: IKineticsModelConfiguration;
}

export interface IKineticsState {
  shouldRender: boolean;
  kineticsSample: IKineticsSample | undefined;
  stepId: number;
  models: IKineticsModel[];
  selectedModels: number[];
  modelConfiguration: IKineticsModelsConfigurations;
  modelConfigurationDone: boolean;
}
