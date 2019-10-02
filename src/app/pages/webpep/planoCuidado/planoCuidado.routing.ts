import { Routes, RouterModule }  from '@angular/router';

import { PlanoCuidado } from './planoCuidado.component';
import { ModuleWithProviders } from '@angular/core';

// noinspection TypeScriptValidateTypes
export const routes: Routes = [
  {
    path: '',
    component: PlanoCuidado
  }


  
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
