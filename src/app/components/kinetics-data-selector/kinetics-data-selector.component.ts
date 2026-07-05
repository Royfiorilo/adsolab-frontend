import {Component, EventEmitter, Input, Output} from '@angular/core';
import {IKineticsSample} from "../kinetics/interface";
import {KineticsSampleService} from "./kinetics-sample.service";
import {TranslateService} from "@ngx-translate/core";
import {MatDialog} from "@angular/material/dialog";
import {firstValueFrom} from "rxjs";
import {ErrorDialogComponent} from "../error-dialog/error-dialog.component";

@Component({
  selector: 'app-kinetics-data-selector',
  templateUrl: './kinetics-data-selector.component.html',
  styleUrl: './kinetics-data-selector.component.css'
})
export class KineticsDataSelectorComponent {
  @Input() kineticsSample: IKineticsSample | undefined;
  @Output() onSampleLoaded: EventEmitter<IKineticsSample> = new EventEmitter();

  constructor(
    private kineticsSampleService: KineticsSampleService,
    private translateService: TranslateService,
    private dialog: MatDialog) {
  }

  private isSampleReadyToSubmit(sample: IKineticsSample): boolean {
    return sample.description !== undefined && sample.description !== '' &&
      sample.adsorbate_id !== undefined &&
      sample.adsorbent_id !== undefined &&
      sample.temperature !== undefined;
  }

  onUploadDataSample(sample: IKineticsSample) {
    if (!this.isSampleReadyToSubmit(sample)) {
      return;
    }

    this.kineticsSampleService.createKineticSample(sample).subscribe({
      error: async (error) => {
        this.dialog.open(ErrorDialogComponent, {
          data: {
            main_message: await firstValueFrom(this.translateService.get('KINETICS_DATA_SELECTOR.CREATE_SAMPLE_ERROR')),
            error_message: error.message,
          }
        })
      },
      next: (response) => {
        sample.title = response.title;
        sample.sample_id = response.kinetic_sample_id;
        this.onSampleLoaded.emit(sample);
      }
    });
  }
}
