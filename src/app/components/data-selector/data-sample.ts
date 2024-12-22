export interface Investigation {
  investigation_id: number | undefined;
  sample: DataSample;
}

export interface DataSample {
  ce: number[];
  qe: number[];
  sample_id?: number | undefined;
  title: string | undefined;
  description: string | undefined;
}

export interface CreateInvestigationResponse {
  investigation_id: number;
  sample_id: number
}

export interface GetSampleResponse {
  samples: DataSample[];
}

export enum InvalidFileReason {
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  INVALID_FILE_STRUCTURE = 'INVALID_FILE_STRUCTURE',
  INVALID_DATA = 'INVALID_DATA',
  READ_ERROR = 'READ_ERROR'
}
