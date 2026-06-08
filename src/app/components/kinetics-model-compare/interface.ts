export interface IKineticsFitResult {
  modelId: number;
  modelName: string;
  params: { [name: string]: number };
  curve: { t: number[]; qt: number[] };      // smooth predicted curve
  statistics: { r2: number; rmse: number };
}

export type AxisScale = 'linear' | 'log';

// Per-axis visual settings. min/max null means autorange.
export interface IKineticsAxisSettings {
  label: string;
  unit: string;
  scale: AxisScale;
  min: number | null;
  max: number | null;
}

// Visual settings shared by every kinetics plot (comparison + per-model).
export interface IKineticsPlotSettings {
  title: string;
  font: { family: string; size: number };
  lineWidth: number;
  colorByModel: { [modelId: number]: string };
  visibleByModel: { [modelId: number]: boolean }; // which curves overlay in comparison
  xAxis: IKineticsAxisSettings;
  yAxis: IKineticsAxisSettings;
}

export type ExportFormat = 'png' | 'svg';
