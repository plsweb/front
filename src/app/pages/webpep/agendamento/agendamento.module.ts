import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgaModule } from '../../../theme/nga.module';
import { Agendamento } from './agendamento.component';
import { GridModule } from '../atendimento/grid/grid.module';
import { routing } from './agendamento.routing';

import { NgbDropdownModule, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        NgaModule,
        //GridModule,
        NgbModalModule,
        routing,
    ],
    declarations: [
        Agendamento
    ],
    entryComponents: [
    ],
})
export class AgendamentoModule { }