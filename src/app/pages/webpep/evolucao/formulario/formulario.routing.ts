import { Routes, RouterModule } from '@angular/router';

import { Evolucao } from './formulario.component';
import { ModuleWithProviders } from '@angular/core';

// noinspection TypeScriptValidateTypes
export const routes: Routes = [
  {
    path: '',
    component: Evolucao,
  },
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
