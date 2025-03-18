export interface Investigation {
  investigation_id: number | undefined;
  sample: DataSample;
}

export interface DataSample {
  ce: number[];
  qe: number[];
  sample_id?: number | undefined;
  title?: string | undefined;
  description: string | undefined;
  temperature: number | undefined;
  measure_unit: string | undefined;
  adsorbate_id: number | undefined;
  adsorbate?: string | undefined;
  adsorbent_id: number | undefined;
  adsorbent?: string | undefined;
}

export interface CreateInvestigationResponse {
  title: string;
  investigation_id: number;
  sample_id: number;
  error?: string;
}

export interface GetSampleResponse {
  samples: DataSample[];
}

export interface IAdsorbate {
  id: number;
  ion_name: string;
  iupac_name: string;
  formula: string;
}

export interface IAdsorbent {
  id: number;
  name: string;
}

export interface GetMaterialsResponse {
  adsorbates: IAdsorbate[];
  adsorbents: IAdsorbent[];
}

export enum InvalidFileReason {
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  INVALID_FILE_STRUCTURE = 'INVALID_FILE_STRUCTURE',
  INVALID_DATA = 'INVALID_DATA',
  READ_ERROR = 'READ_ERROR'
}
