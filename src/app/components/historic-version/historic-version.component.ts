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
import {Version} from "../historic-investigation/interface";
import {faArrowUpRightFromSquare} from "@fortawesome/free-solid-svg-icons";
import {VersionDataService} from "./version.service";
import {AllResultsViewOption, ComparisonViewOption} from "../model-compare/interface";
import {DataSample} from "../data-selector/data-sample";
import {IGraph} from "../../common/common.interface";


@Component({
  selector: 'app-historic-version',
  templateUrl: './historic-version.component.html',
  styleUrl: './historic-version.component.css',
})
export class HistoricVersionComponent {
  @ViewChildren(MatAccordion) accordions!: QueryList<MatAccordion>;
  @ViewChild('comparisonPlot') comparisonPlot!: PlotlyComponent;
  sample: DataSample | undefined;
  versionId: string = '0';
  investigationId: string = '0';
  protected models: Model[] = [];
  protected data: InvestigationData | undefined;
  protected compareGraph: IGraph | undefined;
  versionData: Version | undefined;

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

    this.versionDataService.getSample(this.investigationId).subscribe({//pedir al back que manden el sample ID en los versions
      next: (response) => {
        this.sample = response;
        this.generateGraphs()
      },
      error: (err) => console.error('Error fetching data:', err),
    });

  }

  generateGraphs() {

    let xPointX = this.sample?.ce!
    let yPointX = this.sample?.qe!

    let xForCurvePlot = this.data?.fitted_models[0]?.adjustment_methods[0].transformed.x;

    let axisTitles = {
      xaxis: {
        title: 'CE'
      },
      yaxis: {
        title: 'QE'
      },
    }

    let baseData = {
      x: xPointX,
      y: yPointX,
      type: 'scatter',
      mode: 'markers',
      name: 'SAMPLE',
      marker: {color: 'black'}
    }

    let ridgeData = {
      x: xForCurvePlot!,
      y: this.data?.comparison.ml.y_pred!,
      type: 'scatter',
      mode: 'lines',
      name: "Ridge",
      line: {shape: 'spline', color: 'grey'},
      marker: {color: 'grey'},

    }

    this.compareGraph = {
      data: [ridgeData],
      layout: {
        title: "Mejor Ajuste por Modelo",
        autosize: true,
        xaxis: axisTitles.xaxis,
        yaxis: axisTitles.yaxis
      }
    }
    if (this.data?.fitted_models) {
      for (const model of this.data?.fitted_models) {
        let bestAdjust = this.findBestAdjustMethod(model.model_id)
        let modelName = this.commonUtilsService.getModelById(model.model_id, this.models)
        let graphData = {
          x: bestAdjust?.transformed?.x!,
          y: bestAdjust?.transformed?.y!,
          type: 'scatter',
          mode: 'lines',
          name: modelName.name + " (" + bestAdjust?.name + ")",
          line: {shape: 'spline', color: 'grey'},
          marker: {color: 'grey'},

        }
        this.compareGraph.data.push(graphData);

      }
    }
    this.compareGraph.data.push(baseData);
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


  protected readonly faArrowUpRightFromSquare = faArrowUpRightFromSquare;
  protected readonly comparisonViewOptions = ComparisonViewOption;
  protected readonly Object = Object;
  protected readonly allResultsViewOption = AllResultsViewOption;
}
