import { Component } from '@angular/core';
import {GraphService} from "./graph.service";
import {IModelResult} from "./interface";

@Component({
  selector: 'app-graph',
  templateUrl: './graph.component.html',
  styleUrl: './graph.component.css'
})
export class GraphComponent {

  private ce: number[] = [];
  protected qe: number[] = [];
  protected graph: any = {};

  constructor(private graphService: GraphService) {}

  ngOnInit() {

    this.ce = [4.7, 7.0, 9.31, 16.6, 32.5, 62.8];

    this.graphService
      .getLangmuirResults(this.ce)
      .subscribe((results: IModelResult) => {
        this.qe = results.y;
        this.graph = {
          data: [
            { x: this.ce, y: this.qe, type: 'scatter', mode: 'lines+markers', marker: {color: 'red'} },
          ],
          layout: {title: 'Modelo de Langmuir'}
        };
      });

  }

}
