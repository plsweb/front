import { Routes, RouterModule }  from '@angular/router';

import { ListaRelatorios } from './listaRelatorios.component';
import { ModuleWithProviders } from '@angular/core';

// noinspection TypeScriptValidateTypes
export const routes: Routes = [
  {
    path: '',
    component: ListaRelatorios
  }
];





export const routing: ModuleWithProviders = RouterModule.forChild(routes);