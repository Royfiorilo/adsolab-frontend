import {InvalidFileReason} from "../data-selector/data-sample";

export type SheetCell = string | number | boolean | null | undefined;

export interface IKineticsSeries {
  label: string;
  time: number[];
  qt: number[];
}

export interface IKineticsSheet {
  name: string;
  series: IKineticsSeries[];
  error?: InvalidFileReason;
}
