import { ActivatedRoute, Router } from '@angular/router';
import { Component, ViewChild, OnInit, TemplateRef, QueryList } from '@angular/core';

import { ToastrService } from 'ngx-toastr';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { Sessao, Servidor, EspecialidadeService, TemaGrupoService, FormularioService, PacienteService, AtendimentoEsperaService, GrupoTemaFormularioService, GrupoPerguntaService, AgendamentoGrupoService } from 'app/services';

import { NgbdModalContent, FormatosData } from 'app/theme/components';


import * as moment from 'moment';
moment.locale('pt-br');

@Component({
    selector: 'detalheTema',
    templateUrl: './detalheTema.html',
    styleUrls: ['./detalheTema.scss'],
    providers: [EspecialidadeService, TemaGrupoService, FormularioService, PacienteService, AtendimentoEsperaService, GrupoTemaFormularioService, GrupoPerguntaService, AgendamentoGrupoService]
})
export class DetalheTema implements OnInit {
    momentjs;

    qtdItensTotal;
    paginaAtual = 1;
    itensPorPagina = 15;

    // Propriedades do Request
    temaid;
    descricao;
    corSelecionada;

    observacao;
    prioridades;
    prioridadeSelecionada;

    listaEspera = [];

    modalInstancia;

    formatosDeDatas;
    
    atual = "geral";
    colorPicker;

    especialidade;
    especialidades;
    objFiltro = [ 'descricao', 'descricao' ];

    paciente;
    pacientes;
    objFiltroPaciente = [ 'nome', 'nome' ];

    formulario;
    formularios;
    objFiltroFormulario = [ 'descricao', 'descricao' ];
    
    perguntas = [];
    disabledIndicador = false;
    limiteIndicePerguntas = 5;

    modalConfirmar;
    grupoSelecionado;
    pacienteSelecionado;

    formsSelecionados = [];
    gruposDisponiveis = [];

    @ViewChild("bodyModalAdicionarAoGrupo", {read: TemplateRef}) bodyModalAdicionarAoGrupo: QueryList<TemplateRef<any>>;
	@ViewChild("templateBotoesAdicionarAoGrupo", {read: TemplateRef}) templateBotoesAdicionarAoGrupo: QueryList<TemplateRef<any>>;

    @ViewChild("bodyModalRemoverDalistaDeEspera", {read: TemplateRef}) bodyModalRemoverDalistaDeEspera: QueryList<TemplateRef<any>>;
    @ViewChild("templateBotoesModalRemoverDalistaDeEspera", {read: TemplateRef}) templateBotoesModalRemoverDalistaDeEspera: QueryList<TemplateRef<any>>;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private toastr: ToastrService, 
        private modalService: NgbModal,
        private serviceEspecialidade: EspecialidadeService,
        private serviceTemaGrupo: TemaGrupoService,
        private serviceFormulario: FormularioService,
        private servicePaciente: PacienteService,
        private serviceAtendimentoEspera: AtendimentoEsperaService,
        private serviceGrupoTemaFormulario: GrupoTemaFormularioService,
        private serviceGrupoPergunta: GrupoPerguntaService,
        private serviceAgendamentoGrupo: AgendamentoGrupoService
    ) {
        this.momentjs = moment;
        this.formatosDeDatas = new FormatosData();

        this.route.params.subscribe(params => {
            this.temaid = params['temaid'] == 'novo' ? undefined : params['temaid'];

            if (this.temaid) {
                let temaAtual = Sessao.getPreferenciasUsuario();

                this['descricao'] = temaAtual['agendamentoGrupoTema']['descricao'];
                this['especialidadeSelecionada'] = temaAtual['agendamentoGrupoTema']['especialidade']['descricao'];
                this['especialidade'] = temaAtual['agendamentoGrupoTema']['especialidade'];
                
                this.serviceTemaGrupo.get({ id:this.temaid }).subscribe(
                    (tema) => {
                        let temaAtual = tema.dados[0] || tema[0];
                        this['enviaSms'] = temaAtual['enviaSms'];
                        this['mensagemSms'] = temaAtual['mensagemSms'];
                        this['mensagemConfirmando'] = temaAtual['mensagemConfirmando'];
                        this['mensagemLembrando'] = temaAtual['mensagemLembrando'];
                    }
                )

                
                this['corSelecionada'] = temaAtual['agendamentoGrupoTema']['cor'];

                this.pergunta();
            }
        });

        this.serviceAtendimentoEspera.getPrioridades( ).subscribe( prioridades => this.prioridades = prioridades  )
    }

    ngOnInit() {
    }


    pergunta() {
        let grupoTemaFormularioRequest = {
            "temaId": this.temaid
        };

        this.serviceGrupoTemaFormulario.get(grupoTemaFormularioRequest).subscribe(
            (formulariosResponse) => {
                if (!formulariosResponse || !formulariosResponse.dados) {
                    return;
                }

                formulariosResponse.dados.forEach((form) => {
                    let perguntas = [];

                    form.formulario.formularioGrupo.forEach(
                        (grupo) => {
                            perguntas = perguntas.concat( grupo.grupoPergunta )
                        }
                    )

                    this.formsSelecionados.push({
                        id: form.id,
                        form: form.formulario,
                        perguntas: perguntas
                        // perguntas: form.formulario.formularioGrupo[0].grupoPergunta
                    });

                });
            },
            (erro) => {
                Servidor.verificaErro(erro);
                this.toastr.warning(erro);
            },
        );
    }

    ngAfterViewInit() {

    }

    //  =============================================
    //                  GETs and SETs
    //  =============================================
    getDescricao(evento) {
        this.descricao = evento.valor;
    }

    enviaSms = false;
    getEnviaSms(evento) {
        this.enviaSms = evento;
    }

    mensagemSms = '';
    getMensagemSms(evento) {
        if(evento && evento.valor != ''){
            this.mensagemSms = evento.valor;
        }
    }

    mensagemConfirmando = '';
    getMensagemConfirmando(evento) {
        if(evento && evento.valor != ''){
            this.mensagemConfirmando = evento.valor;
        }
    }

    mensagemLembrando = '';
    getMensagemLembrando(evento) {
        if(evento && evento.valor != ''){
            this.mensagemLembrando = evento.valor;
        }
    }

    setObjColorPicker(colorPicker) {
        this['colorPicker'] = colorPicker;
    }

    
    especialidadeSelecionada    
    getEspecialidade(especialidade) {
        this.especialidade = especialidade;
        this.especialidadeSelecionada = especialidade.descricao
    }

    getPaciente(paciente) {
        this.paciente = paciente;
    }

    formularioSelecionado;
    getFormulario(formulario) {
        this.formulario = formulario;
        this.formularioSelecionado = formulario.descricao
    }

    setColorBackgroundStatus(prioridade) {
        switch (prioridade) {
            case "ALTA":
                return "red"
            case "MEDIA":
                return "orange"
            case "BAIXA":
                return "green"    
            default:
                return "black"  
        }
    }


    //  =============================================
    //                  Componentes dados
    //  =============================================
    objEspecialidades
    fnCfgEspecialidadeRemote(term) {
        return this.serviceEspecialidade.getEspecialidadeLike(term, 0, 10).subscribe(
            (retorno)=>{
                this.objEspecialidades = retorno.dados || retorno;
            }
        );
    }

    objFormularios;
    fnCfgFormularioRemote(term) {
        this.serviceFormulario.getFormularioLike(term).subscribe(
            (retorno) => {
                this.objFormularios = retorno.dados || retorno;
            }
        );
    }
    fnCfgPacienteRemote(term) {
        return this.servicePaciente.getPacienteLike({ like : term, simples: true, quantidade: 5 }, true);
    }
    buscaEspecialidade(evento) {

        if( evento.searchStr && evento.searchStr.length > 3 ){
            this.serviceEspecialidade.getEspecialidadeLike(evento.searchStr, 0, 10).subscribe(
                (especialidades) => {
                    this.especialidades = especialidades;
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                },
            )
        }
    }

    buscaPaciente(evento) {

        if( evento.searchStr && evento.searchStr.length > 3 ){
            this.servicePaciente.getPacienteLike({ like : evento.searchStr, simples: true, quantidade: 5}).subscribe(
                (pacientes) => {
                    this.pacientes = pacientes;
                },
                (erro) => {
                    this.toastr.warning(erro);
                },
            )
        }
    }

    buscarAtendimentoEsperaPaginado(evento = null, paciente = null) {
        this.paginaAtual = evento ? evento.paginaAtual : this.paginaAtual;
        this.serviceAtendimentoEspera.atendimentoEsperaPaginado(this.paginaAtual, this.itensPorPagina, {idGrupoTema: this.temaid, codigoPaciente: (paciente || '')}).subscribe(
            (listaEspera) => {
                this.listaEspera = this.listaEspera.concat([], listaEspera.dados);

                this.qtdItensTotal = listaEspera.qtdItensTotal;
            },
            (erro) => {
                this.toastr.warning(erro);
            }
        );
    }


    //  =============================================
    //              Eventos components
    //  =============================================
    trocaEstadoIndicador($event, pergunta) {
        
        let grupoPerguntaRequest = {
            "indice": $event,
            "obrigatorio": $event ? true : pergunta.obrigatorio
        };

        let bDisabledIndicador = 0;
        this.formsSelecionados.forEach((form) => {
            form.perguntas.forEach((pergunta) => {
                if (pergunta.indice) {
                    bDisabledIndicador++;
                }
            });
        })

        if( bDisabledIndicador >= this.limiteIndicePerguntas ){
            if( $event ){
                this.toastr.warning("Nao é possivel selecionar mais indicadores");
                pergunta.indice = false
                return
            }else{

                if( pergunta.indice == $event ){
                    return;
                }else{

                }
            }
        }

        pergunta.indice = $event;

        this.serviceGrupoPergunta.put(grupoPerguntaRequest, pergunta.id).subscribe(
            () => {
                let desmarcada = $event ? 'marcada' : 'desmarcada';
                this.toastr.success(`Pergunta foi \"${desmarcada}\" como indicadora`);
            },
            (erro) => {
                this.toastr.warning(erro);
            },
        );
    }

    trocaEstadoObrigatorio($event, pergunta) {
        pergunta.obrigatorio = $event;
        
        let grupoPerguntaRequest = {
            "obrigatorio": pergunta.obrigatorio,
        };

        this.serviceGrupoPergunta.put(grupoPerguntaRequest, pergunta.id).subscribe(
            () => {
                let desmarcada = pergunta.indice ? 'marcada' : 'desmarcada';
                this.toastr.success(`Pergunta foi \"${desmarcada}\" como obrigatória`);
            },
            (erro) => {
                this.toastr.warning(erro);
            },
        );
    }

    fnHabilitaCheckboxObrigatorio() {
        return false;
    }

    trocaCor(valor) {
        if (valor) {
            this.corSelecionada = this['colorPicker'] = valor;
        }
    }

    navegar(aba) {
        this.atual = aba;
    }

    abreModalAdicionarAoGrupo(paciente) {
        
        this.pacienteSelecionado = paciente;
        
        this.modalInstancia = this.modalService.open(NgbdModalContent, {size: 'lg'});
        this.modalInstancia.componentInstance.modalHeader = 'Grupos abertos';

        this.serviceAgendamentoGrupo.get({
            "tema": { "id": this.temaid }
        }).subscribe(
            (gruposDisponiveisResponse) => {
                gruposDisponiveisResponse.dados[0]['recorrencia'] = [
                    {"diaDaSemana":2, horaInicio: "17:00"},
                    {"diaDaSemana":4, horaInicio: "17:00"},
                    {"diaDaSemana":6, horaInicio: "10:00"}
                ];
                this.gruposDisponiveis = gruposDisponiveisResponse.dados;
            },
            (erro) => {
                this.toastr.warning(erro);
            },
        );

        this.modalInstancia.componentInstance.templateRefBody = this.bodyModalAdicionarAoGrupo;
        this.modalInstancia.componentInstance.templateBotoes = this.templateBotoesAdicionarAoGrupo;

        let fnSuccess = () => { console.log("Modal Fechada!"); this.voltar();};
        let fnError = () => { console.log("Modal Fechada!"); };
        this.modalInstancia.result.then(() => fnSuccess, fnError);
    }

    abreModalRemoverDaLista(paciente) {
        this.pacienteSelecionado = paciente;
        
        this.modalInstancia = this.modalService.open(NgbdModalContent, {size: 'lg'});
        this.modalInstancia.componentInstance.modalHeader = 'Remover Beneficiário da Lista de Espera';

        this.modalInstancia.componentInstance.templateRefBody = this.bodyModalRemoverDalistaDeEspera;
        this.modalInstancia.componentInstance.templateBotoes = this.templateBotoesModalRemoverDalistaDeEspera;


        let fnSuccess = () => { console.log("Modal Fechada!"); this.voltar();};
        let fnError = () => { console.log("Modal Fechada!"); };
        this.modalInstancia.result.then(() => fnSuccess, fnError);
    }

    //  =============================================
    //                  Ações
    //  =============================================

    pesquisar(texto) {
        this.buscarAtendimentoEsperaPaginado(null, texto);
    }

    adicionarFormulario() {
        if (!this.formulario || !this.formulario.id) {
            this.toastr.warning("Nenhum formulário selecionado!");
            return;
        }

        let formJaAdicionado = this.formsSelecionados.filter((form) => { return form.id == this.formulario.id}).length;
        if (formJaAdicionado) {
            this.toastr.warning("Formulário ja adicionado!");
            return;
        }

        //  
        let grupoTemaFormularioRequest = {
            "formulario": { "id": this.formulario.id },
            "tema": { "id": this.temaid }
        };

        this.serviceGrupoTemaFormulario.post(grupoTemaFormularioRequest).subscribe(
            (grupoTemaFormularioResponse) => {
                
                // this.formsSelecionados.push({
                //     id: grupoTemaFormularioResponse,
                //     form: this.formulario,
                //     perguntas: this.perguntas
                // });
                this.formsSelecionados = [];
                this.formulario = undefined;
                this.perguntas = [];

                this.toastr.success("Formulário adicionado ao tema");
                this.pergunta();
            },
            (erro) => {
                this.toastr.warning(erro);
            },
        );
    }

    removeFormulario(form) {

        this.serviceGrupoTemaFormulario.delete(form.id).subscribe(() => {
                this.formsSelecionados.forEach((formAtual, index) => { 
                    if (formAtual.id == form.id) {
                        this.formsSelecionados.splice(index, 1);

                        this.toastr.success("Formulário removido do tema");
                    }
                })
            },
            (erro) => {
                this.toastr.warning(erro);
            },
        );

    }

    editaFormulario(form) {
        this.router.navigate([`/${Sessao.getModulo()}/formulario/formulario/${form.form.id}`]);
    }

    adicionarListaEspera() {
        if (!this.paciente || !this.paciente.id) {
            this.toastr.warning("Favor Informar Beneficiário!");
            return;
        }

        if (!this.prioridadeSelecionada) {
            this.toastr.warning("Favor Informar Prioridade!");
            return;
        }

        let request = {
            "paciente": {
                "id": this.paciente.id
            },
            "grupoTema": {
                "id": parseInt(this.temaid)
            },
            "prioridade": this.prioridadeSelecionada,
            "observacao": this.observacao,
            "excluido": false
        };

        let fnSuccess = () => { 
            this.toastr.success("Paciente adicionado com Sucesso à Lista de espera!"); 
            
            this.limpaDados();
            this.buscarAtendimentoEsperaPaginado();
        };
        let fnError = () => { this.toastr.error("Erro ao adicionar Usuario à lista de espera!"); };

        this.serviceAtendimentoEspera.salvar(request).subscribe(fnSuccess, fnError);
    }

    adicionarAoGrupo() {
        let fnSuccess = () => { 
            this.toastr.success("Paciente adicionado ao Grupo!");
            this.atualizaLista();
            this.limpaDados();
            this.modalInstancia.close();
        };
        let fnError = () => { this.toastr.error("Erro ao adicionar Paciente ao grupo!"); };

        let request = {
            "idAtendimentoEspera": this.pacienteSelecionado.id,
            "paciente": {
                "id": this.pacienteSelecionado.paciente.id
            },
            "grupo": {
                "id": this.grupoSelecionado
            }
        };

        this.serviceAgendamentoGrupo.salvarPacientes(request).subscribe(fnSuccess, fnError);
    }

    limpaDados() {
        this.paciente = undefined;
        this.prioridadeSelecionada = undefined;
        this.observacao = undefined;
    }

    removerdaLista() {

        if (!this.observacao) {
            this.toastr.warning("Informe o motivo da remoçao do paciente da lista de espera");
            return;
        }

        let atendimentoEsperaRequest = {
            "saida": moment().format(this.formatosDeDatas.dataHoraSegundoFormato),
            "observacao": this.observacao
        };
        let sId = this.pacienteSelecionado.id || "";

        this.serviceAtendimentoEspera.atualizar(sId,atendimentoEsperaRequest).subscribe(
            () => {
                this.toastr.success("Beneficiário removido da lista de espera");
                this.atualizaLista();
                this.limpaDados();
                this.modalInstancia.close();
            },
            (erro) => {
                this.toastr.warning(erro);
            },
        );
    }

    atualizaLista(){
        let id = this.pacienteSelecionado.id;

        let atendimentoEsperaRequest = {
            "saida": moment().format(this.formatosDeDatas.dataHoraSegundoFormato),
            "observacao": "Removido ao adicionar ao grupo"
        };
        this.serviceAtendimentoEspera.atualizar(id, atendimentoEsperaRequest).subscribe(()=>{
            this.buscarAtendimentoEsperaPaginado();
        })
    }

    salvar() {
        if (this.descricao && this.corSelecionada && this.especialidade) {
            
            let sIdParam = this.temaid || null;
            let request = {
                id: this.temaid,
                descricao: this.descricao,
                cor: this.corSelecionada,
                especialidade: this.especialidade,
                enviaSms: this.enviaSms,
                mensagemSms: this.mensagemSms,
                mensagemConfirmando: this.mensagemConfirmando,
                mensagemLembrando: this.mensagemLembrando
            };

            let fnSuccess = (agendamentoGrupoResposta) => { 
                this.toastr.success("Tema Salvo com Sucesso!"); 

                if (agendamentoGrupoResposta) {

                    let requestGet = {id: agendamentoGrupoResposta};
                    let fnGetError = () => { this.toastr.error("Erro ao buscar tema!"); };
                    let fnGetSuccess = (tema) => { 
                        let objtema = tema.dados ? tema.dados[0] : tema;
                        Sessao.setPreferenciasUsuario('agendamentoGrupoTema', objtema);
                        this.router.navigate([`/${Sessao.getModulo()}/agendamentogrupo/tema/${agendamentoGrupoResposta}`]);
                        this.temaid = agendamentoGrupoResposta;
                    };
                    this.serviceTemaGrupo.get(requestGet).subscribe(fnGetSuccess, fnGetError);
                }
            };
            let fnError = () => { this.toastr.error("Erro ao salvar tema!"); };

            if (this.temaid) {
                this.serviceTemaGrupo.put(request, sIdParam).subscribe(fnSuccess, fnError);
            } else {
                this.serviceTemaGrupo.post(request).subscribe(fnSuccess, fnError);
            }
        } else {
            let mensagem = !this.descricao ? ' Descrição' : null;
            mensagem += !this.especialidade ? ' Especialidade' : null;
            mensagem += !this.corSelecionada ? ' Cor' : null;
    
            this.modalConfirmar = this.modalService.open(NgbdModalContent);
            this.modalConfirmar.componentInstance.modalHeader = `Campos obrigatorios`;
            this.modalConfirmar.componentInstance.modalMensagem = `${mensagem}`;
        }
    }

    excluir() {
        if (this.temaid) {
            let fnSuccess = () => { this.toastr.success("Tema Excluido com Sucesso!"); this.voltar();};
            let fnError = () => { this.toastr.error("Erro ao excluir tema!"); };

            this.serviceTemaGrupo.delete(this.temaid).subscribe(fnSuccess, fnError);
        }
    }

    voltar() {
        this.router.navigate([`/${Sessao.getModulo()}/agendamentogrupo/temas`]);
    }
}