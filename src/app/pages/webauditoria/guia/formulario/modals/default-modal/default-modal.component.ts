import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { Sessao, Servidor, AtendimentoService, PainelSenhaService } from 'app/services';

import * as jQuery from 'jquery';
import { ToastrService } from 'ngx-toastr';

import { Aguardar, FormatosData } from 'app/theme/components';
import * as moment from 'moment';
moment.locale('pt-br');

@Component({
    selector: 'add-service-modal',
    styleUrls: ['./default-modal.component.scss'],
    templateUrl: './default-modal.component.html'
})

export class DefaultModal implements OnInit {

    atendimento;
    chegou: Boolean = false;
    consultorio: string = localStorage.getItem('consultorio');
    id;
    modalHeader: string;
    modalHtml: string;
    segundos: number = 50;
    unidade: string = localStorage.getItem('unidade');
    limiteRechamada: number= 3;
    formatosDeDatas;

    constructor(
        private toastr: ToastrService,
        private activeModal: NgbActiveModal,
        private route: ActivatedRoute,
        private router: Router,
        private service: AtendimentoService,
        private serviceSenha: PainelSenhaService, ) {
        this.route.params.subscribe(params => {

            let url = document.URL.split("/");
            this.id = url[url.length - 1];
        });
    }

    ngOnInit() {
        this.formatosDeDatas = new FormatosData();

        this.service.getId(this.id)
            .subscribe((atendimento) => {
                this.atendimento = atendimento.dados[0];
                this.chamar();

            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );

        console.log(this.unidade);
        console.log(this.consultorio);

        let modalHtml = this.modalHtml;

        let body = jQuery('#modalBody');
        body.append(modalHtml);
    }

    closeModal() {
        this.activeModal.close();
    }

    abrir() {
        this.activeModal.close();

        let atendimento = {
            id: this.id,
            inicio: moment().format(this.formatosDeDatas.dataHoraSegundoFormato),
            status: 'EMATENDIMENTO'
        };

        this.service.atualizar(atendimento.id, atendimento).subscribe(
            (retorno) => {
                this.chegou = true;
            }
        );
        console.log("1");

        this.serviceSenha.iniciarAtendimento(this.unidade, this.consultorio).subscribe(
            (retorno) => {
                console.log("ok iniciar");
            },
            erro => (
                console.error("ERRO AO INICIAR ATENDIMENTO")
            )
        );
    }

    cancelar() {
        this.activeModal.close();
        this.router.navigate([`/${Sessao.getModulo()}/atendimento`]);
    }

    chamar() {
        this.serviceSenha.chamarsenha(this.unidade, this.consultorio, this.atendimento.senha)
            .subscribe(
            (retorno) => {
                Aguardar.aguardar(this.segundos).then(() => {

                    if (!this.chegou) {
                        this.rechamar();
                    }
                });
            },
            erro => (
                this.erroSenha()
            )
            );
    }

    rechamar() {
        this.limiteRechamada--;
        if(this.limiteRechamada === 0){
            return;
        }
        
        Aguardar.aguardar(this.segundos).then(() => {

            if (!this.chegou) {
                this.serviceSenha.rechamarsenha(this.unidade, this.consultorio)
                    .subscribe((retorno) => {
                    });
                    
                this.rechamar();
            }
        });
    }

    erroSenha() {
        let modalHtml = this.modalHtml;

        let body = jQuery('#modalBody');
        body.html('Não foi possível chamar o paciente através do painel de senha.');

        jQuery('.modal-footer button.btn-primary').removeClass('btn-primary').addClass('btn-danger').html('Ciente');

    }
}