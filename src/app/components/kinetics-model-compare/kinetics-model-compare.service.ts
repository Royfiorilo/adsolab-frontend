import {Injectable} from '@angular/core';
import {Observable, of} from 'rxjs';
import {delay} from 'rxjs/operators';
import {IKineticsModelsConfigurations, IKineticsSample} from '../kinetics/interface';
import {IKineticsFitResult} from './interface';

const CURVE_POINTS = 80;

// Default color palette used to seed each model's plot color.
export const KINETICS_PLOT_PALETTE = [
  '#008bce', '#e8743b', '#19a979', '#945ecf', '#bf399e', '#c8d322',
];

// Web-safe font families Plotly renders without extra dependencies.
export const KINETICS_FONT_FAMILIES = ['Arial', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana'];

// Analytic kinetic models keyed by model id (mirrors the latex formulas
// declared in kinetics-model-selector). Each returns qt as a function of t.
type KineticFn = (t: number) => number;
const MODEL_REGISTRY: { [modelId: number]: (params: { [name: string]: number }) => KineticFn } = {
  // Pseudo-first-order: qt = qe (1 - e^{-k1 t})
  1: ({qe, k1}) => (t: number) => qe * (1 - Math.exp(-k1 * t)),
  // Pseudo-second-order: qt = (k2 qe^2 t) / (1 + k2 qe t)
  2: ({qe, k2}) => (t: number) => (k2 * qe * qe * t) / (1 + k2 * qe * t),
  // Intraparticle diffusion: qt = kid sqrt(t) + C
  3: ({kid, C}) => (t: number) => kid * Math.sqrt(t) + C,
};

@Injectable({
  providedIn: 'root'
})
export class KineticsModelCompareService {

  // TODO: replace this local mock with a real backend call:
  //   POST /kinetics/compare { sample_id, models } -> IKineticsFitResult[] (withCredentials: true).
  // The component subscription stays identical, only this body changes.
  runModels(
    sample: IKineticsSample,
    selectedModels: number[],
    modelConfiguration: IKineticsModelsConfigurations,
    models: { _id: number; name: string }[]
  ): Observable<IKineticsFitResult[]> {
    const tGrid = this.buildTimeGrid(sample.time);

    const results: IKineticsFitResult[] = selectedModels
      .filter(modelId => MODEL_REGISTRY[modelId])
      .map(modelId => {
        const params = this.readParams(modelConfiguration, modelId);
        const fn = MODEL_REGISTRY[modelId](params);
        return {
          modelId,
          modelName: models.find(m => m._id === modelId)?.name ?? `#${modelId}`,
          params,
          curve: {t: tGrid, qt: tGrid.map(fn)},
          statistics: this.computeStatistics(sample, fn),
        };
      });

    return of(results).pipe(delay(400));
  }

  private readParams(modelConfiguration: IKineticsModelsConfigurations, modelId: number): { [name: string]: number } {
    const paramValues = modelConfiguration[modelId]?.paramValues ?? {};
    return Object.entries(paramValues).reduce((acc, [name, param]) => {
      acc[name] = Number(param.value);
      return acc;
    }, {} as { [name: string]: number });
  }

  private buildTimeGrid(time: number[]): number[] {
    const min = Math.min(...time);
    const max = Math.max(...time);
    const step = (max - min) / (CURVE_POINTS - 1);
    return Array.from({length: CURVE_POINTS}, (_, i) => min + step * i);
  }

  // R^2 and RMSE of the model evaluated at the sample times vs measured qt.
  private computeStatistics(sample: IKineticsSample, fn: KineticFn): { r2: number; rmse: number } {
    const predicted = sample.time.map(fn);
    const mean = sample.qt.reduce((sum, v) => sum + v, 0) / sample.qt.length;
    let ssRes = 0;
    let ssTot = 0;
    for (let i = 0; i < sample.qt.length; i++) {
      ssRes += (sample.qt[i] - predicted[i]) ** 2;
      ssTot += (sample.qt[i] - mean) ** 2;
    }
    const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot;
    const rmse = Math.sqrt(ssRes / sample.qt.length);
    return {r2, rmse};
  }
}
