import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgaModule } from '../../../../theme/nga.module';

import { Grid } from './grid.component';
import { routing } from './grid.routing';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        NgaModule,
        routing,
    ],
    declarations: [
        Grid,
    ],
})
export class GridModule { }
