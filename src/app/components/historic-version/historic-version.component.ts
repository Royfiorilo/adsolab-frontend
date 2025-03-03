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


@Component({
  selector: 'app-historic-version',
  templateUrl: './historic-version.component.html',
  styleUrl: './historic-version.component.css',
})
export class HistoricVersionComponent {
  @ViewChildren(MatAccordion) accordions!: QueryList<MatAccordion>;
  @ViewChild('comparisonPlot') comparisonPlot!: PlotlyComponent;
  versionId: string = '0';
  investigationId: string = '0';
  protected models: Model[] = [];
  protected data: InvestigationData | undefined;


  constructor(
    private route: ActivatedRoute,
    private investigationService: InvestigationService,
    private modelService: ModelSelectorServiceService,
    protected commonUtilsService: CommonUtilsService,
    private translateService: TranslateService
  ) {
  }

  ngOnInit() {
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
        console.log(this.models);
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
  }

}
