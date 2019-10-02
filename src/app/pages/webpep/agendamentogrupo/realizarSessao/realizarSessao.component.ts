import { ActivatedRoute, Router } from '@angular/router';
import { Component, ViewChild, ElementRef, OnInit, TemplateRef, QueryList, ViewChildren } from '@angular/core';

import { ToastrService } from 'ngx-toastr';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { Sessao, Servidor, AgendamentoGrupoService, PacienteDocumentoService, RespostaOpcaoService } from 'app/services';

import { FormatosData, NgbdModalContent } from 'app/theme/components';

import { Evolucao } from '../../evolucao/formulario';
import { FormularioPaciente } from '../../atendimento/formulario';

import * as moment from 'moment';
moment.locale('pt-br');

@Component({
    selector: 'realizarSessao',
    templateUrl: './realizarSessao.html',
    styleUrls: ['./realizarSessao.scss'],
    providers: [Evolucao, FormularioPaciente]
})
export class RealizarSessao implements OnInit {

    idAbaAberta;
    idSessao;
    objCheckbox = new Object();
    visualizacao;
    idGrupo;
    qtdItensTotal;
    sessao;
    mensagemSalvou = "";
    indicadores = [];
    carregou;
    idFormAberto;
    activeModal;
    paginaAtual;
    tipoSessao;
    naoSalvar;
    itensPorPagina;
    formatosDeDatas = new FormatosData();
    objSessoes = [];
    pacientesGrupo = [];
    objPresenca = [];
    podeRemover = true;

    formularioNaoRespondidos = [];
    perguntasObrigatoriasNaoRespondidas = [];

    objTipoPresenca = [
        { "codigo": true, "nome": "Presente" }
    ]
    podeFinalizar = false;
    presencaPreenchida = false;

    @ViewChild("bodyModalFormEvolucao", { read: TemplateRef }) bodyModalFormEvolucao: TemplateRef<any>;
    @ViewChild("botoesModalFormEvolucao", { read: TemplateRef }) botoesModalFormEvolucao: TemplateRef<any>;

    @ViewChild("bodyPerguntasNaoRespondidas", { read: TemplateRef }) bodyPerguntasNaoRespondidas: TemplateRef<any>;


    constructor(
        private modalService: NgbModal,
        private evolucaoService: Evolucao,
        private serviceBeneForm: PacienteDocumentoService,
        private serviceRespostaOpcao: RespostaOpcaoService,
        private servicePacienteGrupo: AgendamentoGrupoService,
        private route: ActivatedRoute,
        private grupoService: AgendamentoGrupoService,
        private toastr: ToastrService,
        private router: Router,
    ) {
        jQuery("#preloader").fadeIn(10);
    }

    ngOnInit() {
        this.paginaAtual = 1;
        this.itensPorPagina = 10;

        this.route.params.subscribe(
            params => {
                this.idSessao = params["sessaoid"]
                this.idGrupo = params["groupid"]
                this.visualizacao = (params["acao"] == 'visualizar')
                this.podeFinalizar = false;
                if (this.visualizacao == 'visualizar') {
                    this.naoSalvar = true;
                } else {
                    this.validaFinalizacaoSessao();
                }
            }
        );

        this.servicePacienteGrupo.buscarPacientes({ grupoId: this.idGrupo }).subscribe(
            (pacientes) => {
                this.qtdItensTotal = pacientes.qtdItensTotal;
                this.pacientesGrupo = pacientes.dados || pacientes;
                this.pacientesGrupo = this.pacientesGrupo.map(
                    (paciente) => {
                        return {
                            nome: paciente.paciente.nome,
                            id: paciente.id
                        }
                    }
                );
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        );

        this.grupoService.grupoSessao({ grupoId: this.idGrupo, id: this.idSessao }).subscribe(
            (sessao) => {
                this.sessao = sessao.dados[0];
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );

        this.buscaPacienteGrupoSessaoPaginado(null);

        this.grupoService.getTipoFalta().subscribe(
            (tipos) => {
                tipos.dados.forEach(tipo => this.objTipoPresenca.push(tipo));
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    completeArray = false;
    @ViewChildren("inputsForm") inputsForm: QueryList<ElementRef>;
    temFuncao = false;
    elems = [];
    ngAfterViewChecked() {
        if (!this.completeArray) {

            this.inputsForm.forEach(
                (child: any) => {
                    this.completeArray = true;

                    if (child.tipo == "FUNCAO") {
                        this.temFuncao = true;
                        this.elems.push(child)
                    }
                }
            );

        }
    }

    validaFinalizacaoSessao() {

        let bPresencaPreenchida = true;
        this.objPresenca.forEach((presenca) => {
            if (!(presenca['obj']['presenca'] || presenca['obj']['tipoFalta'])) {
                bPresencaPreenchida = false;
            }
        });
        this.presencaPreenchida = this.objPresenca && this.objPresenca.length && bPresencaPreenchida;
    }

    buscaPacienteGrupoSessaoPaginado(evento) {
        this.objPresenca = [];
        let resquest = {
            sessaoId: this.idSessao,
            pagina: evento ? evento.paginaAtual : this.paginaAtual,
            quantidade: this.itensPorPagina,
        }
        this.carregandoRespostas = true;

        this.grupoService.getPacienteSessaoFormulario(resquest).subscribe(
            (retorno) => {
                this.carregandoRespostas = false;
                this.carregou = true;
                this.objSessoes = retorno.dados;
                this.paginaAtual = retorno.paginaAtual;
                this.qtdItensTotal = retorno.qtdItensTotal;

                if (!retorno.dados.length) {
                    this.toastr.warning("Nenhum beneficiário encontrado");
                    jQuery("#preloader").fadeOut(50);
                    return;
                }

                this.paginaAtual = retorno.paginaAtual;
                this.sessao = retorno.dados[0].grupoSessaoPaciente.grupoSessao;

                let hoje = moment().format(this.formatosDeDatas.dataFormato);
                let dataSessao = moment(this.objSessoes[0]['grupoSessaoPaciente']['grupoSessao'].dataSessao, this.formatosDeDatas.dataHoraSegundoFormato).format(this.formatosDeDatas.dataFormato);

                if (this.objSessoes[0]['grupoSessaoPaciente']['grupoSessao']['dataInicio']) {
                    this.tipoSessao = "iniciada";
                }
                if (this.objSessoes[0]['grupoSessaoPaciente']['grupoSessao']['dataFim']) {
                    this.tipoSessao = "finalizada";
                }

                // PERMITE FINALIZAR SESSOES RETROATIVAS
                if (hoje != dataSessao) {
                    this.podeRemover = false;
                }

                if (!this.visualizacao && this.tipoSessao == 'finalizada') {
                    this.router.navigate([`/${Sessao.getModulo()}/agendamentogrupo/grupo/${this.idGrupo}/sessao/${this.idSessao}/visualizar`])
                }

                this.criaObjPresenca();
                jQuery("#preloader").fadeOut(50);

                this.validaFinalizacaoSessao();
            }, (error) => {
                this.carregandoRespostas = false;
                Servidor.verificaErro(error, this.toastr);
                jQuery("#preloader").fadeOut(50);
                this.validaFinalizacaoSessao();
            }
        );
    }

    criaObjPresenca() {
        this.objSessoes.forEach(
            (paciente) => {
                this.objPresenca.push(
                    {
                        "id": paciente.grupoSessaoPaciente.id,
                        "obj": {
                            "paciente": {
                                "id": paciente.paciente.id,
                                "nome": paciente.paciente.nome,
                                "idGrupoPaciente": paciente.grupoSessaoPaciente.grupoPaciente.id
                            },
                            "dataSessao": paciente.data,
                            "grupo": {
                                "id": paciente.grupoSessaoPaciente.grupoSessao.grupo.id
                            },
                            "presenca": false || paciente.grupoSessaoPaciente.presenca,
                            "tipoFalta": undefined || paciente.grupoSessaoPaciente.tipoFalta
                        }
                    }
                )

                this.objCheckbox[paciente.id] = {};
                this.setRespostasCheckbox(paciente.formularioResposta, paciente.id);
            }
        )

    }

    setValor(posPart) {

        if( this.objPresenca && this.objPresenca[posPart] ){
            if (this.objPresenca[posPart]['obj']['presenca']) {
                return this.objPresenca[posPart]['obj']['presenca'];

            } else if (this.objPresenca[posPart]['obj']['tipoFalta'] && this.objPresenca[posPart]['obj']['tipoFalta']['id']) {
                return this.objPresenca[posPart]['obj']['tipoFalta']['id'];

            } else {
                return '0';
            }
        }

    }

    setStatusBene(evento, pos, participante) {
        let retorno;
        if (evento && evento.valor) {

            //É presente
            if (evento.valor == 'true') {
                this.objPresenca[pos]["obj"]['presenca'] = true;
                retorno = true;
                if (this.objPresenca[pos]["obj"]['tipoFalta'])
                    delete this.objPresenca[pos]["obj"]['tipoFalta'];
            } else {
                // Valida os outros tiposFalta
                this.objPresenca[pos]["obj"]['presenca'] = false;
                this.objPresenca[pos]["obj"]['tipoFalta'] = { id: parseInt(evento.valor) }
                retorno = this.objPresenca[pos]["obj"]['tipoFalta'];
            }

            this.grupoService.atualizarGrupoSessaoPaciente(this.objPresenca[pos]["obj"], this.objPresenca[pos]["id"]).subscribe(
                () => {
                    this.toastr.success("Status do paciente salvo com sucesso");
                    this.validaFinalizacaoSessao();
                }, (error) => {
                    Servidor.verificaErro(error, this.toastr);
                }
            );
            return retorno;
        }


    }

    visualizarFormulario(pacienteDocumento, posPacienteDocumento = undefined) {

        // this.router.navigate([`/${Sessao.getModulo()}/evolucao/formulario/${idBeneForm}`]);

        if (this.tipoSessao == 'finalizada') {
            this.visualizacao = true;
        }

        this.criaObjRespostasCabecalho(pacienteDocumento);

        this.idFormAberto = pacienteDocumento.id
        this.activeModal = this.modalService.open(NgbdModalContent, { size: 'lg' });
        this.activeModal.componentInstance.modalHeader = 'Preencher Formulario de Evolução do Paciente';
        this.activeModal.componentInstance.templateRefBody = this.bodyModalFormEvolucao;
        this.activeModal.componentInstance.templateBotoes = this.botoesModalFormEvolucao;
        this.activeModal.componentInstance.custom_lg_modal = true;

        let fnFechaModal = () => {
            this.carregandoRespostas = true;
            this.atualizaResposta(pacienteDocumento.id, posPacienteDocumento);
            this.idFormAberto = false;
        };
        this.activeModal.result.then(fnFechaModal, fnFechaModal);
    }

    respostasCabecalho = new Object();
    criaObjRespostasCabecalho(pacienteDocumento){
        this.respostasCabecalho['genero'] = pacienteDocumento.paciente['sexo'];
        this.respostasCabecalho['idade'] = moment().diff(moment(pacienteDocumento.paciente['nascimento'], this.formatosDeDatas.dataHoraSegundoFormato), 'years');
    }

    imprimirFomulario(idForm) {
        window.open(this.serviceBeneForm.evolucaoPdf(idForm), "_blank");
    }

    getResposta(evento, indicador, participante, tipo, isChange, posPart = undefined, pos) {

        if (evento && evento.valor) {
            if ((tipo != "checkbox" && tipo != "seleciona") && !isChange) {
                return;
            }

            let respostasFuncoesIndicadores = new Object();
            if (this.temFuncao) {
                if (this.elems && this.elems.length) {
                    let elem = this.elems[posPart];
                    let novoElem = this.evolucaoService.concatenaElementosFormulaId(elem, this.objSessoes[posPart].id)
                    respostasFuncoesIndicadores = this.evolucaoService.execucaoFormulas([novoElem], true);
                }
            }

            let formularioResposta = { formularioResposta: [] };

            let indiceIndicador;
            participante.formulario.formularioGrupo.forEach(function (grupo) {
                grupo.grupoPergunta.forEach(
                    (pergunta, indice) => {

                    if (pergunta.pergunta.id == indicador.id) {
                        let tmp;
                        indiceIndicador = indice
                        tmp = {
                            valor: evento.valor,
                            pergunta: { id: indicador.id },
                            perguntaDescricao: indicador.descricao,
                            ordemGrupo: 1.1,
                            ordem: pos
                        };

                        if (indicador.tipo == "RADIO") {
                            tmp['respostaOpcoes'] = [
                                {
                                    id: evento.valor
                                }
                            ]
                        }

                        formularioResposta.formularioResposta.push(tmp);
                    }

                });
            });

            Object.keys(respostasFuncoesIndicadores).forEach(
                (resposta) => {
                    let objresposta = respostasFuncoesIndicadores[resposta];
                    let objResp = {
                        "pergunta": {
                            "id": objresposta.pergunta
                        },
                        "ordem": indiceIndicador,
                        "ordemGrupo": 1.1,
                        "valor": objresposta.valor
                    }

                    formularioResposta.formularioResposta.push(objResp);
                }
            )

            this.serviceBeneForm.atualizar(participante.id, formularioResposta).subscribe(
                () => {
                    let horaAtual = moment().format(this.formatosDeDatas.horaFormato);
                    this.mensagemSalvou = "Sessao salva ás " + horaAtual;
                    participante.formularioResposta.forEach(
                        (respostaAntiga, index) => {
                            formularioResposta.formularioResposta.forEach(
                                (novaResposta) => {
                                    if (respostaAntiga.pergunta.id == novaResposta.pergunta.id) {
                                        participante.formularioResposta[index].valor = novaResposta.valor
                                    }
                                }
                            )
                        }
                    )
            
                    // this.buscaPacienteGrupoSessaoPaginado({ paginaAtual : this.paginaAtual });
                }, (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                    // this.buscaPacienteGrupoSessaoPaginado({ paginaAtual : this.paginaAtual });
                }
            );

        }
    }

    resposta(participante, formularioParticipante, id) {
        let valor = "";
        if (formularioParticipante.length < 1)
            return;

        formularioParticipante.forEach(
            (resposta) => {

                if (resposta.pergunta.id == id) {

                    if (resposta.pergunta.tipo == "RADIO") {
                        // valor = resposta['valor'];
                        valor = ''

                        if (resposta.respostaOpcoes && resposta.respostaOpcoes.length) {
                            let opcoesResposta = resposta.respostaOpcoes.map(
                                (resposta) => {
                                    return resposta.perguntaOpcao.id;
                                }
                            ).slice()
                            valor = opcoesResposta.length ? opcoesResposta[0] : '' /*ENVIAR UM ARRAY COM ID DE OPÇÕES*/
                        }
                        return;
                        // dados[""0""].formularioResposta[2].respostaOpcoes[""0""].perguntaOpcao.id
                    } if (resposta.pergunta.tipo == "BOOLEAN" || resposta.pergunta.tipo == "SIMNAO") {
                        if( resposta && resposta.valor ){
                            if ( resposta.valor == 'Não' || resposta.valor == 0 ) {
                                valor = "0";
                            }
            
                            if ( resposta.valor == 'Sim' || resposta.valor == 1 ) {
                                valor = "1";
                            }
                        }
                    }else {
                        valor = resposta['valor'];
                        return;
                    }
                }
            }
        )
        return valor;
    }

    modalConfirmar;
    tentouFinalizar = false;
    finalizarSessao() {

        this.validaFinalizacaoSessao();
        if (!this.presencaPreenchida) {
            this.toastr.warning("Informe o status de todos os pacientes da sessão");
            return;
        }

        this.naoSalvar = true;

        this.modalConfirmar = this.modalService.open(NgbdModalContent);
        this.modalConfirmar.componentInstance.modalHeader = `${this.sessao.grupo.descricao}`;
        this.modalConfirmar.componentInstance.modalMensagem = `Tem certeza que deseja finalizar a sessao: ${this.sessao.dataSessao}?`;
        this.modalConfirmar.componentInstance.modalAlert = true;

        this.modalConfirmar.componentInstance.retorno.subscribe(
            (retorno) => {
                if (retorno) {
                    jQuery("#preloader").fadeIn(10);
                    let esse = this;

                    this.perguntasObrigatoriasNaoRespondidas = [];

                    //  Verifica se pode Finalizar sessao
                    //  TODO: confirmar se o id é o this.idGrupo
                    this.serviceBeneForm.formulariosComPerguntasObrigatoriasPorGrupoSessao(this.idSessao).subscribe(
                        (formulario) => {
                            this.podeFinalizar = !formulario.qtdItensTotal;
                            this.formularioNaoRespondidos = formulario.dados;

                            if (this.podeFinalizar) {
                                let dataAtual = moment(moment()).format(this.formatosDeDatas.dataHoraSegundoFormato)
                                this.grupoService.atualizarGrupoSessao({ dataFim: dataAtual }, this.idSessao).subscribe(
                                    () => {
                                        jQuery("#preloader").fadeOut(10);
                                        this.toastr.success("Sessão foi finalizada com sucesso");

                                        // TODO FINALIZAÇÃO PELO BACK (this.grupoService.atualizarGrupoSessao({ dataFim: dataAtual }, this.idSessao))
                                        // this.finalizaDocumentos();

                                        this.tentouFinalizar = true;
                                        this.perguntasObrigatoriasNaoRespondidas = [];

                                        setTimeout(() => {
                                            this.router.navigate([`/${Sessao.getModulo()}/agendamentogrupo/grupo/${this.idGrupo}`])
                                        }, 1000);
                                    }, (error) => {
                                        jQuery("#preloader").fadeOut(10);
                                        Servidor.verificaErro(error, this.toastr);
                                    }
                                );
                            } else {
                                jQuery("#preloader").fadeOut(10);
                                this.toastr.error("Não é possivel finalizar sessão sem preencher campos obrigatórios");
                                this.tentouFinalizar = true;
                                console.log("Não respondidas: ");
                                console.log(formulario.dados);
                            }
                        }, (error) => {
                            Servidor.verificaErro(error, this.toastr);
                        }
                    );
                }
            }
        );
    }

    finalizaDocumentos() {
        console.log(this.objSessoes);

        this.objSessoes.forEach(
            (pacienteDocumento) => {
                if (pacienteDocumento.grupoSessaoPaciente.presenca) {
                    // 136441
                    let request = {
                        status: 'FINALIZADO'
                    }
                    this.serviceBeneForm.atualizar(pacienteDocumento.id, request).subscribe(
                        () => {
                            console.warn("documento:  " + pacienteDocumento.id + ' Finalizado');
                        }, (error) => {
                            Servidor.verificaErro(error, this.toastr);
                        }
                    );
                }
            }
        )
    }

    carregandoRespostas = false;
    atualizaResposta(idPacienteDocumento, posPacienteDocumento) {
        this.serviceBeneForm.getId({ id: idPacienteDocumento }).subscribe(
            (retorno) => {
                let novasRespostas = (retorno.dados || retorno)[0];
                this.objSessoes[posPacienteDocumento].formularioResposta = novasRespostas.formularioResposta;

                this.setRespostasCheckbox(novasRespostas.formularioResposta, idPacienteDocumento);

                this.carregandoRespostas = false;
                console.log("Já buscou");
            }, (error) => {
                this.carregandoRespostas = false;
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    abrirPerguntasNaoRespondidas(objPerguntas = undefined) {

        if (!objPerguntas) {
            this.serviceBeneForm.getId({ sessaoId: this.idSessao }).subscribe(
                (responseEvolucao) => {
                    let evolucoes = responseEvolucao.dados;
                    let iValidacao = 0;
                    evolucoes.forEach((evolucao, index) => {

                        if (!this.objPresenca[index]['obj']['presenca']) {
                            this.podeFinalizar = true;
                            return
                        }

                        let objPerguntasNaoRespondidasPaciente = {
                            paciente: this.objPresenca[index]['obj']['paciente']['nome'],
                            id: this.objPresenca[index]['obj']['paciente']['id'],
                            pergunta: []
                        }


                        evolucao.formulario.formularioGrupo.forEach((form) => {
                            let aPerguntasObrigatorias = form.grupoPergunta.filter((grupoPergunta) => { return grupoPergunta.obrigatorio });

                            // objPerguntasNaoRespondidas['pergunta'] = [];

                            aPerguntasObrigatorias.forEach((pergunta) => {
                                let perguntaObrigatoria = pergunta.pergunta;
                                let bTemResposta = evolucao.formularioResposta.filter((resposta) => {
                                    if (pergunta.pergunta.id == resposta.pergunta.id) {
                                        console.log("igual");
                                    }
                                    return pergunta.pergunta.id == resposta.pergunta.id;
                                });

                                console.log("paciente");
                                console.log(this.objPresenca[index]);

                                console.log("as respostas");
                                console.log(evolucao.formularioResposta);

                                console.log("as obrigatorias");
                                console.log(aPerguntasObrigatorias);


                                let objPergunta;
                                if (bTemResposta.length == 0) {
                                    iValidacao--;// = false;
                                    objPerguntasNaoRespondidasPaciente['pergunta'].push(perguntaObrigatoria);
                                }
                            });
                        });

                        if (objPerguntasNaoRespondidasPaciente['pergunta'] && objPerguntasNaoRespondidasPaciente['pergunta'].length) {
                            this.perguntasObrigatoriasNaoRespondidas.push(objPerguntasNaoRespondidasPaciente);
                        }

                    });

                    if (this.perguntasObrigatoriasNaoRespondidas.length) {
                        this.activeModal = this.modalService.open(NgbdModalContent, { size: 'lg' });
                        this.activeModal.componentInstance.modalHeader = 'Perguntas Obrigatorias nao respondidas por Paciente';
                        this.activeModal.componentInstance.templateRefBody = this.bodyPerguntasNaoRespondidas;
                    } else {
                        this.toastr.success("Todas as perguntas obrigatorias ja foram respondidas");
                    }

                }, (error) => {
                    Servidor.verificaErro(error, this.toastr);
                }
            );
        } else {
            this.activeModal = this.modalService.open(NgbdModalContent, { size: 'lg' });
            this.activeModal.componentInstance.modalHeader = 'Perguntas Obrigatorias nao respondidas por Paciente';
            this.activeModal.componentInstance.templateRefBody = this.bodyPerguntasNaoRespondidas;
        }

    }

    setColorBackgroundStatus(pos, formulario) {
        if( this.objPresenca && this.objPresenca.length){
            let status = this.objPresenca[pos]['obj']['presenca'] || this.objPresenca[pos]['obj']['tipoFalta'];
            let responder = false;

            this.formularioNaoRespondidos.filter(
                (pacienteDocumento) => {
                    if (formulario == pacienteDocumento) {
                        responder = true;
                    }
                }
            );

            if (responder) {
                return "#f47920";
            }

            switch (status) {
                case true:
                    return "#005128";
                default:
                    return "#79787d";
            }
        }
    }

    getIndicadores(sessoes, retornaObjIndicador, posPacienteDocumento = undefined) {

        if (sessoes && sessoes.length < 1) {
            return [];
        }

        let first = sessoes[0]

        let indicador = [];
        first.formulario.formularioGrupo.forEach(
            grupoForm => {

                grupoForm.grupoPergunta.forEach(
                    pergunta => {

                        this.indicadores.push(pergunta);

                        if (pergunta.indice) {
                            if (!retornaObjIndicador) {
                                indicador.push({ id: pergunta.pergunta.id, descricao: pergunta.pergunta.descricao });
                            } else {
                                indicador.push(pergunta.pergunta);
                            }
                        }
                    }
                );
            }
        );

        if (posPacienteDocumento && this.objSessoes[posPacienteDocumento]) {
            indicador['idelemento'] = this.objSessoes[posPacienteDocumento].id;
        }

        return indicador;
    }

    iniciarSessao() {
        if (confirm("Tem certeza que deseja iniciar a sessao?")) {
            this.toastr.success("Sessão foi iniciada com sucesso");
            let dataAtual = moment(moment()).format(this.formatosDeDatas.dataHoraSegundoFormato)
            this.grupoService.atualizarGrupoSessao({ dataInicio: dataAtual }, this.idSessao).subscribe(
                () => {
                    this.router.navigate([`/${Sessao.getModulo()}/agendamentogrupo/grupo/${this.idGrupo}/sessao/${this.idSessao}/realizar`])
                    this.tipoSessao = "iniciada";
                }, (error) => {
                    Servidor.verificaErro(error, this.toastr);
                }
            )
        }
    }

    checkboxMarcado(opcao, paciente, pergunta) {
        let posPaciente = this.objCheckbox[paciente.id][pergunta.id];
        return posPaciente && posPaciente['valor'] && posPaciente['valor'].indexOf(opcao.id) != -1 ? true : false;
    }

    getCheckbox(participante, valor, indicador, pos) {

        let valorAtual = this.objCheckbox[participante.id][indicador.id]['valor'];

        if (!valorAtual) {

        }
        if (valorAtual.match(valor)) {
            valorAtual = valorAtual.replace('+' + valor, "");

            this.serviceRespostaOpcao.deletarRespostaOpcao(participante.id, valor).subscribe(
                () => {
                    console.warn("remove: " + valor);
                }, (error) => {
                    Servidor.verificaErro(error, this.toastr);
                }
            )

            return

        } else {
            valorAtual += '+' + valor
        }

        // MUDANÇAS EVOLUÇÃO
        let respostaOpcoes = valorAtual.split('+').filter(
            (temValor) => {
                return temValor
            }
        ).map(
            (opcao) => {
                return {
                    id: opcao
                }
            }
        )

        
        // this.objCheckbox[participante.id] = {
        let requestResposta = {
            respostaOpcoes: [respostaOpcoes[respostaOpcoes.length - 1]],
            perguntaDescricao: indicador.descricao,
            pergunta: { id: indicador.id },
            ordemGrupo: 1.1,
            ordem: '00'+pos
        }

        let formularioResposta = {
            "formularioResposta": [requestResposta]
        }

        this.objCheckbox[participante.id][indicador.id]['valor'] = valorAtual;
        this.serviceBeneForm.atualizar(participante.id, formularioResposta).subscribe(
            () => {
                let horaAtual = moment().format(this.formatosDeDatas.horaFormato);
                this.mensagemSalvou = "Sessao salva ás " + horaAtual;
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    setRespostasCheckbox(formularioResposta, id){
        formularioResposta.forEach(
            (resposta) => {
                if (resposta.pergunta.tipo == "SELECAO") {
                    this.objCheckbox[id][resposta.pergunta.id] = {}
                    let valorCheck = '';
                    if (resposta.respostaOpcoes && resposta.respostaOpcoes.length) {
                        valorCheck = "+" + resposta.respostaOpcoes.map(
                            (objresposta) => {
                                return objresposta.perguntaOpcao.id;
                            }
                        ).join('+');

                        this.objCheckbox[id][resposta.pergunta.id] = {
                            valor: valorCheck,
                            pergunta: {
                                id: resposta.pergunta.id
                            }
                        };
                    }else{
                        this.objCheckbox[id][resposta.pergunta.id] = { valor: '', pergunta: { id: '' } }
                    }
                }
            }
        )
    }

    objPacientesGrupo
    fnCfgPacienteRemote(term) {
        let obj = {
            pagina: 1,
            quantidade: 100,
            grupoId: this.idGrupo
            // like: term
        };

        this.grupoService.buscarPacientes(obj).subscribe(
            (retorno) => {
                let dados = retorno.dados || retorno;

                this.objPacientesGrupo = dados.map((pos) => {
                    return {
                        id: pos.id,
                        nome: pos.paciente.nome
                    }
                })
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        )
    }

    // SUBSTITUIR DEPOIS DO LIKE
    getPaciente(evento) {
        if (evento && evento.valor) {
            this.grupoBeneficiarioSelecionado = parseInt(evento.valor);
        } else {
            this.grupoBeneficiarioSelecionado = undefined;
        }
    }

    // pacienteSessaoSelecionado
    // objParamsAddPacientesGrupo
    // getPaciente(evento){
    //     if( evento ){
    //         this.grupoBeneficiarioSelecionado = evento.id;
    //         this.pacienteSessaoSelecionado = evento['nome'];
    //     }else{
    //         this.grupoBeneficiarioSelecionado = undefined;
    //     }
    // }

    grupoBeneficiarioSelecionado = undefined;
    adicionarPacienteSessao() {

        let possuiPaciente = this.objPresenca.filter(
            (paciente) => {
                console.log(paciente);
                return paciente.obj.paciente.idGrupoPaciente == this.grupoBeneficiarioSelecionado
            }
        )

        if (possuiPaciente.length) {
            this.toastr.warning("Paciente já existente na sessão");
            return;
        }

        let request = {
            "grupoPaciente": {
                "id": this.grupoBeneficiarioSelecionado
            },
            "grupoSessao": {
                "id": this.idSessao
            },
            "presenca": false
        }

        this.grupoService.salvarGrupoSessaoPaciente(request).subscribe(
            (retorno) => {
                this.toastr.success("Paciente adicionado na sessao com sucesso");
                this.grupoBeneficiarioSelecionado = undefined;
                this.buscaPacienteGrupoSessaoPaginado(null);
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    removerPacienteSessao(paciente) {
        if (this.podeRemover) {
            if (confirm(`Deseja remover ${paciente.paciente.nome} dessa sessão?"`)) {
                this.grupoService.deleteGrupoSessaoPaciente(paciente.grupoSessaoPaciente.id).subscribe(
                    () => {
                        this.toastr.success("Paciente removido com sucesso");
                        this.serviceBeneForm.delete(paciente.id).subscribe(
                            () => {
                                console.log("Paciente Documento Deletado");
                                this.buscaPacienteGrupoSessaoPaginado({});
                            }, (error) => {
                                Servidor.verificaErro(error, this.toastr);
                            }
                        );
                    }, (error) => {
                        Servidor.verificaErro(error, this.toastr);
                    }
                );
            }
        } else {
            let diaSessao = moment(paciente['grupoSessaoPaciente']['grupoSessao'].dataSessao, this.formatosDeDatas.dataHoraSegundoFormato).format(this.formatosDeDatas.dataFormato);
            this.toastr.warning("Não é possivel remover paciente fora do dia da sessao. Dia da sessao: " + diaSessao);
        }
    }

    mudarParaRealizar() {
        this.router.navigate([`/${Sessao.getModulo()}/agendamentogrupo/grupo/${this.idGrupo}/sessao/${this.idSessao}/realizar`])
    }

    abrirAbaPergunta(idAba) {
        if (this.idAbaAberta == idAba) {
            this.idAbaAberta = "";
        } else {
            this.idAbaAberta = idAba;
        }
    }

    voltar() {
        this.router.navigate([`/${Sessao.getModulo()}/agendamentogrupo/grupo/${this.idGrupo}`]);
    }

    imprimirEvolucoes() {
        window.open(this.serviceBeneForm.evolucaoGrupoPdf(this.idSessao), "_blank");
    }
}