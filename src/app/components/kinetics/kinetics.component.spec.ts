import {TestBed} from '@angular/core/testing';
import {NoopAnimationsModule} from '@angular/platform-browser/animations';
import {MatSnackBar, MatSnackBarModule} from '@angular/material/snack-bar';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {ActivatedRoute} from '@angular/router';
import {KineticsComponent} from './kinetics.component';
import {KineticsStateService} from './kinetics-state.service';
import {IKineticsModelsConfigurations} from './interface';

describe('KineticsComponent', () => {
  let component: KineticsComponent;
  let stateService: KineticsStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [NoopAnimationsModule, MatSnackBarModule, MatDialogModule],
      providers: [{provide: ActivatedRoute, useValue: {snapshot: {params: {}}}}]
    });

    stateService = TestBed.inject(KineticsStateService);
    stateService.resetState();

    component = TestBed.runInInjectionContext(() => new KineticsComponent(
      TestBed.inject(MatSnackBar),
      stateService,
      TestBed.inject(MatDialog),
      TestBed.inject(ActivatedRoute)
    ));
  });

  function configurationWith(paramValues: { [key: string]: { value: number | null } }): IKineticsModelsConfigurations {
    return {
      1: {
        paramValues,
        iterations: 10000,
        step: 0.1,
        automatedParams: true,
        selectedLinearizations: [10],
        knownParams: {},
      }
    };
  }

  beforeEach(() => {
    stateService.state.set({...stateService.state(), selectedModels: [1]});
  });

  it('should mark the configuration as done when a parameter is zero', () => {
    component.onSelectedParams(configurationWith({kid: {value: 1.2}, C: {value: 0}}));

    expect(stateService.state().modelConfigurationDone).toBeTrue();
  });

  it('should mark the configuration as done when every parameter has a value', () => {
    component.onSelectedParams(configurationWith({kid: {value: 1.2}, C: {value: 0.5}}));

    expect(stateService.state().modelConfigurationDone).toBeTrue();
  });

  it('should not mark the configuration as done when a parameter is missing', () => {
    component.onSelectedParams(configurationWith({kid: {value: 1.2}, C: {value: null}}));

    expect(stateService.state().modelConfigurationDone).toBeFalse();
  });
});
