import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {GraphComponent} from "./components/graph/graph.component";
import {InvestigationComponent} from "./components/investigation/investigation.component";
import {MainPageComponent} from "./components/main-page/main-page.component";
import {ErrorComponent} from "./components/error/error.component";
import {HistoricInvestigationComponent} from "./components/historic-investigation/historic-investigation.component";
import {HistoricVersionComponent} from "./components/historic-version/historic-version.component";
import {LoginComponent} from "./components/login/login.component";
import {canActivate} from "./common/auth.service";

const routes: Routes = [
  {path: '', component: MainPageComponent, canActivate: [canActivate]},
  {path: 'graph', component: GraphComponent},
  {path: 'investigation', component: InvestigationComponent, canActivate: [canActivate]},
  {path: 'historic', component: HistoricInvestigationComponent, canActivate: [canActivate]},
  {path: 'error', component: ErrorComponent},
  {path: 'historic/version/:invId/:verId', component: HistoricVersionComponent, canActivate: [canActivate]},
  {path: 'login', component: LoginComponent},


];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
