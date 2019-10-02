import { Routes, RouterModule } from '@angular/router';

import { FormularioPaciente } from './formulario.component';
import { ModuleWithProviders } from '@angular/core';

// noinspection TypeScriptValidateTypes
export const routes: Routes = [
  {
    path: '',
    component: FormularioPaciente,
  },
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
