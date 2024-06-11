import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { GraphComponent } from './graph/graph.component';

import Plotly from 'plotly.js-dist-min';
//import locale from 'plotly.js-locales/es';
import { PlotlyModule } from 'angular-plotly.js';
import {HttpClientModule} from "@angular/common/http";
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NavigationComponent } from './navigation/navigation.component';
import { InvestigationComponent } from './investigation/investigation.component';
import {FormsModule} from "@angular/forms";

//Plotly.register(locale)

PlotlyModule.plotlyjs = Plotly;

@NgModule({
  declarations: [
    AppComponent,
    GraphComponent,
    NavigationComponent,
    InvestigationComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    PlotlyModule,
    NgbModule,
    FormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
