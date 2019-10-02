import { Routes, RouterModule } from '@angular/router';

import { DetalheCuidado } from './detalheCuidado.component';
import { ModuleWithProviders } from '@angular/core';

// noinspection TypeScriptValidateTypes
export const routes: Routes = [
  {
    path: '',
    component: DetalheCuidado,
  },
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);