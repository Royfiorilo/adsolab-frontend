import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {environment} from '../../../environments/environment';
import {KineticsSampleService} from './kinetics-sample.service';

const BASE = environment.backendBaseUrl;

describe('KineticsSampleService', () => {
  let service: KineticsSampleService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting()]});
    service = TestBed.inject(KineticsSampleService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should list the samples of the given user', () => {
    service.getSamples(4).subscribe();

    const call = httpMock.expectOne(request => request.url === `${BASE}/kinetics/samples`);
    expect(call.request.method).toBe('GET');
    expect(call.request.params.get('user_id')).toBe('4');
    call.flush({samples: []});
  });

  it('should delete a sample with credentials', () => {
    service.deleteSample(12).subscribe();

    const call = httpMock.expectOne(`${BASE}/kinetics/sample/12`);
    expect(call.request.method).toBe('DELETE');
    expect(call.request.withCredentials).toBeTrue();
    call.flush({kinetic_sample_id: 12});
  });

  it('should not send a request when the sample was already created', () => {
    let completed = false;

    service.createKineticSample({time: [0], qt: [0], sample_id: 3, adsorbate_id: 1, adsorbent_id: 1})
      .subscribe({complete: () => completed = true});

    httpMock.expectNone(`${BASE}/kinetics/sample`);
    expect(completed).toBeTrue();
  });
});
