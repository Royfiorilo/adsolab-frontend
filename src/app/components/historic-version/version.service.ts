import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';
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

  private sampleData = new BehaviorSubject<any>(null);
  sampleData$ = this.sampleData.asObservable();

  setVersionData(version: any) {
    this.versionData.next(version);
    sessionStorage.setItem('versionData', JSON.stringify(version)); // Backup in sessionStorage
  }

  setSampleData(sample: any) {
    this.sampleData.next(sample);
    sessionStorage.setItem('sampleData', JSON.stringify(sample)); // Backup in sessionStorage
  }

  getVersionData(): any {
    return this.versionData.value || JSON.parse(sessionStorage.getItem('versionData') || 'null');
  }

  getSample(): any {
    return this.sampleData.value || JSON.parse(sessionStorage.getItem('sampleData') || 'null');
  }
  
}
