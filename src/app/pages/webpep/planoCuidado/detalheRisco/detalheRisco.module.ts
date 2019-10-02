import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgaModule } from '../../../../theme/nga.module';
import { DetalheRisco } from './detalheRisco.component';
import { routing } from './detalheRisco.routing';

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
        DetalheRisco
    ],
    entryComponents: [
    ],
})
export class DetalheRiscoModule { }