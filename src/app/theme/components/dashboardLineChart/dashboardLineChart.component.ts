import {Component} from '@angular/core';

import {DashboardLineChartService} from './dashboardLineChart.service';

@Component({
  selector: 'dashboardLineChart',
  templateUrl: './dashboardLineChart.html',
  styleUrls: ['./dashboardLineChart.scss']
})
export class DashboardLineChart {

  chartData:Object;

  constructor(private _lineChartService:DashboardLineChartService) {
    this.chartData = this._lineChartService.getData();
  }

  initChart(chart:any) {
    let zoomChart = () => {
      chart.zoomToDates(new Date(2013, 3), new Date(2014, 0));
    };

    chart.addListener('rendered', zoomChart);
    zoomChart();

    if (chart.zoomChart) {
      chart.zoomChart();
    }
  }
}
