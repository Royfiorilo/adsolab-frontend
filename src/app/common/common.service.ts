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


}

export const DEFAULT_ITERATIONS = 10000;
export const DEFAULT_STEPS = 0.1;
