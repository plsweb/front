import { Routes, RouterModule }  from '@angular/router';

import { CallCenter } from './callcenter.component';
import { ModuleWithProviders } from '@angular/core';

// noinspection TypeScriptValidateTypes
export const routes: Routes = [
  {
    path: '',
    component: CallCenter
  }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
