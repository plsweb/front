import { Routes, RouterModule } from '@angular/router';

import { DetalheClassificacao } from './detalheClassificacao.component';
import { ModuleWithProviders } from '@angular/core';

// noinspection TypeScriptValidateTypes
export const routes: Routes = [
  {
    path: '',
    component: DetalheClassificacao,
  },
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);