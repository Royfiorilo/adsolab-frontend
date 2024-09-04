export interface IModelConfiguration {
  automatedParams :boolean;
  selectedLinearizations: string[];//todavia no implementado
  paramValues: {[key: string]: number};
}
