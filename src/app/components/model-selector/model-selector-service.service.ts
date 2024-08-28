import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {environment} from "../../../environments/environment";
import {Observable} from "rxjs";
import {ModelsResponse} from "./model";


@Injectable({
  providedIn: 'root'
})
export class ModelSelectorServiceService {

  backendBaseUrl: string;

  constructor(private httpClient: HttpClient) {
    this.backendBaseUrl = environment.backendBaseUrl;
  }

  getModels() {
    return this.httpClient.get<ModelsResponse>(`${this.backendBaseUrl}/models`);
  }

  //
  //
  // setDataSample(sample: DataSample): Observable<DataSample> {
  //
  //   if (this.validateSampleData(sample)){
  //     console.log("Invalid data sample");
  // //   }
  //
  //   this.httpClient.get<any>(`${this.backendBaseUrl}/health-check`).subscribe(response => console.log(response))
  //
  //   return this.httpClient.post<DataSample>(`${this.backendBaseUrl}/investigation/sample`, sample)
  // }
}
