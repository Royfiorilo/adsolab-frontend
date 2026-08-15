export interface IKineticsResidualsAnalysis {
  normality_pvalue: number;
  homoscedasticity_pvalue: number;
  durbin_watson: number;
  passes_normality: number | boolean;
  passes_homoscedasticity: number | boolean;
  passes_independence: number | boolean;
}

export interface IKineticsResiduals {
  values: number[];
  analysis: IKineticsResidualsAnalysis;
}

export interface IKineticsFitResult {
  modelId: number;
  modelName: string;
  adjustmentName: string;
  params: { [name: string]: number };
  curve: { t: number[]; qt: number[] };      // smooth predicted curve
  statistics: { [name: string]: number };
  residuals: IKineticsResiduals;
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
  residuals: IKineticsResiduals;
  transformed: { x: number[]; y: number[] };
}

export interface IKineticsModelResult {
  model: number;
  best_adjust: string;
  adjustment_methods: IKineticsAdjustmentMethod[];
}

export interface IKineticsHeuristicComparison {
  best_model: number;
  results: { model: number; score: number }[];
}

export interface IKineticsMlComparison {
  best_model: number;
  results: { model: number; coef: number }[];
  statistics: { [name: string]: number };
  residuals: IKineticsResiduals;
  transformed: { x: number[]; y: number[] };
}

export interface IKineticsComparison {
  heuristic: IKineticsHeuristicComparison | null;
  ml: IKineticsMlComparison | null;
}

export interface IKineticsRunResponse {
  kinetic_sample_id: number;
  results: IKineticsModelResult[];
  comparison: IKineticsComparison;
}

export interface IKineticsRunOutcome {
  results: IKineticsFitResult[];
  comparison: IKineticsComparison;
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
