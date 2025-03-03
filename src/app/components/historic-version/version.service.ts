import {Injectable} from '@angular/core';
import {BehaviorSubject} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VersionDataService {
  private versionData = new BehaviorSubject<any>(null);
  versionData$ = this.versionData.asObservable();

  setVersionData(version: any) {
    this.versionData.next(version);
    sessionStorage.setItem('versionData', JSON.stringify(version)); // Backup in sessionStorage
  }

  getVersionData(): any {
    return this.versionData.value || JSON.parse(sessionStorage.getItem('versionData') || 'null');
  }
}
