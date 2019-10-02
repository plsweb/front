import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { routing } from './pages.routing';
import { NgaModule } from '../theme/nga.module';
import { Seguranca } from './seguranca';
import { Sessao } from '../services/sessao';

import { Pages } from './pages.component';

@NgModule({
    imports: [CommonModule, NgaModule, routing],
    declarations: [Pages],
    providers: [Seguranca, Sessao],
})
export class PagesModule {
}
