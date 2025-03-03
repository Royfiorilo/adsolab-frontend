import {Component, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {InvestigationService} from '../historic-investigation/investigation.service';
import {MatAccordion} from '@angular/material/expansion';
import {PlotlyComponent} from 'angular-plotly.js';
import {catchError, firstValueFrom} from 'rxjs';
import {ModelSelectorServiceService} from '../model-selector/model-selector-service.service';
import {TranslateService} from '@ngx-translate/core';
import {Model} from '../model-selector/model';
import {CommonUtilsService} from '../../common/common.service';
import {InvestigationData} from "./interface";
import {Sample, Version} from "../historic-investigation/interface";
import {VersionDataService} from "./version.service";
import {IGraph} from "../../common/common.interface";


@Component({
  selector: 'app-historic-version',
  templateUrl: './historic-version.component.html',
  styleUrl: './historic-version.component.css',
})
export class HistoricVersionComponent {
  @ViewChildren(MatAccordion) accordions!: QueryList<MatAccordion>;
  @ViewChild('comparisonPlot') comparisonPlot!: PlotlyComponent;
  sample: Sample | undefined;
  versionId: string = '0';
  investigationId: string = '0';
  protected models: Model[] = [];
  protected data: InvestigationData | undefined;
  protected compareGraph: IGraph | undefined;
  versionData: Version | undefined;
  protected summaryGraph: { [key: number]: IGraph } = {};
  private colorByMethod: { [key: string]: string } = {
    cg: "blue",
    leastsq: "#8f3237",
    cobyla: "green",
    freundlich: "orange",
    langmuir: "green"
  }

  constructor(
    private route: ActivatedRoute,
    private investigationService: InvestigationService,
    private modelService: ModelSelectorServiceService,
    protected commonUtilsService: CommonUtilsService,
    private translateService: TranslateService, private versionDataService: VersionDataService
  ) {
  }

  ngOnInit() {
    this.versionData = this.versionDataService.getVersionData();
    this.sample = this.versionDataService.getSample();
    this.modelService
      .getModels()
      .pipe(
        catchError(async (error) => {
          throw await firstValueFrom(
            this.translateService.get('MODEL_SELECTOR.ERROR_LOADING_MODELS', error)
          );
        })
      )
      .subscribe((response) => {
        this.models = response.models;
        this.route.paramMap.subscribe((params) => {
          this.versionId = params.get('verId') || '0';
          this.investigationId = params.get('invId') || '0';
          this.fetchData();
        });
      });

  }

  fetchData() {
    this.investigationService
      .deployDatasetVersion(this.investigationId, this.versionId)
      .subscribe({
        next: (response) => this.processData(response),
        error: (err) => console.error('Error fetching data:', err),
      });
  }

  processData(jsonData: InvestigationData) {
    if (!jsonData) return;
    this.data = jsonData;
    this.generateGraphs()
  }

  generateGraphs() {
    if (!this.data?.fitted_models) return;


    let xPointX = this.sample?.ce!
    let yPointX = this.sample?.qe!


    let axisTitles = {
      xaxis: {
        title: "CE"
      },
      yaxis: {
        title: "QE"
      },
    }
    this.compareGraph = {
      data: [],
      layout: {
        title: "Mejor Ajuste por Modelo",
        autosize: true,
        xaxis: axisTitles.xaxis,
        yaxis: axisTitles.yaxis
      }
    };
    let baseData = {
      x: xPointX,
      y: yPointX,
      type: 'scatter',
      mode: 'markers',
      name: "Sample",
      marker: {color: 'black'}
    }


    for (const model of this.data.fitted_models) {
      this.summaryGraph[model.model_id] = {
        data: [],
        layout: {
          title: "resumen",
          autosize: true,
          xaxis: axisTitles.xaxis,
          yaxis: axisTitles.yaxis
        }
      }


      let bestAdjust = this.findBestAdjustMethod(model.model_id);
      let modelName = this.commonUtilsService.getModelById(model.model_id, this.models);

      for (const adjustMethod of model.adjustment_methods) {
        if (!adjustMethod.graph) {
          adjustMethod.graph = {
            layout: {
              title: "resumen",
              autosize: true,
              xaxis: axisTitles.xaxis,
              yaxis: axisTitles.yaxis,
            }, data: []
          };
        }

        let graphData = {
          x: adjustMethod?.transformed?.x || [],
          y: adjustMethod?.transformed?.y || [],
          type: 'scatter',
          mode: 'lines',
          name: modelName.name + " (" + adjustMethod?.name + ")",
          line: {shape: 'spline', color: this.colorByMethod[adjustMethod.name]},
          marker: {color: this.colorByMethod[adjustMethod.name]},
        };

        adjustMethod.graph.data.push(graphData);
        adjustMethod.graph.data.push(baseData);
        this.summaryGraph[model.model_id].data.push(graphData)

        if (adjustMethod.name === bestAdjust?.name) {
          this.compareGraph?.data?.push(graphData);
        }
      }
      this.summaryGraph[model.model_id].data.push(baseData);

    }
    this.compareGraph?.data?.push(baseData);

  }


  findBestAdjustMethod(modelId: number) {
    const fittedModel = this.data?.fitted_models.find(fittedModel => fittedModel.model_id === modelId);
    return fittedModel?.adjustment_methods.find(method => method.name === fittedModel.best_adjust);
  }

  findAdjustMethods(modelId: number) {
    const model = this.data?.fitted_models?.find(fittedModel => fittedModel.model_id === modelId);
    return model?.adjustment_methods || [];
  }

  findFittedModel(modelId: number) {
    const model = this.data?.fitted_models?.find(fittedModel => fittedModel.model_id === modelId);
    return model?.seeds || [];
  }

  bestStatisticValue(modelId: number, statName: string): number {

    const bestFit = this.findBestAdjustMethod(modelId)
    return bestFit ? (bestFit.statistics as any)[statName] : 0
  }

  getRidgeStatistic(statName: string) {
    return (this.data?.comparison.ml.statistics as any)[statName]
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

  getResidualsRows(): string[] {
    const sampleResiduals = this.data?.comparison?.ml.residuals;
    if (sampleResiduals) {
      return Object.keys(sampleResiduals?.analysis);

    } else {
      return ["not", "found"]
    }

  }

  bestResidualValue(modelId: number, residualName: string): number {
    const bestFit = this.findBestAdjustMethod(modelId)
    return bestFit ? (bestFit.residuals.analysis as any)[residualName] : 0
  }

  getBestComparisonModelOverall(): string | undefined {

    // @ts-ignore //Arreglar porque no se puede distinguir el coef.
    if (this.data?.comparison?.ml?.coefs[this.data?.comparison.heuristic.best_model - 1] >= Math.max(...this.data?.comparison.ml.coefs)) {

      return this.commonUtilsService.getModelById(this.data?.comparison.heuristic.best_model!, this.models).name;

    } else {

      return undefined;
    }

  }

  protected readonly Object = Object;
}
