import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';

import { Sessao, Servidor, CuidadoService } from 'app/services';

import { NgbdModalContent } from 'app/theme/components';

import * as moment from 'moment';
moment.locale('pt-br');

@Component({
    selector: 'cuidado',
    templateUrl: './cuidado.html',
    styleUrls: ['./cuidado.scss'],
    providers: []
})

export class Cuidado {

    riscoId;
    risco;

    atual;
    qtdItensTotalAcoes;
    paginaAtualAcoes = 1;
    itensPorPaginaAcoes = 30;

    pergunta;
    parametros = [];

    colorPicker;
    iconeSelector;

    acoes = [];
    acaoSelecionado;
    objFiltroAcoes = ['descricao', 'descricao'];


    @ViewChild("formPergunta", { read: ElementRef }) formPergunta: ElementRef;

    constructor(
        public router: Router,
        private toastr: ToastrService,
        private route: ActivatedRoute,
        private modalService: NgbModal,
        private serviceAcaoCuidado: CuidadoService,
    ) {
        this.route.params.subscribe(params => {
            this.riscoId = params['riscoid'] == 'novo' ? undefined : params['riscoid'];
        });

        this.risco = new Object();
    }

    pesquisarAcoesSaude(texto) {
        this.buscaAcoes(texto);
    }

    buscaAcoes(evento = null) {
        this.paginaAtualAcoes = evento ? ((evento.paginaAtual) ? evento.paginaAtual : 1) : this.paginaAtualAcoes;
        console.log(this.paginaAtualAcoes)

        let request = { pagina: this.paginaAtualAcoes, quantidade: this.itensPorPaginaAcoes, simples: true };

        if (evento && !evento.paginaAtual) {
            request['like'] = evento;
        }

        this.serviceAcaoCuidado.get(request).subscribe(
            (acoes) => {
                if (request.pagina == 1) {
                    this.acoes = acoes.dados;
                } else {
                    this.acoes = this.acoes.concat([], acoes.dados);
                }

                this.qtdItensTotalAcoes = acoes.qtdItensTotal;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        );
    }

    fnCfgAcoesRemote(term) {
        this.objFiltroAcoes = ['descricao', 'descricao'];
        return this.serviceAcaoCuidado.get({ like: term, pagina: 1, quantidade: 10 }, true)
    }

    modalConfirmar;
    removeAcao(acao) {
        event.preventDefault();

        this.modalConfirmar = this.modalService.open(NgbdModalContent);
        this.modalConfirmar.componentInstance.modalHeader = `${acao.descricao}`;
        this.modalConfirmar.componentInstance.modalMensagem = `Deseja realmente excluir essa ação?`;
        this.modalConfirmar.componentInstance.modalAlert = true;

        this.modalConfirmar.componentInstance.retorno.subscribe(
            (retorno) => {
                if (retorno) {
                    this.serviceAcaoCuidado.delete(acao.id).subscribe(
                        () => {
                            this.toastr.success("Ação foi excuida com sucesso");

                            this.acoes = this.acoes.filter((el) => { 
                                return el.id !== acao.id; 
                            });

                        }, (error) => {
                            Servidor.verificaErro(error, this.toastr);
                        },
                    );
                }
            }
        );

        event.stopPropagation();
    }


    filtrarAcoes() {
        if (this.acaoSelecionado) {

            this.serviceAcaoCuidado.get({ id: this.acaoSelecionado.id }, false).subscribe(
                (acoes) => {
                    this.acoes = acoes.dados;
                    this.qtdItensTotalAcoes = acoes.qtdItensTotal;
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                },
            )
        }
    }

    abrir(acao) {
        let sId = acao ? acao.id : 'novo';
        this.router.navigate([`/${Sessao.getModulo()}/acaocuidado/cuidado/${sId}`]);
    }
}