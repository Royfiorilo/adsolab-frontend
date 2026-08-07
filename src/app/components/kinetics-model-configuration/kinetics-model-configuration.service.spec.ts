import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {environment} from '../../../environments/environment';
import {KineticsModelConfigurationService} from './kinetics-model-configuration.service';
import {IKineticsLinearizationRequest} from './interface';

describe('KineticsModelConfigurationService', () => {
  let service: KineticsModelConfigurationService;
  let httpMock: HttpTestingController;

  const url = `${environment.backendBaseUrl}/kinetics/run-linearization`;

  const request: IKineticsLinearizationRequest = {
    kinetic_sample_id: 10,
    models: [{model: 3, linearizations: [3], known_params: {qe: 7.5}}],
    filter: [],
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(KineticsModelConfigurationService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should post the linearization request to the kinetics endpoint', () => {
    service.runLinearization(request).subscribe();

    const call = httpMock.expectOne(url);
    expect(call.request.method).toBe('POST');
    expect(call.request.withCredentials).toBeTrue();
    expect(call.request.body).toEqual(request);
    call.flush({kinetic_sample_id: 10, results: []});
  });

  it('should return the parsed response', () => {
    const response = {
      kinetic_sample_id: 10,
      results: [{model: 3, best_result: 3, linearizations: []}]
    };
    let received: unknown;

    service.runLinearization(request).subscribe(value => received = value);
    httpMock.expectOne(url).flush(response);

    expect(received).toEqual(response);
  });
});
