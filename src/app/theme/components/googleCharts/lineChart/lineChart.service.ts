import { GoogleChartsBaseService } from '../google-charts.base.service';
import { Injectable } from '@angular/core';

declare var google: any;

@Injectable()
export class LineChartService extends GoogleChartsBaseService {

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

	public BuildLineChart(elementId: string, data: any[], config: any) : void {
		let chartFunc = () => { 
			// return new google.visualization.LineChart(document.getElementById(elementId));

			let chart = new google.visualization.LineChart(document.getElementById(elementId));
			google.visualization.events.addListener(chart, 'onmouseover', function(entry){
				chart.setSelection([{row: entry.row}]);
			});    
			 
			return chart;
		};
		
		let colors = (config['colors'] && config['colors'].length) ? config['colors'] : this.coresPadrao;

		let options = {
			title: config.title,
			titleTextStyle: {
				color: 'white',
				/**/fontSize: 14
			},
			// tooltip: {
			// 	ignoreBounds: true
			// },
			lineHole: config.lineHole,
			backgroundColor: 'transparent',
			is3D: true,
			colors: colors,
			tooltip: {trigger: 'both'},
			legend: config['legend'] || this.legendPadrao,
			fontSize: config['fontSize'],
			height: config['height'],
			width: config['width'],
			hAxis: {
				title: config['subtitulo1'] || '',
				textStyle: {
					color: config['legend'] ? config['legend'].textStyle.color : this.legendPadrao.textStyle.color,
				},
				// slantedText: false,
				titleTextStyle: {
					color: config['legend'] ? config['legend'].textStyle.color : this.legendPadrao.textStyle.color,
					/**/fontSize: 14, 
					bold: true,
					italic: true
				},
			},
			vAxis: {
				title: config['subtitulo2'] || '',
				textStyle: {
					color: config['legend'] ? config['legend'].textStyle.color : this.legendPadrao.textStyle.color
				},
				titleTextStyle: {
					color: config['legend'] ? config['legend'].textStyle.color : this.legendPadrao.textStyle.color,
					/**/fontSize: 14, 
					bold: true,
					italic: true
				},
			}
		};

		this.buildChart(data, chartFunc, options);
	}
}