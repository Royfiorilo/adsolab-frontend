import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {environment} from '../../../environments/environment';
import {KineticsHistoricService, toKineticsSample, toModelResult} from './kinetics-historic.service';

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
});
