import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgaModule } from '../../../theme/nga.module';
import { PopoverModule } from 'ngx-bootstrap';
import { Relatorios } from './relatorios.component';

import { routing } from './relatorios.routing';

import { NgbDropdownModule, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';

@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        NgaModule,
        PopoverModule.forRoot(),
        NgbModalModule,
        routing,
    ],
    declarations: [
        Relatorios
    ],
    entryComponents: [
    ],
})
export class RelatoriosModule { }