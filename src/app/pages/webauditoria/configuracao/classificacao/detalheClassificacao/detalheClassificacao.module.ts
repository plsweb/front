import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgaModule } from '../../../../../theme/nga.module';
import { DetalheClassificacao } from './detalheClassificacao.component';
import { routing } from './detalheClassificacao.routing';

@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        NgaModule,
        routing,
    ],
    declarations: [
        DetalheClassificacao,
    ]
})
export class DetalheClassificacaoModule { }
