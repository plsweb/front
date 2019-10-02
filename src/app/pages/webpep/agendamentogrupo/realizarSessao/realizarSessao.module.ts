import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgaModule } from '../../../../theme/nga.module';
import { RealizarSessao } from './realizarSessao.component';
import { routing } from './realizarSessao.routing';

@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        NgaModule,
        routing,
    ],
    declarations: [
        RealizarSessao,
    ]
})
export class RealizarSessaoModule { }
