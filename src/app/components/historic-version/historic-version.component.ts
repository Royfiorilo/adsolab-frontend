import {Component, QueryList, ViewChild, ViewChildren} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {InvestigationService} from '../historic-investigation/investigation.service';
import {MatAccordion} from '@angular/material/expansion';
import {PlotlyComponent} from 'angular-plotly.js';
import {catchError, firstValueFrom} from 'rxjs';
import {ModelSelectorServiceService} from '../model-selector/model-selector-service.service';
import {TranslateService} from '@ngx-translate/core';
import {Model} from '../model-selector/model';
import {CommonUtilsService, DEFAULT_ITERATIONS, DEFAULT_STEPS} from '../../common/common.service';
import {FittedModels, InvestigationData} from "./interface";
import {Sample, Version} from "../historic-investigation/interface";
import {VersionDataService} from "./version.service";
import {IGraph, IModelsConfigurations} from "../../common/common.interface";
import {faArrowLeft, faArrowUpRightFromSquare} from "@fortawesome/free-solid-svg-icons";
import {StateService} from "../investigation/state.service";
import {DataSample, IAdsorbate, IAdsorbent} from "../data-selector/data-sample";
import {AuthService} from "../../common/auth.service";
import {Location} from "@angular/common";
import {SampleSelectorService} from "../data-selector/sample-selector.service";


@Component({
  selector: 'app-historic-version',
  templateUrl: './historic-version.component.html',
  styleUrl: './historic-version.component.css',
})
export class HistoricVersionComponent {
  state = this.stateService.state;
  @ViewChildren(MatAccordion) accordions!: QueryList<MatAccordion>;
  @ViewChild('comparisonPlot') comparisonPlot!: PlotlyComponent;
  protected loadingHistoric: boolean = true;
  sample: DataSample | undefined;
  versionId: string = '0';

  investigationId: string = '0';
  userId: string = '0';
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
  protected adsorbents: IAdsorbent[] = [];
  protected adsorbates: IAdsorbate[] = [];

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private investigationService: InvestigationService,
    private modelService: ModelSelectorServiceService,
    protected commonUtilsService: CommonUtilsService,
    private translateService: TranslateService,
    private versionDataService: VersionDataService,
    protected stateService: StateService,
    private authService: AuthService,
    private location: Location,
    private sampleService: SampleSelectorService
  ) {
  }

  goBack(): void {
    this.location.back();
  }

  ngOnInit() {

    this.versionData = this.versionDataService.getVersionData();
    this.modelService
      .getModels()
      .pipe(
        catchError(async (error) => {
          this.loadingHistoric = false;
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

    this.sampleService.getMaterials()
      .pipe(
        catchError(async error => {
          throw await firstValueFrom(this.translateService.get('DATA_SELECTOR.ERROR_LOADING_PREVIOUS_SAMPLES', error));
        })
      )
      .subscribe(response => {
        this.adsorbates = response.adsorbates;
        this.adsorbents = response.adsorbents;
        this.sample = this.versionDataService.getSample();
        if (this.sample) {
          this.sample.adsorbent = this.adsorbents.find(adsorbent => adsorbent.id === this.sample?.adsorbent_id)?.name;
          this.sample.adsorbate = this.adsorbates.find(adsorbate => adsorbate.id === this.sample?.adsorbate_id)?.iupac_name;
        }
      })

  }

  fetchData() {
    this.investigationService
      .deployDatasetVersion(this.investigationId, this.versionId)
      .subscribe({
        next: (response) => {
          this.processData(response);
          this.loadingHistoric = false;
        },
        error: (err) => {
          console.error('Error fetching data:', err);
          this.loadingHistoric = false;
        },
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

      for (let adjustMethod of model.adjustment_methods) {
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
          name: adjustMethod?.name,
          line: {shape: 'spline', color: this.colorByMethod[adjustMethod.name]},
          marker: {color: this.colorByMethod[adjustMethod.name]},
        };

        adjustMethod.graph.data.push({...graphData});
        adjustMethod.graph.data.push({...baseData});
        this.summaryGraph[model.model_id].data.push({...graphData})

        if (adjustMethod.name === bestAdjust?.name) {
          let bestGraphData = {...graphData};
          bestGraphData.name = modelName.name + " (" + adjustMethod?.name + ")";
          this.compareGraph?.data?.push({...bestGraphData});
        }
      }
      this.summaryGraph[model.model_id].data.push({...baseData});

    }
    this.compareGraph?.data?.push({...baseData});

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

  bestStatisticValue(modelId: number, statName: string): number | undefined {

    const bestFit = this.findBestAdjustMethod(modelId)
    return bestFit ? (bestFit.statistics as any)[statName] : undefined
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
      return Object.keys(sampleResiduals);

    } else {
      return ["not", "found"]
    }

  }

  bestResidualValue(modelId: number, residualName: string): number {
    const bestFit = this.findBestAdjustMethod(modelId)
    return bestFit ? (bestFit.residuals.analysis as any)[residualName] : 0
  }

  navigateToInvestigation() {

    let investigation = {
      shouldRender: true,
      investigation: {
        investigation_id: +this.investigationId,
        sample: this.sample!
      },
      stepId: 2,
      models: this.models,
      selectedModels: [],
      modelConfiguration: {} as IModelsConfigurations,
      modelConfigurationDone: true
    };

    if (this.data?.fitted_models) {
      for (const fittedModel of this.data?.fitted_models) {

        (investigation.selectedModels as number[]).push(fittedModel.model_id);

        investigation.modelConfiguration[fittedModel.model_id] = {
          automatedParams: false,
          selectedLinearizations: this.getLinearizations(fittedModel),
          paramValues: {},
          paramInfo: this.models?.find(model => model._id === fittedModel.model_id)?.parameters || {},
          paramSaved: undefined,
          iterations: DEFAULT_ITERATIONS,
          step: DEFAULT_STEPS

        };
        for (const paramValues of fittedModel.seeds) {
          investigation.modelConfiguration[fittedModel.model_id].paramValues[paramValues.name] = {
            value: paramValues.value,
            stderr: paramValues.stderr
          }
        }
      }
    }

    this.state.set({...investigation});

    this.router.navigate(['/investigation'], {queryParams: {fromHistoric: true}});
  }

  private getLinearizations(fittedModel: FittedModels | any) {
    return this.models?.find(model => model._id === fittedModel.model_id)?.linearizations || [];
  }

  findMatchedTransformedValues(modelId: number, value: number) {
    let adjustmentMethod = this.findBestAdjustMethod(modelId);
    if (!adjustmentMethod) return undefined;
    let index = adjustmentMethod?.transformed?.x.indexOf(value);

    return adjustmentMethod && index ? adjustmentMethod?.transformed?.y[index] : 0;
  }


  protected readonly Object = Object;
  protected readonly faArrowUpRightFromSquare = faArrowUpRightFromSquare;

  isLoggedUserInvestigation() {

    const userInfo = this.authService.getAuthUserInfo();

    if (userInfo && this.data) {
      return this.data.user.id === userInfo.id
    } else {
      return false
    }

  }

  protected readonly faArrowLeft = faArrowLeft;

  sampleIsActive() {
    return !this.data?.sample?.deleted_at;
  }
}
