import {ErrorHandler, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {GraphComponent} from './components/graph/graph.component';

import Plotly from 'plotly.js-dist-min';
//import locale from 'plotly.js-locales/es';
import {PlotlyModule} from 'angular-plotly.js';
import {HttpClient, HttpClientModule} from "@angular/common/http";
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {NavigationComponent} from './components/navigation/navigation.component';
import {InvestigationComponent} from './components/investigation/investigation.component';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {DataSelectorComponent} from "./components/data-selector/data-selector.component";
import {ModelSelectorComponent} from './components/model-selector/model-selector.component';
import {ModelConfigurationComponent} from './components/model-configuration/model-configuration.component';
import {ModelCompareComponent} from './components/model-compare/model-compare.component';
import {ProgressBarComponent} from './components/progress-bar/progress-bar.component';
import {FileUploadComponent} from './components/file-upload/file-upload.component';
import {MainPageComponent} from './components/main-page/main-page.component';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {MatStepperModule} from '@angular/material/stepper';
import {MatButtonModule} from '@angular/material/button';
import {MatIconModule} from '@angular/material/icon';
import {LoadingComponent} from './components/loading/loading.component';
import {MatProgressSpinner} from "@angular/material/progress-spinner";
import {DataVisualizerComponent} from './components/data-visualizer/data-visualizer.component';
import {NgOptimizedImage} from "@angular/common";
import {MatAutocompleteModule} from '@angular/material/autocomplete';
import {MatInputModule} from '@angular/material/input';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {TranslateLoader, TranslateModule} from "@ngx-translate/core";
import {TranslateHttpLoader} from "@ngx-translate/http-loader";
import {MatButtonToggleModule} from '@angular/material/button-toggle';
import {MatTabBody, MatTabsModule} from '@angular/material/tabs';
import {MatSelect} from "@angular/material/select";
import {MatExpansionModule} from '@angular/material/expansion';
import {MatTooltipModule} from "@angular/material/tooltip";
import {MatTableModule} from "@angular/material/table";
import {MatCardModule} from "@angular/material/card";
import {MatProgressBarModule} from "@angular/material/progress-bar";
import {MatDividerModule} from "@angular/material/divider";
import {FitResultComponent} from './components/fit-result/fit-result.component';
import {MatGridListModule} from "@angular/material/grid-list";
import {MatRippleModule} from "@angular/material/core";
import {ErrorComponent} from './components/error/error.component';
import {CustomErrorHandler} from "./common/custom-error-handler";
import {
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogModule,
  MatDialogTitle
} from "@angular/material/dialog";
import {ErrorDialogComponent} from './components/error-dialog/error-dialog.component';
import {InvestigationModalComponent} from "./components/investigation/investigation-modal.component";
import {DownloaderComponent} from "./components/downloader/downloader.component";

//Plotly.register(locale)

PlotlyModule.plotlyjs = Plotly;

export function HttpLoaderFactory(httpClient: HttpClient) {
  return new TranslateHttpLoader(httpClient);
}

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
    MainPageComponent,
    LoadingComponent,
    DataVisualizerComponent,
    FitResultComponent,
    ErrorComponent,
    ErrorDialogComponent,
    InvestigationModalComponent,
    DownloaderComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    PlotlyModule,
    NgbModule,
    FormsModule,
    FontAwesomeModule,
    MatStepperModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinner,
    NgOptimizedImage,
    MatAutocompleteModule,
    MatInputModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    MatProgressSpinner,
    MatButtonToggleModule,
    MatTabsModule,
    MatExpansionModule,
    MatTooltipModule,
    MatTableModule,
    MatCardModule,
    MatProgressBarModule,
    MatDividerModule,
    MatGridListModule,
    MatRippleModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      },
      defaultLanguage: 'es'
    }),
    MatDialogModule,
    MatSelect,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatTabBody
  ],
  providers: [
    provideAnimationsAsync(),
    {
      provide: ErrorHandler, useClass: CustomErrorHandler
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
