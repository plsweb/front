import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';

import { ToastrService } from 'ngx-toastr';

import { Sessao, Servidor, ExameGrupoService, ProcedimentoService } from 'app/services';
import { NgbdModalContent } from '../../../../theme/components/modal/modal.component';
import { Saida } from '../../../../theme/components/entrada/entrada.component';

import * as jQuery from 'jquery';

@Component({
    selector: 'formulario',
    templateUrl: './formulario.html',
    styleUrls: ['./formulario.scss']
})
export class Formulario implements OnInit {
    descricao: Saida;
    descProcedimento:Saida;
    descricaoValor;
    exame;
    exameEdita;
    exameGrupo: Saida;
    exameGrupoValor;
    examesGrupos = [];
    examesGruposItens = [];
    formularioValido;
    id;
    procedimento: Saida;
    procedimentos = [];
    procedimentoValor;
    quantidade: Saida;
    paginaAtual;
    qtdItensTotal;
    itensPorPagina;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private toastr: ToastrService,
        private modalService: NgbModal,
        private service: ExameGrupoService,
        private serviceProced: ProcedimentoService,
    ) {
        this.route.params.subscribe(params => {

            this.id = params['id'];

        });
    }

    ngOnInit() {

        this.cancelQuantidade();

        this.service.get()
            .subscribe((examesGrupos) => {
                this.examesGrupos = examesGrupos;
            },
            (erro) => {Servidor.verificaErro(erro, this.toastr);}
        );

        if (this.id) {
            this.service.getId(this.id)
                .subscribe((exame) => {
                    this.exameGrupoValor = exame.exameGrupo ? exame.exameGrupo.id : 0;
                    this.descricaoValor = exame.descricao;
                },
                (erro) => {Servidor.verificaErro(erro, this.toastr);}
            );

            this.buscaItens();
        }

    }

    ngAfterViewInit() {
        let esse = this;
        let serviceProced = this.serviceProced;

        let inputCodigo = jQuery("input#Código");
        let inputExame  = jQuery("input#Exame");
        let inputQnt  = jQuery("input#Qnt");

        inputCodigo.css({"height" : "32px"});
        inputExame.css({"height" : "32px"});
        inputQnt.css({"height" : "32px"});

        inputCodigo.change(
            function() {

                esse.serviceProced.getProcedimentosCodigo(inputCodigo.val())
                    .subscribe((procedimento) => {
                        if (procedimento) {
                            esse.procedimento = {valido: true, valor: procedimento.id};

                            inputExame.val(procedimento.descricao);
                        } else {
                            alert(inputCodigo.val() + " não encontrado")
                            esse.limpar();
                        }
                    },
                    (erro) => {Servidor.verificaErro(erro, this.toastr);}
                );
            }
        );
    }

    validar() {
        if (this.exameGrupo && !this.exameGrupo.valido) {
            this.formularioValido = false;
            return;
        }

        if (!this.descricao.valido) {
            this.formularioValido = false;
            return;
        }

        this.formularioValido = true;
    }

    getExamePai(evento) {
        this.exameGrupo = evento;
        this.validar();
    }

    getDescricao(evento) {
        this.descricao = evento;
        this.validar();
    }

    getQuantidade(evento) {
        this.quantidade = evento;
        this.validar();
    }

    getProcedimento(evento) {
        if (evento) {
            this.procedimento = {valido: true, valor: evento.id};
        }
    }

    editaQuantidade(exame) {
        if (this.exameEdita.id == 0) {
            this.exameEdita = {
                'id' : exame.id,
                'quantidade': exame.quantidade
            }
        }
    }

    salvarQuantidade(exame) {
        this.service.atualizarExameGrupoItem(this.exameEdita.id, this.exameEdita).subscribe(
            (exameRet) => {
                this.limpar();

                this.buscaItens();
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
                if (erro.status == 412) {
                    alert("Não foi possível inserir o exame.\nFavor checar os dados inseridos.");
                }
            }
        );
    }

    valorQuantidade(evento) {
        this.exameEdita.quantidade = evento.valor;
    }

    cancelQuantidade() {
        this.exameEdita = {
            'id' : 0,
            'quantidade': 0
        }
    }

    voltar() {
        this.router.navigate([`/${Sessao.getModulo()}/grupoexame`]);
    }

    adicionarItem() {
        if (this.procedimento && this.procedimento.valido) {

            let item = {
                "exameGrupo": {
                    "id": this.id
                },
                "procedimento": {
                    "id": this.procedimento.valor
                },
                "quantidade": this.quantidade.valor
            }

            this.service.inserirExameGrupoItem(item).subscribe(
                (exame) => {
                    this.limpar();

                    this.buscaItens();
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                    if (erro.status == 412) {
                        alert("Não foi possível inserir o exame.\nFavor checar os dados inseridos.");
                    }
                }
            );
        }
    }

    buscaItens() {
        this.cancelQuantidade();
        this.service.getExameGrupoItemExame(this.id).subscribe(
            (exames) => {
                this.examesGruposItens = exames;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );
    }

    limpar() {
        this.procedimento = {valido: false, valor: ""};
        jQuery("input#Código").val("").focus();
        jQuery("input#Exame").val("");
        jQuery("input#Qnt").val("1");
    }

    removerItem(idItem) {
        if (confirm("Deseja excluir esse exame?")) {

            this.service.apagarExameGrupoItem(idItem).subscribe(
                (exame) => {
                    this.buscaItens();
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                }
            );
        }
    }

    buscarProcedimento (bodyModal) {
        const activeModal = this.modalService.open(NgbdModalContent, {size: 'lg'});
        activeModal.componentInstance.modalHeader  = 'Adicionar exame';
        activeModal.componentInstance.templateRefBody = bodyModal;

        this.paginaAtual = 1;
        this.itensPorPagina = 10;
    }

    clickLinha(procedimento) {

        var jaExiste = (this.examesGruposItens.filter(function(i) {
            return i.procedimento.codigo == procedimento.codigo
        }).length > 0);

        if( jaExiste ){
            alert("Exame já existente");
            return;
        }

        let item = {
            "exameGrupo": {
                "id": this.id
            },
            "procedimento": procedimento
        }

        this.service.inserirExameGrupoItem(item).subscribe(
            (exame) => {
                alert("Exame adicionado:  " + exame);
                item["id"] = exame;
                item["quantidade"] = 1;
                this.examesGruposItens.push(item);
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );
    }

    setTableProcedimentoSearch(){

        if (this.descProcedimento.valor && this.descProcedimento.valor.length > 3) {

            this.serviceProced.procedimentoPaginadoFiltro(1, 10, this.descProcedimento.valor)
                .subscribe((procedimento) => {
                    this.procedimentos = procedimento.dados;
                    this.qtdItensTotal = procedimento.qtdItensTotal;
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                }
            );
        } else {
            this.procedimentos = [];
        }
    }

    getProcedimentoSearch(evento) {
        this.descProcedimento = evento;
    }

    buscaProcedimentoPaginado(evento) {
        this.paginaAtual = evento ? evento.paginaAtual : this.paginaAtual;

        this.serviceProced.procedimentoPaginado(this.paginaAtual, this.itensPorPagina)
            .subscribe((procedimentos) => {
                this.procedimentos = procedimentos.dados;
                this.qtdItensTotal = procedimentos.qtdItensTotal;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        );
    }

    submit() {
        if (!this.descricao.valor || this.descricao.valor.trim() == "") {
            alert("Preencha a descrição.");
            jQuery("#Descrição").focus();
            return false;
        }

        this.exame = {
            "descricao": this.descricao.valor,
        };

        if (this.exameGrupo.valor && this.exameGrupo.valor != 0) {
            this.exame.exameGrupo = {
                "id" : this.exameGrupo.valor
            }
        }

        if (!this.id) {
            this.service.inserir(this.exame)
                .subscribe((status) => {
                    if (status) {
                        this.router.navigate([`/${Sessao.getModulo()}/grupoexame/formulario/` + status]);
                    }
                });
        } else{
            this.service.atualizar(this.id, this.exame).subscribe(
                (status) => {
                    if (status) {
                        this.router.navigate([`/${Sessao.getModulo()}/grupoexame`]);
                    }
                }
            );
        }
    }
}