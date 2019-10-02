import { Routes, RouterModule }  from '@angular/router';

import { DetalheRisco } from './detalheRisco.component';
import { ModuleWithProviders } from '@angular/core';

// noinspection TypeScriptValidateTypes
export const routes: Routes = [
  {
    path: '',
    component: DetalheRisco
  }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
