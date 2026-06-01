import {Component, OnInit} from '@angular/core';
import {TranslateService} from "@ngx-translate/core";
import {Router} from "@angular/router";
import {faChartLine, faClock, faFlaskVial, faHistory} from "@fortawesome/free-solid-svg-icons";
import {InvestigationService} from "../historic-investigation/investigation.service";
import {Investigation} from "../historic-investigation/interface";

const RECENT_ACTIVITY_PAGE_SIZE = 5;

@Component({
  selector: 'app-main-page',
  templateUrl: './main-page.component.html',
  styleUrl: './main-page.component.css'
})
export class MainPageComponent implements OnInit {

  recentInvestigations: Investigation[] = [];
  totalInvestigations = 0;
  loadingActivity = true;
  activityError = false;

  protected readonly faFlaskVial = faFlaskVial;
  protected readonly faClock = faClock;
  protected readonly faChartLine = faChartLine;
  protected readonly faHistory = faHistory;

  constructor(translate: TranslateService, private router: Router, private investigationService: InvestigationService) {
    translate.setDefaultLang('es');
    translate.use('es');
  }

  ngOnInit(): void {
    this.loadRecentActivity();
  }

  goToEquilibrium(): void {
    this.router.navigate(['/investigation']);
  }

  // Most recent saved version timestamp, used as the activity date.
  lastVersionDate(investigation: Investigation): string | undefined {
    const versions = investigation.versions;
    return versions?.length ? versions[versions.length - 1].created_at : undefined;
  }

  private loadRecentActivity(): void {
    this.investigationService.getInvestigations(1, RECENT_ACTIVITY_PAGE_SIZE).subscribe({
      next: response => {
        this.recentInvestigations = response.investigations;
        this.totalInvestigations = response.total;
        this.loadingActivity = false;
      },
      error: () => {
        this.loadingActivity = false;
        this.activityError = true;
      }
    });
  }
}
