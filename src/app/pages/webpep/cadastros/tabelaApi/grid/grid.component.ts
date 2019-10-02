import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

import { Sessao, Servidor, TabelaApi } from 'app/services';

import { ToastrService } from 'ngx-toastr';

import { Saida } from '../../../../../theme/components/entrada/entrada.component';

@Component({
    selector: 'grid',
    templateUrl: './grid.html',
    styleUrls: ['./grid.scss'],
})
export class Grid implements OnInit {
    tabelasApi = [];
    filtro:Saida;
    paginaAtual;
    qtdItensTotal;
    itensPorPagina;

    constructor(
        private router: Router,
        private service: TabelaApi,
        private toastr: ToastrService,
    ) {
    }

    ngOnInit() {
        this.paginaAtual = 1;
        this.itensPorPagina = 15;

        this.buscaTabelaApiPaginado(null);
    }

    buscaTabelaApiPaginado(evento) {
        this.paginaAtual = evento ? evento.paginaAtual : this.paginaAtual;

        this.service.get( { pagina : this.paginaAtual, quantidade: this.itensPorPagina, simples: true } )
            .subscribe((tabelasApi) => {
                this.tabelasApi = this.tabelasApi.concat([], tabelasApi.dados);
                this.qtdItensTotal = tabelasApi.qtdItensTotal;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        );
    }

    getFiltro(evento) {
        this.filtro = evento;
    }

    adicionar() {
        this.router.navigate([`/${Sessao.getModulo()}/tabelaapi/novo`]);
    }

    pesquisar(texto) {
        if (texto) {
            this.service.get( { pagina: 1, quantidade: 15, like: texto }  )
                .subscribe((tabelasApi) => {
                    this.tabelasApi = tabelasApi.dados;
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                },
            );
        }
    }

    atualizar(id){
        this.router.navigate([`/${Sessao.getModulo()}/tabelaapi/${id}`]);
    }
}
