import { Routes, RouterModule }  from '@angular/router';

import { Coacher } from './coacher.component';
import { ModuleWithProviders } from '@angular/core';

// noinspection TypeScriptValidateTypes
export const routes: Routes = [
  {
    path: '',
    component: Coacher
  }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
