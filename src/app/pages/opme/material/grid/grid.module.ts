import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgaModule } from 'app/theme/nga.module';

import { Grid } from './grid.component';
import { routing } from './grid.routing';

@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        NgaModule,
        routing,
    ],
    declarations: [
        Grid
    ]
})
export class GridModule { }