import {TestBed} from '@angular/core/testing';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {environment} from '../../../environments/environment';
import {SampleSelectorService} from './sample-selector.service';

const BASE = environment.backendBaseUrl;

describe('SampleSelectorService', () => {
  let service: SampleSelectorService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({providers: [provideHttpClient(), provideHttpClientTesting()]});
    service = TestBed.inject(SampleSelectorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('should create an adsorbate with credentials', () => {
    const body = {ion_name: 'mercurio', iupac_name: 'mercurio (II)', formula: 'Hg'};

    service.createAdsorbate(body).subscribe();

    const call = httpMock.expectOne(`${BASE}/adsorbates`);
    expect(call.request.method).toBe('POST');
    expect(call.request.body).toEqual(body);
    expect(call.request.withCredentials).toBeTrue();
    call.flush({id: 11, ...body});
  });

  it('should create an adsorbent with credentials', () => {
    service.createAdsorbent({name: 'Zeolita'}).subscribe();

    const call = httpMock.expectOne(`${BASE}/adsorbents`);
    expect(call.request.method).toBe('POST');
    expect(call.request.body).toEqual({name: 'Zeolita'});
    expect(call.request.withCredentials).toBeTrue();
    call.flush({id: 17, name: 'Zeolita'});
  });

  it('should no longer offer the ReactorApp sync', () => {
    expect((service as any).syncMaterials).toBeUndefined();
  });
});
