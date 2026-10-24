import {of} from 'rxjs';
import {KineticsFileUploadComponent} from './kinetics-file-upload.component';
import {NEW_MATERIAL} from '../material-dialog/interface';
import {InvalidFileReason} from '../data-selector/data-sample';

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

  describe('lab spreadsheets', () => {
    function sheet(name: string, series: number[][][], error?: InvalidFileReason) {
      return {name, error, series: series.map(points => ({label: '', time: points.map(p => p[0]), qt: points.map(p => p[1])}))};
    }

    it('should accept a CSV with a header row and decimal commas', () => {
      const component = build();

      component.validateCSVContent('t [min],q [mg/g]\n0,0\n"5,5","1,25"\n10,2.5');

      expect(component.uploadedFile.valid).toBeTrue();
      expect(component.dataSample.time).toEqual([0, 5.5, 10]);
      expect(component.dataSample.qt).toEqual([0, 1.25, 2.5]);
    });

    it('should still reject a CSV with three columns', () => {
      const component = build();

      component.validateCSVContent('0,0,1\n5,1,2\n10,2,3');

      expect(component.uploadedFile.valid).toBeFalse();
      expect(component.uploadedFile.reason).toBe(InvalidFileReason.INVALID_FILE_STRUCTURE);
    });

    it('should open the first usable sheet and its first series', () => {
      const component = build();

      component.loadSheets([
        sheet('Notas', [], InvalidFileReason.INVALID_DATA),
        sheet('Datos', [[[0, 0], [5, 1]], [[0, 0], [10, 2], [20, 3]]]),
      ]);

      expect(component.selectedSheet).toBe(1);
      expect(component.selectedSeries).toBe(0);
      expect(component.dataSample.time).toEqual([0, 5]);
      expect(component.uploadedFile.valid).toBeTrue();
    });

    it('should load only the chosen series', () => {
      const component = build();
      component.loadSheets([sheet('Datos', [[[0, 0], [5, 1]], [[0, 0], [10, 2], [20, 3]]])]);

      component.selectSeries(1);

      expect(component.dataSample.time).toEqual([0, 10, 20]);
      expect(component.dataSample.qt).toEqual([0, 2, 3]);
    });

    it('should show the sheet error when an invalid sheet is chosen, and recover with a valid one', () => {
      const component = build();
      component.loadSheets([
        sheet('Datos', [[[0, 0], [5, 1]]]),
        sheet('Notas', [], InvalidFileReason.INVALID_DATA),
      ]);

      component.selectSheet(1);

      expect(component.uploadedFile.valid).toBeFalse();
      expect(component.uploadedFile.reason).toBe(InvalidFileReason.INVALID_DATA);
      expect(component.dataSample.time).toEqual([]);

      component.selectSheet(0);

      expect(component.uploadedFile.valid).toBeTrue();
      expect(component.uploadedFile.reason).toBeUndefined();
    });

    it('should reject a series with negative values', () => {
      const component = build();

      component.loadSheets([sheet('Datos', [[[0, 0], [5, -1]]])]);

      expect(component.uploadedFile.valid).toBeFalse();
      expect(component.uploadedFile.reason).toBe(InvalidFileReason.INVALID_DATA);
    });

    it('should offer the selectors only when there is something to choose', () => {
      const component = build();

      component.loadSheets([sheet('Datos', [[[0, 0], [5, 1]]])]);

      expect(component.showSheetSelector).toBeFalse();
      expect(component.showSeriesSelector).toBeFalse();

      component.loadSheets([sheet('A', [[[0, 0], [5, 1]], [[0, 0], [5, 2]]]), sheet('B', [[[0, 0], [5, 1]]])]);

      expect(component.showSheetSelector).toBeTrue();
      expect(component.showSeriesSelector).toBeTrue();
    });

    it('should forget the sheets on reset', () => {
      const component = build();
      component.loadSheets([sheet('A', [[[0, 0], [5, 1]]]), sheet('B', [[[0, 0], [5, 1]]])]);

      component.reset();

      expect(component.sheets).toEqual([]);
      expect(component.showSheetSelector).toBeFalse();
    });
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
