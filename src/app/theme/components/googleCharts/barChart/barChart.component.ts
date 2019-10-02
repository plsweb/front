import { Component, Input, OnInit } from '@angular/core';

import { BarChartService } from './barChart.service';

declare var google: any;

@Component({
	selector: 'bar-chart',
	templateUrl: './barChart.html',
	providers: [BarChartService]
})
export class BarChartComponent implements OnInit {

    @Input() data: any[];
    @Input() config: Object;
    @Input() elementId: string;

    constructor(private _barChartService: BarChartService) {}

    ngOnInit(): void {
        this._barChartService.BuildBarChart(`${this.elementId}`, this.data, this.config); 
    }
}