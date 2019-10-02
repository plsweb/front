import { Routes, RouterModule }  from '@angular/router';

import { Formulario } from './formulario.component';
import { ModuleWithProviders } from '@angular/core';

// noinspection TypeScriptValidateTypes
export const routes: Routes = [
  {
    path: '',
    component: Formulario
  }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
