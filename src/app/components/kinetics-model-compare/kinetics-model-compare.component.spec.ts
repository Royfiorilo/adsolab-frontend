import {signal} from '@angular/core';
import {KineticsModelCompareComponent} from './kinetics-model-compare.component';
import {IKineticsModelsConfigurations, IKineticsState} from '../kinetics/interface';
import {IKineticsPersistedLinearization} from '../kinetics/interface';

const MODEL_ID = 2;

function buildConfiguration(linearization?: IKineticsPersistedLinearization): IKineticsModelsConfigurations {
  return {
    [MODEL_ID]: {
      paramValues: {qe: {value: 12.02}, k2: {value: 0.0014}},
      iterations: 10000,
      step: 0.1,
      automatedParams: true,
      selectedLinearizations: [20],
      knownParams: {},
      linearization,
    }
  };
}

function build(configuration: IKineticsModelsConfigurations): KineticsModelCompareComponent {
  const state = signal<IKineticsState>({
    shouldRender: true,
    kineticsSample: {time: [], qt: [], sample_id: 1, adsorbate_id: 1, adsorbent_id: 1},
    stepId: 3,
    models: [{_id: MODEL_ID, name: 'Pseudo-Segundo Orden', latex_formula: '', parameters: {}}],
    selectedModels: [MODEL_ID],
    modelConfiguration: configuration,
    modelConfigurationDone: true,
  });

  const compareService = jasmine.createSpyObj('KineticsModelCompareService', ['runModels']);
  const translate = jasmine.createSpyObj('TranslateService', ['instant']);
  translate.instant.and.callFake((key: string) => key);

  const component = new KineticsModelCompareComponent({state} as any, compareService, translate);
  (component as any).results = [{
    modelId: MODEL_ID,
    modelName: 'Pseudo-Segundo Orden',
    params: {},
    curve: {t: [], qt: []},
    statistics: {r2: 0.9971, rmse: 0.12},
  }];
  return component;
}

describe('KineticsModelCompareComponent', () => {

  it('should expose the linear R2 of the best linearization', () => {
    const component = build(buildConfiguration({
      bestResult: 20,
      linearizations: [
        {id: 20, name: 'PSO', status: 'OK', statistics: {r_squared: 0.9988}},
        {id: 21, name: 'otra', status: 'OK', statistics: {r_squared: 0.81}},
      ],
    }));

    expect(component.getLinearR2(MODEL_ID)).toBe(0.9988);
    expect(component.hasLinearR2()).toBeTrue();
  });

  it('should not expose a linear R2 when the linearization was never run', () => {
    const component = build(buildConfiguration());

    expect(component.getLinearR2(MODEL_ID)).toBeUndefined();
    expect(component.hasLinearR2()).toBeFalse();
  });

  it('should not expose a linear R2 when the best linearization failed', () => {
    const component = build(buildConfiguration({
      bestResult: 20,
      linearizations: [{
        id: 20,
        name: 'PSO',
        status: 'ERROR',
        reason: 'sin puntos',
        statistics: {r_squared: 0.42},
      }],
    }));

    expect(component.getLinearR2(MODEL_ID)).toBeUndefined();
    expect(component.hasLinearR2()).toBeFalse();
  });

  it('should not expose a linear R2 for a model that was not linearized', () => {
    const component = build(buildConfiguration({
      bestResult: 20,
      linearizations: [{id: 20, name: 'PSO', status: 'OK', statistics: {r_squared: 0.9988}}],
    }));

    expect(component.getLinearR2(99)).toBeUndefined();
  });
});
