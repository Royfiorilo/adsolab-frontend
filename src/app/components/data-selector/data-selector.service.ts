import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {environment} from "../../../environments/environment";
import {CreateInvestigationResponse, DataSample} from "./data-sample";
import {EMPTY, Observable} from "rxjs";

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
    sample.measure_unit = 'test'

    if (this.validateSampleData(sample)) {
      console.log("Invalid data sample");
    }

    if (sample.sample_id === undefined) {
      return this.httpClient.post<CreateInvestigationResponse>(`${this.backendBaseUrl}/sample`, sample, {withCredentials: true})
    } else {
      return EMPTY;
    }
  }

}
