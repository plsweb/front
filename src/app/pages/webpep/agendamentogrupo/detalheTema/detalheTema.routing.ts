import { Routes, RouterModule } from '@angular/router';

import { DetalheTema } from './detalheTema.component';
import { ModuleWithProviders } from '@angular/core';

// noinspection TypeScriptValidateTypes
export const routes: Routes = [
  {
    path: '',
    component: DetalheTema,
  },
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);