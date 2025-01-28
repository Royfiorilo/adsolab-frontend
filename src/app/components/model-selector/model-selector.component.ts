import {Component, EventEmitter, inject, Input, Output, TemplateRef} from '@angular/core';
import {faInfoCircle} from '@fortawesome/free-solid-svg-icons';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ModelSelectorServiceService} from "./model-selector-service.service";
import {Model} from "./model";
import {catchError, firstValueFrom} from "rxjs";
import {TranslateService} from "@ngx-translate/core";


interface Model2 {
  name: string;
  description: string;
  selected: boolean;
  icon?: string;
}


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
  protected loadingModels: boolean = false;


  protected models2: Model2[] = [
    {
      name: 'Langmuir',
      description: 'Best for monolayer adsorption processes',
      selected: false,
      icon: 'analytics'
    },
    {
      name: 'Freundlich',
      description: 'Suitable for heterogeneous surface processes',
      selected: false,
      icon: 'show_chart'
    }
  ];

  selectModel2(model: Model2): void {
    // If you want single selection
    this.models.forEach(m => m.selected = false);
    model.selected = true;

    // If you want multiple selection, use this instead:
    // model.selected = !model.selected;
  }

  constructor(private modelService: ModelSelectorServiceService, private translateService: TranslateService) {
  }

  ngOnInit() {
    if (this.models.length === 0) {
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

  open(content: TemplateRef<any>) {
    this.modalService.open(content)
  }

  selectModel(modelId: number) {
    this.onSelectedModels.emit(modelId);
  }

}
