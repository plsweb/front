import { Routes, RouterModule }  from '@angular/router';

import { Log } from './log.component';
import { ModuleWithProviders } from '@angular/core';

export const routes: Routes = [
  {
    path: '',
    component: Log
  }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);