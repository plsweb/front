import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ToastrService } from 'ngx-toastr';

import { Sessao, Servidor, Util, PacienteService, FormularioService, PacienteDocumentoService, AtendimentoService } from 'app/services';

import { FormatosData } from '../../theme/components/index';

import * as moment from 'moment';

moment.locale('pt-br');

@Component({
    selector: 'avaliacao',
    templateUrl: './avaliacao.component.html',
    styleUrls: ['./avaliacao.component.scss']
})
export class Avaliacao implements OnInit {
    respostasCabecalho = {};
    formatosDeDatas;
    mensagem = false;
    evolucoes;
    formularios;
    formulario;
    paciente;
    atendimento;
    id;

    constructor(
        private toastr: ToastrService,
        private route: ActivatedRoute,
        private router: Router,
        private servicePaciente: PacienteService,
        private serviceAtendimento: AtendimentoService,
        private serviceFormulario: FormularioService,
        private pacienteDocumentoService: PacienteDocumentoService,
    ) {
        localStorage.setItem("tema", "light_tema");
        $("head")["0"].innerHTML += `<link id="tema" href="assets/css/light_tema.css" rel="stylesheet">`;

        this.route.params.subscribe(params => {
            Sessao.setToken(params.token);
            this.formulario = params.formulario;

            this.route.queryParams.subscribe(queryParam => {
                if (queryParam['paciente']) {
                    this.getPaciente(queryParam['paciente']);
                }

                if (queryParam['atendimento']) {
                    this.getAtendimento(queryParam['atendimento']);
                }
            });
        });
    }

    ngOnInit() {
        this.formatosDeDatas = new FormatosData;
        this.serviceFormulario.getFormularioPorTokenAtivoTipo("CRIAR", { tipo: 'EVOLUCAO' }).subscribe(
            (formularios) => {
                this.formularios = formularios.filter(
                    (formulario) => {
                        return formulario.id == this.formulario;
                    }
                );
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );
    }

    criaObjRespostasCabecalho() {
        this.respostasCabecalho['sexo'] = Util.conversorRespostaValor()['sexo'][this.paciente.sexo];
    }

    buscarPacienteDocumento() {
        let request = {
            idPaciente: this.paciente.id,
            tipo: 'EVOLUCAO',
            simples: true,
        }

        this.pacienteDocumentoService.getPacienteToken(request).subscribe(
            (evolucoes) => {
                this.evolucoes = evolucoes.dados.filter((evolucao) => {
                    return !evolucao.pacienteDocumentoPai
                });

                this.novaEvolucao();
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );
    }

    getPaciente(pacienteId) {

        this.servicePaciente.getPaciente({ carteirinha: pacienteId, pagina: 1, quantidade: 1 }).subscribe(
            (paciente) => {
                if (paciente && (paciente.dados || paciente).length) {
                    this.paciente = paciente.dados[0];
                    this.buscarPacienteDocumento();
                } else {
                    this.servicePaciente.getPaciente({ id: pacienteId }).subscribe(
                        (paciente) => {
                            if (paciente && (paciente.dados || paciente).length) {
                                this.paciente = paciente.dados[0];
                                this.buscarPacienteDocumento();
                            } else {
                                this.toastr.error("Houve um erro ao buscar paciente por ID: " + pacienteId);
                                return;
                            }
                        }, (erro) => {
                            Servidor.verificaErro(erro, this.toastr);
                            return;
                        }
                    );
                }
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
                return;
            }
        );

        // this.servicePaciente.getPaciente( { id : pacienteId } ).subscribe(
        //     (paciente) => {
        //         this.paciente = paciente.dados[0];
        //         this.buscarPacienteDocumento();
        //     }
        // );
    }

    // getCodigo(pacienteId) {
    //     this.servicePaciente.getPaciente( { id : pacienteId } ).subscribe(
    //         (paciente) => {
    //             this.paciente = paciente.dados[0];
    //             this.buscarPacienteDocumento();
    //         }
    //     );
    // }

    getAtendimento(atendimentoId) {
        this.serviceAtendimento.getId(atendimentoId).subscribe(
            (atendimento) => {
                this.atendimento = atendimento.dados[0];
                this.paciente = atendimento.paciente;
                this.buscarPacienteDocumento();
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );
    }

    novaEvolucao() {
        let agora = new Date();
        this.criaObjRespostasCabecalho();

        let possuiFormulario = this.evolucoes.filter(
            (evolucao) => {
                if (moment(evolucao.data, this.formatosDeDatas.dataHoraSegundoFormato).format(this.formatosDeDatas.dataFormato) == moment().format(this.formatosDeDatas.dataFormato)) {
                    console.log("Mesmo dia");

                    if (evolucao.formulario.id == this.formulario) {
                        console.log("Mesmo ID:  " + this.formulario);
                        console.log(evolucao)
                        return evolucao;
                    }
                }
            }
        );

        if (possuiFormulario.length) {
            if (!confirm('Esse formulário já existe para o paciente. \nDeseja criar outro?')) {
                this.id = possuiFormulario[0].id;
                this.formulario = possuiFormulario[0].formulario;
                return;
            }
        }

        let requestForm = {
            data: moment().format(this.formatosDeDatas.dataHoraSegundoFormato),
            formulario: { id: this.formulario },
        };

        if (this.paciente) {
            requestForm["paciente"] = { id: this.paciente.id };
        }

        if (this.atendimento) {
            requestForm["atendimento"] = { id: this.atendimento.id };
        }

        this.pacienteDocumentoService.inserir(requestForm).subscribe(
            (id) => {
                if (id) {
                    this.id = id;
                }
            }, (erro) => {
                if (erro.status == 511) {
                    let id = erro.json();
                    var request = indexedDB.open('cacheRequest');
                    request.onsuccess = ($event: any) => {

                        // get database from $event
                        var db = $event.target.result;

                        // create transaction from database
                        var transaction = db.transaction('formularios', 'readwrite');

                        var formulariosStore = transaction.objectStore('formularios');
                        console.log("Vou buscar");


                        formulariosStore.openCursor(null, 'next').onsuccess = (event) => {
                            var cursor = event.target.result;
                            if (cursor) {
                                console.log(cursor.value[0].formulario.id + " =  " + cursor.value[0].formulario.titulo);

                                if (cursor.value[0].formulario.id == requestForm.formulario.id) {
                                    console.log("Fomrulario encontrado offline");
                                    let novaEvolucao = [
                                        {
                                            id: id,
                                            data: moment().format(this.formatosDeDatas.dataHoraSegundoFormato),
                                            usuario: cursor.value[0].usuario,
                                            formulario: cursor.value[0].formulario
                                        }
                                    ]

                                    this.evolucoes = novaEvolucao.concat([], this.evolucoes);
                                    this.toastr.warning("Formulario adicionado em modo offline");

                                } else {
                                    cursor.continue();
                                }
                            } else {
                                this.toastr.warning('Formulario nao encontrado offline');
                                return
                            }
                        };
                    };
                }

                Servidor.verificaErro(erro, this.toastr);
            }
        );
    }

    salvaFormulario(event) {
        this.mensagem = true;
    }
}