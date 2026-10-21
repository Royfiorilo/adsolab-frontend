import {Injectable} from '@angular/core';
import {TranslateService} from '@ngx-translate/core';
import * as XLSX from 'xlsx';
import {saveAs} from 'file-saver';
import {
  IKineticsAdjustmentMethod,
  IKineticsExportData,
  IKineticsFittedParameter,
  IKineticsModelResult,
  IKineticsSavedSeed
} from './interface';

type Cell = string | number | boolean | null | undefined;

// Excel rejects sheet names longer than 31 characters or containing : \ / ? * [ ]
const MAX_SHEET_NAME_LENGTH = 31;
const INVALID_SHEET_CHARS = /[:\\/?*\[\]]/g;
const FILE_NAME = 'Adsolab-cinetica.xlsx';

@Injectable({
  providedIn: 'root'
})
export class KineticsResultsExportService {

  constructor(private translate: TranslateService) {
  }

  download(data: IKineticsExportData): void {
    const buffer = XLSX.write(this.buildWorkbook(data), {bookType: 'xlsx', type: 'array'});
    saveAs(new Blob([buffer], {type: 'application/octet-stream'}), FILE_NAME);
  }

  buildWorkbook(data: IKineticsExportData): XLSX.WorkBook {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(this.summaryRows(data)), this.label('SUMMARY'));
    data.rawResults.forEach((result, index) => {
      const name = `${index + 1} ${this.modelName(data, result.model)}`;
      XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet(this.modelRows(data, result)), this.sheetName(name));
    });
    return workbook;
  }

  private summaryRows(data: IKineticsExportData): Cell[][] {
    const {sample, comparison} = data;
    const rows: Cell[][] = [
      [this.label('SAMPLE')],
      [this.label('TITLE'), sample.title],
      [this.label('DESCRIPTION'), sample.description],
      [this.label('TEMPERATURE'), sample.temperature],
      [this.label('ADSORBATE'), sample.adsorbate],
      [this.label('ADSORBENT'), sample.adsorbent],
      [this.label('TIME_UNIT'), sample.time_unit],
      [this.label('QT_UNIT'), sample.measure_unit],
      [],
      [this.label('BEST_MODEL'), data.bestModel ?? this.label('NO_AGREEMENT')],
      [],
      [
        this.label('MODEL'), this.label('BEST_METHOD'), this.label('SEED_ORIGIN'), this.label('SEEDS'),
        this.label('PARAMETERS'), this.label('HEURISTIC'), this.label('RIDGE'),
      ],
    ];
    data.rawResults.forEach(result => rows.push([
      this.modelName(data, result.model),
      result.best_adjust,
      this.seedOrigin(data, result.model),
      this.joinValues(data.seedsByModel[result.model] ?? []),
      this.joinValues(this.bestMethod(result)?.parameters ?? []),
      comparison?.heuristic?.results.find(item => item.model === result.model)?.score,
      comparison?.ml?.results.find(item => item.model === result.model)?.coef,
    ]));
    return rows;
  }

  private modelRows(data: IKineticsExportData, result: IKineticsModelResult): Cell[][] {
    const successful = result.adjustment_methods.filter(method => method.success);
    const reference = successful[0];
    const paramNames = reference?.parameters.map(param => param.name) ?? [];
    const statNames = Object.keys(reference?.statistics ?? {});
    const residualNames = Object.keys(reference?.residuals?.analysis ?? {});

    const rows: Cell[][] = [
      [this.label('MODEL'), this.modelName(data, result.model)],
      [this.label('BEST_METHOD'), result.best_adjust],
      [],
      [
        this.label('METHOD'),
        ...paramNames,
        ...paramNames.map(name => `${this.label('STD_ERR')} ${name}`),
        ...statNames.map(name => this.translate.instant(`STATISTICS.${name}`)),
        ...residualNames.map(name => this.translate.instant(`RESIDUALS.${name}`)),
      ],
      ...result.adjustment_methods.map(method => method.success
        ? this.methodRow(method, paramNames, statNames, residualNames)
        : [method.name, this.label('FAILED')]),
      [],
      [
        this.label('TIME'), this.label('QT_EXPERIMENTAL'),
        ...successful.flatMap(method => [
          `${this.label('QT_FITTED')} (${method.name})`, `${this.label('RESIDUAL')} (${method.name})`,
        ]),
      ],
    ];
    data.sample.time.forEach((time, index) => {
      const qt = data.sample.qt[index];
      rows.push([time, qt, ...successful.flatMap(method => {
        // The backend computes residuals as qt - qt_fitted at each measured time.
        const residual = method.residuals?.values[index];
        return [residual === undefined ? undefined : qt - residual, residual];
      })]);
    });
    return rows;
  }

  private methodRow(method: IKineticsAdjustmentMethod, paramNames: string[], statNames: string[],
                    residualNames: string[]): Cell[] {
    const param = (name: string) => method.parameters.find(item => item.name === name);
    const analysis = method.residuals?.analysis as unknown as { [name: string]: Cell } | undefined;
    return [
      method.name,
      ...paramNames.map(name => param(name)?.value),
      ...paramNames.map(name => param(name)?.std_err),
      ...statNames.map(name => method.statistics[name]),
      ...residualNames.map(name => analysis?.[name]),
    ];
  }

  private bestMethod(result: IKineticsModelResult): IKineticsAdjustmentMethod | undefined {
    return result.adjustment_methods.find(method => method.name === result.best_adjust);
  }

  private seedOrigin(data: IKineticsExportData, modelId: number): string {
    const automated = data.automatedByModel?.[modelId];
    if (automated === undefined) {
      return '';
    }
    return this.label(automated ? 'ORIGIN_LINEARIZATION' : 'ORIGIN_MANUAL');
  }

  private joinValues(values: (IKineticsSavedSeed | IKineticsFittedParameter)[]): string {
    return values.map(item => `${item.name} = ${item.value}`).join('; ');
  }

  private modelName(data: IKineticsExportData, modelId: number): string {
    return data.models.find(model => model._id === modelId)?.name ?? `#${modelId}`;
  }

  private sheetName(name: string): string {
    return name.replace(INVALID_SHEET_CHARS, ' ').slice(0, MAX_SHEET_NAME_LENGTH);
  }

  private label(key: string): string {
    return this.translate.instant(`KINETICS_EXPORT.${key}`);
  }
}
