import { Routes, RouterModule }  from '@angular/router';

import { Agendamento } from './agendamento.component';
import { ModuleWithProviders } from '@angular/core';

// noinspection TypeScriptValidateTypes
export const routes: Routes = [
  {
    path: '',
    component: Agendamento
  }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);