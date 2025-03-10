export interface IParameterValue {
  value: number | string;
  stderr: number;
}

export interface IModelConfiguration {
  automatedParams: boolean;
  selectedLinearizations: string[];//todavia no implementado
  paramValues: { [key: string]: IParameterValue };
  paramInfo: { [key: string]: string };
  paramSaved: { name: string, value: number, stderr: number } | undefined;
  iterations: number;
  steps: number;
}
