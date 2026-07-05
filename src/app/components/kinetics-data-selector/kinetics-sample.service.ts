import {Injectable} from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {environment} from "../../../environments/environment";
import {EMPTY, Observable} from "rxjs";
import {CreateKineticSampleResponse, IKineticsSample} from "../kinetics/interface";

@Injectable({
  providedIn: 'root'
})
export class KineticsSampleService {

  backendBaseUrl: string;

  constructor(private httpClient: HttpClient) {
    this.backendBaseUrl = environment.backendBaseUrl;
  }

  createKineticSample(sample: IKineticsSample): Observable<CreateKineticSampleResponse> {
    if (sample.sample_id !== undefined) {
      return EMPTY;
    }

    const request = {
      time: sample.time,
      qt: sample.qt,
      adsorbate_id: sample.adsorbate_id,
      adsorbent_id: sample.adsorbent_id,
      description: sample.description,
      temperature: sample.temperature,
      time_unit: sample.time_unit || 'min',
      measure_unit: sample.measure_unit || 'mg/g',
    };

    return this.httpClient.post<CreateKineticSampleResponse>(
      `${this.backendBaseUrl}/kinetics/sample`, request, {withCredentials: true}
    );
  }

}
