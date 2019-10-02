import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgaModule } from 'app/theme/nga.module';

import { Avaliacao } from './avaliacao.component';
import { routing } from './avaliacao.routing';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgaModule,
    routing,
  ],
  declarations: [Avaliacao],
})
export class AvaliacaoModule { }