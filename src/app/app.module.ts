import {ErrorHandler, NgModule} from '@angular/core';
import {BrowserModule} from '@angular/platform-browser';

import {AppRoutingModule} from './app-routing.module';
import {AppComponent} from './app.component';
import {GraphComponent} from './components/graph/graph.component';

import Plotly from 'plotly.js-dist-min';
//import locale from 'plotly.js-locales/es';
import {PlotlyModule} from 'angular-plotly.js';
import {
  HTTP_INTERCEPTORS,
  HttpClient,
  HttpClientModule,
  provideHttpClient,
  withInterceptorsFromDi
} from "@angular/common/http";
import {NgbModule} from '@ng-bootstrap/ng-bootstrap';
import {NavigationComponent} from './components/navigation/navigation.component';
import {InvestigationComponent} from './components/investigation/investigation.component';
import {KineticsComponent} from './components/kinetics/kinetics.component';
import {KineticsModalComponent} from './components/kinetics/kinetics-modal.component';
import {KineticsDataSelectorComponent} from './components/kinetics-data-selector/kinetics-data-selector.component';
import {KineticsFileUploadComponent} from './components/kinetics-file-upload/kinetics-file-upload.component';
import {KineticsModelSelectorComponent} from './components/kinetics-model-selector/kinetics-model-selector.component';
import {KineticsModelConfigurationComponent} from './components/kinetics-model-configuration/kinetics-model-configuration.component';
import {KineticsModelCompareComponent} from './components/kinetics-model-compare/kinetics-model-compare.component';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {FontAwesomeModule} from '@fortawesome/angular-fontawesome';
import {DataSelectorComponent} from "./components/data-selector/data-selector.component";
import {ModelSelectorComponent} from './components/model-selector/model-selector.component';
import {ModelConfigurationComponent} from './components/model-configuration/model-configuration.component';
import {ModelCompareComponent} from './components/model-compare/model-compare.component';
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
import {HistoricInvestigationComponent} from './components/historic-investigation/historic-investigation.component';
import {MatList, MatListItem, MatNavList} from "@angular/material/list";
import {SnackBarComponent} from "./components/snack-bar/snack-bar.component";
import {HistoricVersionComponent} from './components/historic-version/historic-version.component';
import {LoginComponent} from './components/login/login.component';
import {AuthInterceptor} from "./common/auth.interceptor";
import {MatCheckbox} from "@angular/material/checkbox";
import {UsersComponent} from './components/users/users.component';
import {CreateUserComponent} from './components/create-user/create-user.component';
import {MatRadioButton, MatRadioGroup} from "@angular/material/radio";
import {EditUserComponent} from './components/edit-user/edit-user.component';
import {MatSlideToggle} from "@angular/material/slide-toggle";
import {MatPaginator} from "@angular/material/paginator";
import {LatexParagraphComponent} from './components/latex-paragraph/latex-paragraph.component';
import {MatSidenavContainer, MatSidenavModule} from "@angular/material/sidenav";
import {MatToolbar} from "@angular/material/toolbar";

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
    KineticsComponent,
    KineticsModalComponent,
    KineticsDataSelectorComponent,
    KineticsFileUploadComponent,
    KineticsModelSelectorComponent,
    KineticsModelConfigurationComponent,
    KineticsModelCompareComponent,
    DataSelectorComponent,
    ModelSelectorComponent,
    ModelConfigurationComponent,
    ModelCompareComponent,
    FileUploadComponent,
    MainPageComponent,
    LoadingComponent,
    DataVisualizerComponent,
    FitResultComponent,
    ErrorComponent,
    ErrorDialogComponent,
    InvestigationModalComponent,
    DownloaderComponent,
    HistoricInvestigationComponent,
    SnackBarComponent,
    HistoricVersionComponent,
    LoginComponent,
    UsersComponent,
    CreateUserComponent,
    EditUserComponent,
    LatexParagraphComponent
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
    MatTabBody,
    MatList,
    MatListItem,
    MatCheckbox,
    MatRadioGroup,
    MatRadioButton,
    MatSlideToggle,
    MatPaginator,
    MatSidenavContainer,
    MatNavList,
    MatToolbar,
    MatSidenavModule
  ],
  providers: [
    provideAnimationsAsync(),
    {
      provide: ErrorHandler, useClass: CustomErrorHandler
    },
    provideHttpClient(
      withInterceptorsFromDi(),
    ),
    {provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true}
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
