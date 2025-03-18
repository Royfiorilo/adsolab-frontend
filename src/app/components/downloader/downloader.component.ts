import {Component, Input} from '@angular/core';
import * as XLSX from 'xlsx';
import {saveAs} from 'file-saver';
import {CommonUtilsService} from '../../common/common.service';
import {IGraph, IModelsConfigurations} from '../../common/common.interface';
import {Ridge} from '../model-compare/interface';
import {StateService} from "../investigation/state.service";
import {faFileDownload} from "@fortawesome/free-solid-svg-icons";

@Component({
  selector: 'app-downloader',
  styleUrl: './downloader.component.css',
  templateUrl: './downloader.component.html'
})
export class DownloaderComponent {
  @Input() modelConfiguration!: IModelsConfigurations;
  @Input() summaryGraph!: { [key: number]: IGraph };
  @Input() ridgeResult?: Ridge;
  @Input() noLinearResults!: { [key: number]: { bestAdjustment: string; successful_fits: any[] } };
  @Input() xForCurvePlot: number[] = [];
  state = this.stateService.state;

  constructor(protected stateService: StateService, private commonUtilsService: CommonUtilsService) {
  }


  private addRidgeSheet(workbook: XLSX.WorkBook): void {
    if (!this.ridgeResult) return;

    const sheetData: (string | number)[][] = [];
    const headers = [
      ...Object.keys(this.ridgeResult.statistics),
      ...Object.keys(this.ridgeResult.residuals),
      ...this.ridgeResult.results.map((result) => this.getModelName(result.model))
    ];

    const values = [
      ...Object.values(this.ridgeResult.statistics),
      ...Object.values(this.ridgeResult.residuals),
      ...this.ridgeResult.results.map((result) => result.coef)
    ];

    sheetData.push(headers);
    sheetData.push(values);

    sheetData.push(['x', 'y']);
    this.ridgeResult.transformed.y.forEach((y, index) => {
      sheetData.push([this.xForCurvePlot[index], y]);
    });

    const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(sheetData);
    this.addSheetToWorkbook(workbook, 'Ridge', worksheet);
  }


  getBestAdjustmentDataByModel(modelId: number) {

    const adjustments = this.noLinearResults[modelId].successful_fits;
    const bestAdjustment = this.noLinearResults[modelId]?.bestAdjustment;
    const bestFit = adjustments.find(
      (adjustment) => adjustment.adjustment_name === bestAdjustment
    );
    if (bestFit) {
      return bestFit;
    } else {
      throw new Error("Best Fit not found")
    }

  }

  private addModelSheet(workbook: XLSX.WorkBook, modelId: number): void {
    const model = this.commonUtilsService.getModelById(+modelId, this.state().models);
    const bestAdjust = this.getBestAdjustmentDataByModel(model._id);

    const headers = [
      ...bestAdjust.parameters.map((param: { name: any; }) => param.name),
      ...Object.keys(bestAdjust.statistics),
      ...Object.keys(bestAdjust.residuals)
    ];

    const values = [
      ...bestAdjust.parameters.map((param: { value: any; }) => param.value),
      ...Object.values(bestAdjust.statistics),
      ...Object.values(bestAdjust.residuals)
    ];

    const sheetData: (string | number)[][] = [
      [bestAdjust.adjustment_name],
      headers,
      values,
      ['x', 'y'],
      ...this.getGraphDataRows(bestAdjust.graph.data)
    ];

    const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(sheetData);
    this.addSheetToWorkbook(workbook, model.name, worksheet);
  }

  private addSheetToWorkbook(workbook: XLSX.WorkBook, sheetName: string, worksheet: XLSX.WorkSheet): void {
    workbook.Sheets[sheetName] = worksheet;
    workbook.SheetNames.push(sheetName);
  }

  private getHeaders(...additionalHeaders: string[]): string[] {
    return [...additionalHeaders, ...this.state().selectedModels.map((modelId) => this.getModelName(modelId))];
  }

  private getGraphDataRows(graphData: { x: number[]; y: number[] }[]): (string | number)[][] {
    return graphData.flatMap((data) => data.x.map((xValue, index) => [xValue, data.y[index]]));
  }

  private getModelName(modelId: number): string {
    return this.commonUtilsService.getModelById(modelId, this.state().models).name;
  }

  private getRowForCe(ceValue: number, index: number): (string | number)[] {
    return [ceValue, ...this.state().selectedModels.map((modelId) => this.bestTransformedValue(modelId, index))];
  }

  private getRowForStatistics(statName: string): (string | number)[] {
    return [statName, ...this.state().selectedModels.map((modelId) => this.bestStatisticValue(modelId, statName)), this.getRidgeStatistic(statName)];
  }

  private getRowForResiduals(name: string): (string | number)[] {
    return [name, ...this.state().selectedModels.map((modelId) => this.parseResiduals(this.bestResidualValue(modelId, name))), this.getRidgeResiduals(name)];
  }

  private bestTransformedValue(modelId: number, index: number): number {
    return this.noLinearResults[modelId]?.successful_fits.find(
      (adjustment) => adjustment.adjustment_name === this.noLinearResults[modelId].bestAdjustment
    )?.graph.data[1].y[index] ?? 0;
  }

  private bestStatisticValue(modelId: number, statName: string): number {
    return this.noLinearResults[modelId]?.successful_fits.find(
      (adjustment) => adjustment.adjustment_name === this.noLinearResults[modelId].bestAdjustment
    )?.statistics[statName] ?? 0;
  }

  private bestResidualValue(modelId: number, residualName: string): number {
    return this.noLinearResults[modelId]?.successful_fits.find(
      (adjustment) => adjustment.adjustment_name === this.noLinearResults[modelId].bestAdjustment
    )?.residuals[residualName] ?? 0;
  }

  private parseResiduals(residualValue: number): string | number {
    return residualValue === 0 ? "False" : residualValue === 1 ? "True" : residualValue;
  }

  private getRidgeStatistic(statName: string): number {
    // @ts-ignore
    return this.ridgeResult?.statistics[statName] ?? 0;
  }

  private getRidgeResiduals(name: string): number {
    // @ts-ignore
    return this.ridgeResult?.residuals[name] ?? 0;
  }

  downloadExcel(): void {
    const workbook: XLSX.WorkBook = {Sheets: {}, SheetNames: []};

    this.addMainDataSheet(workbook);
    this.state().selectedModels.forEach((modelId) => this.addModelSheet(workbook, modelId));
    this.addRidgeSheet(workbook);

    const excelBuffer: any = XLSX.write(workbook, {bookType: 'xlsx', type: 'array'});
    const blob = new Blob([excelBuffer], {type: 'application/octet-stream'});
    saveAs(blob, 'Adsolab.xlsx');
  }

  getStatisticsRows(): string[] {
    const sampleStats = this.noLinearResults[this.state().selectedModels[0]]?.successful_fits[0]?.statistics || {};
    return Object.keys(sampleStats);
  }

  getResidualsRows(): string[] {
    const sampleResiduals = this.noLinearResults[this.state().selectedModels[0]]?.successful_fits[0]?.residuals || {};
    return Object.keys(sampleResiduals);
  }

  private addMainDataSheet(workbook: XLSX.WorkBook): void {
    const worksheetData: (string | number)[][] = [];

    worksheetData.push(this.getHeaders('Ce'));
    this.state().investigation?.sample.ce.forEach((ceValue: number, index: number) => {
      worksheetData.push(this.getRowForCe(ceValue, index));
    });

    worksheetData.push([...this.getHeaders('Statistics'), 'Ridge']);
    this.getStatisticsRows().forEach((statName: string) => {
      worksheetData.push(this.getRowForStatistics(statName));
    });

    worksheetData.push([...this.getHeaders('Residuals'), 'Ridge']);
    this.getResidualsRows().forEach((name) => {
      worksheetData.push(this.getRowForResiduals(name));
    });

    const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(worksheetData);
    this.addSheetToWorkbook(workbook, 'Data', worksheet);
  }

  protected readonly faDownload = faFileDownload;
}
