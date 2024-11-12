import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {environment} from "../../../environments/environment";
import {Observable, of} from "rxjs";
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


    const result = {
      "investigation_id": 8,
      "best_model": "model_A",
      "results": [
        {
          "model": 1,
          "best_adjust": "metodo_A",
          "adjustment_methods": [
            {
              "name": "metodo_A",
              "transformed": {
                "x": [ // este es el mismo x original
                  1.5,
                  2.5,
                  3.5
                ],
                "y": [ // este y en realidad es y_pred
                  1,
                  2,
                  3
                ]
              },
              "parameters": [
                {"name": "qmax", "value": 0.54},
                {"name": "k", "value": 0.54}
              ],
              "statistics": {
                "r": 0.001,
                "stderr": 0.54,
                "Chi_squared": 0.002970263681964387,
                "Chi_squared_reduced": 0.0004243233831377696,
                "HYBRID": 0.03386416255914358,
                "R2": 0.8740431382142559,
                "R2_adjusted": 0.8320575176190079,
                "RMSE": 0.0021021052817547466,
                "SSE": 3.976961954023083e-05,
                "Std_error": 0.002383563345085038,
                "n_params": 2,
                "n_points": 9
              }
            }
          ]
        }
      ]
    }

    return of(result)
    // return this.httpClient.post<INoLinearResponse>(`${this.backendBaseUrl}/investigation/run-no-linear-model`, request);
  }

}
