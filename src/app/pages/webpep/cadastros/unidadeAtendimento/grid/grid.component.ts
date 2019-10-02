import { Router, ActivatedRoute } from '@angular/router';
import { Component, OnInit } from '@angular/core';

import { Sessao, Servidor, UnidadeAtendimentoService } from 'app/services';

import { Saida } from 'app/theme/components';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'grid',
    templateUrl: './grid.html',
    styleUrls: ['./grid.scss'],
})
export class Grid implements OnInit {
    unidadesAtendimento = [];
    filtro:Saida;
    paginaAtual;
    qtdItensTotal;
    itensPorPagina;

    // TODO TESTAR UNIDADE ATENDIMENTO 
    constructor(
        public router: Router,
        private route: ActivatedRoute,
        private toastr: ToastrService,
        private service: UnidadeAtendimentoService, 
    ) {
    }

    ngOnInit() {
        this.paginaAtual = 1;
        this.itensPorPagina = 25;

        this.buscaUnidadesAtendimento(null);
    }

    unidadesAtendimentoFiltro = [];

    buscaUnidadesAtendimento(evento) {
        this.paginaAtual = evento ? evento.paginaAtual : this.paginaAtual;

        let request = {
            pagina: this.paginaAtual,
            quantidade: this.itensPorPagina
        }
        this.service.get(request).subscribe(
            (retorno) => {
                let unidadesAtendimento = (retorno.dados || retorno);
                this.unidadesAtendimento = (this.paginaAtual == 1) ? unidadesAtendimento : this.unidadesAtendimento.concat([], unidadesAtendimento );
                this.unidadesAtendimentoFiltro = this.unidadesAtendimento
                this.qtdItensTotal = unidadesAtendimento.qtdItensTotal;
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
        this.router.navigate([`/${Sessao.getModulo()}/unidadeatendimento/novo`]);
    }

    pesquisar(texto) {
        if (texto && texto.trim() != "") {
            this.unidadesAtendimentoFiltro = this.unidadesAtendimento.filter(function (unidade) {
                let filter = '.*' + texto.toUpperCase() + '.*';

                return unidade.descricao.toUpperCase().match(filter);
            });
        } else {
            this.unidadesAtendimentoFiltro = this.unidadesAtendimento;
        }
    }

    atualizar(id){
        this.router.navigate([`/${Sessao.getModulo()}/unidadeatendimento/${id}`]);
    }
}