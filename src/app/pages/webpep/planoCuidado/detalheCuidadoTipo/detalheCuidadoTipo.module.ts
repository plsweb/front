import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgaModule } from '../../../../theme/nga.module';
import { DetalheCuidadoTipo } from './detalheCuidadoTipo.component';
import { routing } from './detalheCuidadoTipo.routing';

@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        NgaModule,
        routing,
    ],
    declarations: [
        DetalheCuidadoTipo,
    ]
})
export class DetalheCuidadoTipoModule { }
