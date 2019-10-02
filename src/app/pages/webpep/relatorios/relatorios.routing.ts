import { Routes, RouterModule }  from '@angular/router';

import { Relatorios } from './relatorios.component';
import { ModuleWithProviders } from '@angular/core';

// noinspection TypeScriptValidateTypes
export const routes: Routes = [
  {
    path: '',
    component: Relatorios
  }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);