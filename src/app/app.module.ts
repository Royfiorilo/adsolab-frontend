import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { GraphComponent } from './components/graph/graph.component';

import Plotly from 'plotly.js-dist-min';
//import locale from 'plotly.js-locales/es';
import { PlotlyModule } from 'angular-plotly.js';
import {HttpClientModule} from "@angular/common/http";
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NavigationComponent } from './components/navigation/navigation.component';
import { InvestigationComponent } from './components/investigation/investigation.component';
import {FormsModule} from "@angular/forms";
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import {DataSelectorComponent} from "./components/data-selector/data-selector.component";
import { ModelSelectorComponent } from './components/model-selector/model-selector.component';
import { ModelConfigurationComponent } from './components/model-configuration/model-configuration.component';
import { ModelCompareComponent } from './components/model-compare/model-compare.component';
import { ProgressBarComponent } from './components/progress-bar/progress-bar.component';
import { FileUploadComponent } from './components/file-upload/file-upload.component';
import { MainPageComponent } from './components/main-page/main-page.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

//Plotly.register(locale)

PlotlyModule.plotlyjs = Plotly;

@NgModule({
  declarations: [
    AppComponent,
    GraphComponent,
    NavigationComponent,
    InvestigationComponent,
    DataSelectorComponent,
    ModelSelectorComponent,
    ModelConfigurationComponent,
    ModelCompareComponent,
    ProgressBarComponent,
    FileUploadComponent,
    MainPageComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    PlotlyModule,
    NgbModule,
    FormsModule,
    FontAwesomeModule
  ],
  providers: [
    provideAnimationsAsync()
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
