import { Routes, RouterModule }  from '@angular/router';

import { ListaEspera } from './listaEspera.component';
import { ModuleWithProviders } from '@angular/core';

// noinspection TypeScriptValidateTypes
export const routes: Routes = [
  {
    path: '',
    component: ListaEspera
  }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
