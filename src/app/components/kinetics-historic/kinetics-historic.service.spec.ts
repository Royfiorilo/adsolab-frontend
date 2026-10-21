import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {environment} from '../../../environments/environment';
import {DEFAULT_ITERATIONS, DEFAULT_STEPS} from '../../common/common.service';
import {KineticsHistoricService, toKineticsSample, toModelResult, toResumeState} from './kinetics-historic.service';

const BASE = environment.backendBaseUrl;

describe('KineticsHistoricService', () => {
  let service: KineticsHistoricService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(KineticsHistoricService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should request a page of every investigation when no user is given', () => {
    service.getInvestigations(2, 10).subscribe();

    const call = httpMock.expectOne(request => request.url === `${BASE}/kinetics/investigations`);
    expect(call.request.params.get('page')).toBe('2');
    expect(call.request.params.get('per_page')).toBe('10');
    expect(call.request.params.has('user_id')).toBeFalse();
    call.flush({investigations: [], page: 2, per_page: 10, total: 0, pages: 0});
  });

  it('should filter by user when one is given', () => {
    service.getInvestigations(1, 10, 4).subscribe();

    const call = httpMock.expectOne(request => request.url === `${BASE}/kinetics/investigations`);
    expect(call.request.params.get('user_id')).toBe('4');
    call.flush({investigations: [], page: 1, per_page: 10, total: 0, pages: 0});
  });

  it('should delete a version with credentials', () => {
    service.deleteVersion(3, 2).subscribe();

    const call = httpMock.expectOne(`${BASE}/kinetics/investigation/3/version/2`);
    expect(call.request.method).toBe('DELETE');
    expect(call.request.withCredentials).toBeTrue();
    call.flush({});
  });

  it('should map a saved fitted model to a run result keyed by model', () => {
    const methods = [{name: 'leastsq'}] as any;

    expect(toModelResult({
      kinetic_fitted_model_id: 9, kinetic_model_id: 2, best_adjust: 'leastsq',
      seeds: [{name: 'qe', value: 1}], adjustment_methods: methods,
    })).toEqual({model: 2, best_adjust: 'leastsq', adjustment_methods: methods, seeds: [{name: 'qe', value: 1}]});
  });

  it('should expose the backend sample id as sample_id', () => {
    const sample = toKineticsSample({
      kinetic_sample_id: 50, user_id: 1, time: [0, 1], qt: [0, 2],
      adsorbate_id: 1, adsorbent_id: 2, title: 'muestra',
    });

    expect(sample.sample_id).toBe(50);
    expect(sample.time).toEqual([0, 1]);
  });

  describe('toResumeState', () => {
    const PSO = {
      _id: 2, name: 'PSO', latex_formula: '', parameters: {qe: '', k2: ''},
      linearizations: [{linearization_id: 20, name: 'PSO'}],
    } as any;
    const SAMPLE = {time: [0, 5], qt: [0, 3], sample_id: 50, adsorbate_id: 1, adsorbent_id: 1};

    function savedVersion(seeds?: { name: string; value: number; stderr?: number | null }[]) {
      return {
        sample: SAMPLE,
        models: [PSO],
        results: [{model: 2, best_adjust: 'leastsq', adjustment_methods: [], seeds}],
        comparison: {heuristic: null, ml: null},
      };
    }

    it('should open the configuration step with the saved models and seeds as manual parameters', () => {
      const state = toResumeState(savedVersion([{name: 'qe', value: 7.5, stderr: 0.1}, {name: 'k2', value: 2.5e-5}]), 500, 0.2);

      expect(state.stepId).toBe(2);
      expect(state.kineticsSample).toBe(SAMPLE);
      expect(state.selectedModels).toEqual([2]);
      expect(state.modelConfiguration[2]).toEqual({
        paramValues: {qe: {value: 7.5, stderr: 0.1}, k2: {value: 2.5e-5, stderr: null}},
        iterations: 500,
        step: 0.2,
        automatedParams: false,
        selectedLinearizations: [20],
        knownParams: {},
      });
      expect(state.modelConfigurationDone).toBeTrue();
    });

    it('should use the default iterations and step when the version has none', () => {
      const config = toResumeState(savedVersion([{name: 'qe', value: 7.5}, {name: 'k2', value: 0.01}]), null, null)
        .modelConfiguration[2];

      expect(config.iterations).toBe(DEFAULT_ITERATIONS);
      expect(config.step).toBe(DEFAULT_STEPS);
    });

    it('should leave the configuration pending when a seed is missing', () => {
      const state = toResumeState(savedVersion([{name: 'qe', value: 7.5}]), null, null);

      expect(state.modelConfiguration[2].paramValues['k2']).toEqual({value: null});
      expect(state.modelConfigurationDone).toBeFalse();
    });
  });
});
