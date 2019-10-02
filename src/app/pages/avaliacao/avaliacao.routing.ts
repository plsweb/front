import { Routes, RouterModule } from '@angular/router';
import { Avaliacao } from './avaliacao.component';
import { ModuleWithProviders } from '@angular/core';

// noinspection TypeScriptValidateTypes
export const routes: Routes = [{
		path: '',
		component: Avaliacao,
}];

export const routing: ModuleWithProviders = RouterModule.forChild(routes);