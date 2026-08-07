import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '../../../environments/environment';
import {map, Observable} from 'rxjs';
import {IKineticsModelsConfigurations, IKineticsSample} from '../kinetics/interface';
import {
  IKineticsAdjustmentMethod,
  IKineticsFitResult,
  IKineticsModelResult,
  IKineticsRunRequest,
  IKineticsRunResponse
} from './interface';

// Default color palette used to seed each model's plot color.
export const KINETICS_PLOT_PALETTE = [
  '#008bce', '#e8743b', '#19a979', '#945ecf', '#bf399e', '#c8d322',
];

// Web-safe font families Plotly renders without extra dependencies.
export const KINETICS_FONT_FAMILIES = ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana'];

@Injectable({
  providedIn: 'root'
})
export class KineticsModelCompareService {

  private backendBaseUrl = environment.backendBaseUrl;

  constructor(private httpClient: HttpClient) {
  }

  // Runs the non-linear fit on the backend and maps its per-method response
  // into the flat IKineticsFitResult[] the component plots (one curve per model,
  // using each model's best adjustment method).
  runModels(
    sample: IKineticsSample,
    selectedModels: number[],
    modelConfiguration: IKineticsModelsConfigurations,
    models: { _id: number; name: string }[]
  ): Observable<IKineticsFitResult[]> {
    const request = this.buildRequest(sample, selectedModels, modelConfiguration);
    return this.httpClient
      .post<IKineticsRunResponse>(`${this.backendBaseUrl}/kinetics/run-no-linear-model`, request, {withCredentials: true})
      .pipe(map(response => this.mapResults(response, models)));
  }

  private buildRequest(
    sample: IKineticsSample,
    selectedModels: number[],
    modelConfiguration: IKineticsModelsConfigurations
  ): IKineticsRunRequest {
    return {
      kinetic_sample_id: sample.sample_id!,
      models: selectedModels.map(modelId => {
        const config = modelConfiguration[modelId];
        return {
          model: modelId,
          seeds: Object.entries(config.paramValues).map(([name, param]) => ({
            name,
            value: Number(param.value),
          })),
          iterations: config.iterations,
          step: config.step,
        };
      }),
      filter: [],
    };
  }

  private mapResults(response: IKineticsRunResponse, models: { _id: number; name: string }[]): IKineticsFitResult[] {
    return response.results
      .filter(result => result.adjustment_methods?.length)
      .map(result => {
        const method = this.pickBestMethod(result);
        const params = method.parameters.reduce((acc, param) => {
          acc[param.name] = param.value;
          return acc;
        }, {} as { [name: string]: number });
        return {
          modelId: result.model,
          modelName: models.find(model => model._id === result.model)?.name ?? `#${result.model}`,
          params,
          curve: {t: method.transformed.x, qt: method.transformed.y},
          statistics: {
            r2: method.statistics['r_squared'],
            rmse: method.statistics['RMSE'],
          },
        };
      });
  }

  private pickBestMethod(result: IKineticsModelResult): IKineticsAdjustmentMethod {
    return result.adjustment_methods.find(method => method.name === result.best_adjust)
      ?? result.adjustment_methods.find(method => method.success)
      ?? result.adjustment_methods[0];
  }
}
