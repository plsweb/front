import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgaModule } from '../../../../theme/nga.module';
import { NgbDropdownModule, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';

import { Grid } from './grid.component';
import { routing } from './grid.routing';
import { DefaultModal } from './modals/default-modal/default-modal.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        NgaModule,
        NgbModalModule,
        routing,
    ],
    declarations: [
        Grid,
        DefaultModal,
    ],
    entryComponents: [
        DefaultModal
    ],
})
export class GridModule { }