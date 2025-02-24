export interface InvestigationResponse {
  investigations: Investigation[];
}

export interface Investigation {
  investigation_id: number;
  sample: Sample;
  sample_id: number;
}

export interface Sample {
  adsorbate_id: number;
  adsorbent_id: number;
  ce: number[];
  description: string;
  measure_unit: string;
  qe: number[];
  sample_id: number;
  temperature: number;
  title: string;
}
