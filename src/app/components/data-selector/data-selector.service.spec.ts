import { TestBed } from '@angular/core/testing';

import { DataSelectorService } from './data-selector.service';

describe('DataSelectorService', () => {
  let service: DataSelectorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DataSelectorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
