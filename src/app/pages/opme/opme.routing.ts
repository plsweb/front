import { Routes, RouterModule } from '@angular/router';
import { Opme } from './opme.component';
import { ModuleWithProviders } from '@angular/core';

export const routes: Routes = [{
    path: '',
    component: Opme,
}];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);