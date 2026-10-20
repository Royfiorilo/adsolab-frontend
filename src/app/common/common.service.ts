import {Model} from "../components/model-selector/model";
import {Injectable} from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class CommonUtilsService {

  getModelById(modelId: number, models: Model[]): Model {
    return models.filter(model => model._id === modelId).pop()!;
  }

  getBestComparisonModelOverall(modelOne: number, modelTwo: number, models: Model[]): string | undefined {
    if (modelOne === modelTwo) {
      return this.getModelById(modelOne, models).name;
    } else {
      return undefined;
    }
  }

  isInteger(str: string) {
    const num = Number(str);
    return Number.isInteger(num) && str.trim() !== '';
  }

  formatNumber(value: number | string | boolean | null | undefined, sigFigs: number = 4): string {
    if (value === null || value === undefined || value === '') {
      return 'N/A';
    }
    if (typeof value === 'boolean') {
      return String(value);
    }
    const num = typeof value === 'number' ? value : Number(value);
    if (isNaN(num) || !isFinite(num)) {
      return String(value);
    }
    if (num === 0) {
      return '0';
    }
    const absNum = Math.abs(num);
    if (absNum < 1e-3 || absNum >= 1e5) {
      return num.toExponential(sigFigs - 1);
    }
    return Number(num.toPrecision(sigFigs)).toString();
  }

}

export const DEFAULT_ITERATIONS = 10000;
export const DEFAULT_STEPS = 0.1;
// The backend rejects a kinetic fit with fewer points (5-fold cross-validation of the comparison).
export const MIN_FIT_POINTS = 5;
