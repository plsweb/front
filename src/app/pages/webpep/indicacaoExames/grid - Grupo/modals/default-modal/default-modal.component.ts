import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { ToastrService } from 'ngx-toastr';

import { Servidor, AtendimentoService, PrestadorService } from 'app/services';
import { Saida } from '../../../../../../theme/components/entrada/entrada.component';

import * as jQuery from 'jquery';

@Component({
    selector: 'add-service-modal',
    styleUrls: [('./default-modal.component.scss')],
    templateUrl: './default-modal.component.html'
})

export class DefaultModal implements OnInit {

    modalHeader: string;
    modalHtml: string;

    atendimento = JSON.parse(localStorage.getItem('atendimento'));
    locais = [];

    local:Saida;
    agendamento:Saida;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private toastr: ToastrService,
        private activeModal: NgbActiveModal,
        private service: AtendimentoService,
        private servicePrestador: PrestadorService,
    ) {
    }

    ngOnInit() {

        this.servicePrestador.getLocaisPrestador(this.atendimento.prestador.codigo).subscribe(
            (locais) => {
                locais.forEach(
                    function(valor) {
                        valor.descricao = valor.endereco + " - " + valor.cidade + " - " + valor.estado;
                    }
                );

                this.locais = locais;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );
    }

    getProcedimento(evento) {

        // this.procedimento = evento;
    }

    getLocal(evento) {
        this.local = evento;
    }

    getDataHora(evento) {
        this.agendamento = evento;
    }

    focar(id) {
        jQuery("#"+id).focus();
    }

    salvar() {
        if (!this.local.valido || this.local.valor.trim() == "0") {
            alert("Selecione o local.");
            this.focar("Local");
            return false;
        }

        let agendamento = this.agendamento.valor;
        let guiaAtual   = this.atendimento.guia.impresso;

        if (!this.agendamento.valido || agendamento.trim() == "") {
            alert("Preencha o Data/Hora.");
            this.focar("DataHora");
            return false;
        }

        agendamento = agendamento.substring(0, 2)   + "/"
                    + agendamento.substring(2, 4)   + "/"
                    + agendamento.substring(4, 8)   + " "
                    + agendamento.substring(8, 10)  + ":"
                    + agendamento.substring(10, 12) + ":"
                    + agendamento.substring(12, 16);


        this.atendimento = {
            "agendamento" : agendamento,
            "paciente" : {
                "id" : this.atendimento.paciente.id
            },
            "guia" : {
                "id" : this.atendimento.guia.id
            },
            "local" : {
                "id" : this.local.valor
            },
            "observacao" : this.atendimento.observacao,
            "prestador" : {
                "id" : this.atendimento.prestador.id
            },
            "status" : "PENDENTE",
        }

        this.service.inserir(this.atendimento).subscribe(
            (status) => {
                if (status) {
                    alert("Agendamento realizado");
                    this.activeModal.close();
                    localStorage.setItem('guiaAtual', guiaAtual);
                    location.reload();
                }
            },
            (erro) => {
            }
        );
    }

    voltar() {
        localStorage.removeItem('atendimento');
        this.activeModal.close();
    }
}