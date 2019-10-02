import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgaModule } from '../../../../../theme/nga.module';
import { Formulario } from './formulario.component';
import { routing } from './formulario.routing';


@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    NgaModule,
    routing,
  ],
  declarations: [
    Formulario,
  ],
})
export class FormularioModule { }
