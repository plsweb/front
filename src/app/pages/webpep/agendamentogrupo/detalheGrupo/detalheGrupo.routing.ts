import { Routes, RouterModule } from '@angular/router';

import { DetalheGrupo } from './detalheGrupo.component';
import { ModuleWithProviders } from '@angular/core';

// noinspection TypeScriptValidateTypes
export const routes: Routes = [
  {
    path: '',
    component: DetalheGrupo,
  },
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);