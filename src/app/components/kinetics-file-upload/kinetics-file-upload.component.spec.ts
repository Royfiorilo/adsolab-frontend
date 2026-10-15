import {of} from 'rxjs';
import {KineticsFileUploadComponent} from './kinetics-file-upload.component';
import {NEW_MATERIAL} from '../material-dialog/interface';

function build(created?: object) {
  const sampleService = jasmine.createSpyObj('SampleSelectorService', ['getMaterials']);
  sampleService.getMaterials.and.returnValue(of({
    adsorbates: [{id: 1, ion_name: 'cromato', iupac_name: 'cromato (VI)', formula: 'CrO4'}],
    adsorbents: [{id: 1, name: 'Carbón activado'}],
  }));
  const translate = jasmine.createSpyObj('TranslateService', ['get']);
  const materialDialog = jasmine.createSpyObj('MaterialDialogService', ['create']);
  materialDialog.create.and.returnValue(of(created));
  const component = new KineticsFileUploadComponent(translate, sampleService, materialDialog) as any;
  component.materialDialogSpy = materialDialog;
  return component;
}

function selectChange(value: number) {
  return {value, source: {value}};
}

function csv(rows: number): string {
  return Array.from({length: rows}, (_, i) => `${i * 5},${i * 2}`).join('\n');
}

describe('KineticsFileUploadComponent', () => {

  it('should start a new sample, not reuse the created one, when another file is selected', () => {
    const component = build();
    component.validateCSVContent(csv(6));
    component.dataSample.sample_id = 12;
    component.dataSample.description = 'cromo';
    const created = component.dataSample;

    component.handleFile(new File(['x'], 'other.txt', {type: 'text/plain'}));

    expect(component.dataSample).not.toBe(created);
    expect(component.dataSample.sample_id).toBeUndefined();
    expect(component.dataSample.description).toBeUndefined();
    expect(component.dataSample.time).toEqual([]);
    expect(created.sample_id).toBe(12);
    expect(created.time.length).toBe(6);
  });

  it('should read the second file into the new sample without touching the first one', () => {
    const component = build();
    component.validateCSVContent(csv(6));
    component.dataSample.sample_id = 12;
    const first = component.dataSample;

    component.reset();
    component.validateCSVContent(csv(8));

    expect(component.dataSample.time.length).toBe(8);
    expect(component.dataSample.sample_id).toBeUndefined();
    expect(first.time.length).toBe(6);
    expect(first.sample_id).toBe(12);
  });

  it('should clear the file state and the file input on reset so the same file can be picked again', () => {
    const component = build();
    const input = {value: 'C:\\fakepath\\cinetica.csv'};
    component.fileInput = {nativeElement: input};
    component.validateCSVContent(csv(6));

    component.reset();

    expect(component.uploadedFile).toEqual({});
    expect(input.value).toBe('');
  });

  it('should report the sample as created only once it has an id', () => {
    const component = build();

    expect(component.isSampleCreated).toBeFalse();

    component.dataSample.sample_id = 3;

    expect(component.isSampleCreated).toBeTrue();
  });

  it('should reject a file with a type that is not allowed and keep the form empty', () => {
    const component = build();

    component.handleFile(new File(['x'], 'foto.png', {type: 'image/png'}));

    expect(component.uploadedFile.valid).toBeFalse();
    expect(component.dataSample.time).toEqual([]);
  });

  describe('"Agregar nuevo..."', () => {
    it('should open the dialog for the right kind and keep the previous choice while it is open', () => {
      const component = build(undefined);
      component.onUnitChange(selectChange(1), 'adsorbent');
      const change = selectChange(NEW_MATERIAL);

      component.onUnitChange(change, 'adsorbent');

      expect(component.materialDialogSpy.create).toHaveBeenCalledOnceWith('adsorbent');
      expect(change.source.value).toBe(1);
      expect(component.dataSample.adsorbent_id).toBe(1);
    });

    it('should leave everything as it was when the dialog is cancelled', () => {
      const component = build(undefined);
      const emitted: unknown[] = [];
      component.onDataSampleUploaded.subscribe((sample: unknown) => emitted.push(sample));

      component.onUnitChange(selectChange(NEW_MATERIAL), 'adsorbate');

      expect(component.dataSample.adsorbate_id).toBeUndefined();
      expect(component.adsorbates.length).toBe(1);
      expect(emitted).toEqual([]);
    });

    it('should add the created adsorbate to the list and select it', () => {
      const component = build({id: 11, ion_name: 'mercurio', iupac_name: 'mercurio (II)', formula: 'Hg'});

      component.onUnitChange(selectChange(NEW_MATERIAL), 'adsorbate');

      expect(component.adsorbates.map((a: any) => a.id)).toEqual([1, 11]);
      expect(component.dataSample.adsorbate_id).toBe(11);
      expect(component.dataSample.adsorbate).toBe('mercurio (II)');
    });

    it('should select an existing material without duplicating it in the list', () => {
      const component = build({id: 1, name: 'Carbón activado'});

      component.onUnitChange(selectChange(NEW_MATERIAL), 'adsorbent');

      expect(component.adsorbents.length).toBe(1);
      expect(component.dataSample.adsorbent_id).toBe(1);
    });

    it('should keep the file and the rest of the form', () => {
      const component = build({id: 7, name: 'Zeolita'});
      component.validateCSVContent(csv(6));
      component.dataSample.description = 'cromo';

      component.onUnitChange(selectChange(NEW_MATERIAL), 'adsorbent');

      expect(component.dataSample.time.length).toBe(6);
      expect(component.dataSample.description).toBe('cromo');
      expect(component.uploadedFile.valid).toBeTrue();
    });
  });
});
