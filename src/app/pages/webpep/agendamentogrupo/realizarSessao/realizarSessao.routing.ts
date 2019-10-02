import { Routes, RouterModule } from '@angular/router';

import { RealizarSessao } from './realizarSessao.component';
import { ModuleWithProviders } from '@angular/core';

// noinspection TypeScriptValidateTypes
export const routes: Routes = [
  {
    path: '',
    component: RealizarSessao,
  },
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
