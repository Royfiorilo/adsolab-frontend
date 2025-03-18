import { TestBed } from '@angular/core/testing';

import { RequestCancellationService } from './request-cancellation.service';

describe('RequestCancellationService', () => {
  let service: RequestCancellationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RequestCancellationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
