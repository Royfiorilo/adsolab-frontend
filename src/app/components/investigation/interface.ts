import {Linearization} from "../model-selector/model";

export interface IParameterValue {
  value: number | string;
  stderr: number;
}

export interface IModelConfiguration {
  automatedParams: boolean;
  selectedLinearizations: Linearization[];
  paramValues: { [key: string]: IParameterValue };
  paramInfo: { [key: string]: string };
  paramSaved: { name: string, value: number, stderr: number } | undefined;
  iterations: number;
  step: number;
}
