import { Routes, RouterModule } from '@angular/router';

import { ListaGrupo } from './listaGrupo.component';
import { ModuleWithProviders } from '@angular/core';

// noinspection TypeScriptValidateTypes
export const routes: Routes = [
  {
    path: '',
    component: ListaGrupo,
  },
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
