import { Routes, RouterModule }  from '@angular/router';

import { DetalheNivelRisco } from './detalheNivelRisco.component';
import { ModuleWithProviders } from '@angular/core';

// noinspection TypeScriptValidateTypes
export const routes: Routes = [
  {
    path: '',
    component: DetalheNivelRisco
  }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
