export interface Investigation {
  investigation_id: number | undefined;
  sample: DataSample;
}

export interface DataSample {
  ce: number[];
  qe: number[];
  sample_id?: number | undefined;
  label: string;
  description: string | undefined;
}

export interface CreateInvestigationResponse {
  investigation_id: number;
  sample_id: number
}

export interface GetSampleResponse{
  samples: DataSample[];
}
