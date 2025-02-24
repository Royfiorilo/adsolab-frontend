import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HistoricInvestigationComponent } from './historic-investigation.component';

describe('HistoricInvestigationComponent', () => {
  let component: HistoricInvestigationComponent;
  let fixture: ComponentFixture<HistoricInvestigationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [HistoricInvestigationComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HistoricInvestigationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
