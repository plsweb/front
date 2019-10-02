import { Component, OnInit } from '@angular/core';
import { GuiaService, MenorValorService,  AtendimentoService, PacienteService } from '../../../../services';

import { Servidor } from '../../../../services/servidor';
import { Sessao } from '../../../../services/sessao';

import { ActivatedRoute, Router } from '@angular/router';
import { Saida } from '../../../../theme/components/entrada/entrada.component';
import * as jQuery from 'jquery';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { DefaultModal } from './modals/default-modal/default-modal.component';
import { ToastrService } from 'ngx-toastr';


@Component({
    selector: 'grid',
    templateUrl: './grid.html',
    styleUrls: ['./grid.scss'],
})
export class Grid implements OnInit {
    atendimentos = [];
    guia;
    lista;
    preloader;
    protocolo:Saida;
    protocoloValor;

    constructor(
        private service: GuiaService,
        private serviceMenorValor: MenorValorService,
        private serviceAtendimentos: AtendimentoService,
        private toastr: ToastrService,
        private router: Router,
        private modalService: NgbModal
    ) {
    }

    ngOnInit() {
    }

    validaGuiaAtual() {
        let esse = this;

        let guiaAtual = localStorage.getItem('guiaAtual');
        if (guiaAtual) {
            this.preloader.fadeIn(10);

           jQuery("#Protocolo").val(guiaAtual);
            esse.protocolo = {
                'valido' : true,
                'valor' : guiaAtual
            }
            esse.protocoloValor = guiaAtual;

            setTimeout(
                function() {
                    jQuery("#Protocolo").val(guiaAtual);
                    localStorage.removeItem('guiaAtual');
                    esse.preloader.fadeOut(10);

                    jQuery("button.btn.btn-primary.form-control.icone").click();
                }, 500
            );
        }
    }

    ngAfterViewInit() {
        let esse = this;

        jQuery("input#Protocolo").css({
            "height" : "32px"
        });

        esse.preloader = jQuery("#preloader");

        this.validaGuiaAtual();
    }

    adicionar() {
        this.router.navigate([`/${Sessao.getModulo()}/indicacaoexames/formulario`]);
    }

    atualizar(id){
        this.router.navigate([`/${Sessao.getModulo()}/indicacaoexames/formulario/${id}`]);
    }

    montarAtendimento(codPrestador, codProcedimento) {

        let atendimento = {
            beneficiario : this.guia.beneficiario,
            guia : this.guia,
            observacao : null,
            prestador : null,
            procedimento : null
        }
        let lista = JSON.parse(JSON.stringify(this.lista));

        lista.forEach(
            function(val) {
                if (codProcedimento == val.codigo) {
                    atendimento.procedimento = val;

                    val.prestador.forEach(
                        function(valPrest) {

                            if (valPrest.prestador.codigo == codPrestador) {
                                atendimento.prestador = valPrest.prestador;
                            }
                        }
                    );

                    atendimento.observacao = val.codigo + " - " + val.descricao + "\n";
                }
            }
        );
        delete atendimento.procedimento.prestador.prestador;

        return atendimento;
    }

    montarAtendimentos() {
        let esse = this;
        esse.atendimentos = [];

        jQuery("input[type='checkbox']").each(
            function(index, val) {
                const valObj = $(val);
                if (valObj.attr("checked")) {
                    let id = valObj.attr("id");
                    let idArray = id.split("-");
                    let atendimento = esse.montarAtendimento(idArray[1], idArray[0]);

                    if (esse.atendimentos.length > 0) {
                        let achou = false;
                        esse.atendimentos.forEach(
                            function(val) {
                                if (atendimento.prestador.codigo == val.prestador.codigo) {
                                    achou = true;

                                    val.observacao += atendimento.procedimento.codigo + " - " +
                                                      atendimento.procedimento.descricao + "\n";
                                }

                            }
                        );

                        if (!achou) {
                            esse.atendimentos.push(atendimento);
                        }
                    } else {
                        esse.atendimentos.push(atendimento);
                    }
                }

            }
        );
    }

    getCheck(prestador, procedimento) {

        const atual = jQuery("input#" + procedimento.codigo+"-"+prestador.codigo);
        if (atual.attr("id")) {
            const status = atual.attr("checked");
            const texto = status ? "desselecionar" : "selecionar";

            let itens = jQuery("input[value='" + prestador.codigo + "']");

            if (itens.length > 1 && confirm("Deseja " + texto + " todos os itens do prestador: " + prestador.nome)) {

                itens.each(
                    function(index, val) {
                        const valObj = $(val);

                        if (status) {
                            valObj.attr('checked', 0).prop('checked', false).removeAttr('checked');
                        }else {
                            valObj.prop('checked', true).attr('checked', 1);
                        }

                    }
                );
            } else {
                const status = atual.attr("checked");

                if (status) {
                    atual.attr('checked', 0).prop('checked', false).removeAttr('checked');
                }else {
                    atual.prop('checked', true).attr('checked', 1);
                }
            }
        }
    }

    getProtocolo(evento) {
        this.protocolo = evento;
        this.protocoloValor = evento.valor;
    }

    agendarProcedimento() {
        this.montarAtendimentos();

        if (this.atendimentos.length > 0) {
            if (this.atendimentos.length > 1) {
                this.toastr.warning("Apenas 1 agendamento deve ser feito por vez");
                return;
            }

            let atendimento = this.atendimentos[0];
            delete atendimento.procedimento;

            localStorage.setItem('atendimento', JSON.stringify(atendimento));

            const activeModal = this.modalService.open(DefaultModal, {size: 'lg'});
            activeModal.componentInstance.modalHeader  = 'Agendar Atendimento';
        }
    }

    imprimirProcedimento() {
        let valor = this.protocolo.valor;

        if (valor && valor.trim() != "") {

            window.open(this.serviceMenorValor.getMenorValorPorImpressoPdf(valor), "_blank");
        }
    }

    buscarProcedimentos() {
        let valor = this.protocolo.valor;
        this.guia = null;
        this.lista = null;

        if (valor && valor.trim() != "") {
            this.preloader.fadeIn(10);

            this.service.getGuiaPorImpresso(valor).subscribe(
                (guia) => {
                    if (JSON.stringify(guia) != "{}") {
                        this.guia = guia;

                        this.serviceMenorValor.getMenorValorPorImpresso(valor).subscribe(
                            (lista) => {
                                if (JSON.stringify(lista) != "[]") {
                                    this.lista = lista;
                                } else {
                                    this.toastr.warning("Guia não encontrada.");
                                }
                                this.preloader.fadeOut(10);
                            },
                            (erro) => {
                                this.preloader.fadeOut(10);
                                Servidor.verificaErro(erro, this.toastr);
                                console.error(erro);
                            },
                        );
                    } else {
                        this.toastr.warning("Guia não encontrada.");
                        this.preloader.fadeOut(10);
                    }
                },
                (erro) => {
                    this.preloader.fadeOut(10);
                    Servidor.verificaErro(erro, this.toastr);
                },
            );
        }
    }

    cancelarAtendimento(idAtendimento) {
        if (confirm("Deseja cancelar esse atendimento?")) {
            var atendimento = {
                id : idAtendimento,
                status : "DESMARCADO"
            }

            this.serviceAtendimentos.atualizar(idAtendimento, atendimento).subscribe(
                (retorno) => {
                    this.buscarProcedimentos();
                },
                (erro) => {
                    console.error(erro);
                }
            );

        }
    }
}
