import {Component, EventEmitter, inject, Input, Output, TemplateRef} from '@angular/core';
import {faInfoCircle} from '@fortawesome/free-solid-svg-icons';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {IModelResult} from "../graph/interface";
import {ModelSelectorServiceService} from "./model-selector-service.service";
import {Model, ModelsResponse, Parameter, Linearization} from "./model";

@Component({
  selector: 'app-model-selector',
  templateUrl: './model-selector.component.html',
  styleUrl: './model-selector.component.css'
})
export class ModelSelectorComponent {
  protected models: Model[] = [];
  @Input() selectedModels!: string[];
  @Output() onSelectedModels: EventEmitter<string> = new EventEmitter();
  private modalService = inject(NgbModal);
  protected readonly faInfoCircle = faInfoCircle;

constructor(private modelService: ModelSelectorServiceService) {
}
  ngOnInit() {
    this.modelService.getModels().subscribe(response => {
      this.models = response.models;
    });
  }

  open(content: TemplateRef<any>) {
    this.modalService.open(content)
  }

  selectModel(modelName: string){
    this.onSelectedModels.emit(modelName);
  }

}
