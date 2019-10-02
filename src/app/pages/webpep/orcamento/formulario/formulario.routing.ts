import { Routes, RouterModule }  from '@angular/router';
import { ModuleWithProviders } from '@angular/core';

import { Formulario } from './formulario.component';

export const routes: Routes = [
    {
        path: '',
        component: Formulario
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);