import {of, throwError} from 'rxjs';
import {KineticsDataSelectorComponent} from './kinetics-data-selector.component';
import {CreateKineticSampleResponse, IKineticsSample} from '../kinetics/interface';

const USER_ID = 4;
const MATERIALS = {
  adsorbates: [{id: 1, iupac_name: 'Cromo'}, {id: 2, iupac_name: 'Plomo'}],
  adsorbents: [{id: 1, name: 'Carbón'}],
};

function dto(id: number, points: number, overrides: Partial<CreateKineticSampleResponse> = {}): CreateKineticSampleResponse {
  return {
    kinetic_sample_id: id,
    user_id: USER_ID,
    time: Array.from({length: points}, (_, i) => i * 5),
    qt: Array.from({length: points}, (_, i) => i * 2),
    adsorbate_id: 1,
    adsorbent_id: 1,
    title: `muestra ${id}`,
    ...overrides,
  };
}

function build(options: { samples?: CreateKineticSampleResponse[] | 'none' | 'error'; user?: { id: number } | undefined } = {}) {
  const sampleService = jasmine.createSpyObj('KineticsSampleService', ['getSamples', 'deleteSample', 'createKineticSample']);
  const samples = options.samples ?? [dto(1, 6), dto(2, 3), dto(3, 8)];
  if (samples === 'none') {
    sampleService.getSamples.and.returnValue(throwError(() => ({status: 404})));
  } else if (samples === 'error') {
    sampleService.getSamples.and.returnValue(throwError(() => ({status: 500, message: 'boom'})));
  } else {
    sampleService.getSamples.and.returnValue(of({samples}));
  }
  const selectorService = jasmine.createSpyObj('SampleSelectorService', ['getMaterials', 'syncMaterials']);
  selectorService.getMaterials.and.returnValue(of(MATERIALS));
  const authService = {user: () => 'user' in options ? options.user : {id: USER_ID}};
  const translate = jasmine.createSpyObj('TranslateService', ['instant']);
  translate.instant.and.callFake((key: string) => key);
  const dialog = jasmine.createSpyObj('MatDialog', ['open']);
  const snackBar = jasmine.createSpyObj('MatSnackBar', ['openFromComponent']);

  const component = new KineticsDataSelectorComponent(
    sampleService, selectorService, authService as any, translate, dialog, snackBar
  );
  const loaded: IKineticsSample[] = [];
  const deleted: number[] = [];
  component.onSampleLoaded.subscribe((sample: IKineticsSample) => loaded.push(sample));
  component.onSampleDeleted.subscribe((id: number) => deleted.push(id));
  component.ngOnInit();
  return {component: component as any, sampleService, selectorService, dialog, snackBar, loaded, deleted};
}

describe('KineticsDataSelectorComponent', () => {

  it('should ask only for the samples of the logged user', () => {
    const {sampleService} = build();

    expect(sampleService.getSamples).toHaveBeenCalledOnceWith(USER_ID);
  });

  it('should not ask for samples when nobody is logged in', () => {
    const {component, sampleService} = build({user: undefined});

    expect(sampleService.getSamples).not.toHaveBeenCalled();
    expect(component.options).toEqual([]);
  });

  it('should list the samples newest first', () => {
    const {component} = build();

    expect(component.options.map((option: any) => option.sample.sample_id)).toEqual([3, 2, 1]);
  });

  it('should map the backend sample and the material names', () => {
    const {component} = build();
    const sample = component.options[2].sample;

    expect(sample.sample_id).toBe(1);
    expect(sample.adsorbate).toBe('Cromo');
    expect(sample.adsorbent).toBe('Carbón');
    expect(component.options[2].points).toBe(6);
  });

  it('should show an empty list, without an error dialog, when the backend answers 404', () => {
    const {component, dialog} = build({samples: 'none'});

    expect(component.options).toEqual([]);
    expect(component.loadingSamples).toBeFalse();
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('should open the error dialog when the request fails with another error', () => {
    const {component, dialog} = build({samples: 'error'});

    expect(dialog.open).toHaveBeenCalledTimes(1);
    expect(component.options).toEqual([]);
    expect(component.loadingSamples).toBeFalse();
  });

  it('should retry the materials after syncing them when the first read is a 404', () => {
    const sampleService = jasmine.createSpyObj('KineticsSampleService', ['getSamples']);
    sampleService.getSamples.and.returnValue(of({samples: [dto(1, 6)]}));
    const selectorService = jasmine.createSpyObj('SampleSelectorService', ['getMaterials', 'syncMaterials']);
    selectorService.getMaterials.and.returnValues(throwError(() => ({status: 404})), of(MATERIALS));
    selectorService.syncMaterials.and.returnValue(of({}));
    const component = new KineticsDataSelectorComponent(
      sampleService, selectorService, {user: () => ({id: USER_ID})} as any,
      {instant: (key: string) => key} as any, jasmine.createSpyObj('MatDialog', ['open']), {} as any
    );

    component.ngOnInit();

    expect(selectorService.syncMaterials).toHaveBeenCalledTimes(1);
    expect((component as any).options[0].sample.adsorbate).toBe('Cromo');
  });

  it('should warn about, and not allow choosing, a sample with fewer points than the fit needs', () => {
    const {component, loaded} = build();
    const short = component.options.find((option: any) => option.sample.sample_id === 2);

    component.selectSample(short);

    expect(short.tooShort).toBeTrue();
    expect(loaded).toEqual([]);
  });

  it('should emit a copy of the chosen sample without creating one in the backend', () => {
    const {component, loaded, sampleService} = build();
    const option = component.options[0];

    component.selectSample(option);

    expect(loaded.length).toBe(1);
    expect(loaded[0].sample_id).toBe(3);
    expect(loaded[0].time).toEqual(option.sample.time);
    expect(loaded[0].time).not.toBe(option.sample.time);
    expect(sampleService.createKineticSample).not.toHaveBeenCalled();
  });

  it('should clear the upload form when a listed sample is chosen', () => {
    const {component} = build();
    const fileUpload = jasmine.createSpyObj('KineticsFileUploadComponent', ['reset']);
    component.fileUpload = fileUpload;

    component.selectSample(component.options[0]);

    expect(fileUpload.reset).toHaveBeenCalledTimes(1);
  });

  it('should keep the upload form when the chosen sample is too short', () => {
    const {component} = build();
    const fileUpload = jasmine.createSpyObj('KineticsFileUploadComponent', ['reset']);
    component.fileUpload = fileUpload;

    component.selectSample(component.options.find((option: any) => option.tooShort));

    expect(fileUpload.reset).not.toHaveBeenCalled();
  });

  it('should filter the list by title', () => {
    const {component} = build();

    component.onFilterChange({target: {value: ' MUESTRA 3 '}} as any);

    expect(component.filteredOptions.map((option: any) => option.sample.sample_id)).toEqual([3]);
  });

  it('should mark as selected the sample that is in the stepper state', () => {
    const {component} = build();
    component.kineticsSample = {...component.options[1].sample};

    expect(component.isSelected(component.options[1])).toBeTrue();
    expect(component.isSelected(component.options[0])).toBeFalse();
  });

  describe('delete', () => {
    it('should remove the sample from the list when the backend deletes it', () => {
      const {component, sampleService, deleted} = build();
      sampleService.deleteSample.and.returnValue(of({}));

      component.deleteSample(2);

      expect(component.options.map((option: any) => option.sample.sample_id)).toEqual([3, 1]);
      expect(deleted).toEqual([]);
    });

    it('should tell the stepper when the deleted sample was the chosen one', () => {
      const {component, sampleService, deleted} = build();
      component.kineticsSample = {...component.options[0].sample};
      sampleService.deleteSample.and.returnValue(of({}));

      component.deleteSample(3);

      expect(deleted).toEqual([3]);
    });

    it('should show a snack bar and keep the list when the user is not the owner', () => {
      const {component, sampleService, snackBar, dialog} = build();
      sampleService.deleteSample.and.returnValue(throwError(() => ({status: 403})));

      component.deleteSample(2);

      expect(snackBar.openFromComponent).toHaveBeenCalledTimes(1);
      expect(dialog.open).not.toHaveBeenCalled();
      expect(component.options.length).toBe(3);
    });

    it('should open the error dialog and keep the list on any other error', () => {
      const {component, sampleService, dialog} = build();
      sampleService.deleteSample.and.returnValue(throwError(() => ({status: 500, message: 'boom'})));

      component.deleteSample(2);

      expect(dialog.open).toHaveBeenCalledTimes(1);
      expect(component.options.length).toBe(3);
    });
  });

  describe('upload', () => {
    const uploaded = (): IKineticsSample => ({
      time: [0, 5, 10, 20, 30], qt: [0, 3, 5, 6, 7], adsorbate_id: 1, adsorbent_id: 1,
      description: 'cromo', temperature: 298,
    });

    it('should not create the sample until the metadata is complete', () => {
      const {component, sampleService} = build();

      component.onUploadDataSample({...uploaded(), description: ''});

      expect(sampleService.createKineticSample).not.toHaveBeenCalled();
    });

    it('should emit the created sample and refresh the list', () => {
      const {component, sampleService, loaded} = build();
      sampleService.createKineticSample.and.returnValue(of({kinetic_sample_id: 9, title: 'nueva'}));
      sampleService.getSamples.calls.reset();

      component.onUploadDataSample(uploaded());

      expect(loaded[0].sample_id).toBe(9);
      expect(loaded[0].title).toBe('nueva');
      expect(sampleService.getSamples).toHaveBeenCalledTimes(1);
    });
  });
});
