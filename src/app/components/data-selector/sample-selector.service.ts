import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {environment} from "../../../environments/environment";
import {Observable, of} from "rxjs";
import {DataSample} from "./data-sample";
// import { map } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class SampleSelectorService {
  private samples: DataSample[] = [
    {
      ce: [1, 2, 3],
      qe: [4, 5, 6],
      investigation_id: 1,
      label: 'Sample 1',
      description: 'datos de utilizando material Y a temperatura X'
    },
    {
      ce: [7, 8, 9],
      qe: [10, 11, 12],
      investigation_id: 2,
      label: 'Sample 2',
      description: 'datos de utilizando material Z a temperatura W'
    }
  ];
  backendBaseUrl: string;

  constructor(private httpClient: HttpClient) {
    this.backendBaseUrl = environment.backendBaseUrl;
  }

  getSamples(): Observable<DataSample[]> {
    return of(this.samples);
    // return this.httpClient.get<DataSample[]>(`${this.backendBaseUrl}/samples`);
    // return this.http.get<{samples: DataSample[]}>(`${this.backendBaseUrl}/samples`).pipe(map(response => response.samples)
  }
}
