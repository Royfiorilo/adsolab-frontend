export interface DataSample {
  ce: number[];
  qe: number[];
  investigation_id: number | undefined;
  label: string;
  description: string | undefined;
}

export interface CreateInvestigationResponse {
  investigation_id: number;
  sample_id: number
}
