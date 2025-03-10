import {Model} from "../components/model-selector/model";
import {Injectable} from "@angular/core";

@Injectable({
  providedIn: 'root'
})
export class CommonUtilsService {

  getModelById(modelId: number, models: Model[]): Model {
    return models.filter(model => model._id === modelId).pop()!;
  }

}

export const DEFAULT_ITERATIONS = 10000;
export const DEFAULT_STEPS = 1;
