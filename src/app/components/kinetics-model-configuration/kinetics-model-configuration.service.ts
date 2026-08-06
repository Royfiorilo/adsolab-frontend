import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '../../../environments/environment';
import {IKineticsLinearizationRequest, IKineticsLinearizationResponse} from './interface';

@Injectable({
  providedIn: 'root'
})
export class KineticsModelConfigurationService {

  private backendBaseUrl = environment.backendBaseUrl;

  constructor(private httpClient: HttpClient) {
  }

  runLinearization(request: IKineticsLinearizationRequest): Observable<IKineticsLinearizationResponse> {
    return this.httpClient.post<IKineticsLinearizationResponse>(
      `${this.backendBaseUrl}/kinetics/run-linearization`,
      request,
      {withCredentials: true}
    );
  }
}
