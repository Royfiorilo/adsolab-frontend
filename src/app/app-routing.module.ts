import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {GraphComponent} from "./components/graph/graph.component";
import {InvestigationComponent} from "./components/investigation/investigation.component";
import {AppComponent} from "./app.component";

const routes: Routes = [
  {path: 'graph', component: GraphComponent},
  {path: 'investigation', component: InvestigationComponent}

];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
