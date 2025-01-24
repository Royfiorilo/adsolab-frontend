import {Component, Input, QueryList, SimpleChanges, ViewChildren} from '@angular/core';
import {DataSample} from "../data-selector/data-sample";
import {Model} from "../model-selector/model";
import {CommonUtilsService} from "../../common/common.service";
import {
  IComparison,
  INoLinearGraph,
  INoLinearRequest,
  INoLinearRequestModel,
  INoLinearRequestSeed,
  Ridge,
  ViewOption
} from "./interface";
import {ModelCompareService} from "./model-compare.service";
import {IGraph, IModelsConfigurations} from "../../common/common.interface";
import {MatAccordion} from "@angular/material/expansion";
import {faFileDownload} from "@fortawesome/free-solid-svg-icons";
import * as XLSX from 'xlsx';
import {saveAs} from 'file-saver';


@Component({
  selector: 'app-model-compare',
  templateUrl: './model-compare.component.html',
  styleUrl: './model-compare.component.css',
})
export class ModelCompareComponent {
  @ViewChildren(MatAccordion) accordions!: QueryList<MatAccordion>;
  @Input() investigationId: number | undefined;
  @Input() selectedModels!: number[];
  @Input() models!: Model[];
  @Input() dataSample: DataSample | undefined;
  @Input() modelConfiguration!: IModelsConfigurations;
  @Input() stepId!: number;
  protected noLinearResults: { [key: number]: { bestAdjustment: string, adjustments: INoLinearGraph[] } } = {};
  protected noLinearCompareResult: IComparison | undefined;
  protected runningNoLinearAdjustment: boolean = false;
  protected summaryGraph: { [key: number]: IGraph } = {};
  protected compareGraph: IGraph | undefined;
  protected toggleValue: string = 'results';
  protected selectedViewOption: ViewOption = ViewOption.SIMPLIFIED;
  protected viewOptions = ViewOption;
  protected selectedModelsChanged: boolean = false;
  protected ridgeResult: Ridge | undefined;
  protected xForCurvePlot: number[] = [];

  private colorByMethod: { [key: string]: string } = {
    cg: "blue",
    leastsq: "#8f3237",
    cobyla: "green",
    freundlich: "orange",
    langmuir: "green"
  }

  constructor(protected commonUtilsService: CommonUtilsService,
              protected modelCompareService: ModelCompareService) {
  }

  ngOnInit() {

    this.runNonLinearModels();

  }

  ngOnChanges(changes: SimpleChanges) {

    if (changes['selectedModels'] && changes['selectedModels'].currentValue !== changes['selectedModels'].previousValue) {
      this.selectedModelsChanged = true;
    }

    if (changes['stepId'] && !changes['stepId'].firstChange && changes['stepId'].currentValue === 3 && this.selectedModelsChanged) {
      this.runNonLinearModels();
    }

  }

  bestTransformedValue(modelId: number, index: number): number {
    const adjustments = this.noLinearResults[modelId].adjustments;
    const bestAdjustment = this.noLinearResults[modelId]?.bestAdjustment;
    const bestFit = adjustments.find(
      (adjustment) => adjustment.adjustment_name === bestAdjustment
    );
    return bestFit ? bestFit.graph.data[1].y[index] : 0
  }

  parseResiduals(residualValue: number): string | number {
    if (residualValue === 0) {
      return "False"
    } else if (residualValue === 1) {
      return "True"
    } else {
      return residualValue
    }
  }

  getStatisticsRows(): string[] {
    const sampleStats = this.noLinearResults[this.selectedModels[0]]?.adjustments[0]?.statistics || {};
    return Object.keys(sampleStats);
  }

  getResidualsRows(): string[] {
    const sampleResiduals = this.noLinearResults[this.selectedModels[0]]?.adjustments[0]?.residuals || {};
    return Object.keys(sampleResiduals);
  }

  bestResidualValue(modelId: number, residualName: string): number {
    const adjustments = this.noLinearResults[modelId].adjustments;
    const bestAdjustment = this.noLinearResults[modelId]?.bestAdjustment;
    const bestFit = adjustments.find(
      (adjustment) => adjustment.adjustment_name === bestAdjustment
    );
    return bestFit ? (bestFit.residuals as any)[residualName] : 0
  }


  bestStatisticValue(modelId: number, statName: string): number {
    const adjustments = this.noLinearResults[modelId].adjustments;
    const bestAdjustment = this.noLinearResults[modelId]?.bestAdjustment;
    const bestFit = adjustments.find(
      (adjustment) => adjustment.adjustment_name === bestAdjustment
    );
    return bestFit ? (bestFit.statistics as any)[statName] : 0
  }

  toggleChange(value: string) {
    this.toggleValue = value;
  }

  runNonLinearModels() {
    
    this.selectedModelsChanged = false;

    this.noLinearResults = {};

    this.runningNoLinearAdjustment = true

    const models: INoLinearRequestModel[] = [];

    for (const modelId of Object.keys(this.modelConfiguration)) {

      const seeds: INoLinearRequestSeed[] = []

      for (const param of Object.entries(this.modelConfiguration[+modelId].paramValues)) {

        seeds.push({
          name: param[0],
          value: param[1]
        })
      }

      const modelRequest: INoLinearRequestModel = {
        model: +modelId,
        iteration: this.modelConfiguration[+modelId].iterations,
        seeds
      }

      models.push(modelRequest)
    }


    const request: INoLinearRequest = {
      investigation_id: this.investigationId!,
      models
    }

    this.modelCompareService.runNoLinearModel(request).subscribe((response) => {

      this.noLinearCompareResult = response.comparison;

      let xPointX = this.dataSample?.ce!
      let yPointX = this.dataSample?.qe!

      this.xForCurvePlot = response.results[0].adjustment_methods[0].transformed.x;

      let baseData = {
        x: xPointX,
        y: yPointX,
        type: 'scatter',
        mode: 'markers',
        name: "Muestra",
        marker: {color: 'black'}
      }

      this.ridgeResult = response.comparison.ridge;

      let ridgeData = {
        x: this.xForCurvePlot,
        y: response.comparison.ridge.y_pred,
        type: 'scatter',
        mode: 'line+marker',
        name: 'Ridge',
        line: {shape: 'spline', color: 'grey'},
        marker: {color: 'grey'},

      }

      this.compareGraph = {
        data: [ridgeData], layout: {title: "Mejor ajuste por modelo", autosize: true}
      }

      for (const model of response.results) {

        this.noLinearResults[model.model] = {
          adjustments: [],
          bestAdjustment: model.best_adjust
        }


        this.summaryGraph[model.model] = {
          data: [], layout: {title: "Resumen de resultados", autosize: true}
        }

        for (const adjustment of model.adjustment_methods) {

          let resultData = {
            x: adjustment.transformed.x,
            y: adjustment.transformed.y,
            type: 'scatter',
            mode: 'line+marker',
            name: adjustment.name,
            line: {shape: 'spline', color: this.colorByMethod[adjustment.name]},
            marker: {color: this.colorByMethod[adjustment.name]},
          }


          if (adjustment.name === model.best_adjust) {
            let compareData = {...resultData};
            let modelName = this.commonUtilsService.getModelById(model.model, this.models).name;
            compareData.line = {shape: 'spline', color: this.colorByMethod[modelName]}
            compareData.marker = {color: this.colorByMethod[modelName]}
            compareData.name = modelName + ` (${model.best_adjust})`
            this.compareGraph.data.push(compareData);
          }

          this.summaryGraph[model.model].data.push(resultData)

          let noLinearGraph: INoLinearGraph = {
            parameters: adjustment.parameters,
            statistics: adjustment.statistics,
            adjustment_name: adjustment.name,
            residuals: adjustment.residuals,
            graph: {
              data: [
                resultData,
                baseData
              ],
              layout: {title: '', autosize: true} //TODO: poner algun titulo
            }
          }
          this.noLinearResults[model.model].adjustments.push(noLinearGraph)
        }

        this.summaryGraph[model.model].data.push(baseData)

      }
      this.compareGraph.data.push(baseData);

      this.runningNoLinearAdjustment = false;

    })

  }


  getBestComparisonModelOverall(): string {

    if (this.noLinearCompareResult?.heuristic.best_model === this.noLinearCompareResult?.ridge.best_model) {

      return this.commonUtilsService.getModelById(this.noLinearCompareResult?.heuristic.best_model!, this.models).name;

    } else {

      return 'Indefinido'
    }

  }

  getBestAdjustmentDataByModel(modelId: number) {

    const adjustments = this.noLinearResults[modelId].adjustments;
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

  getRidgeResiduals(name: string) {

    return (this.noLinearCompareResult!.ridge!.residuals as any)[name]
  }

  getRidgeStatistic(statName: string) {

    return (this.noLinearCompareResult!.ridge!.statistics as any)[statName]
  }

  toggleView(viewOption: ViewOption): void {
    this.selectedViewOption = viewOption;
  }

  toggleAccordion(index: number, action: string): void {
    const accordionArray = this.accordions.toArray();
    if (accordionArray[index]) {
      const accordion = accordionArray[index];
      if (action === 'collapse') {
        accordion.closeAll();
      } else {
        accordion.openAll();
      }
    }
  }

  downloadExcelWithMultipleSheets(): void {
    const workbook: XLSX.WorkBook = {Sheets: {}, SheetNames: []};

    this.addMainDataSheet(workbook);
    this.selectedModels.forEach((modelId) => this.addModelSheet(workbook, modelId));
    this.addRidgeSheet(workbook);

    const excelBuffer: any = XLSX.write(workbook, {bookType: 'xlsx', type: 'array'});
    const blob = new Blob([excelBuffer], {type: 'application/octet-stream'});
    saveAs(blob, 'Adsolab.xlsx'); // Reemplazar por investigation name
  }

  private addMainDataSheet(workbook: XLSX.WorkBook): void {
    const worksheetData: (string | number)[][] = [];

    worksheetData.push([...this.getHeaders('Ce'), 'Ridge']);
    this.dataSample?.ce.forEach((ceValue, index) => {
      worksheetData.push(this.getCeRowWithRidge(ceValue, index));
    });

    worksheetData.push([...this.getHeaders('Estadisticos'), 'Ridge']);
    this.getStatisticsRows().forEach((statName) => {
      worksheetData.push(this.getRowForStatistics(statName));
    });

    worksheetData.push([...this.getHeaders('Residuos'), 'Ridge']);
    this.getResidualsRows().forEach((name) => {
      worksheetData.push(this.getRowForResiduals(name));
    });

    const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(worksheetData);
    this.addSheetToWorkbook(workbook, 'Data', worksheet);
  }

  private addRidgeSheet(workbook: XLSX.WorkBook): void {
    if (!this.ridgeResult) return;

    const sheetData: (string | number)[][] = [];
    const headers = [
      ...Object.keys(this.ridgeResult.statistics),
      ...Object.keys(this.ridgeResult.residuals),
      ...this.ridgeResult.results.map(result => this.getModelName(result.model))
    ];

    const values = [
      ...Object.values(this.ridgeResult.statistics),
      ...Object.values(this.ridgeResult.residuals),
      ...this.ridgeResult.results.map(result => result.coef)
    ];

    sheetData.push(headers);
    sheetData.push(values);

    sheetData.push(['x', 'y']);
    this.ridgeResult.y_pred.forEach((y, index) => {
      sheetData.push([this.xForCurvePlot[index], y]);
    });

    const worksheet: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(sheetData);
    this.addSheetToWorkbook(workbook, 'Ridge', worksheet);
  }

  private addModelSheet(workbook: XLSX.WorkBook, modelId: number): void {
    const model = this.commonUtilsService.getModelById(+modelId, this.models);
    const bestAdjust = this.getBestAdjustmentDataByModel(model._id);

    const headers = [
      ...bestAdjust.parameters.map(param => param.name),
      ...Object.keys(bestAdjust.statistics),
      ...Object.keys(bestAdjust.residuals)
    ];

    const values = [
      ...bestAdjust.parameters.map(param => param.value),
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
    const modelHeaders = Object.keys(this.noLinearResults).map(modelId =>
      this.getModelName(+modelId)
    );
    return [...additionalHeaders, ...modelHeaders];
  }

  private getCeRowWithRidge(ceValue: number, index: number): (string | number)[] {
    const baseRow = this.getRowForCe(ceValue, index);
    const ridgeValue = this.ridgeResult?.y_pred?.[index] ?? 'N/A';
    return [...baseRow, ridgeValue];
  }

  private getGraphDataRows(graphData: { x: number[]; y: number[] }[]): (string | number)[][] {
    const rows: (string | number)[][] = [];
    graphData.forEach((data) => {
      data.x.forEach((xValue, index) => {
        rows.push([xValue, data.y[index]]);
      });
    });
    return rows;
  }

  private getModelName(modelId: number): string {
    return this.commonUtilsService.getModelById(modelId, this.models).name;
  }

  private getRowForCe(ceValue: number, index: number): (string | number)[] {
    return [ceValue, ...this.selectedModels.map(modelId => this.bestTransformedValue(modelId, index))];
  }

  private getRowForStatistics(statName: string): (string | number)[] {
    return [statName, ...this.selectedModels.map(modelId => this.bestStatisticValue(modelId, statName)), this.getRidgeStatistic(statName)];
  }

  private getRowForResiduals(name: string): (string | number)[] {
    return [name, ...this.selectedModels.map(modelId => this.parseResiduals(this.bestResidualValue(modelId, name))), this.getRidgeResiduals(name)];
  }

  protected readonly Object = Object;
  protected readonly faDownload = faFileDownload;
}
