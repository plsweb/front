import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgaModule } from '../../../../theme/nga.module';
import { ListaGrupo } from './listaGrupo.component';
import { routing } from './listaGrupo.routing';

@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        NgaModule,
        routing,
    ],
    declarations: [
        ListaGrupo,
    ]
})
export class ListaGrupoModule { }
