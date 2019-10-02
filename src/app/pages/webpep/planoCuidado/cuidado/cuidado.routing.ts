import { Routes, RouterModule }  from '@angular/router';

import { Cuidado } from './cuidado.component';
import { ModuleWithProviders } from '@angular/core';

// noinspection TypeScriptValidateTypes
export const routes: Routes = [
  {
    path: '',
    component: Cuidado
  }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
