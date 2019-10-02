import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgaModule } from '../../../../theme/nga.module';
import { Formulario } from './formulario.component';
import { routing } from './formulario.routing';

import { NgbDropdownModule, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { DefaultModal } from './modals/default-modal/default-modal.component';

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
        Formulario,
        DefaultModal,
    ],
    entryComponents: [
        DefaultModal
    ],
})
export class FormularioModule { }
