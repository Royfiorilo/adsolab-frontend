import {Component, EventEmitter, inject, Output, SimpleChanges, TemplateRef} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ModelSelectorServiceService} from "./model-selector-service.service";
import {Model} from "./model";
import {catchError, firstValueFrom} from "rxjs";
import {TranslateService} from "@ngx-translate/core";
import {StateService} from "../investigation/state.service";

@Component({
  selector: 'app-model-selector',
  templateUrl: './model-selector.component.html',
  styleUrl: './model-selector.component.css'
})
export class ModelSelectorComponent {
  @Output() onSelectedModels: EventEmitter<number> = new EventEmitter();
  @Output() onLoadedModels: EventEmitter<Model[]> = new EventEmitter();
  private modalService = inject(NgbModal);
  protected loadingModels: boolean = false;
  state = this.stateService.state;

  constructor(private modelService: ModelSelectorServiceService, private translateService: TranslateService, protected stateService: StateService) {
  }

  ngOnInit() {
    this.getModels();
  }

  private getModels() {
    if (this.state().models.length === 0) {
      this.loadingModels = true;
      this.modelService.getModels()
        .pipe(catchError(async (error) => {
          throw await firstValueFrom(this.translateService.get('MODEL_SELECTOR.ERROR_LOADING_MODELS', error));
        }))
        .subscribe(response => {
          this.loadingModels = false;
          this.onLoadedModels.emit(response.models);
        });
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.getModels();
    if (this.state().stepId && this.state().stepId === 1) {
      this.getModels();
    }
  }

  open(content: TemplateRef<any>) {
    this.modalService.open(content)
  }

  selectModel(modelId: number) {
    this.onSelectedModels.emit(modelId);
  }

}
