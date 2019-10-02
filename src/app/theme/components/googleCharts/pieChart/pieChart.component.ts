import { Component, Input, OnInit } from '@angular/core';

import { PieChartService } from './pieChart.service';

declare var google: any;

@Component({
	selector: 'pie-chart',
	templateUrl: './pieChart.html',
	providers: [PieChartService]
})
export class PieChartComponent implements OnInit {

    @Input() data: any[];
    @Input() config: Object;
    @Input() elementId: string;

    constructor(private _pieChartService: PieChartService) {}

    ngOnInit(): void {
        console.log(this.config);
        
        this._pieChartService.BuildPieChart(`${this.elementId}`, this.data, this.config); 
    }
}