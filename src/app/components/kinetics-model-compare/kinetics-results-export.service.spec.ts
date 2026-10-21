import * as XLSX from 'xlsx';
import {KineticsResultsExportService} from './kinetics-results-export.service';
import {IKineticsExportData} from './interface';

const MODEL_ID = 2;

function method(name: string, success: boolean) {
  return {
    name, success,
    parameters: [{name: 'qe', value: 12.02, std_err: 0.1}, {name: 'k2', value: 2.5e-5, std_err: null}],
    statistics: {r_squared: 0.99, RMSE: 0.12},
    residuals: {
      values: [0, 0.3, -0.2],
      analysis: {
        normality_pvalue: 0.7, homoscedasticity_pvalue: 0.2, durbin_watson: 1.8,
        passes_normality: true, passes_homoscedasticity: true, passes_independence: true,
      },
    },
    transformed: {x: [0, 10], y: [0, 6]},
  };
}

function exportData(overrides: Partial<IKineticsExportData> = {}): IKineticsExportData {
  return {
    sample: {
      time: [0, 5, 10], qt: [0, 3.8, 5.0], title: 'Muestra 1', adsorbate_id: 1, adsorbent_id: 1,
      adsorbate: 'Plomo', adsorbent: 'Carbón activado',
    },
    models: [{_id: MODEL_ID, name: 'Pseudo-Segundo Orden', latex_formula: '', parameters: {}}],
    rawResults: [{
      model: MODEL_ID, best_adjust: 'leastsq',
      adjustment_methods: [method('leastsq', true), method('nelder', true), method('cobyla', false)],
    }],
    comparison: {heuristic: {best_model: MODEL_ID, results: [{model: MODEL_ID, score: 1.9}]}, ml: null},
    bestModel: 'Pseudo-Segundo Orden',
    seedsByModel: {[MODEL_ID]: [{name: 'qe', value: 10}, {name: 'k2', value: 1e-4}]},
    automatedByModel: {[MODEL_ID]: true},
    ...overrides,
  };
}

// sheet_to_json pads every row to the sheet width; trailing blanks are dropped to compare rows.
function rows(workbook: XLSX.WorkBook, sheet: string): any[][] {
  const padded: any[][] = XLSX.utils.sheet_to_json(workbook.Sheets[sheet], {header: 1, defval: null});
  return padded.map(row => {
    const last = row.map(cell => cell !== null).lastIndexOf(true);
    return row.slice(0, last + 1);
  });
}

function rowStartingWith(sheetRows: any[][], label: string): any[] | undefined {
  return sheetRows.find(row => row[0] === label);
}

describe('KineticsResultsExportService', () => {
  let service: KineticsResultsExportService;

  beforeEach(() => {
    const translate = jasmine.createSpyObj('TranslateService', ['instant']);
    translate.instant.and.callFake((key: string) => key);
    service = new KineticsResultsExportService(translate);
  });

  it('should add a summary sheet and one sheet per model', () => {
    const workbook = service.buildWorkbook(exportData());

    expect(workbook.SheetNames).toEqual(['KINETICS_EXPORT.SUMMARY', '1 Pseudo-Segundo Orden']);
  });

  it('should summarize the sample materials, the best model and the seeds with their origin', () => {
    const summary = rows(service.buildWorkbook(exportData()), 'KINETICS_EXPORT.SUMMARY');

    expect(rowStartingWith(summary, 'KINETICS_EXPORT.ADSORBATE')?.[1]).toBe('Plomo');
    expect(rowStartingWith(summary, 'KINETICS_EXPORT.ADSORBENT')?.[1]).toBe('Carbón activado');
    expect(rowStartingWith(summary, 'KINETICS_EXPORT.BEST_MODEL')?.[1]).toBe('Pseudo-Segundo Orden');
    expect(rowStartingWith(summary, 'Pseudo-Segundo Orden')).toEqual([
      'Pseudo-Segundo Orden', 'leastsq', 'KINETICS_EXPORT.ORIGIN_LINEARIZATION', 'qe = 10; k2 = 0.0001',
      'qe = 12.02; k2 = 0.000025', 1.9,
    ]);
  });

  it('should leave the seed origin empty when it is unknown', () => {
    const summary = rows(service.buildWorkbook(exportData({automatedByModel: undefined})), 'KINETICS_EXPORT.SUMMARY');

    expect(rowStartingWith(summary, 'Pseudo-Segundo Orden')?.[2]).toBe('');
  });

  it('should list every method and mark the failed ones', () => {
    const sheet = rows(service.buildWorkbook(exportData()), '1 Pseudo-Segundo Orden');

    expect(rowStartingWith(sheet, 'leastsq')?.slice(0, 5)).toEqual(['leastsq', 12.02, 2.5e-5, 0.1, null]);
    expect(rowStartingWith(sheet, 'nelder')).toBeDefined();
    expect(rowStartingWith(sheet, 'cobyla')).toEqual(['cobyla', 'KINETICS_EXPORT.FAILED']);
  });

  it('should export the fitted qt and residual of each successful method at every measured time', () => {
    const sheet = rows(service.buildWorkbook(exportData()), '1 Pseudo-Segundo Orden');
    const header = sheet.findIndex(row => row[0] === 'KINETICS_EXPORT.TIME');

    expect(sheet[header].length).toBe(6);
    // toBeCloseTo(…, 10): only float subtraction noise is tolerated.
    expect(sheet[header + 2][0]).toBe(5);
    expect(sheet[header + 2][2]).toBeCloseTo(3.5, 10);
    expect(sheet[header + 2][3]).toBe(0.3);
    expect(sheet.length).toBe(header + 4);
  });

  it('should keep sheet names within the Excel limits', () => {
    const data = exportData({models: [{_id: MODEL_ID, name: 'Modelo [con] nombre muy largo / extra', latex_formula: '', parameters: {}}]});

    const name = service.buildWorkbook(data).SheetNames[1];

    expect(name.length).toBeLessThanOrEqual(31);
    expect(name).not.toMatch(/[:\\/?*\[\]]/);
  });
});
