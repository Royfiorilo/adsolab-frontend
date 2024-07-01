import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable, tap} from "rxjs";
import { environment } from '../../../environments/environment';
import {IModelResult} from "./interface";

@Injectable({
  providedIn: 'root'
})
export class GraphService {

  backendBaseUrl: string;

  constructor(private httpClient: HttpClient) {
    this.backendBaseUrl = environment.backendBaseUrl;
  }

  getLangmuirResults(ce: number[]): Observable<IModelResult> {

    this.httpClient.get<any>(`${this.backendBaseUrl}/health-check`).subscribe(response => console.log(response))

    return this.httpClient.post<IModelResult>(`${this.backendBaseUrl}/run-model/langmuir`, {
      x: ce
    })
  }
}
