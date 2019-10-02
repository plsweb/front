import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

import { ToastrService } from 'ngx-toastr';

import { Sessao, Servidor, AgendamentoColetivoService } from 'app/services';
import { Saida } from 'app/theme/components';

@Component({
    selector: 'grid',
    templateUrl: './grid.html',
    styleUrls: ['./grid.scss'],
})
export class Grid implements OnInit {
    agendasColetiva = [];
    filtro: Saida;
    paginaAtual;
    qtdItensTotal;
    itensPorPagina;
    ativo: false;

    constructor(
        private router: Router,
        private toastr: ToastrService,
        private service: AgendamentoColetivoService,
    ) {
    }

    ngOnInit() {
        this.paginaAtual = 1;
        this.itensPorPagina = 30;

        this.buscaAgendaColetivaPaginado(this.paginaAtual);
    }

    buscaAgendaColetivaPaginado(paginaAtual) {
        let request = {
            simples: true,
            ativo: this.ativo,
            pagina: paginaAtual,
            quantidade: this.itensPorPagina,
        }

        this.service.getAgendamentoColetivo(request).subscribe(
            (retorno) => {
                this.agendasColetiva = retorno.paginaAtual == 1 ? retorno.dados : this.agendasColetiva.concat([], retorno.dados);

                this.paginaAtual = retorno.paginaAtual;
                this.qtdItensTotal = retorno.qtdItensTotal;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        );
    }

    adicionar() {
        this.router.navigate([`/${Sessao.getModulo()}/agendacoletiva/novo`]);
    }

    situacao($event) {
        this.paginaAtual = 1;
        this.ativo = $event.valor;
        this.buscaAgendaColetivaPaginado(this.paginaAtual);
    }

    pesquisar(texto) {
        let request = {
            pagina: 1,
            like: texto,
            simples: true,
            ativo: this.ativo,
            quantidade: this.itensPorPagina,
        }

        this.service.getAgendamentoColetivo(request).subscribe(
            (agendasColetiva) => {
                this.agendasColetiva = agendasColetiva.dados;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        );
    }

    atualizar(id) {
        this.router.navigate([`/${Sessao.getModulo()}/agendacoletiva/${id}`]);
    }
}