import { Routes, RouterModule } from '@angular/router';

import { DetalheCuidadoTipo } from './detalheCuidadoTipo.component';
import { ModuleWithProviders } from '@angular/core';

// noinspection TypeScriptValidateTypes
export const routes: Routes = [
  {
    path: '',
    component: DetalheCuidadoTipo,
  },
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);