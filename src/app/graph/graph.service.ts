import { Injectable } from '@angular/core';
import {HttpClient} from "@angular/common/http";
import {Observable, tap} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class GraphService {

  constructor(private httpClient: HttpClient) { }

  getLangmuirResults(ce: number[]): Observable<number[]> {

    return this.httpClient.get<number[]>('https://adsolab-back.onrender.com/langmuir')
      // .pipe(
      //   tap(results => console.info(`Results: ${JSON.stringify(results)}`))
      // )
  }
}
