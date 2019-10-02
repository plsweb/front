import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ToastrService } from 'ngx-toastr';

import { Sessao, Servidor, GuiaService, MenorValorService } from 'app/services';
import { DefaultModal } from './modals/default-modal/default-modal.component';
import { Saida } from '../../../../theme/components/entrada/entrada.component';

import * as jQuery from 'jquery';

@Component({
    selector: 'grid',
    templateUrl: './grid.html',
    styleUrls: ['./grid.scss'],
})
export class Grid implements OnInit {
    guia;
    lista;
    protocolo:Saida;
    preloader;
    protocoloValor;

    constructor(
        private router: Router,
        private service: GuiaService,
        private toastr: ToastrService,
        private modalService: NgbModal,
        private serviceMenorValor: MenorValorService,
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
            jQuery("button.btn.btn-primary.form-control.icone").click();

            setTimeout(
                function() {
                    jQuery("#Protocolo").val(guiaAtual);
                    localStorage.removeItem('guiaAtual');
                    this.preloader.fadeOut(10);
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

    getProtocolo(evento) {
        this.protocolo = evento;
        this.protocoloValor = evento.valor;
    }

    agendarProcedimento(paciente, prestador, exames) {
        let observacao = "";

        exames.forEach(
            function(val) {
                observacao += val.codigo + " - " + val.descricao + "\n";
            }
        );

        let atendimento = {
            'paciente' : paciente,
            'guia'         : this.guia,
            'observacao'   : observacao,
            'prestador'    : prestador
        };

        localStorage.setItem('atendimento', JSON.stringify(atendimento));

        const activeModal = this.modalService.open(DefaultModal, {size: 'lg'});
        activeModal.componentInstance.modalHeader  = 'Agendar Atendimento';
    }

    buscarProcedimentos() {
        let valor = this.protocolo.valor;
        this.guia = null;
        this.lista = null;

        if (valor && valor.trim() != "") {
            this.preloader.fadeIn(10);

            this.service.getGuiaPorImpresso(valor)
                .subscribe((guia) => {
                    if (JSON.stringify(guia) != "{}") {
                        this.guia = guia;

                        this.serviceMenorValor.getMenorValorPorImpresso(valor)
                            .subscribe((lista) => {
                                if (JSON.stringify(lista) != "{}") {
                                    this.lista = lista;
                                } else {
                                    alert("Guia não encontrada.");
                                }
                                this.preloader.fadeOut(10);
                            },
                            (erro) => {
                                this.preloader.fadeOut(10);
                                Servidor.verificaErro(erro, this.toastr);
                            },
                        );
                    } else {
                        alert("Guia não encontrada.");
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
}
