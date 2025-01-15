import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {environment} from "../../../environments/environment";
import {Observable} from "rxjs";
import {GetMaterialsResponse, GetSampleResponse} from "./data-sample";


@Injectable({
  providedIn: 'root'
})
export class SampleSelectorService {

  backendBaseUrl: string;

  constructor(private httpClient: HttpClient) {
    this.backendBaseUrl = environment.backendBaseUrl;
  }

  getSamples(): Observable<GetSampleResponse> {
    return this.httpClient.get<GetSampleResponse>(`${this.backendBaseUrl}/samples`);
  }

  getMaterials(): Observable<GetMaterialsResponse> {
    // @ts-ignore
    //add methods for materials adsorbate and adsorbent
    return

  }
}
