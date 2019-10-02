import { Routes, RouterModule } from '@angular/router';

import { LogAtendimento } from './logAtendimento.component';
import { ModuleWithProviders } from '@angular/core';

// noinspection TypeScriptValidateTypes
export const routes: Routes = [
  {
    path: '',
    component: LogAtendimento,
  },
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);