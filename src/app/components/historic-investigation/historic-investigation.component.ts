import {Component} from '@angular/core';
import {InvestigationService} from "./investigation.service";
import {InvestigationResponse, InvestigationVersionsResponse} from "./interface";
import {faArrowUpRightFromSquare} from "@fortawesome/free-solid-svg-icons";

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

  fetchVersions(investigationId: number): void {
    const investigation = this.investigations?.investigations.find(
      (inv: any) => inv.investigation_id === investigationId
    );
    if (investigation && investigation.versions === undefined) {
      this.investigationService.getInvestigationVersions(investigationId).subscribe({
        next: (response: InvestigationVersionsResponse) => {
          investigation.versions = response.versions;
        },
        error: (error) => {
          console.error('Error fetching versions:', error);
        }
      });
    }

  }

  protected readonly faArrowUpRightFromSquare = faArrowUpRightFromSquare;
}
