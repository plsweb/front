import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { AtendimentoService, PrestadorService, PacienteService } from '../../../../../../services';

import { Servidor } from '../../../../../../services/servidor';
import { Sessao } from '../../../../../../services/sessao';

import { ActivatedRoute, Router } from '@angular/router';
import { Notificacao, Aguardar } from '../../../../../../theme/components';
import { Saida } from '../../../../../../theme/components/entrada/entrada.component';
import * as jQuery from 'jquery';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'add-service-modal',
    styleUrls: ['./default-modal.component.scss'],
    templateUrl: './default-modal.component.html'
})

export class DefaultModal implements OnInit {

    modalHeader: string;
    modalHtml: string;

    atendimento = JSON.parse(localStorage.getItem('atendimento'));
    locais = [];

    local:Saida;
    agendamento:Saida;

    constructor(private activeModal: NgbActiveModal,
        private route: ActivatedRoute,
        private router: Router,
        private service: AtendimentoService,
        private toastr: ToastrService,
        private pacienteService: PacienteService,
        private servicePrestador: PrestadorService,) {
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
            this.toastr.warning("Selecione o local.");
            this.focar("Local");
            return false;
        }

        let agendamento = this.agendamento.valor;
        let guiaAtual   = this.atendimento.guia.impresso;

        if (!this.agendamento.valido || agendamento.trim() == "") {
            this.toastr.warning("Preencha o Data/Hora.");
            this.focar("DataHora");
            return false;
        }

        agendamento = agendamento.substring(0, 2)   + "/"
                    + agendamento.substring(2, 4)   + "/"
                    + agendamento.substring(4, 8)   + " "
                    + agendamento.substring(8, 10)  + ":"
                    + agendamento.substring(10, 12) + ":"
                    + agendamento.substring(12, 16);


        // BUSCAR PACIENTE PELO NUMERO DA CARTEIRINHA
        this.pacienteService.getPaciente( { pagina: 1, quantidade : 5, carteirinha : this.atendimento.beneficiario.codigo, simples: true } ).subscribe(
            (retorno) => {
                let paciente = (retorno.dados || retorno)
                if( paciente && paciente.length ){
                    
                    this.atendimento = {
                        "agendamento" : agendamento,
                        "paciente" : {
                            "id" : paciente[0].id
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
            

                    console.log(this.atendimento);
                    
                    this.service.inserir(this.atendimento).subscribe(
                        (status) => {
                            if (status.status == 412) {
                                this.toastr.warning(status.mensagem);
                                return;
                            }

                            if (status) {
                                this.toastr.success("Agendamento realizado");
                                this.activeModal.close();
                                localStorage.setItem('guiaAtual', guiaAtual);
                                location.reload();
                            }
                        },
                        (erro) => {
            
                        }
                    );
                }else{
                    this.toastr.warning("Nao foi encontrado paciente para essa carteirinha: " + this.atendimento.beneficiario.codigo)
                }

            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
                this.toastr.error("Houve um erro ao criar agendamento");
            }
        )

    }

    voltar() {
        localStorage.removeItem('atendimento');
        this.activeModal.close();
    }
}