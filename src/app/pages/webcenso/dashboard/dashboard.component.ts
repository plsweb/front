import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

import { Servidor, DashboardService } from '../../../services';

@Component({
	selector: 'dashboard',
	templateUrl: './dashboard.html',
	styleUrls: ['./dashboard.scss'],
})
export class Dashboard implements OnInit {
	pieCharts;
	trafficCharts;
	lineCharts;

	constructor(
        private toastr: ToastrService,
        private serviceDashboard: DashboardService,
    ) {}

	ngOnInit() {
		this.serviceDashboard.getDashboard1().subscribe(
            (pieCharts) => {
				this.pieCharts = pieCharts;
			}, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
		);

		this.serviceDashboard.getDashboard2().subscribe(
            (trafficCharts) => {
				this.trafficCharts = trafficCharts;
			}, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
		);

		this.serviceDashboard.getDashboard3().subscribe(
            (lineCharts) => {
				this.lineCharts = lineCharts;
			}, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
		);
    }
}