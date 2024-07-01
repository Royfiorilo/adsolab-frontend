import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModelCompareComponent } from './model-compare.component';

describe('ModelCompareComponent', () => {
  let component: ModelCompareComponent;
  let fixture: ComponentFixture<ModelCompareComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ModelCompareComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ModelCompareComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
