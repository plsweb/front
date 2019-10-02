import { Input, Component } from '@angular/core';
import 'easy-pie-chart/dist/jquery.easypiechart.js';

@Component({
    selector: 'dashboardPieChart',
    templateUrl: './dashboardPieChart.html',
    styleUrls: ['./dashboardPieChart.scss']
})
// TODO: move easypiechart to component
export class DashboardPieChart {

    @Input() titulo: string;
    @Input() subtitulo: string;
    @Input() icone: string;
    @Input() percentual;

    color:string = (localStorage.getItem("tema") == "dark_tema") ? "#fff" : "#25002e";

    private _init = false;

    constructor() {
    }

    ngAfterViewInit() {
        if (!this._init) {
            this.percentual = parseFloat(this.percentual);

            this._loadPieCharts();
            this._updatePieCharts();
            this._init = true;
        }
    }

    public _loadPieCharts() {
        let percentual = this.percentual.toFixed(1);
        let titulo = this.titulo;
        let color = this.color;

        jQuery('.chart#'+titulo).attr("data-percent", percentual).each(function () {
            let chart = jQuery(this);
            chart.easyPieChart({
                easing: 'easeOutBounce',
                onStep: function (from, to, percent) {
                    jQuery(this.el).find('.percent').text(percentual);
                },
                barColor: color,
                trackColor: 'rgba(0,0,0,0)',
                size: 84,
                scaleLength: 0,
                animation: 2000,
                lineWidth: 9,
                lineCap: 'round',
            });
        });
    }

    private _updatePieCharts() {
        let percentual = parseFloat(this.percentual);

        jQuery('.pie-charts .chart .' + this.titulo).each(function (index, chart) {
            jQuery(chart).data('easyPieChart').update(percentual);
        });
    }
}