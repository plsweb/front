import { Component, Input, OnInit } from '@angular/core';

import { LineChartService } from './lineChart.service';

declare var google: any;

@Component({
	selector: 'line-chart',
	templateUrl: './lineChart.html',
	providers: [LineChartService]
})
export class LineChartComponent implements OnInit {

    @Input() data: any[];
    @Input() config: Object;
    @Input() elementId: string;

    constructor(private _lineChartService: LineChartService) {}

    ngOnInit(): void {
        this._lineChartService.BuildLineChart(`${this.elementId}`, this.data, this.config); 
    }
}