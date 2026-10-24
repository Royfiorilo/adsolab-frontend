import * as XLSX from 'xlsx';
import {InvalidFileReason} from "../data-selector/data-sample";
import {IKineticsSeries, IKineticsSheet, SheetCell} from "./interface";

export const MIN_SAMPLE_POINTS = 2;

// Accepts decimal commas ("0,5"), the way Spanish-locale CSVs write numbers.
const NUMBER_PATTERN = /^[-+]?\d+([.,]\d+)?([eE][-+]?\d+)?$/;
const LABEL_SEPARATOR = ' · ';
const HEADER_MIN_CELLS = 2;

type ParsedCell = number | string | null;

export function parseCell(cell: SheetCell): ParsedCell {
  if (cell === null || cell === undefined) {
    return null;
  }
  if (typeof cell === 'number') {
    return Number.isFinite(cell) ? cell : String(cell);
  }
  const text = String(cell).trim();
  if (text === '') {
    return null;
  }
  return NUMBER_PATTERN.test(text) ? Number(text.replace(',', '.')) : text;
}

// Series are runs of (time, qt) rows; text and blank rows separate them and title the next one.
// A numbers-only row without exactly two values rejects the sheet, so no point is dropped silently.
export function parseSheet(name: string, rows: SheetCell[][]): IKineticsSheet {
  const series: IKineticsSeries[] = [];
  let textRows: string[][] = [];
  let current: IKineticsSeries | null = null;

  const closeSeries = () => {
    if (current && current.time.length >= MIN_SAMPLE_POINTS) {
      series.push(current);
    }
    current = null;
  };

  for (const row of rows) {
    const cells = row.map(parseCell).filter((cell): cell is number | string => cell !== null);
    if (cells.length === 0) {
      closeSeries();
      continue;
    }

    const texts = cells.filter((cell): cell is string => typeof cell === 'string');
    if (texts.length > 0) {
      closeSeries();
      textRows.push(texts);
      continue;
    }

    if (cells.length !== 2) {
      const error = cells.length > 2 ? InvalidFileReason.INVALID_FILE_STRUCTURE : InvalidFileReason.INVALID_DATA;
      return {name, series: [], error};
    }

    if (!current) {
      current = {label: seriesLabel(textRows), time: [], qt: []};
      textRows = [];
    }
    const [time, qt] = cells as number[];
    current.time.push(time);
    current.qt.push(qt);
  }
  closeSeries();

  return series.length > 0 ? {name, series} : {name, series, error: InvalidFileReason.INVALID_DATA};
}

function seriesLabel(textRows: string[][]): string {
  const last = textRows[textRows.length - 1];
  const titles = last && last.length >= HEADER_MIN_CELLS ? textRows.slice(0, -1) : textRows;
  return titles.map(cells => cells.join(' ')).join(LABEL_SEPARATOR);
}

export function parseWorkbook(workbook: XLSX.WorkBook): IKineticsSheet[] {
  return workbook.SheetNames.map(name => {
    const rows = XLSX.utils.sheet_to_json<SheetCell[]>(workbook.Sheets[name], {
      header: 1, raw: true, defval: null, blankrows: true
    });
    return parseSheet(name, rows);
  });
}

export function hasNegativeValues(series: IKineticsSeries): boolean {
  return series.time.some(value => value < 0) || series.qt.some(value => value < 0);
}
