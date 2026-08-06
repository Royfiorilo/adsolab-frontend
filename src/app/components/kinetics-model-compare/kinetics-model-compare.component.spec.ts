import {signal} from '@angular/core';
import {KineticsModelCompareComponent} from './kinetics-model-compare.component';
import {IKineticsModelsConfigurations, IKineticsState} from '../kinetics/interface';
import {IKineticsPersistedLinearization} from '../kinetics/interface';

const MODEL_ID = 2;

function buildConfiguration(linearization?: IKineticsPersistedLinearization): IKineticsModelsConfigurations {
  return {
    [MODEL_ID]: {
      paramValues: {qe: {value: 12.02}, k2: {value: 0.0014}},
      iterations: 10000,
      step: 0.1,
      automatedParams: true,
      selectedLinearizations: [20],
      knownParams: {},
      linearization,
    }
  };
}

const OTHER_MODEL_ID = 1;
const SAMPLE_TIME = [0, 5, 10, 20];

const STATISTICS = {
  r_squared: 0.9971, adjust_r_squared: 0.9955, chi_squared: 0.004,
  adjust_chi_squeared: 0.0002, RMSE: 0.12, SSE: 0.058,
  HYBRID: 3.61, AIC: -25.3, BIC: -23.2,
};

const RESIDUALS = {
  values: [0.0, 0.34, -0.12, 0.05],
  analysis: {
    normality_pvalue: 0.7677,
    homoscedasticity_pvalue: 0.0,
    durbin_watson: 1.5071,
    passes_normality: true,
    passes_homoscedasticity: false,
    passes_independence: true,
  },
};

function fitResult(modelId: number, modelName: string, statistics = STATISTICS, residuals = RESIDUALS) {
  return {
    modelId,
    modelName,
    adjustmentName: 'leastsq',
    params: {qe: 12.02, k2: 0.0014},
    curve: {t: [], qt: []},
    statistics,
    residuals,
  };
}

function build(configuration: IKineticsModelsConfigurations, results?: any[]): KineticsModelCompareComponent {
  const state = signal<IKineticsState>({
    shouldRender: true,
    kineticsSample: {time: [...SAMPLE_TIME], qt: [0, 3.8, 5.0, 6.1], sample_id: 1, adsorbate_id: 1, adsorbent_id: 1},
    stepId: 3,
    models: [
      {_id: MODEL_ID, name: 'Pseudo-Segundo Orden', latex_formula: '', parameters: {}},
      {_id: OTHER_MODEL_ID, name: 'Difusión Intraparticular', latex_formula: '', parameters: {}},
    ],
    selectedModels: [MODEL_ID],
    modelConfiguration: configuration,
    modelConfigurationDone: true,
  });

  const compareService = jasmine.createSpyObj('KineticsModelCompareService', ['runModels']);
  // ngx-translate devuelve la clave tal cual cuando no hay traducción; de eso
  // depende `hasDescription`.
  const translated = new Set(['ESTADISTICOS.r_squared', 'RESIDUOS.durbin_watson', 'LATEX.r_squared']);
  const translate = jasmine.createSpyObj('TranslateService', ['instant']);
  translate.instant.and.callFake((key: string) => translated.has(key) ? `texto de ${key}` : key);

  const modalService = jasmine.createSpyObj('NgbModal', ['open']);
  const component = new KineticsModelCompareComponent({state} as any, compareService, translate, modalService);
  (component as any).results = results ?? [fitResult(MODEL_ID, 'Pseudo-Segundo Orden')];
  return component;
}

describe('KineticsModelCompareComponent', () => {

  it('should expose the linear R2 of the best linearization', () => {
    const component = build(buildConfiguration({
      bestResult: 20,
      linearizations: [
        {id: 20, name: 'PSO', status: 'OK', statistics: {r_squared: 0.9988}},
        {id: 21, name: 'otra', status: 'OK', statistics: {r_squared: 0.81}},
      ],
    }));

    expect(component.getLinearR2(MODEL_ID)).toBe(0.9988);
    expect(component.hasLinearR2()).toBeTrue();
  });

  it('should not expose a linear R2 when the linearization was never run', () => {
    const component = build(buildConfiguration());

    expect(component.getLinearR2(MODEL_ID)).toBeUndefined();
    expect(component.hasLinearR2()).toBeFalse();
  });

  it('should not expose a linear R2 when the best linearization failed', () => {
    const component = build(buildConfiguration({
      bestResult: 20,
      linearizations: [{
        id: 20,
        name: 'PSO',
        status: 'ERROR',
        reason: 'sin puntos',
        statistics: {r_squared: 0.42},
      }],
    }));

    expect(component.getLinearR2(MODEL_ID)).toBeUndefined();
    expect(component.hasLinearR2()).toBeFalse();
  });

  it('should not expose a linear R2 for a model that was not linearized', () => {
    const component = build(buildConfiguration({
      bestResult: 20,
      linearizations: [{id: 20, name: 'PSO', status: 'OK', statistics: {r_squared: 0.9988}}],
    }));

    expect(component.getLinearR2(99)).toBeUndefined();
  });

  describe('statistics and residuals tables', () => {
    it('should derive the statistic rows from the backend payload', () => {
      const component = build(buildConfiguration());

      expect(component.getStatisticsRows()).toEqual(Object.keys(STATISTICS));
      expect(component.getStatisticsRows().length).toBe(9);
    });

    it('should derive the residual rows from the backend payload', () => {
      const component = build(buildConfiguration());

      expect(component.getResidualsRows()).toEqual(Object.keys(RESIDUALS.analysis));
      expect(component.getResidualsRows().length).toBe(6);
    });

    it('should return empty rows when there are no results yet', () => {
      const component = build(buildConfiguration(), []);

      expect(component.getStatisticsRows()).toEqual([]);
      expect(component.getResidualsRows()).toEqual([]);
    });

    it('should read each statistic from its own model', () => {
      const other = {...STATISTICS, r_squared: 0.5, RMSE: 9.9};
      const component = build(buildConfiguration(), [
        fitResult(MODEL_ID, 'PSO'),
        fitResult(OTHER_MODEL_ID, 'Intraparticular', other),
      ]);

      expect(component.statisticValue(MODEL_ID, 'r_squared')).toBe(0.9971);
      expect(component.statisticValue(OTHER_MODEL_ID, 'r_squared')).toBe(0.5);
      expect(component.statisticValue(99, 'r_squared')).toBeUndefined();
    });

    it('should read each residual metric from its own model', () => {
      const other = {values: [], analysis: {...RESIDUALS.analysis, durbin_watson: 2.4, passes_normality: false}};
      const component = build(buildConfiguration(), [
        fitResult(MODEL_ID, 'PSO'),
        fitResult(OTHER_MODEL_ID, 'Intraparticular', STATISTICS, other),
      ]);

      expect(component.residualValue(MODEL_ID, 'durbin_watson')).toBe(1.5071);
      expect(component.residualValue(OTHER_MODEL_ID, 'durbin_watson')).toBe(2.4);
      expect(component.residualValue(MODEL_ID, 'passes_homoscedasticity')).toBeFalse();
      expect(component.residualValue(99, 'durbin_watson')).toBeUndefined();
    });

    it('should tell apart a translated key from an untranslated one', () => {
      const component = build(buildConfiguration());

      expect(component.hasDescription('ESTADISTICOS', 'r_squared')).toBeTrue();
      expect(component.hasDescription('ESTADISTICOS', 'HYBRID')).toBeFalse();
    });
  });

  describe('comparison block', () => {
    const comparison = {
      heuristic: {best_model: MODEL_ID, results: [{model: MODEL_ID, score: 1.9}, {model: OTHER_MODEL_ID, score: 0.4}]},
      ml: {
        best_model: MODEL_ID,
        results: [{model: MODEL_ID, coef: 2.68}, {model: OTHER_MODEL_ID, coef: 0.73}],
        statistics: {...STATISTICS, r_squared: 0.9787},
        residuals: RESIDUALS,
        transformed: {x: [], y: []},
      },
    };

    function withComparison(value: any): KineticsModelCompareComponent {
      const component = build(buildConfiguration(), [
        fitResult(MODEL_ID, 'PSO'),
        fitResult(OTHER_MODEL_ID, 'Intraparticular'),
      ]);
      (component as any).comparison = value;
      return component;
    }

    it('should expose the heuristic score and the ML coefficient per model', () => {
      const component = withComparison(comparison);

      expect(component.getHeuristicScore(MODEL_ID)).toBe(1.9);
      expect(component.getMlCoefficient(OTHER_MODEL_ID)).toBe(0.73);
      expect(component.getHeuristicScore(99)).toBeUndefined();
    });

    it('should expose the ML statistics separately from the per-model ones', () => {
      const component = withComparison(comparison);

      expect(component.getMlStatistic('r_squared')).toBe(0.9787);
      expect(component.statisticValue(MODEL_ID, 'r_squared')).toBe(0.9971);
    });

    it('should not expose ML statistics when the backend returned no ML block', () => {
      const component = withComparison({heuristic: comparison.heuristic, ml: null});

      expect(component.getMlStatistic('r_squared')).toBeUndefined();
      expect(component.getMlCoefficient(MODEL_ID)).toBeUndefined();
    });

    it('should name the best model when heuristic and ML agree', () => {
      const component = withComparison(comparison);

      expect(component.bestModelOverall()).toBe('Pseudo-Segundo Orden');
    });

    it('should not name a best model when heuristic and ML disagree', () => {
      const component = withComparison({
        heuristic: comparison.heuristic,
        ml: {...comparison.ml, best_model: OTHER_MODEL_ID},
      });

      expect(component.bestModelOverall()).toBeUndefined();
    });

    it('should not name a best model when there is no comparison', () => {
      const component = withComparison(undefined);

      expect(component.bestModelOverall()).toBeUndefined();
    });
  });
});
