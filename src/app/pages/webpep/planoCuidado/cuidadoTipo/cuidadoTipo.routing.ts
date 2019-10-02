import { Routes, RouterModule }  from '@angular/router';

import { CuidadoTipo } from './cuidadoTipo.component';
import { ModuleWithProviders } from '@angular/core';

// noinspection TypeScriptValidateTypes
export const routes: Routes = [
  {
    path: '',
    component: CuidadoTipo
  }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
