import {Component, EventEmitter, inject, Input, Output, TemplateRef} from '@angular/core';
import {faInfoCircle} from '@fortawesome/free-solid-svg-icons';
import { ModalDismissReasons, NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-model-selector',
  templateUrl: './model-selector.component.html',
  styleUrl: './model-selector.component.css'
})
export class ModelSelectorComponent {
  @Input() models!: { name: string; description: string; params: number }[];
  @Input() selectedModels!: string[];
  @Output() onSelectedModels: EventEmitter<string> = new EventEmitter();
  private modalService = inject(NgbModal);
  protected readonly faInfoCircle = faInfoCircle;

  open(content: TemplateRef<any>) {
    this.modalService.open(content)
  }

  selectModel(modelName: string){
    this.onSelectedModels.emit(modelName);
  }

}
