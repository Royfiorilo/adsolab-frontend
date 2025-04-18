import {Component, EventEmitter, inject, Output, SimpleChanges, TemplateRef} from '@angular/core';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ModelSelectorServiceService} from "./model-selector-service.service";
import {Model} from "./model";
import {catchError, firstValueFrom} from "rxjs";
import {TranslateService} from "@ngx-translate/core";
import {StateService} from "../investigation/state.service";
import {ErrorDialogComponent} from "../error-dialog/error-dialog.component";
import {MatDialog} from "@angular/material/dialog";

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
  currentLang: string;

  constructor(private dialog: MatDialog, private modelService: ModelSelectorServiceService, private translateService: TranslateService, protected stateService: StateService) {
    this.currentLang = this.translateService.currentLang || this.translateService.getDefaultLang() || 'es';
    this.translateService.onLangChange.subscribe(event => {
      this.currentLang = event.lang;
    });
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

  parseDescription(description: string): string {
    try {
      const parsedDesc = JSON.parse(description);
      return parsedDesc[this.currentLang] ? parsedDesc[this.currentLang] : description;
    } catch (e: any) {
      this.dialog.open(ErrorDialogComponent, {
        data: {
          main_message: this.translateService.instant('MODEL_SELECTOR.ERROR')
        }
      });
      return description;
    }
  }
}
