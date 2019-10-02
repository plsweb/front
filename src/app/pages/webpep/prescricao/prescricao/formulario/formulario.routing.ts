import { Routes, RouterModule }  from '@angular/router';

import { ItensPrescricao } from './formulario.component';
import { ModuleWithProviders } from '@angular/core';

// noinspection TypeScriptValidateTypes
export const routes: Routes = [
  {
    path: '',
    component: ItensPrescricao
  }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
