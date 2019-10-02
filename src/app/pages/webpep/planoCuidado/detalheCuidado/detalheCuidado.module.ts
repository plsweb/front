import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgaModule } from '../../../../theme/nga.module';
import { DetalheCuidado } from './detalheCuidado.component';
import { routing } from './detalheCuidado.routing';

@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        NgaModule,
        routing,
    ],
    declarations: [
        DetalheCuidado,
    ]
})
export class DetalheCuidadoModule { }
