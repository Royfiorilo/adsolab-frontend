export interface IKineticsFitResult {
  modelId: number;
  modelName: string;
  params: { [name: string]: number };
  curve: { t: number[]; qt: number[] };      // smooth predicted curve
  statistics: { r2: number; rmse: number };
}

// Visual settings shared by every kinetics plot (comparison + per-model).
export interface IKineticsPlotSettings {
  title: string;
  xAxisLabel: string;
  yAxisLabel: string;
  lineWidth: number;
  colorByModel: { [modelId: number]: string };
}

export type ExportFormat = 'png' | 'svg';
