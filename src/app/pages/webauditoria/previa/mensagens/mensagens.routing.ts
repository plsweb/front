import { Routes, RouterModule } from '@angular/router';

import { Mensagens } from './mensagens.component';
import { ModuleWithProviders } from '@angular/core';

// noinspection TypeScriptValidateTypes
export const routes: Routes = [
  {
    path: '',
    component: Mensagens,
  },
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);