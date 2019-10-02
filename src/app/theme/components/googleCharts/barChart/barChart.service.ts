import { GoogleChartsBaseService } from '../google-charts.base.service';
import { Injectable } from '@angular/core';

declare var google: any;

@Injectable()
export class BarChartService extends GoogleChartsBaseService {

	constructor() { super(); }

	coresPadrao = [
		'#00995D',
		'#B1D34B',
		'#FFF0C7',
		'#ED1651',
		'#A3238E',
		'#F47920',
		'#FFCB08',
		'#C4CBCF',
		'#00401A',
		'#411564',
		'#0A5F55',
		'#5B5C65',
		'#682D00'
	];

	legendPadrao= {
		textStyle: {
			color: 'white'
		}
	};

	public BuildBarChart(elementId: string, data: any[], config:any) : void {
		let chartFunc = () => { 
			let chart = new google.visualization.ColumnChart(document.getElementById(elementId));
			google.visualization.events.addListener(chart, 'onmouseover', (entry) => {
				chart.setSelection([{row: entry.row}]);
			});    

			google.visualization.events.addListener(chart, 'click', function(e) {
				var match = e.targetID.match(/hAxis#(\d+)#label#(\d+)/);
				if (match != null && match.length) {
					var rowIndex = parseInt(match[2]);
					chart.setSelection([]);
					chart.setSelection([{row: rowIndex, column: 1}]);
				}
			});
			 
			return chart;
		};

		let colors = (config['colors'] && config['colors'].length) ? config['colors'] : this.coresPadrao;
		let colorText = (config['legend']) ? config['legend'] : this.legendPadrao;

		let options = {
			title: config.title,
			titleTextStyle: {
				color: colorText.textStyle.color,
				/**/fontSize: 14
			},
			barHole: 0.4,
			backgroundColor: 'transparent',
			sliceVisibilityThreshold: 0.0005,
			colors: colors,
			focusTarget:'category',
			selectionMode:'single',
			tooltip: {trigger: 'both'},
			legend: colorText.textStyle.color,
			fontSize: config['fontSize'],
			height: config['height'],
			width: config['width'],
			hAxis: {
				title: config['subtitulo1'] || '',
				titleTextStyle: {
					color: colorText.textStyle.color,
					/**/fontSize: 14, 
					bold: true,
					italic: true
				},
				textStyle: {
					color: colorText.textStyle.color,
				}
			},
			vAxis: {
				title: config['subtitulo2'] || '',
				titleTextStyle: {
					color: colorText.textStyle.color,
					/**/fontSize: 14, 
					bold: true,
					italic: true
				},
				textStyle: {
					color: colorText.textStyle.color,
				}
			}
		};

		this.buildChart(data, chartFunc, options);
	}
}