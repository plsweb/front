import { Component, OnInit } from '@angular/core';
import { BeneficiarioService } from '../../../../services';

import { ToastrService } from 'ngx-toastr';

import { Servidor } from '../../../../services/servidor';
import { Sessao } from '../../../../services/sessao';

import { Router } from '@angular/router';
import { Saida } from '../../../../theme/components/entrada/entrada.component';

@Component({
    selector: 'grid',
    templateUrl: './grid.html',
    styleUrls: ['./grid.scss'],
})
export class Grid implements OnInit {
    beneficiarios = [];
    filtro:Saida;
    ordenacao;
    paginaAtual;
    qtdItensTotal;
    itensPorPagina;
    colunasTabela;

    constructor(
        private toastr: ToastrService,
        private router: Router,
        private service: BeneficiarioService,
    ) {
        this.ordenacao = {
            tipo: 'desc',
            ordem: 'prazo',
            paginaAtual: 1,
            itensPorPagina: 30
        };

        this.colunasTabela = [
            {'titulo': 'Carteira',    'chave': 'codigo',      'filtroClasse': 'INTEGER', 'filtroTipo': 'IGUAL'},
            {'titulo': 'Nome',        'chave': 'nome',        'filtroClasse': 'STRING',  'filtroTipo': 'LIKE'},
            {'titulo': 'Nascimento',  'chave': 'nascimento',  'filtroClasse': 'DATE',    'filtroTipo': 'IGUAL'},
            {'titulo': 'Contratante', 'chave': 'contratante', 'filtroClasse': 'STRING',  'filtroTipo': 'LIKE'},
        ];
    }

    ngOnInit() {
        this.paginaAtual = 1;
        this.itensPorPagina = 25;

        this.buscaBeneficiarioPaginado(null);
    }

    buscaBeneficiarioPaginado(evento) {
        this.paginaAtual = evento ? evento.paginaAtual : this.paginaAtual;

        this.service.getBeneficiarioPaginado(this.paginaAtual, this.itensPorPagina)
            .subscribe((beneficiarios) => {
                this.beneficiarios = this.beneficiarios.concat([], beneficiarios.dados);
                this.qtdItensTotal = beneficiarios.qtdItensTotal;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        );
    }

    getFiltro(evento) {
        this.filtro = evento;
    }

    pesquisar(texto) {
        if (texto) {
            this.service.getBeneficiarioLikePaginado(1, 100, texto)
                .subscribe((beneficiarios) => {
                    this.beneficiarios = beneficiarios.dados;
                    this.qtdItensTotal = beneficiarios.qtdItensTotal;
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                },
            );
        }
    }

    atualizaDados(obj = {"like":""}) {
        this.pesquisar(obj.like);
    }

    limparFiltros(a) {
        console.log(a)
    }

    abrir(beneficiario) {
        this.router.navigate([`/${Sessao.getModulo()}/beneficiario/formulario/${beneficiario.codigo}`]);
    }
}