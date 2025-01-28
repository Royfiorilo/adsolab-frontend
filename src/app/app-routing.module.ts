import {NgModule} from '@angular/core';
import {RouterModule, Routes} from '@angular/router';
import {GraphComponent} from "./components/graph/graph.component";
import {InvestigationComponent} from "./components/investigation/investigation.component";
import {MainPageComponent} from "./components/main-page/main-page.component";
import {ErrorComponent} from "./components/error/error.component";

const routes: Routes = [
  {path: '', component: MainPageComponent},
  {path: 'graph', component: GraphComponent},
  {path: 'investigation', component: InvestigationComponent},
  {path: 'error', component: ErrorComponent}

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {
}
