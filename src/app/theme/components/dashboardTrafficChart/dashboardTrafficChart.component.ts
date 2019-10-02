import { Input, Component } from '@angular/core';

import * as Chart from 'chart.js';

@Component({
  selector: 'dashboardTrafficChart',
  templateUrl: './dashboardTrafficChart.html',
  styleUrls: ['./dashboardTrafficChart.scss']
})

// TODO: move chart.js to it's own component
export class DashboardTrafficChart {
  @Input() dados;

  public doughnutData: Array<Object>;

  ngAfterViewInit() {
    this._loadDoughnutCharts();
  }

  private _loadDoughnutCharts() {
    let el = jQuery('.chart-area').get(0) as HTMLCanvasElement;
    new Chart(el.getContext('2d')).Doughnut(this.doughnutData, {
      segmentShowStroke: false,
      percentageInnerCutout: 64,
      responsive: true
    });
  }
}
