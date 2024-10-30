import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {environment} from "../../../environments/environment";
import {Observable} from "rxjs";
import {CreateInvestigationResponse, DataSample} from "./data-sample";

@Injectable({
  providedIn: 'root'
})
export class DataSelectorService {

  backendBaseUrl: string;

  constructor(private httpClient: HttpClient) {
    this.backendBaseUrl = environment.backendBaseUrl;
  }

  validateSampleData(dataSample: DataSample): boolean {
    return dataSample.ce.length !== dataSample.qe.length;
  }

  createInvestigation(sample: DataSample): Observable<CreateInvestigationResponse> {
    if (this.validateSampleData(sample)) {
      console.log("Invalid data sample");
    }

    if (sample.sample_id) {
      return this.httpClient.post<CreateInvestigationResponse>(`${this.backendBaseUrl}/investigation/sample`, {
        sample_id: sample.sample_id
      })
    } else {
      return this.httpClient.post<CreateInvestigationResponse>(`${this.backendBaseUrl}/investigation`, {
        ce: sample.ce,
        qe: sample.qe,
      })
    }
  }
}
