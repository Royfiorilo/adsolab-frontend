export interface InvestigationData {
  comparison: {
    comparison_id: number;
    heuristic: {
      best_model: number;
      results: { model: number; score: number }[];
    };
    ml: {
      coefs: number[];
      name: string;
      residuals: {
        analysis: {
          durbin_watson: number;
          homoscedasticity_pvalue: number;
          normality_pvalue: number;
          passes_homoscedasticity: number;
          passes_independence: number;
          passes_normality: number;
        };
        values: number[];
      };
      statistics: Record<string, number>;
      y_pred: number[];
    };
  };
  created_at: string;
  fitted_models: {
    best_adjust: string;
    fitted_model_id: number | null;
    model_id: number;
    adjustment_methods: {
      name: string;
      params: { name: string; std_err: number; value: number }[];
      residuals: {
        analysis: Record<string, number>;
        values: number[];
      };
      statistics: Record<string, number>;
    }[];
    seeds: { name: string; stderr: number; value: number }[];
  }[];
  investigation_id: number;
  iterations: number | null;
  steps: number | null;
  version_id: number;
}
