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

  describe('changing the sample', () => {
    const sample = (id: number) => ({
      time: [0, 5, 10, 20, 30], qt: [0, 3, 5, 6, 7], sample_id: id, adsorbate_id: 1, adsorbent_id: 1,
    });

    beforeEach(() => {
      // The real snack bar renders SnackBarComponent, which needs the translate pipe.
      spyOn(TestBed.inject(MatSnackBar), 'openFromComponent');
      stateService.state.set({
        ...stateService.state(),
        kineticsSample: sample(1),
        selectedModels: [1, 2],
        modelConfiguration: configurationWith({kid: {value: 1.2}, C: {value: 0.5}}),
        modelConfigurationDone: true,
      });
    });

    it('should discard the models and their configuration when another sample is chosen', () => {
      component.sampleLoaded(sample(2));

      const state = stateService.state();
      expect(state.kineticsSample?.sample_id).toBe(2);
      expect(state.selectedModels).toEqual([]);
      expect(state.modelConfiguration).toEqual({});
      expect(state.modelConfigurationDone).toBeFalse();
    });

    it('should keep the models and their configuration when the same sample is loaded again', () => {
      component.sampleLoaded(sample(1));

      const state = stateService.state();
      expect(state.selectedModels).toEqual([1, 2]);
      expect(state.modelConfigurationDone).toBeTrue();
    });

    it('should clear the whole state when the chosen sample is deleted', () => {
      component.sampleDeleted();

      const state = stateService.state();
      expect(state.kineticsSample).toBeUndefined();
      expect(state.selectedModels).toEqual([]);
      expect(state.stepId).toBe(0);
    });
  });
});
