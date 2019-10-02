import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgaModule } from '../../../../theme/nga.module';
import { ListaRelatorios } from './listaRelatorios.component';

import { routing } from './listaRelatorios.routing';

import { NgbDropdownModule, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';




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
        ListaRelatorios
    ],
    entryComponents: [
    ],
})
export class ListaRelatoriosModule { }