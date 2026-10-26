import { TestBed } from '@angular/core/testing';

import { ModelSelectorServiceService } from './model-selector-service.service';

xdescribe('ModelSelectorServiceService', () => {
  let service: ModelSelectorServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ModelSelectorServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
