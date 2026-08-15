import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {environment} from '../../../environments/environment';
import {KineticsModelCompareService} from './kinetics-model-compare.service';
import {IKineticsModelsConfigurations, IKineticsSample} from '../kinetics/interface';
import {IKineticsRunOutcome} from './interface';

const URL = `${environment.backendBaseUrl}/kinetics/run-no-linear-model`;
const MODEL_ID = 2;

const SAMPLE: IKineticsSample = {
  time: [0, 5, 10], qt: [0, 3.8, 5.0], sample_id: 7, adsorbate_id: 1, adsorbent_id: 1,
};

const CONFIGURATION: IKineticsModelsConfigurations = {
  [MODEL_ID]: {
    paramValues: {qe: {value: 12.02}, k2: {value: 0.0014}},
    iterations: 10000,
    step: 0.1,
    automatedParams: true,
    selectedLinearizations: [20],
    knownParams: {},
  }
};

const STATISTICS = {
  r_squared: 0.9797, adjust_r_squared: 0.9775, chi_squared: 0.0051,
  adjust_chi_squeared: 0.0003, RMSE: 0.4977, SSE: 5.2022,
  HYBRID: 4.6168, AIC: -25.3044, BIC: -23.2154,
};

const RESIDUALS = {
  values: [0.0, 0.34, -0.12],
  analysis: {
    normality_pvalue: 0.7677, homoscedasticity_pvalue: 0.0, durbin_watson: 1.5071,
    passes_normality: true, passes_homoscedasticity: false, passes_independence: true,
  },
};

function method(name: string, statistics: any, success = true) {
  return {
    name,
    success,
    parameters: [{name: 'qe', value: 12.02, std_err: 0.3}, {name: 'k2', value: 0.0014, std_err: 0.0001}],
    statistics,
    residuals: RESIDUALS,
    transformed: {x: [0, 1, 2], y: [0, 1.5, 2.9]},
  };
}

const COMPARISON = {
  heuristic: {best_model: MODEL_ID, results: [{model: MODEL_ID, score: 1.0054}]},
  ml: {
    best_model: MODEL_ID,
    results: [{model: MODEL_ID, coef: 2.6806}],
    statistics: {...STATISTICS, r_squared: 0.9787},
    residuals: RESIDUALS,
    transformed: {x: [0, 1], y: [0, 1.5]},
  },
};

describe('KineticsModelCompareService', () => {
  let service: KineticsModelCompareService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(KineticsModelCompareService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  function run(response: any): IKineticsRunOutcome {
    let outcome!: IKineticsRunOutcome;
    service.runModels(SAMPLE, [MODEL_ID], CONFIGURATION, [{_id: MODEL_ID, name: 'Pseudo-Segundo Orden'}])
      .subscribe(value => outcome = value);
    httpMock.expectOne(URL).flush(response);
    return outcome;
  }

  const singleResult = {
    kinetic_sample_id: 7,
    results: [{
      model: MODEL_ID,
      best_adjust: 'leastsq',
      seeds: [{name: 'qe', value: 12.02}],
      adjustment_methods: [
        method('cobyla', {...STATISTICS, r_squared: 0.42}),
        method('leastsq', STATISTICS),
      ],
    }],
    comparison: COMPARISON,
  };

  it('should post the request to the kinetics endpoint with credentials', () => {
    service.runModels(SAMPLE, [MODEL_ID], CONFIGURATION, []).subscribe();

    const call = httpMock.expectOne(URL);
    expect(call.request.method).toBe('POST');
    expect(call.request.withCredentials).toBeTrue();
    expect(call.request.body.kinetic_sample_id).toBe(7);
    call.flush({kinetic_sample_id: 7, results: [], comparison: {heuristic: null, ml: null}});
  });

  it('should keep every statistic of the best adjustment method', () => {
    const outcome = run(singleResult);

    expect(outcome.results[0].statistics).toEqual(STATISTICS);
    expect(Object.keys(outcome.results[0].statistics).length).toBe(9);
  });

  it('should keep the residuals of the best adjustment method', () => {
    const outcome = run(singleResult);

    expect(outcome.results[0].residuals).toEqual(RESIDUALS as any);
  });

  it('should pick the method named by best_adjust, not the first one', () => {
    const outcome = run(singleResult);

    expect(outcome.results[0].adjustmentName).toBe('leastsq');
    expect(outcome.results[0].statistics['r_squared']).toBe(0.9797);
  });

  it('should pass the comparison block through', () => {
    const outcome = run(singleResult);

    expect(outcome.comparison).toEqual(COMPARISON as any);
  });

  it('should fall back to a successful method when best_adjust is missing', () => {
    const outcome = run({
      ...singleResult,
      results: [{
        ...singleResult.results[0],
        best_adjust: 'inexistente',
        adjustment_methods: [
          method('cobyla', {...STATISTICS, r_squared: 0.42}, false),
          method('nelder', STATISTICS, true),
        ],
      }],
    });

    expect(outcome.results[0].adjustmentName).toBe('nelder');
  });

  it('should drop models that produced no adjustment method', () => {
    const outcome = run({
      ...singleResult,
      results: [{model: MODEL_ID, best_adjust: 'leastsq', seeds: [], adjustment_methods: []}],
    });

    expect(outcome.results).toEqual([]);
    expect(outcome.comparison).toEqual(COMPARISON as any);
  });
});
