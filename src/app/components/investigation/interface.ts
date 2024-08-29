export interface IModelConfiguration {
  automatedParams :boolean;
  selectedLinearizations: string[];
  paramValues: {[key: string]: number};
}
