import { Routes, RouterModule } from '@angular/router';

import { Visualizar } from './visualizar.component';
import { ModuleWithProviders } from '@angular/core';

export const routes: Routes = [
	{
		path: '',
		component: Visualizar,
	},
];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);
