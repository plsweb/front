import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
	selector: 'app-grid',
	templateUrl: './grid.component.html',
	styleUrls: ['./grid.component.scss']
})

export class Grid implements OnInit {

	materiais = new Object();

	paginaAtual;
	qtdItensTotal;
	itensPorPagina;

	constructor(
		private router: Router
	) { }

	ngOnInit() {
		this.materiais = [
			{id: 1, descricao: 'Teste 1', quantidade: '25', valor: '10'},
			{id: 2, descricao: 'Teste 2', quantidade: '5',  valor: '0.54'},
			{id: 3, descricao: 'Teste 3', quantidade: '48', valor: '2'},
			{id: 4, descricao: 'Teste 4', quantidade: '3',  valor: '2.36'},
		]
	}

	pesquisar() {
		return;
	}

	buscaPaginado(event) {
		return;
	}

	validar(material) {
		console.log(material);
		
		console.log(`${window.location.toString()}/${material.id}`);

		this.router.navigate([`${window.location.toString()}/${material.id}`]);
	}
}