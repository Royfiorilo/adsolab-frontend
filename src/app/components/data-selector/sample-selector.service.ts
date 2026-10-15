import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {environment} from "../../../environments/environment";
import {Observable} from "rxjs";
import {GetMaterialsResponse, GetSampleResponse, IAdsorbate, IAdsorbent} from "./data-sample";
import {IAdsorbateCreation, IAdsorbentCreation} from "../material-dialog/interface";


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
    return this.httpClient.get<GetMaterialsResponse>(`${this.backendBaseUrl}/adsorption-materials`);
  }

  createAdsorbate(adsorbate: IAdsorbateCreation): Observable<IAdsorbate> {
    return this.httpClient.post<IAdsorbate>(`${this.backendBaseUrl}/adsorbates`, adsorbate, {withCredentials: true});
  }

  createAdsorbent(adsorbent: IAdsorbentCreation): Observable<IAdsorbent> {
    return this.httpClient.post<IAdsorbent>(`${this.backendBaseUrl}/adsorbents`, adsorbent, {withCredentials: true});
  }

  deleteSample(sampleId: number | undefined) {
    return this.httpClient.delete(`${this.backendBaseUrl}/sample/${sampleId}`, {withCredentials: true});

  }
}
