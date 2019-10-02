import { Routes, RouterModule } from '@angular/router';

import { Historico } from './historico.component';
import { ModuleWithProviders } from '@angular/core';

// noinspection TypeScriptValidateTypes
export const routes: Routes = [
  {
    path: '',
    component: Historico,
  },
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);