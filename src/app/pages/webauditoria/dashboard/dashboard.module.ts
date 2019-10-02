import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NgaModule } from '../../../theme/nga.module';
import { Dashboard } from './dashboard.component';
import { routing } from './dashboard.routing';



@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        NgaModule,
        NgbModalModule,
        routing,
    ],
    declarations: [
        Dashboard
    ]
})
export class DashboardModule { }