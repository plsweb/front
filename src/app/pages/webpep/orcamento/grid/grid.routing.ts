import { Routes, RouterModule }  from '@angular/router';
import { ModuleWithProviders } from '@angular/core';

import { Grid } from './grid.component';

export const routes: Routes = [
    {
        path: '',
        component: Grid
    }
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);