import {signal} from '@angular/core';
import {of, throwError} from 'rxjs';
import {KineticsModelConfigurationComponent} from './kinetics-model-configuration.component';
import {IKineticsModel, IKineticsModelsConfigurations, IKineticsState} from '../kinetics/interface';
import {IKineticsLinearizationResponse} from './interface';

const PFO: IKineticsModel = {
  _id: 3,
  name: 'Pseudo-Primer Orden (Lagergren)',
  latex_formula: '',
  parameters: {qe: '', k1: ''},
  linearizations: [{
    linearization_id: 30,
    name: 'Linealización PFO (Lagergren)',
    parameters: {x: 'time', y: 'ln(qe - qt)', m: '-k1', b: 'ln(qe)'}
  }]
};

const PSO: IKineticsModel = {
  _id: 2,
  name: 'Pseudo-Segundo Orden',
  latex_formula: '',
  parameters: {qe: '', k2: ''},
  linearizations: [{
    linearization_id: 20,
    name: 'Linealización Pseudo-Segundo Orden',
    parameters: {x: 'time', y: 'time/qt', m: '1/qe', b: '1/(k2 * qe**2)'}
  }]
};

const INTRAPARTICLE: IKineticsModel = {
  _id: 1,
  name: 'Difusión Intraparticular',
  latex_formula: '',
  parameters: {kid: '', C: ''},
  linearizations: [{
    linearization_id: 10,
    name: 'Linealización Intraparticular',
    parameters: {x: 'time**0.5', y: 'qt', m: 'kid', b: 'C'}
  }]
};

function buildConfiguration(model: IKineticsModel): IKineticsModelsConfigurations {
  return {
    [model._id]: {
      paramValues: Object.keys(model.parameters).reduce((acc, key) => ({...acc, [key]: {value: null}}), {}),
      iterations: 10000,
      step: 0.1,
      automatedParams: true,
      selectedLinearizations: (model.linearizations ?? []).map(l => l.linearization_id),
      knownParams: {},
    }
  };
}

describe('KineticsModelConfigurationComponent', () => {
  let component: KineticsModelConfigurationComponent;
  let linearizationService: jasmine.SpyObj<any>;
  let dialog: jasmine.SpyObj<any>;

  function build(models: IKineticsModel[], configuration: IKineticsModelsConfigurations) {
    const state = signal<IKineticsState>({
      shouldRender: true,
      kineticsSample: {time: [], qt: [], sample_id: 10, adsorbate_id: 1, adsorbent_id: 1},
      stepId: 2,
      models,
      selectedModels: models.map(m => m._id),
      modelConfiguration: configuration,
      modelConfigurationDone: false,
    });

    linearizationService = jasmine.createSpyObj('KineticsModelConfigurationService', ['runLinearization']);
    dialog = jasmine.createSpyObj('MatDialog', ['open']);

    const cancellation = jasmine.createSpyObj('RequestCancellationService', ['getCancellationSubject', 'finishRequest', 'cancelRequest']);
    cancellation.getCancellationSubject.and.returnValue(of());

    const translate = jasmine.createSpyObj('TranslateService', ['instant']);
    translate.instant.and.callFake((key: string) => key);

    const changeDetector = jasmine.createSpyObj('ChangeDetectorRef', ['markForCheck']);

    component = new KineticsModelConfigurationComponent(
      {state} as any, linearizationService, cancellation, dialog, translate, changeDetector
    );
    component.modelConfiguration = configuration;
    return component;
  }

  describe('requiredKnownParams', () => {
    it('should require qe for the PFO linearization', () => {
      build([PFO], buildConfiguration(PFO));
      expect(component.requiredKnownParams(PFO._id)).toEqual(['qe']);
    });

    it('should not require anything for PSO', () => {
      build([PSO], buildConfiguration(PSO));
      expect(component.requiredKnownParams(PSO._id)).toEqual([]);
    });

    it('should not require anything for intraparticle diffusion', () => {
      build([INTRAPARTICLE], buildConfiguration(INTRAPARTICLE));
      expect(component.requiredKnownParams(INTRAPARTICLE._id)).toEqual([]);
    });
  });

  describe('runLinearization', () => {
    it('should omit known_params when the field was left empty', () => {
      const configuration = buildConfiguration(PFO);
      configuration[PFO._id].knownParams = {qe: null};
      build([PFO], configuration);
      linearizationService.runLinearization.and.returnValue(of({kinetic_sample_id: 10, results: []}));

      component.runLinearization(PFO._id);

      const request = linearizationService.runLinearization.calls.mostRecent().args[0];
      expect(request.kinetic_sample_id).toBe(10);
      expect(request.models[0].linearizations).toEqual([30]);
      expect(request.models[0].known_params).toBeUndefined();
    });

    it('should send known_params when a value was entered', () => {
      const configuration = buildConfiguration(PFO);
      configuration[PFO._id].knownParams = {qe: 7.5};
      build([PFO], configuration);
      linearizationService.runLinearization.and.returnValue(of({kinetic_sample_id: 10, results: []}));

      component.runLinearization(PFO._id);

      const request = linearizationService.runLinearization.calls.mostRecent().args[0];
      expect(request.models[0].known_params).toEqual({qe: 7.5});
    });

    it('should fall back to manual params and open the error dialog when the request fails', () => {
      const configuration = buildConfiguration(PFO);
      build([PFO], configuration);
      linearizationService.runLinearization.and.returnValue(throwError(() => new Error('boom')));

      component.runLinearization(PFO._id);

      expect(configuration[PFO._id].automatedParams).toBeFalse();
      expect(dialog.open).toHaveBeenCalled();
    });
  });

  describe('applyLinearizationResponse', () => {
    const response: IKineticsLinearizationResponse = {
      kinetic_sample_id: 10,
      results: [{
        model: 1,
        best_result: 10,
        linearizations: [
          {
            id: 10,
            name: 'Linealización Intraparticular',
            status: 'OK',
            slope: 1.2,
            intercept: 0.5,
            transformed: {x: [0, 2.2361, 3.1623], y: [0.5, 3.1833, 4.2947]},
            parameters: [
              {name: 'kid', value: 1.2, std_err: 0.01},
              {name: 'C', value: 0.5, std_err: 0.02},
            ],
            statistics: {r_squared: 1.0},
            assumed_params: {},
            dropped_points: 0,
          },
          {
            id: 11,
            name: 'Linealización rota',
            status: 'ERROR',
            reason: 'Not enough valid points to linearize',
          },
        ],
      }],
    };

    it('should build a graph per linearization and flag the best one', () => {
      build([INTRAPARTICLE], buildConfiguration(INTRAPARTICLE));

      component.applyLinearizationResponse(1, response);

      const graphs = (component as any).linearizationGraphs[1];
      expect(graphs.length).toBe(2);
      expect(graphs[0].isBestResult).toBeTrue();
      expect(graphs[0].graph.data.length).toBe(2);
      expect(graphs[0].graph.layout.xaxis.title).toBe('time**0.5');
      expect(graphs[0].graph.layout.yaxis.title).toBe('qt');
    });

    it('should autofill the seeds from the best linearization', () => {
      const configuration = buildConfiguration(INTRAPARTICLE);
      build([INTRAPARTICLE], configuration);

      component.applyLinearizationResponse(1, response);

      expect(configuration[1].paramValues['kid'].value).toBe(1.2);
      expect(configuration[1].paramValues['C'].value).toBe(0.5);
    });

    it('should not flag a failed linearization as best nor build a graph for it', () => {
      build([INTRAPARTICLE], buildConfiguration(INTRAPARTICLE));

      component.applyLinearizationResponse(1, response);

      const failed = (component as any).linearizationGraphs[1][1];
      expect(failed.status).toBe('ERROR');
      expect(failed.isBestResult).toBeFalse();
      expect(failed.graph).toBeUndefined();
      expect(failed.reason).toBe('Not enough valid points to linearize');
    });

    it('should not autofill when no linearization succeeded', () => {
      const configuration = buildConfiguration(INTRAPARTICLE);
      build([INTRAPARTICLE], configuration);

      component.applyLinearizationResponse(1, {
        kinetic_sample_id: 10,
        results: [{
          model: 1,
          best_result: null,
          linearizations: [{id: 10, name: 'rota', status: 'ERROR', reason: 'sin puntos'}],
        }],
      });

      expect(configuration[1].paramValues['kid'].value).toBeNull();
    });

    it('should ignore a failed linearization even when it is pointed at as best', () => {
      const configuration = buildConfiguration(INTRAPARTICLE);
      build([INTRAPARTICLE], configuration);

      component.applyLinearizationResponse(1, {
        kinetic_sample_id: 10,
        results: [{
          model: 1,
          best_result: 10,
          linearizations: [{
            id: 10,
            name: 'rota',
            status: 'ERROR',
            reason: 'sin puntos',
            parameters: [{name: 'kid', value: 99, std_err: 0}],
          }],
        }],
      });

      expect(configuration[1].paramValues['kid'].value).toBeNull();
      expect((component as any).linearizationGraphs[1][0].isBestResult).toBeFalse();
    });

    it('should persist the linearization result in the configuration', () => {
      const configuration = buildConfiguration(INTRAPARTICLE);
      build([INTRAPARTICLE], configuration);

      component.applyLinearizationResponse(1, response);

      expect(configuration[1].linearization?.bestResult).toBe(10);
      expect(configuration[1].linearization?.linearizations.length).toBe(2);
    });

    it('should keep the standard error of the autofilled seeds', () => {
      const configuration = buildConfiguration(INTRAPARTICLE);
      build([INTRAPARTICLE], configuration);

      component.applyLinearizationResponse(1, response);

      expect(configuration[1].paramValues['kid'].stderr).toBe(0.01);
      expect(configuration[1].paramValues['C'].stderr).toBe(0.02);
    });

    it('should rebuild the graphs from the persisted result when the step is re-entered', () => {
      const configuration = buildConfiguration(INTRAPARTICLE);
      build([INTRAPARTICLE], configuration);
      component.applyLinearizationResponse(1, response);

      const reopened = build([INTRAPARTICLE], configuration);
      expect((reopened as any).linearizationGraphs[1]).toBeUndefined();

      reopened.ngOnChanges({});

      const graphs = (reopened as any).linearizationGraphs[1];
      expect(graphs.length).toBe(2);
      expect(graphs[0].isBestResult).toBeTrue();
    });

    it('should drop the persisted result when the linearization is run again', () => {
      const configuration = buildConfiguration(INTRAPARTICLE);
      build([INTRAPARTICLE], configuration);
      component.applyLinearizationResponse(1, response);
      linearizationService.runLinearization.and.returnValue(of({kinetic_sample_id: 10, results: []}));

      component.runLinearization(INTRAPARTICLE._id);

      expect(configuration[1].linearization).toBeUndefined();
    });

    it('should expose assumed params and dropped points', () => {
      build([PFO], buildConfiguration(PFO));

      component.applyLinearizationResponse(3, {
        kinetic_sample_id: 10,
        results: [{
          model: 3,
          best_result: 30,
          linearizations: [{
            id: 30,
            name: 'Linealización PFO (Lagergren)',
            status: 'OK',
            slope: -0.15,
            intercept: 2.01,
            transformed: {x: [5, 10], y: [1.25, 0.5]},
            parameters: [{name: 'k1', value: 0.15, std_err: 0.001}],
            statistics: {r_squared: 0.999},
            assumed_params: {qe: 7.4},
            dropped_points: 1,
          }],
        }],
      });

      const graph = (component as any).linearizationGraphs[3][0];
      expect(graph.assumedParams).toEqual([{name: 'qe', value: 7.4}]);
      expect(graph.droppedPoints).toBe(1);
    });
  });
});
