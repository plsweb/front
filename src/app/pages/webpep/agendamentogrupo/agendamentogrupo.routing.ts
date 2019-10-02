import { Routes, RouterModule }  from '@angular/router';

import { AgendamentoGrupo } from './agendamentogrupo.component';
import { ModuleWithProviders } from '@angular/core';

// noinspection TypeScriptValidateTypes
export const routes: Routes = [
  {
    path: '',
    component: AgendamentoGrupo
  }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
