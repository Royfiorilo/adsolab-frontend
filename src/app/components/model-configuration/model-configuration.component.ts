import {Component, EventEmitter, inject, Input, Output, SimpleChanges, TemplateRef} from '@angular/core';
import {Model} from "../model-selector/model";
import {IModelConfiguration} from "../investigation/interface";
import {DataSelectorService} from "../data-selector/data-selector.service";
import {ModelConfigurationService} from "./model-configuration.service";
import {ILinearizationGraph, ILinearizationRequest, ILinearizationResponse} from "./interface";
import {faInfoCircle} from "@fortawesome/free-solid-svg-icons";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";

@Component({
  selector: 'app-model-configuration',
  templateUrl: './model-configuration.component.html',
  styleUrl: './model-configuration.component.css'
})
export class ModelConfigurationComponent {
  @Input() selectedModels!: number[];
  @Input() investigationId!: number;
  @Input() modelConfiguration!: { [modelId: number]:  IModelConfiguration};
  @Input() models!: Model[];
  @Output() onSelectedConfiguration = new EventEmitter<number>();
  protected linearizationGraphs: {[key: number]: ILinearizationGraph[]} = {};
  private modalService = inject(NgbModal);

  constructor(private modelConfigurationService: ModelConfigurationService) {}

  getModelById(modelId: number): Model {
   return this.models.filter(model => model._id === modelId).pop()!;
  }
  open(content: TemplateRef<any>) {
    this.modalService.open(content)
  }

  runLinearization(modelId: number) {
    let model: Model = this.getModelById(modelId);
    let request: ILinearizationRequest = {investigation_id: this.investigationId, models: [{
        model: model.name,
        linearizations: model.linearizations.map(linearization => linearization.name)
      }]};

    this.modelConfigurationService.runLinearization(request).subscribe((response) => {

      this.linearizationGraphs[model._id] = [];

      for ( const linearization of response.results[0].linearizations){

        let slope:number = linearization.slope;
        let intercept:number= linearization.intercept;
        let xTransformed = linearization.transformed.x;
        let xMin:number= this.getMinValue(xTransformed!);
        let xMax:number= this.getMaxValue(xTransformed!);
        let linearizationGraph:ILinearizationGraph = {
          linearizationName: linearization.name,
        graph: {
          data: [
            {x: xTransformed, y: linearization.transformed.y, type: 'scatter', mode: 'markers', marker: {color: 'red'}},
            {x: [xMin, xMax], y: [(slope*xMin+intercept),(slope*xMax+intercept)], type: 'scatter', mode: 'line', marker: {color: 'blue'}},
          ],
            layout: {title: linearization.name}
        }
        }
        this.linearizationGraphs[modelId].push(linearizationGraph);
      }
    });
  }

  private getMaxValue(numbers: number[]) {
    return Math.max(...numbers);
  }

  private getMinValue(numbers: number[]) {
    return Math.min(...numbers);
  }

  selectConfiguration(event: Event,modelId:number): void {
    this.onSelectedConfiguration.emit(modelId);
  }

  protected readonly faInfoCircle = faInfoCircle;
}
