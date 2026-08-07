import {Component, Input} from '@angular/core';
import {IParameter, IStatistics} from "../../common/common.interface";

@Component({
  selector: 'app-fit-result',
  templateUrl: './fit-result.component.html',
  styleUrl: './fit-result.component.css'
})
export class FitResultComponent {
  @Input() parameters!: IParameter[];
  @Input() statistics!: Partial<IStatistics>;

  getStatisticsInOrder() {

    let statisticsInOrder: Partial<IStatistics> = {
      chi_squared: this.statistics.chi_squared,
      adjust_chi_squeared: this.statistics.adjust_chi_squeared,
      r_squared: this.statistics.r_squared,
      adjust_r_squared: this.statistics.adjust_r_squared,
      AIC: this.statistics.AIC,
      BIC: this.statistics.BIC,
      HYBRID: this.statistics.HYBRID,
      RMSE: this.statistics.RMSE,
      SSE: this.statistics.SSE,
    };

    return Object.entries(statisticsInOrder).filter(([_, value]) => value !== undefined)
  }
}
