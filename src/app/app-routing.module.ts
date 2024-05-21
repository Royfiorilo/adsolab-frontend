import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import {GraphComponent} from "./graph/graph.component";
import {AppComponent} from "./app.component";

const routes: Routes = [
  {path: 'graph', component: GraphComponent}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
