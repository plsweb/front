import { Routes, RouterModule } from '@angular/router';

import { Grid } from './grid.component';
import { ModuleWithProviders } from '@angular/core';

// noinspection TypeScriptValidateTypes
export const routes: Routes = [
    {
        path: '',
        component: Grid,
    },
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
