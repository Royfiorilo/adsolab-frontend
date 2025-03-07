import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoricVersionComponent } from './historic-version.component';

describe('HistoricVersionComponent', () => {
  let component: HistoricVersionComponent;
  let fixture: ComponentFixture<HistoricVersionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HistoricVersionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HistoricVersionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
