import {of} from 'rxjs';
import {KineticsFileUploadComponent} from './kinetics-file-upload.component';

function build() {
  const sampleService = jasmine.createSpyObj('SampleSelectorService', ['getMaterials', 'syncMaterials']);
  sampleService.getMaterials.and.returnValue(of({adsorbates: [], adsorbents: []}));
  const translate = jasmine.createSpyObj('TranslateService', ['get']);
  const component = new KineticsFileUploadComponent(translate, sampleService) as any;
  return component;
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
});
