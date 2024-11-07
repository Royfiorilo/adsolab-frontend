import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {environment} from "../../../environments/environment";
import {Observable} from "rxjs";
import {INoLinearRequest, INoLinearResponse} from "./interface";

@Injectable({
  providedIn: 'root'
})
export class ModelCompareService {
  backendBaseUrl: string;

  constructor(private httpClient: HttpClient) {
    this.backendBaseUrl = environment.backendBaseUrl;
  }

  runNoLinearModel(request: INoLinearRequest): Observable<INoLinearResponse> {
    return this.httpClient.post<INoLinearResponse>(`${this.backendBaseUrl}/investigation/run-no-linear-model`, request);
  }

}
