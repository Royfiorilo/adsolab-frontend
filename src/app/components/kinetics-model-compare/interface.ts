export interface IKineticsFitResult {
  modelId: number;
  modelName: string;
  params: { [name: string]: number };
  curve: { t: number[]; qt: number[] };      // smooth predicted curve
  statistics: { r2: number; rmse: number };
}

// ---- Backend contract for POST /kinetics/run-no-linear-model ----

export interface IKineticsSeed {
  name: string;
  value: number;
}

export interface IKineticsRunModelConfig {
  model: number;
  seeds: IKineticsSeed[];
  iterations: number;
  step: number;
}

export interface IKineticsRunRequest {
  kinetic_sample_id: number;
  models: IKineticsRunModelConfig[];
  filter: number[];
}

export interface IKineticsFittedParameter {
  name: string;
  value: number;
  std_err: number | null;
}

export interface IKineticsAdjustmentMethod {
  name: string;
  description?: string;
  success: boolean;
  parameters: IKineticsFittedParameter[];
  statistics: { [key: string]: number };
  residuals: { values: number[]; analysis: any };
  transformed: { x: number[]; y: number[]; qt_pred: number[] };
}

export interface IKineticsModelResult {
  model: number;
  best_adjust: string;
  adjustment_methods: IKineticsAdjustmentMethod[];
}

export interface IKineticsRunResponse {
  kinetic_sample_id: number;
  results: IKineticsModelResult[];
  comparison: any;
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
