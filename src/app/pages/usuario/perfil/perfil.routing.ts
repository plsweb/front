import { Routes, RouterModule } from '@angular/router';

import { Perfil } from './perfil.component';
import { ModuleWithProviders } from '@angular/core';

// noinspection TypeScriptValidateTypes
export const routes: Routes = [
    {
        path: '',
        component: Perfil,
    },
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
