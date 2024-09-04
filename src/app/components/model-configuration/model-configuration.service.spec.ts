import { TestBed } from '@angular/core/testing';

import { ModelConfigurationService } from './model-configuration.service';

describe('ModelConfigurationService', () => {
  let service: ModelConfigurationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModelConfigurationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
