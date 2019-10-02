import { Routes, RouterModule }  from '@angular/router';

import { GridPrescricoes } from './grid.component';
import { ModuleWithProviders } from '@angular/core';

// noinspection TypeScriptValidateTypes
export const routes: Routes = [
  {
    path: '',
    component: GridPrescricoes
  }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
