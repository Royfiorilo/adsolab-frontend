import {of, throwError} from 'rxjs';
import {KineticsHistoricComponent} from './kinetics-historic.component';
import {IKineticsInvestigation, IKineticsVersion} from './interface';

const OWNER_ID = 4;

function investigation(id: number, title: string, userId = OWNER_ID): IKineticsInvestigation {
  return {
    kinetic_investigation_id: id,
    kinetic_sample_id: id * 10,
    sample: {
      kinetic_sample_id: id * 10, user_id: userId, time: [], qt: [],
      adsorbate_id: 1, adsorbent_id: 1, title, description: 'carbón activado',
    },
    user_id: userId,
    user: {id: userId, email: `user${userId}@fi.uba.ar`},
  };
}

function version(overrides: Partial<IKineticsVersion> = {}): IKineticsVersion {
  return {
    version_id: 1, kinetic_investigation_id: 1, iterations: null, steps: null,
    created_at: '2026-09-26T15:00:00',
    fitted_models: [],
    comparison: {heuristic: {best_model: 2, results: []}, ml: {best_model: 2} as any},
    ...overrides,
  };
}

function build(investigations = [investigation(1, 'Cromo'), investigation(2, 'Plomo', 7)]) {
  const historicService = jasmine.createSpyObj('KineticsHistoricService',
    ['getInvestigations', 'getVersions', 'deleteVersion', 'deleteInvestigation']);
  historicService.getInvestigations.and.returnValue(of({investigations, page: 1, per_page: 10, total: 2, pages: 1}));
  const modelService = jasmine.createSpyObj('KineticsModelSelectorService', ['getModels']);
  modelService.getModels.and.returnValue(of({models: [{_id: 2, name: 'Pseudo-Segundo Orden'}]}));
  const authService = {user: () => ({id: OWNER_ID})};
  const translate = jasmine.createSpyObj('TranslateService', ['instant']);
  const dialog = jasmine.createSpyObj('MatDialog', ['open']);
  const snackBar = jasmine.createSpyObj('MatSnackBar', ['openFromComponent']);
  const router = jasmine.createSpyObj('Router', ['navigate']);

  const component = new KineticsHistoricComponent(
    historicService, modelService, authService as any, router, translate, dialog, snackBar
  );
  component.ngOnInit();
  return {component, historicService, router, snackBar};
}

describe('KineticsHistoricComponent', () => {

  it('should load every investigation by default', () => {
    const {historicService} = build();

    expect(historicService.getInvestigations).toHaveBeenCalledWith(1, 10, undefined);
  });

  it('should ask the backend only for the logged user investigations in "mine"', () => {
    const {component, historicService} = build();

    component.onScopeChange('mine');

    expect(historicService.getInvestigations).toHaveBeenCalledWith(1, 10, OWNER_ID);
  });

  it('should filter the current page by title, email or exact id', () => {
    const {component} = build();
    const filterBy = (value: string) => {
      component.onFilterChange({target: {value}} as any);
      return (component as any).rows.map((row: IKineticsInvestigation) => row.kinetic_investigation_id);
    };

    expect(filterBy('plomo')).toEqual([2]);
    expect(filterBy('user4@')).toEqual([1]);
    expect(filterBy('1')).toEqual([1]);
    expect(filterBy('')).toEqual([1, 2]);
  });

  it('should only let the owner delete', () => {
    const {component} = build();

    expect(component.isOwner(investigation(1, 'Cromo'))).toBeTrue();
    expect(component.isOwner(investigation(2, 'Plomo', 7))).toBeFalse();
  });

  it('should fetch the versions once, newest first', () => {
    const {component, historicService} = build();
    historicService.getVersions.and.returnValue(of({versions: [version({version_id: 1}), version({version_id: 3})]}));
    const target = (component as any).investigations[0];

    component.toggleRow(target);
    component.toggleRow(target);
    component.toggleRow(target);

    expect(historicService.getVersions).toHaveBeenCalledTimes(1);
    expect(target.versions.map((v: IKineticsVersion) => v.version_id)).toEqual([3, 1]);
  });

  it('should drop a deleted version from its investigation', () => {
    const {component, historicService} = build();
    const target = (component as any).investigations[0];
    target.versions = [version({version_id: 1}), version({version_id: 2})];
    historicService.deleteVersion.and.returnValue(of({}));

    component.deleteVersion(1, 2);

    expect(target.versions.map((v: IKineticsVersion) => v.version_id)).toEqual([1]);
  });

  it('should keep the investigation and warn when deleting is forbidden', () => {
    const {component, historicService, snackBar} = build();
    historicService.deleteInvestigation.and.returnValue(throwError(() => ({status: 403})));

    component.deleteInvestigation(2);

    expect((component as any).rows.length).toBe(2);
    expect(snackBar.openFromComponent).toHaveBeenCalled();
  });

  it('should read created_at as UTC', () => {
    const {component} = build();

    expect(component.createdAt(version()).toISOString()).toBe('2026-09-26T15:00:00.000Z');
    expect(component.createdAt(version({created_at: '2026-09-26T15:00:00+00:00'})).toISOString())
      .toBe('2026-09-26T15:00:00.000Z');
  });

  it('should name the best model only when heuristic and ML agree', () => {
    const {component} = build();

    expect(component.bestModelOverall(version())).toBe('Pseudo-Segundo Orden');
    expect(component.bestModelOverall(version({
      comparison: {heuristic: {best_model: 2, results: []}, ml: {best_model: 1} as any},
    }))).toBeUndefined();
  });

  it('should show the parameters of the best adjustment method', () => {
    const {component} = build();
    const params = component.bestParameters({
      kinetic_fitted_model_id: 1, kinetic_model_id: 2, best_adjust: 'leastsq', seeds: [],
      adjustment_methods: [
        {name: 'cobyla', parameters: [{name: 'qe', value: 1, std_err: null}]} as any,
        {name: 'leastsq', parameters: [{name: 'qe', value: 12.02, std_err: 0.3}]} as any,
      ],
    });

    expect(params).toEqual([{name: 'qe', value: 12.02, std_err: 0.3}]);
  });

  it('should open a version passing its sample id', () => {
    const {component, router} = build();

    component.openVersion(investigation(1, 'Cromo'), 3);

    expect(router.navigate).toHaveBeenCalledWith(
      ['/kinetics/historic', 1, 'version', 3], {queryParams: {sample: 10}}
    );
  });
});
