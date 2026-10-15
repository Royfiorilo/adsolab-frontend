import {IAdsorbate, IAdsorbent} from '../data-selector/data-sample';

export type MaterialKind = 'adsorbate' | 'adsorbent';
export type MaterialField = 'ion_name' | 'iupac_name' | 'formula' | 'name';

// Option value of "Agregar nuevo..." in the material selects; real ids are positive.
export const NEW_MATERIAL = -1;

// Column sizes of the backend tables.
export const MATERIAL_FIELD_LIMITS: { [field in MaterialField]: number } = {
  ion_name: 100,
  iupac_name: 100,
  formula: 10,
  name: 255,
};

export interface IMaterialDialogData {
  kind: MaterialKind;
}

export interface IMaterialDialogResult {
  material: IAdsorbate | IAdsorbent;
  existed: boolean;
}

export interface IAdsorbateCreation {
  ion_name: string;
  iupac_name: string;
  formula: string;
}

export interface IAdsorbentCreation {
  name: string;
}

// Same normalization as the backend: trimmed, inner spaces collapsed.
export function normalizeMaterialText(value: string): string {
  return String(value).trim().replace(/\s+/g, ' ');
}

// Adds the material to the list unless it is already there (a duplicate returns the existing one).
export function withMaterial<T extends { id: number }>(list: T[], material: T): T[] {
  return list.some(item => item.id === material.id) ? list : [...list, material];
}
