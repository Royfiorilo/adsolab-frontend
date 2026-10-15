import {of, throwError} from 'rxjs';
import {MaterialDialogComponent, materialTextValidator} from './material-dialog.component';
import {FormControl} from '@angular/forms';
import {MaterialKind, normalizeMaterialText, withMaterial} from './interface';

function build(kind: MaterialKind) {
  const dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
  const sampleService = jasmine.createSpyObj('SampleSelectorService', ['createAdsorbate', 'createAdsorbent']);
  const dialog = jasmine.createSpyObj('MatDialog', ['open']);
  const translate = {instant: (key: string) => key};
  const component = new MaterialDialogComponent({kind}, dialogRef, sampleService, dialog, translate as any) as any;
  return {component, dialogRef, sampleService, dialog};
}

function fill(component: any, values: { [field: string]: string }) {
  Object.entries(values).forEach(([field, value]) => component.form.get(field).setValue(value));
}

describe('MaterialDialogComponent', () => {

  it('should ask for ion name, IUPAC name and formula for an adsorbate', () => {
    expect(build('adsorbate').component.fields).toEqual(['ion_name', 'iupac_name', 'formula']);
  });

  it('should ask only for the name of an adsorbent', () => {
    expect(build('adsorbent').component.fields).toEqual(['name']);
  });

  it('should not submit with an empty or blank field', () => {
    const {component, sampleService} = build('adsorbent');
    fill(component, {name: '   '});

    component.submit();

    expect(sampleService.createAdsorbent).not.toHaveBeenCalled();
    expect(component.form.get('name').hasError('required')).toBeTrue();
  });

  it('should not submit a formula longer than 10 characters', () => {
    const {component, sampleService} = build('adsorbate');
    fill(component, {ion_name: 'x', iupac_name: 'x', formula: 'ABCDEFGHIJK'});

    component.submit();

    expect(sampleService.createAdsorbate).not.toHaveBeenCalled();
    expect(component.form.get('formula').hasError('maxlength')).toBeTrue();
  });

  it('should send the normalized text and close with the created material', () => {
    const {component, sampleService, dialogRef} = build('adsorbate');
    const created = {id: 11, ion_name: 'mercurio', iupac_name: 'mercurio (II)', formula: 'Hg'};
    sampleService.createAdsorbate.and.returnValue(of(created));
    fill(component, {ion_name: '  mercurio ', iupac_name: 'mercurio   (II)', formula: 'Hg'});

    component.submit();

    expect(sampleService.createAdsorbate).toHaveBeenCalledOnceWith({ion_name: 'mercurio', iupac_name: 'mercurio (II)', formula: 'Hg'});
    expect(dialogRef.close).toHaveBeenCalledOnceWith({material: created, existed: false});
  });

  it('should close with the existing material when the backend answers 409', () => {
    const {component, sampleService, dialogRef, dialog} = build('adsorbent');
    const existing = {id: 2, name: 'Carbón activado'};
    sampleService.createAdsorbent.and.returnValue(throwError(() => ({status: 409, error: {existing}})));
    fill(component, {name: 'carbón ACTIVADO'});

    component.submit();

    expect(dialogRef.close).toHaveBeenCalledOnceWith({material: existing, existed: true});
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('should show the error dialog and stay open on any other error', () => {
    const {component, sampleService, dialogRef, dialog} = build('adsorbent');
    sampleService.createAdsorbent.and.returnValue(throwError(() => ({status: 500, message: 'boom'})));
    fill(component, {name: 'Zeolita'});

    component.submit();

    expect(dialog.open).toHaveBeenCalledTimes(1);
    expect(dialogRef.close).not.toHaveBeenCalled();
    expect(component.saving).toBeFalse();
    expect(component.form.get('name').value).toBe('Zeolita');
  });

  it('should close without a result when cancelled', () => {
    const {component, dialogRef} = build('adsorbent');

    component.cancel();

    expect(dialogRef.close).toHaveBeenCalledOnceWith();
  });

  it('should count the length after trimming', () => {
    const {component} = build('adsorbent');
    fill(component, {name: '  Zeolita   natural  '});

    expect(component.length('name')).toBe('Zeolita natural'.length);
  });
});

describe('material helpers', () => {
  it('should accept the limit and reject one more character, ignoring outer spaces', () => {
    const validator = materialTextValidator(10);

    expect(validator(new FormControl('  ' + 'x'.repeat(10) + '  '))).toBeNull();
    expect(validator(new FormControl('x'.repeat(11)))?.['maxlength']).toBeTruthy();
  });

  it('should normalize like the backend', () => {
    expect(normalizeMaterialText('  Carbón \t  activado ')).toBe('Carbón activado');
  });

  it('should not add a material that is already in the list', () => {
    const list = [{id: 1}, {id: 2}];

    expect(withMaterial(list, {id: 2})).toBe(list);
    expect(withMaterial(list, {id: 3}).map(item => item.id)).toEqual([1, 2, 3]);
  });
});
