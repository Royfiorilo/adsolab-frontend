import {Component, OnInit, ViewChild} from '@angular/core';
import {faSave} from "@fortawesome/free-solid-svg-icons";
import {TranslateService} from "@ngx-translate/core";
import {PlotlyComponent} from "angular-plotly.js";
import {KineticsStateService} from "../kinetics/kinetics-state.service";
import {KINETICS_FONT_FAMILIES, KINETICS_PLOT_PALETTE, KineticsModelCompareService} from "./kinetics-model-compare.service";
import {AxisScale, ExportFormat, IKineticsAxisSettings, IKineticsFitResult, IKineticsPlotSettings} from "./interface";

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
  protected comparisonGraph?: PlotlyGraph;
  protected graphByModel: { [modelId: number]: PlotlyGraph } = {};

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
              private translate: TranslateService) {
  }

  ngOnInit(): void {
    this.runModels();
  }

  getModelName(modelId: number): string | undefined {
    return this.state().models.find(model => model._id === modelId)?.name;
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
      next: results => {
        this.results = results;
        this.plotSettings = this.buildDefaultSettings(results);
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
    this.results.forEach((result, index) => {
      this.graphByModel[result.modelId] = {
        data: [sampleTrace, this.buildModelTrace(result, index)],
        layout: this.buildLayout(),
      };
    });

    setTimeout(() => this.comparisonPlot?.updatePlot(), 0);
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
