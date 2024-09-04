export interface Parameter {
  [key: string]: string;
}

export interface Linearization {
  linearization_id: number;
  model_id: number;
  name: string;
  description: string;
  formula: string;
  parameters: Parameter;
}

export interface Model {
  _id: number;
  name: string;
  description: string;
  formula: string;
  parameters: Parameter;
  linearizations: Linearization[];
}

export interface ModelsResponse {
  models: Model[];
}
