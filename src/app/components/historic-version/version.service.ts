import {Injectable} from '@angular/core';
import {BehaviorSubject, Observable} from 'rxjs';
import {HttpClient} from "@angular/common/http";
import {environment} from "../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class VersionDataService {
  backendBaseUrl: string;

  constructor(private httpClient: HttpClient) {
    this.backendBaseUrl = environment.backendBaseUrl;

  }

  private versionData = new BehaviorSubject<any>(null);
  versionData$ = this.versionData.asObservable();

  setVersionData(version: any) {
    this.versionData.next(version);
    sessionStorage.setItem('versionData', JSON.stringify(version)); // Backup in sessionStorage
  }

  getVersionData(): any {
    return this.versionData.value || JSON.parse(sessionStorage.getItem('versionData') || 'null');
  }

  getSample(sampleId: string): Observable<any> {
    return this.httpClient.get(`${this.backendBaseUrl}/sample/${sampleId}`);
  }


}
