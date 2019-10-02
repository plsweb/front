import { GoogleChartsBaseService } from '../google-charts.base.service';
import { Injectable } from '@angular/core';

declare var google: any;

@Injectable()
export class PieChartService extends GoogleChartsBaseService {

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

	constructor() { super(); }

	public BuildPieChart(elementId: string, data: any[], config: any) : void {
		let chartFunc = () => {

			let chart = new google.visualization.PieChart(document.getElementById(elementId));
			
			google.visualization.events.addListener( chart, 'ready', () => this.customFn(elementId, config) );
			
			google.visualization.events.addListener(chart, 'onmouseover', function(entry){
				chart.setSelection([{row: entry.row}]);
			});    

			return chart;

		};

		let colors = (config['colors'] && config['colors'].length) ? config['colors'] : this.coresPadrao;

		let options = {
			title: config['title'],
			titleTextStyle: {
				color: '#ffffff',
				/**/fontSize: 14, 
			},
			pieHole: config['pieHole'],
			sliceVisibilityThreshold: .0,
			backgroundColor: 'transparent',
			focusTarget:'category',
			selectionMode:'single',
			tooltip: {trigger: 'both'},
			colors: colors,
			is3D: true,
			legend: config['legend'] || this.legendPadrao,
			fontSize: config['fontSize'],
			height: config['height'],
			width: config['width'],
			hAxis: {
				textStyle: {
					color: config['legend'] ? config['legend'].textStyle.color : this.legendPadrao.textStyle.color
				},
				slantedText: false,
				titleTextStyle: {
					color: config['legend'] ? config['legend'].textStyle.color : this.legendPadrao.textStyle.color,
					/**/fontSize: 14, 
					bold: true,
					italic: true
				},
			},
			vAxis: {
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

	customFn(elementId, config){

		if( config.subtitulo1 ){
			let color = config['legend'] ? config['legend'].textStyle.color : this.legendPadrao.textStyle.color;

			var container = `
				<div class="subtitle1_pieChart">
					<span class="span_pieChart" style="color:${color};font-size:12px;">${config.subtitulo1}</span>
				</div>
			`
			$(document.getElementById(elementId)).append(container);
		}

	}
}