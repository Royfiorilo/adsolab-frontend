import {IKineticsMlComparison} from "./interface";

// Second criterion since ABE-002: leave-one-out prediction RMSE. Versions saved before it carry a Ridge `coef`.
export const LOO_CRITERION = 'loo_cv';

export function isLooCriterion(ml: IKineticsMlComparison | null | undefined): boolean {
  return ml?.criterion === LOO_CRITERION;
}

export function mlScore(ml: IKineticsMlComparison | null | undefined, modelId: number): number | undefined {
  const result = ml?.results.find(item => item.model === modelId);
  return result?.cv_rmse ?? result?.coef;
}
