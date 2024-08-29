import {Component, EventEmitter, inject, Input, Output, TemplateRef} from '@angular/core';
import {faInfoCircle} from '@fortawesome/free-solid-svg-icons';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {ModelSelectorServiceService} from "./model-selector-service.service";
import {Model, ModelsResponse, Parameter, Linearization} from "./model";

@Component({
  selector: 'app-model-selector',
  templateUrl: './model-selector.component.html',
  styleUrl: './model-selector.component.css'
})
export class ModelSelectorComponent {
  @Input() selectedModels!: number[];
  @Input() models!: Model[];
  @Output() onSelectedModels: EventEmitter<number> = new EventEmitter();
  @Output() onLoadedModels: EventEmitter<Model[]> = new EventEmitter();
  private modalService = inject(NgbModal);
  protected readonly faInfoCircle = faInfoCircle;

constructor(private modelService: ModelSelectorServiceService) {
}
  ngOnInit() {
    if (this.models.length === 0){
      this.modelService.getModels().subscribe(response => {
        this.onLoadedModels.emit(response.models);
      });
    }
  }

  open(content: TemplateRef<any>) {
    this.modalService.open(content)
  }

  selectModel(modelId: number){
    this.onSelectedModels.emit(modelId);
  }

}
