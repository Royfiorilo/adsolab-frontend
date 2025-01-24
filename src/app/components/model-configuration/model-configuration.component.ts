import {Component, EventEmitter, inject, Input, Output, SimpleChanges, TemplateRef} from '@angular/core';
import {Model} from "../model-selector/model";
import {ModelConfigurationService} from "./model-configuration.service";
import {ILinearizationGraph, ILinearizationRequest} from "./interface";
import {faInfoCircle} from "@fortawesome/free-solid-svg-icons";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {DataSample} from "../data-selector/data-sample";
import {CommonUtilsService} from "../../common/common.service";
import {IModelsConfigurations} from "../../common/common.interface";

@Component({
  selector: 'app-model-configuration',
  templateUrl: './model-configuration.component.html',
  styleUrl: './model-configuration.component.css'
})
export class ModelConfigurationComponent {
  @Input() dataSample: DataSample | undefined;
  @Input() selectedModels!: number[];
  @Input() investigationId: number | undefined;
  @Input() modelConfiguration!: IModelsConfigurations;
  @Input() models!: Model[];
  @Output() onSelectedConfiguration = new EventEmitter<number>();
  @Output() onSelectedParams = new EventEmitter<IModelsConfigurations>();
  protected linearizationGraphs: { [key: number]: ILinearizationGraph[] } = {};
  private modalService = inject(NgbModal);
  protected runningLinearization: boolean = false;

  constructor(private modelConfigurationService: ModelConfigurationService,
              protected commonUtilsService: CommonUtilsService) {

  }

  ngOnChanges(changes: SimpleChanges) {

    this.cleanLinearizationGraphs(changes);

    console.log(this.modelConfiguration)

  }

  private cleanLinearizationGraphs(changes: SimpleChanges) {
    if (changes['selectedModels'] && !changes['selectedModels'].firstChange && changes['selectedModels'].currentValue !== changes['selectedModels'].previousValue) {

      let modelSelectionDiff = [
        ...changes['selectedModels'].currentValue?.filter((modelId: number) => !changes['selectedModels'].previousValue?.includes(modelId)),
        ...changes['selectedModels'].previousValue?.filter((modelId: number) => !changes['selectedModels'].currentValue?.includes(modelId))
      ];

      modelSelectionDiff.forEach(modelId => delete this.linearizationGraphs[modelId])
    }
  }

  open(content: TemplateRef<any>) {
    this.modalService.open(content)
  }

  runLinearization(modelId: number) {
    let model: Model = this.commonUtilsService.getModelById(modelId, this.models);
    if (this.investigationId) {
      let request: ILinearizationRequest = {
        investigation_id: this.investigationId, models: [{
          model: model._id,
          linearizations: model.linearizations.map(linearization => linearization.linearization_id)
        }]
      };

      this.runningLinearization = true;

      this.modelConfigurationService.runLinearization(request).subscribe((response) => {

        this.runningLinearization = false;

        this.linearizationGraphs[model._id] = [];
        let linearizations = response.results[0].linearizations;

        for (const linearization of linearizations) {

          let slope: number = linearization.slope;
          let intercept: number = linearization.intercept;
          let xTransformed = linearization.transformed.x;
          let xMin: number = this.getMinValue(xTransformed!);
          let xMax: number = this.getMaxValue(xTransformed!);
          let linearizationGraph: ILinearizationGraph = {
            parameters: linearization.parameters,
            statistics: linearization.statistics,
            isBestResult: linearization.id === +response.results[0].best_result,
            linearizationName: linearization.name,
            graph: {
              data: [
                {
                  x: xTransformed,
                  y: linearization.transformed.y,
                  type: 'scatter',
                  mode: 'markers',
                  marker: {color: 'red'}
                },
                {
                  x: [xMin, xMax],
                  y: [(slope * xMin + intercept), (slope * xMax + intercept)],
                  type: 'scatter',
                  mode: 'line',
                  marker: {color: 'blue'}
                },
              ],
              layout: {title: '', autosize: true}
            }
          }

          //asign param values
          if (linearizationGraph.isBestResult) {
            for (const parameter of linearization.parameters) {
              this.modelConfiguration[modelId].paramValues[parameter.name] = parameter.value
            }
          }

          this.linearizationGraphs[modelId].push(linearizationGraph);
        }

        this.onSelectedParams.emit(this.modelConfiguration);

      });
    }
  }

  private getMaxValue(numbers: number[]) {
    return Math.max(...numbers);
  }

  private getMinValue(numbers: number[]) {
    return Math.min(...numbers);
  }

  protected readonly faInfoCircle = faInfoCircle;

  onChange(event: Event, modelId: number, key: string) {

    this.modelConfiguration[modelId].paramValues[key] = +(event.target as HTMLInputElement).value


    this.onSelectedParams.emit(this.modelConfiguration)

  }
}
