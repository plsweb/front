import { Routes, RouterModule }  from '@angular/router';

import { Risco } from './risco.component';
import { ModuleWithProviders } from '@angular/core';

// noinspection TypeScriptValidateTypes
export const routes: Routes = [
  {
    path: '',
    component: Risco
  }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
