import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {environment} from "../../../environments/environment";
import {Observable} from "rxjs";
import {DataSample} from "./data-sample";

@Injectable({
  providedIn: 'root'
})
export class DataSelectorService {

  backendBaseUrl: string;

  constructor(private httpClient: HttpClient) {
    this.backendBaseUrl = environment.backendBaseUrl;
  }

  validateSampleData(dataSample: DataSample):boolean {
    return dataSample.ce.length !== dataSample.qe.length;
  }

  setDataSample(sample: DataSample): Observable<DataSample> {

    if (this.validateSampleData(sample)){
      console.log("Invalid data sample");
    }

    this.httpClient.get<any>(`${this.backendBaseUrl}/health-check`).subscribe(response => console.log(response))

    return this.httpClient.post<DataSample>(`${this.backendBaseUrl}/investigation/sample`, sample)
  }
}
