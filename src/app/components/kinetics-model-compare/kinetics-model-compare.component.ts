import {Component, OnInit, TemplateRef, ViewChild} from '@angular/core';
import {faSave} from "@fortawesome/free-solid-svg-icons";
import {TranslateService} from "@ngx-translate/core";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {PlotlyComponent} from "angular-plotly.js";
import {KineticsStateService} from "../kinetics/kinetics-state.service";
import {KINETICS_FONT_FAMILIES, KINETICS_PLOT_PALETTE, KineticsModelCompareService} from "./kinetics-model-compare.service";
import {
  AxisScale,
  ExportFormat,
  IKineticsAxisSettings,
  IKineticsComparison,
  IKineticsFitResult,
  IKineticsPlotSettings
} from "./interface";

interface PlotlyGraph {
  data: any[];
  layout: any;
}

@Component({
  selector: 'app-kinetics-model-compare',
  templateUrl: './kinetics-model-compare.component.html',
  styleUrl: './kinetics-model-compare.component.css'
})
export class KineticsModelCompareComponent implements OnInit {
  @ViewChild('comparisonPlot') comparisonPlot?: PlotlyComponent;
  state = this.stateService.state;
  protected readonly faSave = faSave;

  protected loading = true;
  protected error = false;
  protected results: IKineticsFitResult[] = [];
  protected comparison?: IKineticsComparison;
  protected comparisonGraph?: PlotlyGraph;
  protected graphByModel: { [modelId: number]: PlotlyGraph } = {};
  protected residualsGraphByModel: { [modelId: number]: PlotlyGraph } = {};

  @ViewChild('statModal') private statModalRef!: TemplateRef<any>;
  @ViewChild('residualModal') private residualModalRef!: TemplateRef<any>;
  protected selectedStatName = '';
  protected selectedResidualName = '';

  protected plotSettings!: IKineticsPlotSettings;
  protected exportFormat: ExportFormat = 'png';
  protected colorMode: 'color' | 'bw' = 'color';
  protected config: any = {responsive: true};
  protected readonly fontFamilies = KINETICS_FONT_FAMILIES;

  // Grayscale shades + dash patterns used in black & white mode so models
  // stay distinguishable when the chart is printed.
  private readonly bwShades = ['#000000', '#555555', '#888888', '#bbbbbb'];
  private readonly bwDashes = ['solid', 'dash', 'dot', 'dashdot'];

  constructor(protected stateService: KineticsStateService,
              private compareService: KineticsModelCompareService,
              private translate: TranslateService,
              private modalService: NgbModal) {
  }

  ngOnInit(): void {
    this.runModels();
  }

  getModelName(modelId: number): string | undefined {
    return this.state().models.find(model => model._id === modelId)?.name;
  }

  /**
   * R² de la mejor linealización del modelo, calculado en el paso de configuración.
   * Se muestra junto al R² del ajuste no lineal porque linealizar deforma la
   * estructura del error: un R² lineal alto no implica mejor ajuste.
   */
  getLinearR2(modelId: number): number | undefined {
    const persisted = this.state().modelConfiguration[modelId]?.linearization;
    if (!persisted) {
      return undefined;
    }
    return persisted.linearizations
      .find(linearization => linearization.status === 'OK' && linearization.id === persisted.bestResult)
      ?.statistics?.r_squared;
  }

  hasLinearR2(): boolean {
    return this.results.some(result => this.getLinearR2(result.modelId) !== undefined);
  }

  /** Las filas salen de las claves que manda el backend, no de una lista fija. */
  getStatisticsRows(): string[] {
    return Object.keys(this.results[0]?.statistics ?? {});
  }

  getResidualsRows(): string[] {
    return Object.keys(this.results[0]?.residuals?.analysis ?? {});
  }

  statisticValue(modelId: number, name: string): number | undefined {
    return this.results.find(result => result.modelId === modelId)?.statistics?.[name];
  }

  residualValue(modelId: number, name: string): number | boolean | undefined {
    const analysis = this.results.find(result => result.modelId === modelId)?.residuals?.analysis;
    return analysis ? (analysis as any)[name] : undefined;
  }

  getMlStatistic(name: string): number | undefined {
    return this.comparison?.ml?.statistics?.[name];
  }

  getHeuristicScore(modelId: number): number | undefined {
    return this.comparison?.heuristic?.results.find(result => result.model === modelId)?.score;
  }

  getMlCoefficient(modelId: number): number | undefined {
    return this.comparison?.ml?.results.find(result => result.model === modelId)?.coef;
  }

  /** Sólo hay un ganador claro cuando heurística y ML coinciden. */
  bestModelOverall(): string | undefined {
    const heuristic = this.comparison?.heuristic?.best_model;
    const ml = this.comparison?.ml?.best_model;
    if (heuristic === undefined || ml === undefined || heuristic !== ml) {
      return undefined;
    }
    return this.getModelName(heuristic);
  }

  hasDescription(prefix: string, name: string): boolean {
    const key = `${prefix}.${name}`;
    return this.translate.instant(key) !== key;
  }

  openStatModal(name: string): void {
    this.selectedStatName = name;
    this.modalService.open(this.statModalRef, {size: 'lg'});
  }

  openResidualModal(name: string): void {
    this.selectedResidualName = name;
    this.modalService.open(this.residualModalRef, {size: 'lg'});
  }

  private runModels(): void {
    const {kineticsSample, selectedModels, modelConfiguration, models} = this.state();
    if (!kineticsSample || selectedModels.length === 0) {
      this.loading = false;
      return;
    }

    this.loading = true;
    this.error = false;
    this.compareService.runModels(kineticsSample, selectedModels, modelConfiguration, models).subscribe({
      next: outcome => {
        this.results = outcome.results;
        this.comparison = outcome.comparison;
        this.plotSettings = this.buildDefaultSettings(outcome.results);
        this.updateConfig();
        this.rebuildGraphs();
        this.loading = false;
      },
      error: () => {
        this.error = true;
        this.loading = false;
      }
    });
  }

  private buildDefaultSettings(results: IKineticsFitResult[]): IKineticsPlotSettings {
    const sample = this.state().kineticsSample;
    const colorByModel: { [modelId: number]: string } = {};
    const visibleByModel: { [modelId: number]: boolean } = {};
    results.forEach((result, index) => {
      colorByModel[result.modelId] = KINETICS_PLOT_PALETTE[index % KINETICS_PLOT_PALETTE.length];
      visibleByModel[result.modelId] = true;
    });
    return {
      title: this.translate.instant('KINETICS_MODEL_COMPARE.PLOT_TITLE'),
      font: {family: 'Arial', size: 14},
      lineWidth: 2,
      colorByModel,
      visibleByModel,
      xAxis: {
        label: this.translate.instant('KINETICS_MODEL_COMPARE.AXIS_TIME'),
        unit: sample?.time_unit ?? '',
        scale: 'linear',
        min: null,
        max: null,
      },
      yAxis: {
        label: this.translate.instant('KINETICS_MODEL_COMPARE.AXIS_QT'),
        unit: sample?.measure_unit ?? '',
        scale: 'linear',
        min: null,
        max: null,
      },
    };
  }

  // Recomputes every plot's traces/layout from results + plotSettings.
  rebuildGraphs(): void {
    const sample = this.state().kineticsSample!;
    const sampleTrace = {
      x: sample.time,
      y: sample.qt,
      type: 'scatter',
      mode: 'markers',
      name: this.translate.instant('KINETICS_MODEL_COMPARE.SAMPLE'),
      marker: {color: 'black'},
    };

    const visibleResults = this.results.filter(result => this.plotSettings.visibleByModel[result.modelId]);
    this.comparisonGraph = {
      data: [sampleTrace, ...visibleResults.map(result => this.buildModelTrace(result, this.results.indexOf(result)))],
      layout: this.buildLayout(),
    };

    this.graphByModel = {};
    this.residualsGraphByModel = {};
    this.results.forEach((result, index) => {
      this.graphByModel[result.modelId] = {
        data: [sampleTrace, this.buildModelTrace(result, index)],
        layout: this.buildLayout(),
      };
      this.residualsGraphByModel[result.modelId] = this.buildResidualsGraph(result, sample.time);
    });

    setTimeout(() => this.comparisonPlot?.updatePlot(), 0);
  }

  // `sample.time` ya viene ordenado desde el backend (`order_sample`), así que
  // los residuos se alinean con él sin reordenar.
  private buildResidualsGraph(result: IKineticsFitResult, time: number[]): PlotlyGraph {
    const color = this.colorMode === 'bw' ? '#000000' : this.plotSettings.colorByModel[result.modelId];
    return {
      data: [{
        x: time,
        y: result.residuals?.values ?? [],
        type: 'scatter',
        mode: 'markers',
        name: this.translate.instant('KINETICS_MODEL_COMPARE.RESIDUALS_PLOT'),
        marker: {color},
      }],
      layout: {
        title: this.translate.instant('KINETICS_MODEL_COMPARE.RESIDUALS_PLOT'),
        autosize: true,
        font: this.plotSettings.font,
        xaxis: this.buildAxisLayout(this.plotSettings.xAxis),
        yaxis: {title: this.translate.instant('KINETICS_MODEL_COMPARE.AXIS_RESIDUAL'), autorange: true},
      },
    };
  }

  private buildModelTrace(result: IKineticsFitResult, index: number): any {
    const bw = this.colorMode === 'bw';
    const color = bw
      ? this.bwShades[index % this.bwShades.length]
      : this.plotSettings.colorByModel[result.modelId];
    const line: any = {color, width: this.plotSettings.lineWidth, shape: 'spline'};
    if (bw) {
      line.dash = this.bwDashes[index % this.bwDashes.length];
    }
    return {
      x: result.curve.t,
      y: result.curve.qt,
      type: 'scatter',
      mode: 'lines',
      name: result.modelName,
      line,
      marker: {color},
    };
  }

  private buildLayout(): any {
    const font = this.plotSettings.font;
    return {
      title: this.plotSettings.title,
      autosize: true,
      font,
      xaxis: this.buildAxisLayout(this.plotSettings.xAxis),
      yaxis: this.buildAxisLayout(this.plotSettings.yAxis),
    };
  }

  // Builds a Plotly axis from its settings: title (with unit), scale and range.
  private buildAxisLayout(axis: IKineticsAxisSettings): any {
    const title = axis.unit ? `${axis.label} (${axis.unit})` : axis.label;
    const layout: any = {title, type: axis.scale};
    if (axis.min !== null && axis.max !== null) {
      // Plotly expects log-axis ranges as base-10 exponents.
      layout.range = axis.scale === 'log'
        ? [Math.log10(axis.min), Math.log10(axis.max)]
        : [axis.min, axis.max];
      layout.autorange = false;
    } else {
      layout.autorange = true;
    }
    return layout;
  }

  onLineWidthChange(event: Event): void {
    this.plotSettings.lineWidth = Number((event.target as HTMLInputElement).value);
    this.rebuildGraphs();
  }

  onFontSizeChange(event: Event): void {
    this.plotSettings.font.size = Number((event.target as HTMLInputElement).value);
    this.rebuildGraphs();
  }

  onAxisRangeChange(axis: IKineticsAxisSettings, bound: 'min' | 'max', event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    axis[bound] = value === '' ? null : Number(value);
    this.rebuildGraphs();
  }

  onAxisScaleChange(axis: IKineticsAxisSettings, scale: AxisScale): void {
    axis.scale = scale;
    this.rebuildGraphs();
  }

  updateConfig(): void {
    this.config = {
      responsive: true,
      displaylogo: false,
      toImageButtonOptions: {
        format: this.exportFormat,
        filename: 'kinetics_comparison',
        scale: 2,
      },
    };
    setTimeout(() => this.comparisonPlot?.updatePlot(), 0);
  }
}
