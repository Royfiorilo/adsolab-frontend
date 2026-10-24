import * as XLSX from 'xlsx';
import {InvalidFileReason} from '../data-selector/data-sample';
import {SheetCell} from './interface';
import {hasNegativeValues, parseCell, parseSheet, parseWorkbook} from './kinetics-sheet-parser';

// Same layout as the lab's "Datos para trabajar.xlsx": titles, headers, two series and a footer.
const LAB_SHEET: SheetCell[][] = [
  [null, null],
  ['Adsorbente CA caña', null],
  ['Tamaño < 126', null],
  ['t [min]', 'q [mg/g]'],
  [0, 0],
  [10, 3.8754986373989038],
  [30, 4.98],
  [null, null],
  ['Tamaño: 125 - 350', null],
  ['t [min]', 'q [mg/g]'],
  [0, 0],
  [10, 2.25],
  [20, 3.88],
  [25, 4.37],
  [null, null],
  ['Contaminante', 'Cromo'],
];

function workbook(sheets: { [name: string]: SheetCell[][] }): XLSX.WorkBook {
  const book = XLSX.utils.book_new();
  Object.entries(sheets).forEach(([name, rows]) => XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet(rows), name));
  return book;
}

describe('kinetics sheet parser', () => {

  describe('parseCell', () => {
    it('should read numbers, decimal commas and text, and treat blanks as empty', () => {
      expect(parseCell(4.5)).toBe(4.5);
      expect(parseCell(' 0,5 ')).toBe(0.5);
      expect(parseCell('-3')).toBe(-3);
      expect(parseCell('1e3')).toBe(1000);
      expect(parseCell('t [min]')).toBe('t [min]');
      expect(parseCell('   ')).toBeNull();
      expect(parseCell(null)).toBeNull();
    });
  });

  describe('parseSheet', () => {
    it('should keep the clean two-column format working', () => {
      const sheet = parseSheet('Datos', [[0, 0], [5, 1.2], [10, 2.4]]);

      expect(sheet.error).toBeUndefined();
      expect(sheet.series.length).toBe(1);
      expect(sheet.series[0].time).toEqual([0, 5, 10]);
      expect(sheet.series[0].qt).toEqual([0, 1.2, 2.4]);
    });

    it('should skip titles and the header row and load only the numeric rows', () => {
      const sheet = parseSheet('Datos', [['Adsorbente X', null], ['t', 'qt'], [0, 0], [5, 1.2]]);

      expect(sheet.series[0].time).toEqual([0, 5]);
      expect(sheet.series[0].label).toBe('Adsorbente X');
    });

    it('should split a sheet with two series and title each one with the text above it', () => {
      const sheet = parseSheet('CA caña', LAB_SHEET);

      expect(sheet.error).toBeUndefined();
      expect(sheet.series.map(series => series.label)).toEqual(['Adsorbente CA caña · Tamaño < 126', 'Tamaño: 125 - 350']);
      expect(sheet.series[0].time).toEqual([0, 10, 30]);
      expect(sheet.series[1].time).toEqual([0, 10, 20, 25]);
    });

    it('should keep the full precision of the cell, not the rounded value Excel displays', () => {
      const sheet = parseSheet('CA caña', LAB_SHEET);

      expect(sheet.series[0].qt[1]).toBe(3.8754986373989038);
    });

    it('should not let a footer row like "Contaminante, Cromo" invalidate the file', () => {
      const sheet = parseSheet('CA caña', LAB_SHEET);

      expect(sheet.error).toBeUndefined();
      expect(sheet.series.length).toBe(2);
    });

    it('should keep replicated times', () => {
      const sheet = parseSheet('Palta', [['t', 'q'], [0, 0], [5, 1.28], [5, 1.84], [15, 2.08]]);

      expect(sheet.series[0].time).toEqual([0, 5, 5, 15]);
      expect(sheet.series[0].qt).toEqual([0, 1.28, 1.84, 2.08]);
    });

    it('should leave the label empty when there is only a header above the data', () => {
      const sheet = parseSheet('Palta', [['t [min]', 'q [mg/g]'], [0, 0], [5, 1.28]]);

      expect(sheet.series[0].label).toBe('');
    });

    it('should reject a row with more than two numbers as a structure error', () => {
      const sheet = parseSheet('Datos', [[0, 0], [5, 1.2, 7], [10, 2.4]]);

      expect(sheet.error).toBe(InvalidFileReason.INVALID_FILE_STRUCTURE);
      expect(sheet.series).toEqual([]);
    });

    it('should reject a data row with a missing value instead of splitting the series around it', () => {
      const sheet = parseSheet('Datos', [[0, 0], [5, null], [10, 2.4], [15, 3.0]]);

      expect(sheet.error).toBe(InvalidFileReason.INVALID_DATA);
    });

    it('should reject a sheet without any numeric series', () => {
      const sheet = parseSheet('Notas', [['Notas', 'La primera columna es Ce']]);

      expect(sheet.error).toBe(InvalidFileReason.INVALID_DATA);
    });

    it('should reject a sheet with a single point', () => {
      const sheet = parseSheet('Datos', [['t', 'qt'], [5, 1.2]]);

      expect(sheet.error).toBe(InvalidFileReason.INVALID_DATA);
    });
  });

  describe('parseWorkbook', () => {
    it('should return every sheet in workbook order', () => {
      const sheets = parseWorkbook(workbook({
        'CA caña': LAB_SHEET,
        'CA Carozo de Palta': [['t [min]', 'q [mg/g]'], [0, 0], [5, 1.28], [5, 1.84]],
      }));

      expect(sheets.map(sheet => sheet.name)).toEqual(['CA caña', 'CA Carozo de Palta']);
      expect(sheets[0].series.length).toBe(2);
      expect(sheets[1].series[0].time).toEqual([0, 5, 5]);
    });
  });

  describe('hasNegativeValues', () => {
    it('should detect a negative time or qt', () => {
      expect(hasNegativeValues({label: '', time: [0, 5], qt: [0, -1]})).toBeTrue();
      expect(hasNegativeValues({label: '', time: [0, 5], qt: [0, 1]})).toBeFalse();
    });
  });
});
