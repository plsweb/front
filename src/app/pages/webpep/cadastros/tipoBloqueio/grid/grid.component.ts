import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

import { ToastrService } from 'ngx-toastr';

import { Sessao, Servidor, TipoBloqueioService } from 'app/services';
import { Saida } from '../../../../../theme/components/entrada/entrada.component';

@Component({
    selector: 'grid',
    templateUrl: './grid.html',
    styleUrls: ['./grid.scss'],
    providers: [TipoBloqueioService]
})
export class Grid implements OnInit {
    tiposBloqueio = [];
    filtro:Saida;
    paginaAtual;
    qtdItensTotal;
    itensPorPagina;

    constructor(
        private router: Router,
        private toastr: ToastrService,
        private service: TipoBloqueioService,
    ) {
    }

    ngOnInit() {
        this.paginaAtual = 1;
        this.itensPorPagina = 15;

        this.buscaTiposBloqueioPaginado(null);
    }

    buscaTiposBloqueioPaginado(evento) {
        this.paginaAtual = evento ? evento.paginaAtual : this.paginaAtual;

        this.service.atendimentoBloqueio( { pagina: this.paginaAtual, quantidade: this.itensPorPagina } )
            .subscribe((tiposBloqueio) => {
                let retorno = tiposBloqueio.dados || tiposBloqueio;
                this.tiposBloqueio = this.tiposBloqueio.concat([], retorno);
                this.qtdItensTotal = tiposBloqueio.qtdItensTotal;
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
        this.router.navigate([`/${Sessao.getModulo()}/tipobloqueio/novo`]);
    }

    pesquisar(texto) {
        if (texto) {
            this.service.atendimentoBloqueio( { like: texto, pagina:1, quantidade: 10 }  )
                .subscribe((tiposBloqueio) => {
                    this.tiposBloqueio = tiposBloqueio.dados;
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                },
            );
        }else{
            this.buscaTiposBloqueioPaginado( { paginaAtual : 1 } );
        }
    }

    atualizar(id){
        this.router.navigate([`/${Sessao.getModulo()}/tipobloqueio/${id}`]);
    }
}
