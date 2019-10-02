import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgaModule } from '../../../theme/nga.module';
import { DashboardLineChartService } from '../../../theme/components/dashboardLineChart/dashboardLineChart.service';

import { Dashboard } from './dashboard.component';
import { routing } from './dashboard.routing';


@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        NgaModule,
        routing
    ],
    declarations: [
        Dashboard,
    ],
    providers: [
        DashboardLineChartService
      ]
})
export class DashboardModule { }