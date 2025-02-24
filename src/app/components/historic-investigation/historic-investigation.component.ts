import {Component} from '@angular/core';
import {InvestigationService} from "./investigation.service";
import {InvestigationResponse} from "./interface";

@Component({
  selector: 'app-historic-investigation',
  templateUrl: './historic-investigation.component.html',
  styleUrl: './historic-investigation.component.css'
})
export class HistoricInvestigationComponent {
  investigations: InvestigationResponse | undefined;

  constructor(private investigationService: InvestigationService) {
  }

  ngOnInit(): void {
    this.investigationService.getInvestigations().subscribe((data: InvestigationResponse) => {
      this.investigations = data;
    });
  }
}
