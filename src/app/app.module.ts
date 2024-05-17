import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { GraphComponent } from './graph/graph.component';

import Plotly from 'plotly.js-dist-min';
//import locale from 'plotly.js-locales/es';
import { PlotlyModule } from 'angular-plotly.js';
import {HttpClientModule} from "@angular/common/http";

//Plotly.register(locale)

PlotlyModule.plotlyjs = Plotly;

@NgModule({
  declarations: [
    AppComponent,
    GraphComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    PlotlyModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
