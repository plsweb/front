import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit, TemplateRef, ViewContainerRef, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, HostListener } from '@angular/core';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { GlobalState } from '../../../global.state';
import { ToastrService } from 'ngx-toastr';

import {
    Sessao, Servidor, AtendimentoService, LocalAtendimentoService, SegurancaService, PainelSenhaService, TipoFaltaService,
    AtendimentoEsperaService, TipoAtendimentoService, UsuarioService, EspecialidadeService, PrestadorAtendimentoService,
    PacienteService, FeriadoService, LogAtendimentoService, PacienteOperadoraService, UtilService, GuiaService,
    PacienteCuidadoExecucaoService,
    AtendimentoTipoTussService
} from 'app/services';


import { NgbdModalContent, Agenda, Treeview, FormatosData } from 'app/theme/components';

import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';

import * as moment from 'moment';
moment.locale('pt-br');

@Component({
    selector: 'agendamento',
    templateUrl: './agendamento.html',
    styleUrls: ['./agendamento.scss'],
    providers: [Agenda, Treeview, PrestadorAtendimentoService, LocalAtendimentoService, AtendimentoEsperaService, TipoAtendimentoService, PacienteService, EspecialidadeService, PainelSenhaService, TipoFaltaService, SegurancaService, FeriadoService],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Agendamento implements OnInit {

    item;
    unidadesAtendimento = [];

    agendasFuturasPaciente = [];
    agendaHistoricoPaciente = [];
    agendaTabela = {};
    filtro = new Object();

    agendamentosEmSerie = [];
    configuraHorario

    buscando;
    refreshListInterval;

    unidadePainelSenha;

    foraDoHorario;
    qtdSessoes;

    callCenterEmAtendimento;

    configuracoesInit;
    datasSelecionadas;
    instanciaAgenda;

    modalInstancia;
    modalAgendamento;

    agendamentoPromiseResolve;

    novoAtendimento;
    formatosDeDatas;
    bloqueiaSalvar = false;
    verDesmarcados = false;

    bloqueiosFuturosDoPrestador = [];
    agendasFuturosDoPrestador = [];

    recorrencia = new Object();
    observer: Subject<any>;
    setObjRecorrencia(recorrencia) {
        this['recorrencia'] = recorrencia;
    }
    fnOnDiaTodoChange(valor) {
        if (valor.diaTodo) {
            this.novoHorario.horaFim = valor.horaFim;
            this.novoHorario.horaInicio = valor.horaInicio;
        }
    }

    tipoFalta;
    tiposFalta;
    tipoConsulta;
    tiposConsulta;
    senhaPainel = '0';
    protocolo
    senhasPainelDeSenha;
    motivoCancelamento;
    pacientes;
    especialidades;
    planos = [];
    planoSelecionado = new Object();
    contatos = [];
    contatoSelecionado = new Object();
    objFiltro = [];
    objFiltroTwo = ['codigo', 'nome', 'codigo'];
    consultaAgendaPaciente;

    acaoAgendamento;
    detalheAgenda = new Object();
    activeModal;
    novaListaEspera;
    modalConfirmar;

    novoHorario;
    unidadeAtendimento;
    novaUnidadeAtendimento;
    objParams = new Object();
    objParamsListaEspera = new Object();
    objParamsLog = new Object();
    initialValuePaciente;
    excluirListaEspera = false;
    disableInputPaciente = false;
    prestadorSelecionado;
    prestadorAgendaEspecialidade;
    instanciaBtnSearch;
    idPacienteListaEspera;

    usuarioEspecialidade = [];
    instanciaTreeview;

    feriados = [];

    paciente;
    prestador = new Object()
    novoPrestador = new Object()
    prestadores;
    todosprestadoresGUID;
    todosprestadoresCODIGO;
    prioridades;
    zoom = 1;
    agendaAtual;
    guiaVinculada;
    calendarioOpt = { visao: "week" };
    someKeyboard2: number | number[];

    @ViewChild("acoesListaEspera", { read: TemplateRef }) acoesListaEspera: TemplateRef<any>;
    @ViewChild("btnAdicionarListaEspera", { read: TemplateRef }) btnAdicionarListaEspera: TemplateRef<any>;
    @ViewChild("bodyModalAdicionaListaEspera", { read: TemplateRef }) bodyModalAdicionaListaEspera: TemplateRef<any>;
    @ViewChild("modalAdicionaListaEsperaBotoes", { read: TemplateRef }) modalAdicionaListaEsperaBotoes: TemplateRef<any>;
    @ViewChild("filtrosListaEspera", { read: TemplateRef }) filtrosListaEspera: TemplateRef<any>;

    @ViewChild("agendamentoModal", { read: TemplateRef }) agendamentoModal: TemplateRef<any>;
    @ViewChild("botoesModalAgendamento", { read: TemplateRef }) botoesModalAgendamento: TemplateRef<any>;

    @ViewChild("alteraStatusAgendamentoModal", { read: TemplateRef }) alteraStatusAgendamentoModal: TemplateRef<any>;
    @ViewChild("botoesModalAlteraStatusAgendamento", { read: TemplateRef }) botoesModalAlteraStatusAgendamento: TemplateRef<any>;

    @ViewChild("cadastroPacienteModal", { read: TemplateRef }) cadastroPacienteModal: TemplateRef<any>;
    @ViewChild("botoesCadastroPaciente", { read: TemplateRef }) botoesCadastroPaciente: TemplateRef<any>;

    @ViewChild("bodyModalAgendamentosRecorrentes", { read: TemplateRef }) bodyModalAgendamentosRecorrentes: TemplateRef<any>;
    @ViewChild("footerModalAgendamentosRecorrentes", { read: TemplateRef }) footerModalAgendamentosRecorrentes: TemplateRef<any>;

    @ViewChild("removerBloqueioContentModal", { read: TemplateRef }) removerBloqueioContentModal: TemplateRef<any>;
    @ViewChild("removerBloqueioBotoesModal", { read: TemplateRef }) removerBloqueioBotoesModal: TemplateRef<any>;

    debounce: Subject<any> = new Subject<any>();

    constructor(
        private _state: GlobalState,
        private router: Router,
        private route: ActivatedRoute,
        private modalService: NgbModal,
        private serviceUtil: UtilService,
        private serviceEspecialidade: EspecialidadeService,
        private serviceSeguranca: SegurancaService,
        private serviceAtendimentoEspera: AtendimentoEsperaService,
        private serviceUsuario: UsuarioService,
        private servicePrestador: PrestadorAtendimentoService,
        private serviceAtendimento: AtendimentoService,
        private localAtendimentoService: LocalAtendimentoService,
        private serviceAtendimentoLog: LogAtendimentoService,
        private serviceTipoAtendimento: TipoAtendimentoService,
        private servicePacienteCuidadoExecucao: PacienteCuidadoExecucaoService,
        private servicePaciente: PacienteService,
        private serviceSenhasPainel: PainelSenhaService,
        private tipoFaltaService: TipoFaltaService,
        private serviceFeriado: FeriadoService,
        private atendimentoTipoTussService: AtendimentoTipoTussService,
        private serviceOperadora: PacienteOperadoraService,
        private toastr: ToastrService,
        private cdr: ChangeDetectorRef,
        private vcr: ViewContainerRef,
    ) {

        this.atendimentoTipoTussService;

        this.observer = new Subject<any>();

        this.unidadeAtendimento = Sessao.getPreferenciasUsuario('localAtendimentoAgenda') ? Sessao.getPreferenciasUsuario('localAtendimentoAgenda') : Sessao.getIdUnidade();
        this.prestador = Sessao.getPreferenciasUsuario('prestadorAgenda');

        this.validaAgrupamentoAgendas(this.prestador);

        this.prestadorAgendaEspecialidade = Sessao.getPreferenciasUsuario('prestadorAgendaEspecialidade');
        this.agendaTabela['colunasTabela'] = [
            { 'titulo': 'Local', 'chave': 'local.descricao', 'fnValidaLabel': this.fnValidaLocal.bind(this) },
            { 'titulo': 'Dia', 'chave': 'agendamento' },
            { 'titulo': 'Prestador', 'chave': 'prestador.nome', 'fnValidaLabel': this.fnValidaPrestador.bind(this) },
        ];

        this.zoom = Sessao.getPreferenciasUsuario('zoom') || 1;

        this.agendaTabela['paginaAtual'] = 1;
        this.agendaTabela['itensPorPagina'] = 15;

        this.route.params.subscribe(params => {
            this.agendar = (!!params.unidade) ? true : false;

            if (this.agendar) {
                this.unidadeAtendimento = params['unidade'];
                this.route.queryParams.subscribe(queryParam => {
                    if (queryParam['paciente']) {
                        this.pacienteId = { id: queryParam['paciente'] };
                    }
                });
            }
        });
    }

    @HostListener('document:click', ['$event'])
    somePopover() {
        this.instanciaAgenda.somePopover();
    }
    agendar;
    pacienteId;
    ngOnInit() {
        this._state.notifyDataChanged('menu.isCollapsed', true);
        this.formatosDeDatas = new FormatosData();

        if (Sessao.getVariaveisAmbiente('unidadeAtendimentoUsuario') && Sessao.getVariaveisAmbiente('unidadeAtendimentoUsuario').length) {
            this.unidadesAtendimento = Sessao.getVariaveisAmbiente('unidadeAtendimentoUsuario');
        } else {
            console.error("--- Erro nas variaveis locais: Unidade de Atendiento ---");
            this.refreshUnidadesAtendimento();
        }

        this.tipoFaltaService.get().subscribe((tipos) => {
            this.tiposFalta = tipos.dados;
        })

        if (this.unidadeAtendimento && this.unidadeAtendimento != '0') {
            this.objParams["codigoDto"] = this.unidadeAtendimento
            this.buscaPrestador(true);
        }

        this.refreshTiposDeConsulta();
        this.refreshOperadoras();

        this.debounce.pipe(
            debounceTime(1000)
        ).subscribe(
            (value) => {
                let dados = value.target.value.split(':');
                dados = (dados.length > 0) ? dados[1] : dados[0];
                dados = dados.split('ç');
                dados = dados[1].slice(0, 38).split('=');

                this.buscaPorPlano(dados[0]);
            }
        );
    }

    refreshTiposDeConsulta() {
        let obj = (this.unidadeAtendimento) ? { idUnidadeAtendimento: this.unidadeAtendimento } : {}
        this.serviceTipoAtendimento.atendimentoTipo(obj).subscribe((tiposConsulta) => {
            let retorno = tiposConsulta.dados || tiposConsulta;
            this.tiposConsulta = retorno.map(
                (tipo) => {
                    return {
                        id: tipo.id,
                        descricao: tipo.descricao,
                        obrigaTelefone: tipo.obrigaTelefone,
                        enviaSms: tipo.enviaSms,
                        tempo: tipo.tempo
                    }
                }
            )
        });
    }

    operadoras = [];
    refreshOperadoras() {
        this.serviceOperadora.getOperadoraPaginado().subscribe(
            (operadora) => {
                this.operadoras = operadora.dados;
            }
        );
    }

    refreshUnidadesAtendimento() {
        this.serviceUsuario.usuarioSessao().subscribe(
            (usuario) => {
                this.serviceUsuario.getUsuarioUnidadeAtendimento({ usuarioGuid: usuario.guid }).subscribe((unidades) => {
                    this.unidadesAtendimento = (unidades.dados || unidades).map(
                        (unidade) => {
                            return {
                                id: unidade.unidadeAtendimento.id,
                                descricao: unidade.unidadeAtendimento.descricao,
                                cidade: unidade.unidadeAtendimento.cidade,
                                cadastroBasico: unidade.unidadeAtendimento.obrigaCadastroBasico,
                                codigoVisual: unidade.unidadeAtendimento.codigoVisual,
                                ignoraFeriados: unidade.unidadeAtendimento.ignoraFeriados,
                                tempoLimite: unidade.unidadeAtendimento.tempoLimite,
                            }
                        }
                    )

                });
            }
        )
    }

    limpaOperadora() {
        this.novoAtendimento['operadora'] = undefined;
    }

    ngAfterViewInit() {

        if (sessionStorage.getItem('agendaEspera') && sessionStorage.getItem('agendaEspera').indexOf('pacienteAgendado') < 0) {
            this.toastr.warning("Necessario selecionar um horario para agendar o paciente");
        }

        this.startRefreshList();

        // let preferenciasUsuario = Sessao.getPreferenciasUsuario('atividadeEmAndamento');
        // if (preferenciasUsuario){
        //     this.callCenterEmAtendimento = true;
        // } else {
        //     this.callCenterEmAtendimento = false;
        // }
    }

    ngOnDestroy() {
        this.debounce.unsubscribe();
        this.stopRefreshList();
        this.cdr.detach();
    }

    startRefreshList() {
        this.refreshListInterval = setInterval(() => {
            if (!this.buscando) {
                if (this.unidadeAtendimento && this.prestador) {
                    this.instanciaAgenda.rebuild(false);
                }
            }
        }, 1500);
    }

    stopRefreshList() {
        clearInterval(this.refreshListInterval);
    }

    getDados(objeto) {
        console.log(objeto.dados)
        this.valorPacienteSelecionado = objeto.paciente;
        switch (objeto.retorno) {
            case 'Plano':
                this.planoSelecionado = objeto.dados;
                let plano = objeto.dados.codigo ? objeto.dados.codigo : objeto.dados.operadora.nome;
                this.toastr.info('Plano ' + plano + ' selecionado.');
                break;
            case 'Contato':
                this.contatoSelecionado = objeto.dados;
                this.novoAtendimento['telefone'] = objeto.dados.descricao;
                break;
            default:
                break;
        }

        this.cdr.markForCheck();
    }

    valorPacienteSelecionado = '';
    getPaciente(paciente) {
        this.planoSelecionado = undefined;
        this.paciente = paciente;
        if (this.paciente) {
            let request = {
                "paciente": {
                    "id": this.paciente.id
                },
                "agendamentoInicial": moment().format(this.formatosDeDatas.dataHoraSegundoFormato),
                "statusNotIn": this.aStatusNotIn,
            };

            this.serviceAtendimento.filtrar(request).subscribe(
                (agendas) => { this.agendasFuturasPaciente = agendas.dados }
            );

            this.cdr.markForCheck();
        }
    }

    getAgendaHistorico(evento = null) {
        this.agendaTabela['paginaAtual'] = evento ? evento.paginaAtual : this.agendaTabela['paginaAtual']

        let request = {
            "paciente": {
                "id": this.paciente.id
            },
            "agendamentoFinal": moment().format(this.formatosDeDatas.dataHoraSegundoFormato),
            "statusNotIn": this.aStatusNotIn,
            "ordenacao": "agendamento DESC, prestador.nome ASC",
        };

        let param = {};
        param["pagina"] = this.agendaTabela['paginaAtual'];
        param["quantidade"] = this.agendaTabela['itensPorPagina'];

        this.serviceAtendimento.filtrar(request, param).subscribe(
            (agendas) => {
                this.agendaHistoricoPaciente = agendas.dados;
                this.agendaTabela['dados'] = agendas.dados;
                this.agendaTabela['qtdItensTotal'] = agendas.qtdItensTotal;

            }
        );
    }

    getNomePaciente(evento) {
        if (evento) {
            this.novoAtendimento['nome'] = evento;
        }
    }

    objPacientes = [];
    fnCfgPacienteRemote(term) {
        console.log(term)

        let objParam;
        if (term.length == 11) {
            objParam = { cpf: term };
        } else if ((term.length > 11) && !term.match(/\D/g)) {
            objParam = { carteirinha: term };
        } else {
            objParam = { like: term };
        }

        objParam['quantidade'] = 10;
        objParam['pagina'] = 1;

        this.paciente = null;
        this.servicePaciente.getPacienteLike(objParam).subscribe(
            (retorno) => {
                this.objPacientes = retorno.dados || retorno;
            }
        );

    }

    aStatusNotIn = ["DESMARCADO"];
    fnVisualizaDesmarcados($event) {
        console.log($event)
        this.verDesmarcados = !this.verDesmarcados;
        this.aStatusNotIn = (this.verDesmarcados) ? [] : ["DESMARCADO"];
        this.instanciaAgenda.rebuild(false);
    }


    validaCadastroBasico = true;
    getUnidadeAtendimento(evento) {

        this.unidadeAtendimento = evento.valor;

        let unidadeSelecionada = this.unidadesAtendimento.filter((ua) => { return ua.id == evento.valor })[0];

        if (unidadeSelecionada) {

            this.validaCadastroBasico = unidadeSelecionada.cadastroBasico;
            console.log("Obriga cadastro Basico:  " + this.validaCadastroBasico);

            this.unidadePainelSenha = unidadeSelecionada['codigoVisual'];

            if (unidadeSelecionada.cidade) {
                this.serviceFeriado.get({ cidadeId: unidadeSelecionada.cidade.id }).subscribe(
                    (feriados) => {
                        this.feriados = feriados;
                    }
                );
            }

        } else {
            this.unidadePainelSenha = undefined;
        }

        if ((this.unidadeAtendimento != undefined) && (this.unidadeAtendimento != "0")) {
            this.objParams["codigoDto"] = evento.valor;

            this.refreshTiposDeConsulta();

            Sessao.setPreferenciasUsuario('localAtendimentoAgenda', this.unidadeAtendimento);
            this.buscaPrestador(true);

        } else {
            this.usuarioEspecialidade = []
        }
    }

    getTipoConsulta(evento) {
        this.tipoConsulta = evento.valor;
    }

    buscaPrestador(setPreferencia) {
        this.servicePrestador.getUsuarioPorEspecialidade(this.objParams).subscribe(
            (prestadores) => {
                console.log("USUARIO PRESTADOR ATENDIMENTO");

                this.prestadores = prestadores;
                this.inicializa_treeview(setPreferencia);
            }
        );
    }

    getNovoPrestador(evento) {
        (evento) ? this.novoPrestador = { guid: evento['guid'], nome: evento['nome'] } : this.novoPrestador = new Object();
    }

    getPrestador(item, childItem) {
        this.prestador = childItem;

        if (this.prestador) {

            this.validaAgrupamentoAgendas(this.prestador);

            Sessao.setPreferenciasUsuario('prestadorAgenda', this.prestador);
            Sessao.setPreferenciasUsuario('prestadorAgendaEspecialidade', item);
            this.prestadorAgendaEspecialidade = item;
            this.prestadorSelecionado = childItem;
            this.instanciaAgenda.rebuild(false);

            this.buscaAgendamentosEBloqueiosDoPrestador();

        }
        this.cdr.markForCheck();
    }

    validaAgrupamentoAgendas(prestador){
        // setTimeout(() => {
            if( prestador ){
                if( !this.instanciaAgenda ){
                    console.log("Nao tem a instancia");
                }
                if(this.prestador['userName'] != 'AgendamentoColetivo'){
                    this.instanciaAgenda ? this.instanciaAgenda.setAgrupaAgendamentos(false) : null
                }else{
                    this.instanciaAgenda ? this.instanciaAgenda.setAgrupaAgendamentos(true) : null
                }
            }else{
                console.log("Nao tem prestador");
            }
        // }, 500);
    }

    abreCallCenter() {
        this.router.navigate([`/${Sessao.getModulo()}/callcenter`]);
    }

    inicializa_treeview(setPreferencia) {
        this.usuarioEspecialidade = [];

        if (this.prestadores.length == 0) {
            this.usuarioEspecialidade = [];
        } else {
            this.prestadores.forEach(
                (posicao) => {
                    let usuarios = [];
                    posicao.usuarios.forEach(usuario => usuarios.push({ text: usuario.nome, value: usuario.guid }));
                    posicao.usuarios = posicao.usuarios.map((usuario) => {
                        usuario.descricao = usuario.nome;
                        return usuario;
                    });

                    let usuario = posicao.usuarios.filter(function (e, i) {
                        return posicao.usuarios.indexOf(e) === i;
                    })

                    this.usuarioEspecialidade.push({
                        filhos: posicao.usuarios,
                        item: posicao.especialidade,
                        unico: (usuario.length > 1 ? false : true)
                    });
                }
            )
        }

        this.cdr.markForCheck();


        let unico = true;
        this.usuarioEspecialidade.forEach(
            (posicao) => {
                if (posicao.unico == false) {
                    unico = false;
                }
            }
        );

        if (unico) {
            Sessao.setPreferenciasUsuario("prestadorAgenda", this.usuarioEspecialidade[0].filhos[0]);
            this.prestador = Sessao.getPreferenciasUsuario('prestadorAgenda');
        }
        if (setPreferencia) {
            let prestadorAgenda = Sessao.getPreferenciasUsuario('prestadorAgenda');
            (prestadorAgenda && prestadorAgenda['guid']) ? this.prestadorSelecionado = prestadorAgenda : null;
        }

    }

    getDatasSelecionadas(datas) {
        this.datasSelecionadas = datas;

        if (datas.length > 1) {
            this.instanciaAgenda ? this.instanciaAgenda.setOpt('visao', 'week') : null;
        }
        // (this.instanciaAgenda) ? this.instanciaAgenda.rebuild() : null
    }

    getInstanciaAgenda(instancia) {
        this.instanciaAgenda = instancia;
    }

    getInstanciaTreeview(instancia) {
        this.instanciaTreeview = instancia;
    }

    onDatePickerChange(datas) {
        if (datas.length == 1) {
            this.instanciaAgenda.setOpt('visao', 'day');
        }
    }

    fnDropBloco(target, novaData, bloco) {

        let promiseUpdate = new Promise((resolve, reject) => {

            setTimeout(() => {
                resolve();
                //this.instanciaAgenda.rebuild(false);
            }, 500);

        });

        return promiseUpdate;
    }

    fnDropAgenda(target, novaData, bloco) {

        let promiseUpdate = new Promise((resolve, reject) => {

            setTimeout(() => {
                resolve();
                this.instanciaAgenda.rebuild(false);
            }, 500);

        });

        return promiseUpdate;
    }

    fnInicializaBlocos() {
        let resolveConfiguracoes;
        let rejectConfiguracoes;
        let promiseConfiguracoes = new Promise((resolve, reject) => {
            resolveConfiguracoes = resolve;
            rejectConfiguracoes = reject;
        });

        if ((!this.prestador || !this.prestador['guid']) || (!this.objParams || !this.objParams["codigoDto"])) {
            return promiseConfiguracoes;
        }

        this.buscando = true;
        let min = this.datasSelecionadas.reduce(function (a, b) { return a < b ? a : b; });
        let max = this.datasSelecionadas.reduce(function (a, b) { return a > b ? a : b; });
        let request = {
            "inicio": min.format(this.formatosDeDatas.dataFormato) + ' 00:00:00',
            "fim": max.format(this.formatosDeDatas.dataFormato) + ' 23:59:59',
            // "inicio": min.format(this.formatosDeDatas.dataFormato),
            // "fim": max.format(this.formatosDeDatas.dataFormato),
            "unidadeAtendimento": {
                "id": this.objParams["codigoDto"]
            }
        };

        if (this.prestador['userName'] == 'AgendamentoColetivo') {
            request['trazerApenasAgendamentosColetivos'] = true;
            request['trazerComAgendamentos'] = true;
        }

        this.validaAgrupamentoAgendas(this.prestador);
        if (this.prestador['userName'] == 'AgendamentoColetivo') {
            request["agendamentoColetivo"] = { "id": this.prestador['guid'] };
        } else {
            request["usuarioPrestador"] = { "guid": this.prestador['guid'] };
        }

        this.servicePrestador.getConfiguracaoHorarioFiltro(request).subscribe(
            (configuracoes) => {
                this.configuracoesInit = configuracoes;
                this.resolveBloqueios(configuracoes.filter((bloq) => { return bloq.tipo == "BLOQUEADO" }));

                let blocosNormais = configuracoes.filter((cfg) => {
                    return (cfg.tipo == 'DISPONIVEL' || cfg.tipo == 'COLETIVA') && !cfg.repetir
                });
                
                blocosNormais = blocosNormais.map((configuracao) => {

                    let atendimentosBloco = (configuracao.atendimentos || []).map(
                        (atendimento) => {
                            let obj = atendimento;
                            let config = Object.assign({}, configuracao)
                            let objAtendimento = Object.assign({}, atendimento)
                            delete config.atendimentos;
                            delete config.configuracoesHorario;

                            obj['configuracoesHorario'] = [{
                                atendimento: objAtendimento,
                                configuraHorario: config
                            }];
                            return obj;
                        }
                    )

                    return {
                        dado: configuracao,
                        id: configuracao.id,
                        draggable: false,
                        grupo: true,

                        dataInicio: moment(moment(`${configuracao.dataInicio} ${configuracao.horaInicio}`, 'DD/MM/YYYY HH:mm').toDate()),
                        dataFim: moment(moment(`${configuracao.dataInicio} ${configuracao.horaInicio}`, 'DD/MM/YYYY HH:mm').toDate()),

                        inicio: moment(moment(`${configuracao.dataInicio} ${configuracao.horaInicio}`, 'DD/MM/YYYY HH:mm').toDate()),
                        fim: moment(moment(`${configuracao.dataFim} ${configuracao.horaFim}`, 'DD/MM/YYYY HH:mm').toDate()),
                        atendimentos: atendimentosBloco,
                        recorrencia: [],

                        status: configuracao.tipo == 'BLOQUEADO' ? 'BLOQUEADO' : ''
                    }
                });

                let blocosRecorrentes = this.instanciaAgenda.geraAgendaRecorrente(configuracoes, this.datasSelecionadas, 'DISPONIVEL');
                let blocosColetivosRecorrentes = this.instanciaAgenda.geraAgendaRecorrente(configuracoes, this.datasSelecionadas, 'COLETIVA');
                let blocos = blocosNormais.concat(blocosRecorrentes, blocosColetivosRecorrentes);

                resolveConfiguracoes(blocos);
                this.buscando = false;
            },
            (erro) => {
                this.buscando = false;
                Servidor.verificaErro(erro, this.toastr);
                //this.toastr.error("Houve um erro ao buscar configurações da agenda. GUID: " + this.prestador.guid);
            }
        );

        return promiseConfiguracoes;
    }

    agendasPrestador = []
    fnInicializaAgendas() {
        let resolveAgendas;
        let promiseAgendas = new Promise((resolve, reject) => {
            resolveAgendas = resolve;
        });

        if (this.prestador['userName'] != 'AgendamentoColetivo') {
            let min = this.datasSelecionadas.reduce(function (a, b) { return a < b ? a : b; });
            let max = this.datasSelecionadas.reduce(function (a, b) { return a > b ? a : b; });
            let request = {
                "agendamentoInicial": min.set('hour', 0).set('minute', 0).set('second', 0).format(this.formatosDeDatas.dataHoraSegundoFormato),
                "agendamentoFinal": max.set('hour', 23).set('minute', 59).set('second', 59).format(this.formatosDeDatas.dataHoraSegundoFormato),
                "statusNotIn": this.aStatusNotIn,
                "unidadeAtendimento": {
                    "id": this.objParams["codigoDto"]
                }
            };

            if ((!this.prestador || !this.prestador['guid']) || (!this.objParams || !this.objParams["codigoDto"])) {
                return promiseAgendas;
            }

            this.validaAgrupamentoAgendas(this.prestador);
            if (this.prestador['userName'] == 'AgendamentoColetivo') {
                request["agendamentoColetivo"] = { "id": this.prestador['guid'] };
            } else {
                request["usuario"] = { "guid": this.prestador['guid'] };
            }

            this.serviceAtendimento.filtrar(request).subscribe(
                (agendas) => {
                    this.agendasPrestador = agendas.dados || agendas;
                    this.instanciaAgenda.mostraStatus(!this.aStatusNotIn.length);

                    agendas = agendas.dados.map((agenda) => {
                        agenda['draggable'] = true;
                        return agenda;
                    });
                    if (this.configuracoesInit) {
                        agendas = agendas.concat(this.resolveBloqueios(this.configuracoesInit));
                        resolveAgendas(agendas);
                    }
                    this.cdr.markForCheck();
                },
                (erro) => {
                    this.buscando = false;
                    //this.toastr.warning("Houve um erro ao buscar configurações da agenda. GUID: " + this.prestador.guid);
                }
            );
        }else{
            // AGENDAMENTO COLETIVO
            if (this.configuracoesInit) {
                let agendas = [];
                agendas = agendas.concat(this.resolveBloqueios(this.configuracoesInit));
                resolveAgendas(agendas);
            }else{
                resolveAgendas([]);
            }
            this.buscando = false;
            this.cdr.markForCheck();
        }
        
        return promiseAgendas;
    }

    resolveBloqueios(agendas) {

        let configuracoes = [];

        agendas.forEach((AGENDA) => {

            if (AGENDA.tipo == 'BLOQUEADO')
                configuracoes.push(AGENDA)
        });


        let bloqueiosNormais = configuracoes.filter((cfg) => {
            return cfg.dataInicio == cfg.dataFim;
        }).map((bloqueio) => {
            bloqueio.bloqueado = true;
            return bloqueio;
        });

        let bloqueiosMultiDiasTemp = configuracoes.filter((cfg) => {
            return cfg.dataInicio != cfg.dataFim && cfg.diaTodo;
        });

        let bloqueiosMultiDias = [];
        var min = this.datasSelecionadas.reduce(function (a, b) { return a < b ? a : b; });
        var max = this.datasSelecionadas.reduce(function (a, b) { return a > b ? a : b; });

        bloqueiosMultiDiasTemp.forEach((bloqueio) => {
            var inicio = moment(`${bloqueio.dataInicio} ${bloqueio.horaInicio}`, this.formatosDeDatas.dataHoraFormato);

            var fim = moment(`${bloqueio.dataFim} ${bloqueio.horaFim}`, this.formatosDeDatas.dataHoraFormato);

            var atualInicio = moment(`${bloqueio.dataInicio} ${bloqueio.horaInicio}`, this.formatosDeDatas.dataHoraFormato);
            var atualFim = moment(`${bloqueio.dataFim} ${bloqueio.horaFim}`, this.formatosDeDatas.dataHoraFormato);


            while (inicio.isSameOrBefore(atualFim)) {
                let oCfg = Object.assign({}, bloqueio);

                oCfg['dataInicio'] = inicio.format(this.formatosDeDatas.dataFormato);
                oCfg['dataFim'] = fim.format(this.formatosDeDatas.dataFormato);
                oCfg['horaInicio'] = '00:00';
                oCfg['horaFim'] = '23:59';

                bloqueiosMultiDias.push(oCfg);

                inicio.add(1, 'day');
                fim.add(1, 'day');
            }
        });

        let blocosRecorrentesBloqueados = this.instanciaAgenda.geraBloqueioRecorrente(configuracoes, this.datasSelecionadas, 'BLOQUEADO');

        blocosRecorrentesBloqueados.map((bloq) => {
            bloq.bloqueado = true;
            return bloq;
        });


        let bloqueios = bloqueiosNormais.concat(bloqueiosMultiDias).concat(blocosRecorrentesBloqueados);
        //  Adiciona campo status pra forçar a classe PENDENTE no bloco
        bloqueios = bloqueios.map((bloqueio) => {
            bloqueio['status'] = 'BLOQUEADO';
            return bloqueio;
        });


        return bloqueios;
    }

    fnPegaHoraInicial(agenda) {
        if (agenda.configuracoesHorario) {
            if (!agenda.configuracoesHorario.length && !agenda.dataInicio) {
                return moment(`${agenda.agendamento}`, this.formatosDeDatas.dataHoraSegundoFormato);
            } else if (agenda.configuracoesHorario.length && (agenda.configuracoesHorario[0]['configuraHorario'].tipo == "DISPONIVEL" || agenda.configuracoesHorario[0]['configuraHorario'].tipo == "COLETIVA")) {
                return moment(`${agenda.agendamento}`, this.formatosDeDatas.dataHoraSegundoFormato);
            }
        }
        /*else if (!agenda.configuraHorario && agenda.agendamento){
            return moment(`${agenda.agendamento}`, this.formatosDeDatas.dataHoraSegundoFormato);
        }*/
        return moment(`${agenda.dataInicio} ${agenda.horaInicio}`, this.formatosDeDatas.dataHoraFormato);
    }

    fnPegaHoraFinal(agenda) {
        if (agenda.configuracoesHorario) {
            if (!agenda.configuracoesHorario.length && !agenda.dataFim) {
                return moment(`${agenda.agendamentoFim}`, this.formatosDeDatas.dataHoraSegundoFormato);
            } else if (agenda.configuracoesHorario.length && (agenda.configuracoesHorario[0]['configuraHorario'].tipo == "DISPONIVEL" || agenda.configuracoesHorario[0]['configuraHorario'].tipo == "COLETIVA")) {
                if (agenda.agendamentoFim) {
                    return moment(`${agenda.agendamentoFim}`, this.formatosDeDatas.dataHoraSegundoFormato);
                } else {
                    let agendaFim = moment(`${agenda.agendamento}`, this.formatosDeDatas.dataHoraSegundoFormato);
                    agendaFim.add(agenda.tipo.tempo, 'minute');
                    return agendaFim;
                }
            }
        }
        /*else if (!agenda.configuraHorario && agenda.agendamento){
            return moment(`${agenda.agendamento}`, this.formatosDeDatas.dataHoraSegundoFormato);
        }*/
        return moment(`${agenda.dataInicio} ${agenda.horaInicio}`, this.formatosDeDatas.dataHoraFormato);
    }

    fnCriaAgendamentoListaEspera(bloco, paciente, consultaAgendaPaciente) {

        /*let sMensagem = `
            <div style="width: 200px">Paciente: ${paciente.paciente.nome}
            <br>
            Observação: ${paciente.observacao}</div>
        `;*/
        let sMensagem = `Por Favor selecione um horário para agendar o paciente "${paciente.paciente.nome}"`

        this.toastr.info(sMensagem, 'Paciente Selecionado.', {
            enableHtml: true,
            tapToDismiss: true
        });

        this.initialValuePaciente = paciente.paciente.nome;
        this.idPacienteListaEspera = paciente.id;
        //this.disableInputPaciente = true;
        this.excluirListaEspera = true;
        this.getPaciente(paciente.paciente);
    }

    fnCriaAgendamento(bloco, paciente, consultaAgendaPaciente) {
        this.agendaAtual = null;
        this.bloqueiaSalvar = false;
        this.consultaAgendaPaciente = consultaAgendaPaciente;
        if (consultaAgendaPaciente) {
            this.bloqueiaSalvar = true;
        }

        this.novoAtendimento = {
            data: bloco ? bloco.novoInicio.format(this.formatosDeDatas.htmlDataFormato) : '',
            hora: bloco ? bloco.novoInicio.format(this.formatosDeDatas.horaFormato) : ''
        };

        let esse = this;
        this.instanciaAgenda.somePopover();
        let agendamentoPromise = new Promise((resolve, reject) => {

            esse.agendamentoPromiseResolve = resolve;

            this.modalAgendamento = this.modalService.open(NgbdModalContent, { size: 'lg' });
            this.modalAgendamento.componentInstance.modalHeader = this.consultaAgendaPaciente ? 'Consultar Agendamento' : 'Novo Agendamento';

            this.modalAgendamento.componentInstance.templateRefBody = this.agendamentoModal;
            this.modalAgendamento.componentInstance.templateBotoes = this.botoesModalAgendamento;

            this.modalAgendamento.result.then(
                (data) => this.fechaModalFnCriaAgendamento(bloco, data),
                (reason) => this.fechaModalFnCriaAgendamento(bloco, reason)
            );
        });

        return agendamentoPromise;
    }

    fechaModalFnCriaAgendamento(bloco, retorno) {

        this.acaoAgendamento = null;
        this.initialValuePaciente = '';
        this.disableInputPaciente = false;
        this.instanciaAgenda.rebuild(false);
        this.valorPacienteSelecionado = '';
        this.objPacientes = [];

        this.paciente = null;
        this.agendasFuturasPaciente = [];
        this.agendaHistoricoPaciente = [];
        this.idPacienteListaEspera = null;
        this.excluirListaEspera = null;

        if (bloco)
            this.instanciaAgenda.removeBlocoId(bloco.id);


        console.log(" --- FINALIZEI MEUS AGENDAMENTOS --- ");


        this.consultaAgendaPaciente = false;
    }

    fnVisualizaAgenda(bloco, acaoAgendamento = null) {
        this.valorPacienteSelecionado = '';
        this.objPacientes = [];

        let unidadeSelecionada = this.unidadesAtendimento.filter((ua) => { return ua.id == this.unidadeAtendimento })[0];
        let feriado = this.feriados.filter((feriado) => {

            if (bloco.novoInicio) {
                return feriado.dia == bloco.novoInicio.format('DD') && feriado.mes == bloco.novoInicio.format('MM');
            }

            let horarioAgendamento = moment(bloco.agendamento, this.formatosDeDatas.dataHoraSegundoFormato);
            return feriado.dia == horarioAgendamento.format('DD') && feriado.mes == horarioAgendamento.format('MM');
        });

        if (feriado.length && !unidadeSelecionada.ignoraFeriados) {
            this.toastr.error(`Feriado: ${feriado[0].nome}`);
            this.instanciaAgenda.removeBlocoId(bloco.id);
            return
        }

        this.bloqueiaSalvar = false;

        if (bloco.tipo == "BLOQUEADO") {
            this.toastr.error("Não é possível criar agendamento em uma configuração de bloqueio");
            return
        }

        if (bloco && bloco.id && !bloco.agendaInstancia) {
            if (bloco['configuracoesHorario'] && bloco['configuracoesHorario'].length) {
                this.configuraHorario = {
                    horaInicio: bloco['configuracoesHorario'][0]['configuraHorario']['horaInicio'],
                    horaFim: bloco['configuracoesHorario'][bloco['configuracoesHorario'].length - 1]['configuraHorario']['horaFim']
                }
            } else {
                this.toastr.warning("Atendimento sem configuração de horário: " + bloco.id);
                this.configuraHorario = {};
            }
            this.novoAtendimento = {
                data: moment(bloco.agendamento, this.formatosDeDatas.dataHoraSegundoFormato).format(this.formatosDeDatas.htmlDataFormato),
                hora: moment(bloco.agendamento, this.formatosDeDatas.dataHoraSegundoFormato).format(this.formatosDeDatas.horaFormato),
            };
        } else {
            this.configuraHorario = bloco.cfg;
            this.novoAtendimento = {
                data: bloco.novoInicio.format(this.formatosDeDatas.htmlDataFormato),
                hora: bloco.cfg.horaInicio || bloco.novoInicio.format(this.formatosDeDatas.horaFormato)
            };
        }

        this.agendaAtual = JSON.parse(JSON.stringify(bloco));

        console.log(this.tipoConsulta);
        
        if (bloco.tipo) {
            this.tipoConsulta = bloco.tipo.id
        } else if (bloco.cfg) {
            if (bloco.cfg.atendimentoTipo) {
                this.tipoConsulta = bloco.cfg.atendimentoTipo.id;
            } else if (bloco.cfg.bloqueio) {
                this.tipoConsulta = bloco.cfg.bloqueio.id;
            }
        } else {
            this.tipoConsulta = null
        }

        console.log("depois  " + this.tipoConsulta);
        if (sessionStorage.getItem('agendaEspera') && sessionStorage.getItem('agendaEspera').indexOf('pacienteAgendado') < 0) {
            let esperaJson = JSON.parse(sessionStorage.getItem("agendaEspera"));
            this.getPaciente(esperaJson.paciente);
        } else {
            if (acaoAgendamento == 'ENCAIXE') {
                delete this.agendaAtual.id;
                this.paciente = null;

                let seconds = moment(this.agendaAtual.agendamentoFim, this.formatosDeDatas.dataHoraSegundoFormato).diff(moment(this.agendaAtual.agendamento, this.formatosDeDatas.dataHoraSegundoFormato), 'seconds');

                if (seconds <= 600) {
                    this.novoAtendimento.hora = moment(this.novoAtendimento.data + this.novoAtendimento.hora, this.formatosDeDatas.htmlDataFormato + this.formatosDeDatas.horaFormato).add(seconds / 2, 'seconds').format(this.formatosDeDatas.horaFormato);
                } else {
                    this.novoAtendimento.hora = moment(this.novoAtendimento.data + this.novoAtendimento.hora, this.formatosDeDatas.htmlDataFormato + this.formatosDeDatas.horaFormato).add(10, 'minutes').format(this.formatosDeDatas.horaFormato);
                }

                bloco.telefone = '';
                bloco.observacao = '';

            } else if (acaoAgendamento == 'COLETIVA') {
                delete this.agendaAtual.id;
                this.paciente = null;
                this.novoAtendimento.hora = moment(this.novoAtendimento.data + this.novoAtendimento.hora, this.formatosDeDatas.htmlDataFormato + this.formatosDeDatas.horaFormato).format(this.formatosDeDatas.horaFormato);
            } else {
                this.novoAtendimento['telefone'] = (bloco && bloco.telefone) ? bloco.telefone : '';
                this.novoAtendimento['observacao'] = (bloco && bloco.observacao) ? bloco.observacao : '';
                this.novoAtendimento['confirmacao'] = (bloco && bloco.confirmacao) ? bloco.confirmacao : undefined;
                this.paciente = bloco.paciente;
            }

            this.novoAtendimento['status'] = (bloco && bloco.status) ? bloco.status : undefined;
            this.novoAtendimento['agendamento'] = (bloco && bloco.agendamento) ? bloco.agendamento : undefined;

            
            this.novoAtendimento = Object.assign(this.novoAtendimento, bloco);
        }

        this.buscaAgendamentosEBloqueiosDoPrestador();
        this.recorrencia['repetir'] = false;
        this.recorrencia['frequencia'] = [];
        this.qtdSessoes = 2;

        this.instanciaAgenda.somePopover();
        let agendamentoPromise = new Promise((resolve, reject) => {
            this.agendamentoPromiseResolve = resolve;

            this.modalAgendamento = this.modalService.open(NgbdModalContent, { size: 'lg' });
            this.modalAgendamento.componentInstance.modalHeader = bloco.id && !bloco.agendaInstancia ? 'Agendamento' : 'Novo Agendamento';

            if (!isNaN(bloco.id)) {
                this.inicializaLogAtendimento(bloco.id);
            } else {
                this.atendimentoSelecionado = undefined;
            }

            this.instanciaAgenda.somePopover();
            this.modalAgendamento.componentInstance.templateRefBody = this.agendamentoModal;
            this.modalAgendamento.componentInstance.templateBotoes = this.botoesModalAgendamento;

            this.getPaciente(this.pacienteId || this.paciente);

            let onModalClose = (data) => {
                console.log("----")
                this.agendasFuturasPaciente = [];
                this.agendaHistoricoPaciente = [];
                if (this.acaoAgendamento != 'SALADEESPERA') {
                    this.acaoAgendamento = null;
                }
                this.valorPacienteSelecionado = '';
                this.objPacientes = [];
                this.planoSelecionado = undefined;
                this.guiaVinculada = undefined;
                this.cdr.markForCheck();
                this.instanciaAgenda.rebuild(false);
            };

            this.instanciaAgenda.somePopover();
            if (unidadeSelecionada.ignoraFeriados && feriado && feriado.length) {
                this.modalAgendamento = this.modalService.open(NgbdModalContent);
                this.modalAgendamento.componentInstance.modalHeader = 'Agendamento';
                this.modalAgendamento.componentInstance.modalMensagem = `Confirma agendamento no feriado: ${feriado[0].nome} ?`;
                this.modalAgendamento.componentInstance.modalAlert = true;

                this.modalAgendamento.componentInstance.retorno.subscribe(() => { });
            }

            this.modalAgendamento.result.then(onModalClose, onModalClose);
        });

        return agendamentoPromise;
    }

    atendimentoSelecionado;
    inicializaLogAtendimento(atendimentoId) {
        this.atendimentoSelecionado = atendimentoId;

        setTimeout(() => {
            this.instanciaLogAtendimento ? this.instanciaLogAtendimento.carregaMensagens() : null;
        }, 1000);
    }

    instanciaLogAtendimento;
    getRefreshLogAtendimento(instancia) {
        this.instanciaLogAtendimento = instancia;
    }

    fnOnCreateBloco(agendamentoModal, botoesModalAgendamento, bloco) {
        this.novoAtendimento = {
            data: bloco.novoInicio.format(this.formatosDeDatas.htmlDataFormato),
            hora: bloco.novoInicio.format(this.formatosDeDatas.horaFormato),
        };

        let esse = this;
        this.instanciaAgenda.somePopover();
        let agendamentoPromise = new Promise((resolve, reject) => {

            esse.agendamentoPromiseResolve = resolve;

            this.modalAgendamento = this.modalService.open(NgbdModalContent, { size: 'lg' });
            this.modalAgendamento.componentInstance.modalHeader = 'Agendamento';

            this.modalAgendamento.componentInstance.templateRefBody = agendamentoModal;
            this.modalAgendamento.componentInstance.templateBotoes = botoesModalAgendamento;

            this.modalAgendamento.result.then((data) => {
                esse.acaoAgendamento = null;
                console.log("----")
                //this.instanciaAgenda.removeBlocoId(bloco.id);
                esse.instanciaAgenda.rebuild(false);
            }, (reason) => {
                esse.acaoAgendamento = null;
                //this.instanciaAgenda.removeBlocoId(bloco.id);
                esse.instanciaAgenda.rebuild(false);
            });
        });

        return agendamentoPromise;
    }

    validaColetivo(dado) {
        if (!dado) return;
        if (dado.status && dado.status == 'BLOQUEADO') {
            return false
        }

        if (dado['configuracoesHorario'] && !dado['configuracoesHorario'].length) {
            return true;
        } else {
            return (
                        dado['configuracoesHorario'] &&
                        dado['configuracoesHorario'][0]['configuraHorario'] && 
                        dado['configuracoesHorario'][0]['configuraHorario']['tipo'] == 'COLETIVA'
                    ) || 
                    (   dado['configuraHorario'] && dado['configuraHorario']['id'] );
        }
    }

    validaMostraDesbloquear(dado) {
        if (!dado) return;

        return dado.bloqueado;
    }

    validaMostraBloquear(aStatusNotInd, dado) {
        if (!dado) return;

        return !dado.bloqueado;
    }

    validaStatusNotIn(aStatusNotInd, dado, fnValidaCampo = undefined) {
        if (!dado) return;

        if (fnValidaCampo) {
            let obj = fnValidaCampo
            fnValidaCampo = dado;

            if (aStatusNotInd.indexOf(obj.status) == -1) {
                return fnValidaCampo(obj);
            } else {
                return false;
            }
        }

        return aStatusNotInd.indexOf(dado.status) == -1;
    }

    fnValidaNaoConfirmado(dado) {
        console.log("tem confirmacao?   " + dado.confirmacao);
        return !(dado.confirmacao);
    }

    buscaAgendamentosEBloqueiosDoPrestador() {
        let min = moment().startOf('week');
        min.set('hour', 0).set('minute', 0);

        //  Pega bloqueios;
        let requestConfiguraHorario = {
            "inicio": min.format(this.formatosDeDatas.dataFormato) + ' 00:00:00',
            "tipo": "BLOQUEADO",
            "unidadeAtendimento": { "id": this.objParams["codigoDto"] }
        };
        let request = {
            "agendamentoInicial": min.format(this.formatosDeDatas.dataHoraSegundoFormato),
            "statusNotIn": this.aStatusNotIn,
        };

        if (this.prestador['userName'] == 'AgendamentoColetivo') {
            request["agendamentoColetivo"] = { "id": this.prestador['guid'] };
            requestConfiguraHorario["agendamentoColetivo"] = { "id": this.prestador['guid'] };
        } else {
            request["usuario"] = { "guid": this.prestador['guid'] };
            requestConfiguraHorario["usuarioPrestador"] = { "guid": this.prestador['guid'] };
        }

        this.servicePrestador.getConfiguracaoHorarioFiltro(requestConfiguraHorario).subscribe(
            (bloqueios) => {
                this.bloqueiosFuturosDoPrestador = bloqueios;
            }, (err) => { }
        );

        //  Pega agendamentos;
        this.serviceAtendimento.filtrar(request).subscribe(
            (agendas) => {
                this.agendasFuturosDoPrestador = agendas.dados;
            },
            (err) => {}
        )
    }

    cancelarAtendimento(agenda, agendamentoModal, botoesModalAgendamento, acaoAgendamento = 'DESMARCADO') {
        this.fnAbreModalAlteraStatus(agendamentoModal, botoesModalAgendamento, acaoAgendamento, agenda);
    }

    salvaAgendamento() {
        console.log("salvaAgendamento")
        let esse = this;

        // chama API e salva
        let agendamento = moment(`${this.novoAtendimento.data} ${this.novoAtendimento.hora}`, `${this.formatosDeDatas.htmlDataFormato} ${this.formatosDeDatas.horaFormato}`).format(`${this.formatosDeDatas.dataHoraFormato}:00`);

        //VALIDA SE O TIPO DE CONSULTA OBRIGA INFORMAR TELEFONE OU NAO
        let consulta = this.tiposConsulta.filter(
            (tipo) => {
                return tipo.id == this.tipoConsulta
            }
        )

        if (!this.tipoConsulta || this.tipoConsulta == 0) {
            this.toastr.warning("Selecione um tipo de consulta."); return;
        } else if (agendamento == "Invalid date") {
            this.toastr.warning("Data inválida"); return;
        } else if ((!this.novoAtendimento.telefone) && (!this.novoAtendimento['nome'] || (this.contatos && !this.contatos.length))) {

            if (consulta && consulta.length > 0) {
                if (consulta[0] && consulta[0].obrigaTelefone) {
                    this.toastr.warning("Informe um numero de telefone");
                    return;
                }
            }

        } else if (!this.paciente) {

            let unidade = this.unidadesAtendimento.filter(
                (unidade) => {
                    return (unidade.id) == (parseInt(this.unidadeAtendimento) || this.novaUnidadeAtendimento)
                }
            )[0];

            if (this.tipoConsulta != 158) {
                if (unidade.cadastroBasico) { // SE OBRIGA CADASTRO BASICO
                    this.toastr.error("Informe um paciente para o agendamento"); return;
                }
            }

            if (!this.novoAtendimento['nome']) {
                this.toastr.error("Informe um paciente para o agendamento"); return;
            }
        }

        let duracaoAtendimento = consulta && consulta.length ? consulta[0].tempo : 20;

        (this.novoPrestador['guid']) ? this.prestador = this.novoPrestador : null

        let prestadorAgendaEspecialidade = Sessao.getPreferenciasUsuario()['prestadorAgendaEspecialidade'];
        let atendimentoRequest = {
            "unidadeAtendimento": {
                "id": parseInt(this.unidadeAtendimento) || this.novaUnidadeAtendimento
            }
        };

        if (this.paciente) {
            atendimentoRequest["paciente"] = {
                "id": this.paciente.id
            };
        } else {
            atendimentoRequest["nome"] = this.novoAtendimento['nome'];
        }

        if (this.acaoAgendamento != 'ALTERARTIPO' && this.acaoAgendamento != 'CONFIRMARAGENDAMENTO' && this.acaoAgendamento != 'REAGENDAR' && atendimentoRequest["paciente"]) {
            if (this.planoSelecionado && this.planoSelecionado['id']) {
                atendimentoRequest["pacientePlano"] = { "id": this.planoSelecionado['id'] };
                if (this.planoSelecionado && this.planoSelecionado['operadora'] && this.planoSelecionado['operadora']['id']) {
                    atendimentoRequest["operadora"] = this.planoSelecionado['operadora'];
                } else {
                    this.toastr.error("Plano selecionado nao possui operadora");
                    return;
                }
            } else {
                if (this.validaCadastroBasico && this.tipoConsulta != 158) { //SE OBRIGA CADASTRO BÁSICO
                    this.toastr.error("Paciente nao tem um plano selecionado");
                    return;
                }
            }
        } else {
            if (this.acaoAgendamento == 'REAGENDAR' && (this.agendaAtual.status == 'DESMARCADO' || this.agendaAtual.status == 'FALTA')) {
                this.instanciaAgenda.somePopover();
                this.modalConfirmar = this.modalService.open(NgbdModalContent);
                this.modalConfirmar.componentInstance.modalHeader = `${this.agendaAtual}`;
                this.modalConfirmar.componentInstance.modalMensagem = `Deseja reagendar esse paciente?`;
                this.modalConfirmar.componentInstance.modalAlert = true;

                this.modalConfirmar.componentInstance.retorno.subscribe(
                    (retorno) => {
                        if (retorno) {
                            atendimentoRequest["status"] = "PENDENTE";
                        }
                    }
                );
            }
        }

        if (this.tipoConsulta != 158) {
            if (this.novoAtendimento['operadora'] && !atendimentoRequest["operadora"]) {
                atendimentoRequest["operadora"] = this.novoAtendimento['operadora'];
            } else {
                if (!atendimentoRequest["operadora"]) {

                    if (this.novoAtendimento['pacientePlano'] && this.novoAtendimento['pacientePlano']['operadora'] && this.novoAtendimento['pacientePlano']['operadora']['id']) {
                        atendimentoRequest["operadora"] = this.novoAtendimento['pacientePlano']['operadora'];
                    } else {
                        if ( !atendimentoRequest["nome"] ) {
                            this.toastr.error("Informe uma carteirinha válida para o atendimento");
                            return
                        }
                        this.toastr.warning("Em agendamentos sem pré cadastro é obrigatório informar Operadora");
                        return;
                    }
                }
            }
        }

        if (this.prestador['userName'] != 'AgendamentoColetivo') {
            atendimentoRequest["usuario"] = {
                "guid": this.prestador['guid']
            };
        }

        if (prestadorAgendaEspecialidade && prestadorAgendaEspecialidade.item && prestadorAgendaEspecialidade.item.id) {
            atendimentoRequest["especialidade"] = {
                "id": prestadorAgendaEspecialidade.item.id
            };
        }

        let configuraHorario;
        if (this.agendaAtual && this.agendaAtual.cfg && this.agendaAtual.cfg.id) {
            configuraHorario = this.agendaAtual.cfg;
            atendimentoRequest["configuraHorario"] = {
                "id": configuraHorario.id
            }
        } else if (this.agendaAtual && this.agendaAtual.configuraHorario && this.agendaAtual.configuraHorario.id) {
            configuraHorario = this.agendaAtual.configuraHorario;
            atendimentoRequest["configuraHorario"] = {
                "id": configuraHorario.id
            }
        } else if (this.agendaAtual && this.agendaAtual.configuracoesHorario && this.agendaAtual.configuracoesHorario.length && this.agendaAtual.configuracoesHorario[0].configuraHorario.id) {
            configuraHorario = this.agendaAtual.configuracoesHorario[0].configuraHorario;
            atendimentoRequest["configuraHorario"] = {
                "id": configuraHorario.id
            }
        }

        atendimentoRequest["agendamento"] = agendamento;

        let dataFimAgendamento = moment(atendimentoRequest['agendamento'], this.formatosDeDatas.dataHoraSegundoFormato).add(duracaoAtendimento, 'minute').format(this.formatosDeDatas.dataHoraSegundoFormato);
        atendimentoRequest["agendamentoFim"] = dataFimAgendamento;

        atendimentoRequest["tipo"] = { "id": parseInt(this.tipoConsulta) };
        (this.novoAtendimento.telefone) ? atendimentoRequest["telefone"] = this.novoAtendimento.telefone : null;
        atendimentoRequest["observacao"] = this.novoAtendimento.observacao;

        if (atendimentoRequest && atendimentoRequest['operadora'] && atendimentoRequest['operadora'].id == 2) {
            atendimentoRequest["valor"] = this.validaValorConsulta(this.novoAtendimento.valor);
        }

        //  Valida se tem bloqueio
        let emBloqueio = false;

        this.bloqueiosFuturosDoPrestador.forEach((bloq) => {
            let agendamento = moment(atendimentoRequest['agendamento'], this.formatosDeDatas.dataHoraFormato);
            let inicioBloq = moment(`${bloq.dataInicio} ${bloq.horaInicio}`, this.formatosDeDatas.dataHoraFormato);
            let fimBloq = moment(`${bloq.dataFim} ${bloq.horaFim}`, this.formatosDeDatas.dataHoraFormato);

            if (agendamento.isBetween(inicioBloq, fimBloq, null, '[)')) {
                if (bloq.repetir && bloq.recorrencia) {
                    bloq.recorrencia.split(",").filter((dias) => {
                        if (dias == agendamento.format("d")) {
                            let hora = moment(moment(agendamento, this.formatosDeDatas.dataHoraFormato).format(this.formatosDeDatas.horaFormato), this.formatosDeDatas.horaFormato);

                            if (hora.isBetween(moment(bloq.horaInicio, this.formatosDeDatas.horaFormato), moment(bloq.horaFim, this.formatosDeDatas.horaFormato), null, '[)')) {
                                emBloqueio = true;
                            }
                        }
                    })
                }
            }
        });

        if (emBloqueio) {
            this.toastr.error("Não é possível criar agendamento em uma configuração de bloqueio");
            return false;
        }

        let recorrencia = this['recorrencia'];
        if (recorrencia['repetir'] == 'true' || recorrencia['repetir'] == true) {

            //  valida se é do tipo week se for verifica se tem dias selecionados
            if (recorrencia['tipoFrequencia'] == 'week' && !recorrencia['frequencia'].length) {
                this.toastr.warning('Por favor preencha os dias para retição');
                //return;
            }


            //  Calcula o ultimo dia do evento
            let dataMaximaConfiguracao = configuraHorario.dataFim ? moment(configuraHorario.dataFim, this.formatosDeDatas.dataFormato) : null;
            let dataDoUltimoEvento = moment(agendamento, this.formatosDeDatas.dataHoraSegundoFormato);
            let countDias = 0;
            let agendamentos = [];

            var validaDiaAgendamento = (data) => {
                let dataFim = moment(data.format(this.formatosDeDatas.dataHoraFormato), this.formatosDeDatas.dataHoraFormato);
                let tempoConsulta = 20; //this.tipoConsulta;
                dataFim.add(tempoConsulta, 'minute');

                let aTemFeriado = this.feriados.filter((feriado) => {
                    let feriadoSim = [data.format(this.formatosDeDatas.dataFormato)].filter((dia) => {
                        return dia.slice(0, 2) == feriado.dia && dia.slice(3, 5) == feriado.mes;
                    });
                    return feriadoSim.length;
                });

                //  Valida Feriado

                let unidadeSelecionada = this.unidadesAtendimento.filter((ua) => { return ua.id == this.unidadeAtendimento })[0];
                if (!unidadeSelecionada.ignoraFeriados) {
                    aTemFeriado.forEach((feriado) => { console.log(`Dia pulado Feriado: '${feriado.nome}'`); });
                    if (aTemFeriado.length) {
                        return false;
                    }
                }

                //  Valida se tem bloqueio
                let bSuccess = true;
                this.bloqueiosFuturosDoPrestador.forEach((bloq) => {
                    let inicioBloq = moment(`${bloq.dataInicio} ${bloq.horaInicio}`, this.formatosDeDatas.dataHoraFormato);
                    let fimBloq = moment(`${bloq.dataInicio} ${bloq.horaFim}`, this.formatosDeDatas.dataHoraFormato);

                    if (bloq.repetir && bloq.recorrencia) {
                        //  TODO : Valida bloqueio recorrente
                    } else {
                        if (
                            (
                                // 1º cenario
                                (inicioBloq.isSameOrBefore(data) && fimBloq.isSameOrAfter(data)) ||
                                // 2º cenario
                                (fimBloq.isAfter(data) && fimBloq.isBefore(dataFim)) ||
                                // 3º cenario
                                (inicioBloq.isBefore(dataFim) && fimBloq.isAfter(dataFim)) ||
                                // 4º cenario
                                (inicioBloq.isAfter(data) && fimBloq.isBefore(dataFim))
                            ) &&
                            (!bloq.dataFim || moment(bloq.dataFim, this.formatosDeDatas.dataFormato).isAfter(moment(bloq.dataInicio, this.formatosDeDatas.dataFormato)))
                        ) {
                            bSuccess = false;
                        }
                    }
                });

                if (!bSuccess) {
                    console.log('Bloqueio pulado');
                    return false;
                }

                let dInicio;
                let dFim;
                if (this.prestador['userName'] != 'AgendamentoColetivo') {
                    //  Valida se tem agendamento
                    this.agendasFuturosDoPrestador.forEach((agenda) => {
                        let agendaInicio = moment(agenda.agendamento, this.formatosDeDatas.dataHoraSegundoFormato);
                        let agendaFim = moment(agenda.agendamento, this.formatosDeDatas.dataHoraSegundoFormato);

                        if (agenda.agendamentoFim) {
                            agendaFim = moment(agenda.agendamento, this.formatosDeDatas.dataHoraSegundoFormato);
                        } else {
                            agendaFim.add(agenda.tipo.tempo, 'minute');
                        }

                        // VALIDAR POR QUE NOS DIAS
                        /*
                        Agendamento presente no intervalo: 03/05/2019 07:00 - 03/05/2019 19:00
                        Agendamento presente no intervalo: 03/06/2019 07:00 - 03/06/2019 19:00
                        Agendamento presente no intervalo: 03/07/2019 13:00 - 03/07/2019 14:00
                        */
                        if (data.isSameOrAfter(agendaInicio) && data.isSameOrBefore(agendaFim) && agendaFim.isSameOrAfter(dataFim)) {
                            dInicio = agendaInicio;
                            dFim = agendaFim;
                            bSuccess = false;
                        }
                    });

                    if (!bSuccess) {
                        console.log(`Agendamento presente no intervalo: ${dInicio.format('DD/MM/YYYY HH:mm')} - ${dFim.format('DD/MM/YYYY HH:mm')}`);
                        return false;
                    }
                }

                //  Valida se configuracao contempla o dia
                if (configuraHorario.recorrencia && configuraHorario.recorrencia.indexOf(data.weekday()) == -1) {
                    return false;
                }

                if (!(!configuraHorario.dataFim || dataMaximaConfiguracao.isSameOrAfter(data, 'day'))) {
                    return false
                }

                return true;
            };

            if (recorrencia['tipoFrequencia'] == 'week') {
                //inicioRecorrencia.isSameOrBefore(data, 'day') &&
                let countFrequencia = 0;
                while (countFrequencia <= recorrencia['frequencia'].length && countDias < this.qtdSessoes && (!configuraHorario.dataFim || dataMaximaConfiguracao.isSameOrAfter(dataDoUltimoEvento, 'day'))) {

                    if (recorrencia['frequencia'][countFrequencia] == dataDoUltimoEvento.weekday()) {

                        if (validaDiaAgendamento(dataDoUltimoEvento)) {
                            agendamentos.push(dataDoUltimoEvento.format(this.formatosDeDatas.dataFormato));
                            countDias++;
                        }

                        let qtdDiasProximaData;
                        if (
                            recorrencia['frequencia'][countFrequencia + 1] &&
                            recorrencia['frequencia'][countFrequencia + 1] >= 0 &&
                            recorrencia['frequencia'][countFrequencia + 1] <= 7
                        ) {
                            qtdDiasProximaData = (recorrencia['frequencia'][countFrequencia + 1] - recorrencia['frequencia'][countFrequencia]);
                        } else {
                            qtdDiasProximaData = ((7 - (recorrencia['frequencia'][countFrequencia] + 1)) + (recorrencia['frequencia'][0] + 1)) + (7 * (recorrencia['qtdFrequencia'] - 1));
                            countFrequencia = -1;
                        }
                        dataDoUltimoEvento.add(qtdDiasProximaData, 'day');
                    }

                    countFrequencia++;
                }
            } else {

                while (countDias < this.qtdSessoes) {

                    if (validaDiaAgendamento(dataDoUltimoEvento)) {
                        agendamentos.push(dataDoUltimoEvento.format(this.formatosDeDatas.dataFormato));
                        countDias++;
                    }

                    dataDoUltimoEvento.add(recorrencia['qtdFrequencia'], recorrencia['tipoFrequencia']);
                }
            }

            if ((!agendamentos.length)) {
                this.toastr.warning("Você esta criando um evento em série. Verifique os dias selecionados.");
                return;
            }
            if ((agendamentos.length < this.qtdSessoes)) {
                this.toastr.warning("Quantidade de sessões extrapola a configuração da agenda.");
                return;
            }

            this.AbreModalAgendamentosRecorrentes(agendamentos, atendimentoRequest);
            return;
        }

        if (this.agendaAtual && this.agendaAtual.id && !this.agendaAtual.agendaInstancia) {

            atendimentoRequest["id"] = this.agendaAtual.id;

            this.serviceAtendimento.atualizar(this.agendaAtual.id, atendimentoRequest).subscribe((atendimento) => {

                if (atendimento && atendimento.mensagem) {
                    this.toastr.error(atendimento.mensagem);
                    this.bloqueiaSalvar = true;
                    return;
                }

                if (atendimento) {
                    this.agendamentoPromiseResolve();
                    esse.modalAgendamento.close();
                    esse.instanciaAgenda.rebuild(false);
                    this.novoPrestador = new Object();
                    this.novaUnidadeAtendimento = undefined;
                    this.toastr.success("Agendamento salvo com sucesso")
                    this.bloqueiaSalvar = false;
                }
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            });

            return;
        }

        atendimentoRequest["status"] = "PENDENTE";

        let serviceAcao = this.acaoAgendamento == 'ENCAIXE' ? 'postEncaixe' : 'post';

        // let configuracoesEnvolvidas = this.validaConfiguracoesEnvolvidas(atendimentoRequest, duracaoAtendimento)

        // if( configuracoesEnvolvidas && configuracoesEnvolvidas.length > 1 ){
        //     console.log("Envia array de configurações de horário");
        //     console.log(configuracoesEnvolvidas);
        // }else{
        //     console.log("Não faz nada");
        // }

        if (esse.configuraHorario.tipo == 'COLETIVA') {
            // TODO Agendamento Coletivo
            console.log(esse)
            delete atendimentoRequest["usuario"];
        }

        let atendimentoId = null;
        if (this.acaoAgendamento == 'ENCAIXE') {
            atendimentoId = esse.agendaAtual.configuracoesHorario[0].atendimento.id ?
                esse.agendaAtual.configuracoesHorario[0].atendimento.id : null;
        }


        this.serviceAtendimento[serviceAcao](atendimentoRequest, atendimentoId).subscribe(
            (atendimento) => {
                this.saveAgendamentoCallBack(atendimento);
                let agendaColetiva:any = atendimentoRequest;
                agendaColetiva['id'] = (atendimento.id || atendimento);
                agendaColetiva['paciente'] = this.paciente;
                agendaColetiva['pacientePlano'] = this.planoSelecionado;
                agendaColetiva['tipo'] = this.tiposConsulta.filter(
                    (tipo) => {
                        return tipo.id == agendaColetiva.tipo.id
                    }
                )[0];
                let objParam = {
                    nome: 'agendasColetivas',
                    valor: agendaColetiva,
                    fnCustomizada: this.ordenarColetivas.bind(this)
                }
                this.observer.next( objParam );

                let quantidadeAtual = this.instanciaAgenda.getQuantidadeAtual() ? parseInt(this.instanciaAgenda.getQuantidadeAtual()) : 0;
                let objParamCapacidade = {
                    nome: 'quantidadeOcupada',
                    valor:  quantidadeAtual +  agendaColetiva.tipo.tempo
                }
                this.observer.next( objParamCapacidade );
                this.novoPrestador = new Object();
                this.paciente = undefined;
                this.planoSelecionado = undefined;
                this.novaUnidadeAtendimento = undefined;
                if (atendimento && this.excluirListaEspera) {
                    this.removeListaEspera(atendimentoRequest);
                }

                if (Sessao.getCuidado()) {
                    let cuidado = Sessao.getCuidado();
                    this.criaAcaoAgendamento(atendimento, atendimentoRequest, cuidado);
                    window.history.go(-1);
                    // FAZ O REDIRECT
                } else if (this.agendar) {
                    this.toastr.success("Paciente " + this.valorPacienteSelecionado + " agendado com sucesso.");
                    // this.router.navigate([`/${Sessao.getModulo()}/agendamentoconsultorio`]);
                    window.history.go(-1);
                }

                this.valorPacienteSelecionado = '';

            }, (result) => {
                Servidor.verificaErro(result, this.toastr);
            }
        );
    }

    validaConfiguracoesEnvolvidas(atendimentoRequest, duracaoAtendimento) {
        let dataFimAgendamento = moment(atendimentoRequest['agendamento'], this.formatosDeDatas.dataHoraSegundoFormato).add(duracaoAtendimento, 'minute');
        let inicioAgendamento = moment(atendimentoRequest['agendamento'], this.formatosDeDatas.dataHoraSegundoFormato);
        console.log('INICIA:  ' + inicioAgendamento.format(this.formatosDeDatas.dataHoraFormato));
        console.log('ACABA:  ' + dataFimAgendamento.format(this.formatosDeDatas.dataHoraFormato));

        let configuracoesAtuais = this.pegaConfiguracoesAtuais(this.configuracoesInit);
        console.log(configuracoesAtuais);

        let configuracoesDia = configuracoesAtuais.filter(
            (configuracao) => {
                if (configuracao.tipo == "BLOQUEADO")
                    return false;

                let inicioConf = moment(configuracao.inicio);
                // PEGAR CONFIGURACOES QUE "COMPORTEM A DATA DO AGENDAMENTO"
                if (inicioConf.format(this.formatosDeDatas.dataFormato) != inicioAgendamento.format(this.formatosDeDatas.dataFormato)) {
                    console.log("é diferente");
                    return false;
                }

                return true;
            }
        )

        let agendasDia = this.agendasPrestador.filter(
            (agenda) => {
                let inicioAgenda = moment(agenda.agendamento);
                // PEGAR CONFIGURACOES QUE "COMPORTEM A DATA DO AGENDAMENTO"
                if (inicioAgenda.format(this.formatosDeDatas.dataFormato) != inicioAgendamento.format(this.formatosDeDatas.dataFormato)) {
                    console.log("é diferente");
                    return false;
                }
            }
        )
        console.log(agendasDia);

        let agendasConflitantes = agendasDia.filter(
            (agenda) => {
                let agendaInicio = moment(agenda.agendamento, this.formatosDeDatas.dataHoraSegundoFormato);
                let agendaFim = moment(agenda.agendamento, this.formatosDeDatas.dataHoraSegundoFormato);
                agendaFim.add(agenda.tipo.tempo, 'minute');

                // console.log('tentando agendar:  ' + inicioAgendamento + ' ATÉ AS   ' + horaFinal);

                console.log('EXISTE UMA AGENDA DAS>  ' + agendaInicio + ' ATÉ AS   ' + agendaFim);

                if (
                    inicioAgendamento.isSameOrAfter(agendaInicio) &&
                    inicioAgendamento.isSameOrBefore(agendaFim) &&
                    agendaFim.isSameOrAfter(dataFimAgendamento)
                ) {
                    return false;
                }
            }
        )

        // PEGAR CONFIGURACOES QUE COMPORTEM O INTERVALO DA HORA INICIAL E FINAL DO AGENDAMENTO
        console.log("Agendas conflitantes");
        console.log(agendasConflitantes);

        console.log(configuracoesDia);
        let configuracoesEnvolvidas = configuracoesDia.filter(
            (configuracao) => {

                let horaInicioAgendamento = inicioAgendamento.format(this.formatosDeDatas.horaFormato);
                let horaFinal = dataFimAgendamento.format(this.formatosDeDatas.horaFormato);

                console.log(horaInicioAgendamento + ' ATÉ AS   ' + horaFinal);

                let inicioConf = moment(configuracao.inicio);
                let fimConf = moment(configuracao.fim);

                console.log('CONF>  ' + inicioConf + ' ATÉ AS   ' + fimConf);

                let horaInicioConf = inicioConf.format(this.formatosDeDatas.horaFormato);
                let horaFimConf = fimConf.format(this.formatosDeDatas.horaFormato);

                return (horaInicioAgendamento == horaInicioConf || horaFinal == horaFimConf)
            }
        )

        if (configuracoesEnvolvidas && configuracoesEnvolvidas.length > 1) {
            console.log("Envia array de configurações de horário");
            console.log(configuracoesEnvolvidas);
        } else {
            console.log("Não faz nada");
        }

        return configuracoesEnvolvidas;
    }

    pegaConfiguracoesAtuais(configuracoesAtuais) {
        console.log(configuracoesAtuais);

        this.resolveBloqueios(configuracoesAtuais.filter((bloq) => { return bloq.tipo == "BLOQUEADO" }));

        let blocosNormais = configuracoesAtuais.filter((cfg) => {
            return (cfg.tipo == 'DISPONIVEL' || cfg.tipo == 'COLETIVA') && !cfg.repetir
        });

        blocosNormais = blocosNormais.map((configuracao) => {

            return {
                dado: configuracao,
                id: configuracao.id,
                draggable: false,
                grupo: true,

                dataInicio: moment(moment(`${configuracao.dataInicio} ${configuracao.horaInicio}`, 'DD/MM/YYYY HH:mm').toDate()),
                dataFim: moment(moment(`${configuracao.dataInicio} ${configuracao.horaInicio}`, 'DD/MM/YYYY HH:mm').toDate()),

                inicio: moment(moment(`${configuracao.dataInicio} ${configuracao.horaInicio}`, 'DD/MM/YYYY HH:mm').toDate()),
                fim: moment(moment(`${configuracao.dataFim} ${configuracao.horaFim}`, 'DD/MM/YYYY HH:mm').toDate()),

                recorrencia: [],

                status: configuracao.tipo == 'BLOQUEADO' ? 'BLOQUEADO' : ''
            }
        });

        let blocosRecorrentes = this.instanciaAgenda.geraAgendaRecorrente(configuracoesAtuais, this.datasSelecionadas, 'DISPONIVEL');
        let blocosColetivosRecorrentes = this.instanciaAgenda.geraAgendaRecorrente(configuracoesAtuais, this.datasSelecionadas, 'COLETIVA');
        let blocos = blocosNormais.concat(blocosRecorrentes, blocosColetivosRecorrentes);

        console.log(blocos);

        return blocos;
    }

    agendarEmSerie() {
        let request;
        let esse = this;
        let aPromises = [];

        this.agendamentosEmSerie.forEach((objAgendamento) => {

            aPromises.push(
                new Promise((resolve, reject) => {
                    this.serviceAtendimento['post'](objAgendamento.req).subscribe(
                        (atendimento) => {
                            resolve(true);
                        }, (erro) => {
                            Servidor.verificaErro(erro, this.toastr);
                        }
                    );
                })
            );
        });

        Promise.all(aPromises).then(function () {
            esse.novoPrestador = new Object();
            esse.novaUnidadeAtendimento = undefined;

            esse.validaAgendamentoApartirDaListaEspera();

            esse.modalAgendamento.close();
            esse.modalInstancia.close();
            esse.instanciaAgenda.rebuild(false);
        });
    }

    AbreModalAgendamentosRecorrentes(agendamentos, request) {
        request["status"] = "PENDENTE";

        this.agendamentosEmSerie = agendamentos.map((horario) => {
            let oReq = JSON.parse(JSON.stringify(request));
            oReq.agendamento = oReq.agendamento.replace(/..\/..\/..../g, horario);

            return {
                agendamento: oReq.agendamento,
                req: oReq
            }
        });

        this.modalAgendamento.close();
        this.instanciaAgenda.somePopover();
        this.modalInstancia = this.modalService.open(NgbdModalContent, { size: 'lg' });
        this.modalInstancia.componentInstance.modalHeader = 'Agendamentos em série';

        this.modalInstancia.componentInstance.templateRefBody = this.bodyModalAgendamentosRecorrentes;
        this.modalInstancia.componentInstance.templateBotoes = this.footerModalAgendamentosRecorrentes;

        let fnSuccess = (agendamentoGrupoResposta) => { console.log("Modal Fechada!"); };
        let fnError = (erro) => { console.log("Modal Fechada!"); };
        this.modalInstancia.result.then((data) => fnSuccess, fnError);
    }

    saveAgendamentoCallBack(atendimento) {
        let esse = this;
        if (atendimento && atendimento.mensagem) {
            esse.toastr.error(atendimento.mensagem);
            return;
        }

        if (esse.agendamentoPromiseResolve) {
            esse.agendamentoPromiseResolve();
        }
        this.guiaVinculada = undefined;

        esse.modalAgendamento.close();

        this.validaAgendamentoApartirDaListaEspera(atendimento);

        esse.instanciaAgenda.rebuild(false);
    }

    removeListaEspera(atendimentoRequest) {
        let pacienteListaEspera = true;
        this.instanciaAgenda.somePopover();
        if (!this.idPacienteListaEspera) {
            this.modalConfirmar = this.modalService.open(NgbdModalContent);
            this.modalConfirmar.componentInstance.modalHeader = `${atendimentoRequest["paciente"]["nome"]}`;
            this.modalConfirmar.componentInstance.modalMensagem = `Deseja realmente excluir da Lista de Espera?`;
            this.modalConfirmar.componentInstance.modalAlert = true;

            this.modalConfirmar.componentInstance.retorno.subscribe(
                (retorno) => {
                    pacienteListaEspera = retorno;
                }
            );
        }

        if (pacienteListaEspera) {
            let idListaEspera = (this.idPacienteListaEspera || atendimentoRequest.id)
            let saida = moment(new Date()).format(this.formatosDeDatas.dataHoraSegundoFormato)

            let request = {
                saida: saida,
                saidaTipo: 'NORMAL',
                usuario: { guid: Sessao.getUsuario()['guid'] }
            };

            this.serviceAtendimentoEspera.atualizar(idListaEspera, request).subscribe(
                () => {
                    this.disableInputPaciente = false;
                    this.idPacienteListaEspera = undefined;
                    this.excluirListaEspera = false;
                }, (error) => {
                    Servidor.verificaErro(error, this.toastr);
                }
            );
        }
    }

    criaAcaoAgendamento(idAtendimento, atendimentoRequest, cuidado) {
        let pacienteListaEspera = true;
        this.instanciaAgenda.somePopover();
        if (!this.idPacienteListaEspera) {
            this.modalConfirmar = this.modalService.open(NgbdModalContent);
            this.modalConfirmar.componentInstance.modalHeader = `${this.valorPacienteSelecionado}`;
            this.modalConfirmar.componentInstance.modalMensagem = `Confirma a ação para o dia ${atendimentoRequest['agendamento']}?`;
            this.modalConfirmar.componentInstance.modalAlert = true;

            this.modalConfirmar.componentInstance.retorno.subscribe(
                (retorno) => {
                    pacienteListaEspera = retorno;
                }
            );
        }

        if (pacienteListaEspera) {
            let requestAcao = {
                usuario: { guid: Sessao.getUsuario()['guid'] },
                executado: moment().format(this.formatosDeDatas.dataHoraSegundoFormato)
            }

            this.servicePacienteCuidadoExecucao.putPacienteCuidadoExecucao(cuidado.execucaoCuidado.id, requestAcao).subscribe(
                () => {
                    let request = {
                        atendimento: { id: idAtendimento },
                        pacienteCuidado: { id: cuidado.id },
                        previsto: atendimentoRequest['agendamento']
                    };

                    this.servicePacienteCuidadoExecucao.postPacienteCuidadoExecucao(request).subscribe(
                        () => {
                            this.toastr.success("Ação gerada com sucesso");
                            Sessao.removeCuidadoAgendamento();
                        }, (error) => {
                            Servidor.verificaErro(error, this.toastr);
                        }
                    );
                }, (error) => {
                    Servidor.verificaErro(error, this.toastr);
                }
            );
        }
    }

    fnBloquearHorario(bloco) {
        console.log('fnBloquearHorario');
    }

    bloqueioAParaRemover;
    blocoCfg;
    fnDesbloquearHorario(bloco, blocoCfg) {
        this.bloqueioAParaRemover = bloco.bloqueado ? (bloco.bloqueioOriginal || bloco) : (bloco || undefined);
        this.blocoCfg = blocoCfg ? blocoCfg : bloco;

        if (!this.bloqueioAParaRemover) {
            return;
        }

        let esse = this;
        this.instanciaAgenda.somePopover();
        let promise = new Promise((resolve, reject) => {

            esse.agendamentoPromiseResolve = resolve;

            this.modalInstancia = this.modalService.open(NgbdModalContent, { size: 'lg' });
            this.modalInstancia.componentInstance.modalHeader = 'Remover bloqueio';

            this.modalInstancia.componentInstance.templateRefBody = this.removerBloqueioContentModal;
            this.modalInstancia.componentInstance.templateBotoes = this.removerBloqueioBotoesModal;

            let onModalClose = (data) => {
                esse.modalInstancia.rebuild(false);
            };
            this.modalInstancia.result.then(onModalClose, onModalClose);
        });

        return promise;
    }

    removerBloqueio(bRemoverTodos = false) {

        if (this.bloqueioAParaRemover && this.bloqueioAParaRemover.tipo == 'BLOQUEADO') {
            this.blocoCfg.novaDataInicio = this.blocoCfg.dataInicio;
        }

        if (this.bloqueioAParaRemover.repetir) {
            let dataFim = moment(`${this.blocoCfg.novaDataInicio} ${this.bloqueioAParaRemover.horaFim}`, this.formatosDeDatas.dataHoraFormato).subtract(1, 'day');
            let configuraHorarioUpdate = {
                bloqueio: { id: this.bloqueioAParaRemover.bloqueio.id },
                dataFim: dataFim.format(this.formatosDeDatas.dataFormato),
                horaFim: dataFim.format(this.formatosDeDatas.horaFormato)
            }

            this.servicePrestador.updateConfiguraHorario(this.bloqueioAParaRemover.id, configuraHorarioUpdate).subscribe((resp) => {

                let novoConfiguraHorario = Object.assign({}, this.bloqueioAParaRemover);
                novoConfiguraHorario.dataInicio = moment(`${this.blocoCfg.novaDataInicio}`, this.formatosDeDatas.dataFormato).add(1, 'day').format(this.formatosDeDatas.dataFormato);

                delete novoConfiguraHorario.id;
                novoConfiguraHorario.local = { id: novoConfiguraHorario.local.id };
                novoConfiguraHorario.unidadeAtendimento = { id: novoConfiguraHorario.unidadeAtendimento.id };
                delete novoConfiguraHorario.usuarioCadastro;
                novoConfiguraHorario.usuarioPrestador = { guid: novoConfiguraHorario.usuarioPrestador.guid };

                this.servicePrestador.configuraHorario(novoConfiguraHorario).subscribe((resp) => {
                    this.modalInstancia.close();
                });
            });

        } else {
            this.servicePrestador.deleteConfiguraHorario(this.bloqueioAParaRemover.id).subscribe((resp) => {
                this.modalInstancia.close();
            });
        }

    }

    fnEditarAtendimento(agendamentoModal, botoesModalAgendamento, acaoAgendamento, bloco) {
        this.acaoAgendamento = acaoAgendamento;
        return this.fnVisualizaAgenda(bloco);
    }

    fnEncaixeAtendimento(agendamentoModal, botoesModalAgendamento, acaoAgendamento, bloco) {
        this.acaoAgendamento = acaoAgendamento;
        return this.fnVisualizaAgenda(bloco, acaoAgendamento);
    }

    fnColetivoAtendimento(agendamentoModal, botoesModalAgendamento, acaoAgendamento, bloco) {
        this.acaoAgendamento = acaoAgendamento;

        (this.modalAgendamento) ? this.modalAgendamento.close() : '';
        (this.activeModal) ? this.activeModal.close() : '';
        (this.modalInstancia) ? this.modalInstancia.close() : '';
        return this.fnVisualizaAgenda(bloco, acaoAgendamento);
    }

    fnReagendarAtendimento(agendamentoModal, botoesModalAgendamento, acaoAgendamento, bloco, target, novaData) {

        if (bloco.status == "SALADEESPERA") {
            this.toastr.warning('Paciente ja esta na sala de espera.');
            this.instanciaAgenda.rebuild(false);

            return;
        }

        this.acaoAgendamento = acaoAgendamento;
        bloco.agendamento = novaData.format(this.formatosDeDatas.dataHoraSegundoFormato);
        return this.fnVisualizaAgenda(bloco);
    }

    guiaObrigatoria = false;
    fnAbreModalSalaDeEspera(agendamentoModal, botoesModalAgendamento, acaoAgendamento, bloco) {
        this.fnAbreModalAlteraStatus(agendamentoModal, botoesModalAgendamento, acaoAgendamento, bloco);
    }

    idPacienteSelecionado;
    modalAlteraStatus;
    fnAbreModalAlteraStatus(agendamentoModal, botoesModalAgendamento, acaoAgendamento, bloco) {
        let esse = this;
        this.instanciaAgenda.somePopover();
        this.acaoAgendamento = acaoAgendamento;
        this.agendaAtual = bloco;
        this.motivoCancelamento = '';

        let consulta = bloco.tipo;
        this.tipoAtendimentoFatura = consulta.faturar;
        this.tipoConsulta = consulta.id;
        let unidade = this.unidadesAtendimento.filter((unidade) => { return unidade.id == this.unidadeAtendimento })[0];
        if (unidade.vinculaGuia && this.tipoAtendimentoFatura) {
            this.guiaObrigatoria = true;
        }

        let codigoVisual = unidade.codigoVisual;

        let horaMaxima = moment(this.agendaAtual.agendamento, this.formatosDeDatas.dataHoraSegundoFormato).add((unidade.tempoLimite || 0), 'minute');
        let duration = moment.duration(moment(new Date()).diff(horaMaxima));

        this.foraDoHorario = unidade.tempoLimite < duration.asMinutes() ? (Math.floor(duration.asHours()) + moment.utc(duration.asMilliseconds()).format(":mm:ss")) : undefined;
        this.serviceSenhasPainel.get(codigoVisual).subscribe(
            (senhasPainelDeSenha) => {
                senhasPainelDeSenha = senhasPainelDeSenha.map((senha) => {
                    senha.id = senha.numero;
                    return senha;
                })
                this.senhasPainelDeSenha = senhasPainelDeSenha;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );

        this.modalAgendamento ? this.modalAgendamento.close() : null;

        if ((bloco.paciente && bloco.pacientePlano) || acaoAgendamento != 'SALADEESPERA') {

            this.modalAlteraStatus = this.modalService.open(NgbdModalContent, { size: 'lg' });
            this.modalAlteraStatus.componentInstance.modalHeader = acaoAgendamento == 'SALADEESPERA' ? 'Chegada do Paciente' : (acaoAgendamento == 'FALTA' ? 'Paciente faltou' : 'Cancelar Agendamento');

            this.modalAlteraStatus.componentInstance.templateRefBody = agendamentoModal;
            this.modalAlteraStatus.componentInstance.templateBotoes = botoesModalAgendamento;

            this.modalAlteraStatus.result.then((data) => {
                esse.acaoAgendamento = null;
                this.instanciaAgenda.rebuild(false);
            }, (reason) => {
                esse.acaoAgendamento = null;
                this.instanciaAgenda.rebuild(false);
            });
        } else if ((acaoAgendamento == 'SALADEESPERA')) {
            this.toastr.warning("Paciente sem pré cadastro");

            let unidadeSelecionada = this.unidadesAtendimento.filter((ua) => { return ua.id == this.unidadeAtendimento })[0];
            this.idPacienteSelecionado = (bloco.paciente) ? bloco.paciente.id : undefined;

            this.modalAlteraStatus = this.modalService.open(NgbdModalContent, { size: 'lg' });
            this.modalAlteraStatus.componentInstance.modalHeader = 'Cadastro de Novo Paciente';
            this.modalAlteraStatus.componentInstance.custom_lg_modal = true;

            this.modalAlteraStatus.componentInstance.templateRefBody = this.cadastroPacienteModal;

            this.modalAlteraStatus.result.then((data) => {
                esse.acaoAgendamento = null;
                this.atendimentoTipoTussFaturar = [];
                this.tipoConsulta = undefined;
                this.instanciaAgenda.rebuild(false);
                //this.instanciaAgenda.removeBlocoId(bloco.id);
            }, (reason) => {
                esse.acaoAgendamento = null;
                this.atendimentoTipoTussFaturar = [];
                this.tipoConsulta = undefined;
                this.instanciaAgenda.rebuild(false);
                //this.instanciaAgenda.removeBlocoId(bloco.id);
            });
        }
    }

    setDados(objeto) {
        switch (objeto.retorno) {
            case 'Paciente':
                this.setPacienteAtendimento(objeto.dados);
                break;
            case 'Plano':
                this.setPlanoAtendimento(objeto.dados);
                break;
            default:
                break;
        }
    }

    setPacienteAtendimento(novoPaciente, confirma = false) {
        console.log(novoPaciente);

        let objAttPacienteAtendimento = {
            paciente: {
                id: novoPaciente.id
            }
        }

        if (!confirm("Confirma agendamento para " + novoPaciente.nome + " ?")) {
            return;
        }

        this.modalAlteraStatus.close();

        this.serviceAtendimento.atualizar(this.agendaAtual.id, objAttPacienteAtendimento).subscribe(
            (retorno) => {
                this.toastr.success("Atendimento atualizado com sucesso");

                this.agendaAtual['paciente'] = {
                    id: novoPaciente.id
                }

                this.fnAbreModalSalaDeEspera(this.alteraStatusAgendamentoModal, this.botoesModalAlteraStatusAgendamento, 'SALADEESPERA', this.agendaAtual);
            }
        )

    }

    setPlanoAtendimento(pacientePlano) {
        console.log(pacientePlano);

        let objAttPacientePlanoAtendimento;
        if (pacientePlano && pacientePlano.id) {
            objAttPacientePlanoAtendimento = {
                pacientePlano: {
                    id: pacientePlano.id
                }
            }
        } else {
            this.toastr.error("Plano inválido para atendimento");
            this.planoSelecionado = undefined;
            return;
        }

        if (pacientePlano.operadora && pacientePlano.operadora.id) {
            objAttPacientePlanoAtendimento['operadora'] = {
                id: pacientePlano.operadora.id
            }
        } else {
            this.toastr.error("Plano selecionado não possui operadora");
            this.planoSelecionado = undefined;
            return;
        }


        if (!confirm("Deseja selecionar o plano: " + (pacientePlano.codigo) || ('PARTICULAR') + " para o atendimento?")) {
            return;
        }

        this.modalAlteraStatus.close();

        this.serviceAtendimento.atualizar(this.agendaAtual.id, objAttPacientePlanoAtendimento).subscribe(
            (retorno) => {
                this.toastr.success("Atendimento atualizado com sucesso");

                this.agendaAtual['pacientePlano'] = {
                    id: pacientePlano.id
                }

                this.fnAbreModalSalaDeEspera(this.alteraStatusAgendamentoModal, this.botoesModalAlteraStatusAgendamento, 'SALADEESPERA', this.agendaAtual);
            }
        )
    }

    validaAgendamentoApartirDaListaEspera(atendimento = null) {

        if (sessionStorage.getItem('agendaEspera') && sessionStorage.getItem('agendaEspera').indexOf('pacienteAgendado') < 0) {
            let esperaJson = JSON.parse(sessionStorage.getItem("agendaEspera"));

            let idListaEspera = esperaJson.id;
            let saida = moment(new Date()).format(this.formatosDeDatas.dataHoraSegundoFormato)

            this.serviceAtendimentoEspera.atualizar(idListaEspera,
                {
                    saida: saida,
                    status: 'FINALIZADO'
                }
            ).subscribe(
                (retorno) => {
                    esperaJson['pacienteAgendado'] = true;
                    let string = JSON.stringify(esperaJson);
                    sessionStorage.setItem('agendaEspera', string);

                    if (atendimento) {
                        let requestLog = {
                            atendimento: {
                                id: atendimento
                            },
                            descricao: `Atendimento Gerado a partir da lista de espera - Código: ${esperaJson.id}`
                        }
                        this.serviceAtendimentoLog.post(requestLog).subscribe(
                            (retorno) => {
                                console.log(retorno);
                                this.router.navigate([`/${Sessao.getModulo()}/listaespera`]);
                            }
                        )

                        return;
                    }
                    this.router.navigate([`/${Sessao.getModulo()}/listaespera`]);
                }
            )
        }

    }

    atendimentoTipoTussFaturar:Array<any>;
    tipoAtendimentoFatura = false;
    alterarStatusAgendamento() {

        let atendimentoRequest = {
            "status": this.acaoAgendamento,
            "observacao": (this.motivoCancelamento && this.motivoCancelamento != "") ? this.motivoCancelamento : undefined
        };
        if (this.acaoAgendamento == 'SALADEESPERA') {
            if ((!this.senhaPainel || this.senhaPainel == '0') && this.unidadePainelSenha) {
                this.toastr.warning('Selecione senha Painel');
                return;
            }

            if (this.guiaObrigatoria && this.tipoAtendimentoFatura) {
                let unidadeSelecionada = this.unidadesAtendimento.filter((ua) => { return ua.id == this.unidadeAtendimento })[0];
                if (unidadeSelecionada['vinculaGuia'] && !this.guiaVinculada) {
                    this.toastr.warning("Necessário informar um numero de guia");
                    return;
                }

                if (!this.atendimentoTipoTussFaturar || (this.atendimentoTipoTussFaturar && !this.atendimentoTipoTussFaturar.length)) {
                    this.toastr.error("É obrigatório selecionar ao menos um procedimento para faturar");
                    return
                }else{
                    atendimentoRequest['atendimentoTipoTuss'] = this.atendimentoTipoTussFaturar
                }
            }
        }

        if (this.acaoAgendamento == "CONFIRMARAGENDAMENTO" && this.agendaAtual && this.agendaAtual.confirmacao) {
            this.toastr.warning("Esse agendamento já foi confirmado");
            (this.modalAlteraStatus) ? this.modalAlteraStatus.close() : null;
            return
        } else if (this.acaoAgendamento == "CONFIRMARAGENDAMENTO" && !this.protocolo) {
            this.toastr.warning("É obrigatório informar o protocolo");
            return;
        }

        if (this.acaoAgendamento == 'DESMARCADO' && (!this.motivoCancelamento && this.motivoCancelamento.trim() == '')) {
            this.toastr.warning('Informe um motivo para cancelar o agendamento');
            return;
        }

        if (this.acaoAgendamento == 'FALTA' && (!this.motivoCancelamento && this.motivoCancelamento.trim() == '')) {
            this.toastr.warning('Informe um motivo para a falta');
            return;
        }

        if (this.acaoAgendamento == 'FALTA') {
            atendimentoRequest['tipoFalta'] = { "id": this.tipoFalta };
            atendimentoRequest.status = "FALTA";

            if (this.arquivo) {
                atendimentoRequest['arquivo'] = this.arquivo;
                this.serviceUtil.postArquivo(this.arquivo).subscribe(
                    (arquivo) => {

                        let request = {
                            "descricao": this.arquivo.descricao + "." + this.arquivo.extensao,
                            "atendimento": {
                                "id": this.agendaAtual.id
                            },
                            "arquivo": {
                                "id": arquivo
                            }
                        };

                        this.serviceAtendimentoLog.post(request).subscribe((log) => { });
                    },
                    (erro) => {
                        Servidor.verificaErro(erro, this.toastr);
                        return
                    }
                );
            }
        }

        if (this.guiaVinculada && this.guiaObrigatoria) {
            // atendimentoRequest['guia'] = {
            //     impresso : this.guiaVinculada
            // }
            atendimentoRequest['guiaImpresso'] = this.guiaVinculada;
        }

        if (this.acaoAgendamento == 'SALADEESPERA' && this.unidadePainelSenha) {
            atendimentoRequest['senha'] = this.senhaPainel;
            atendimentoRequest['atividade'] = { id: 246 };

            if (!localStorage.getItem('unidade')) {
                this.toastr.warning("Não é possivel mudar status do atendimento sem selecionar unidade");
                return;
            }

            let unidade = localStorage.getItem('unidade');

            this.serviceSenhasPainel.encaminharConsultorio(unidade, this.senhaPainel).subscribe(
                (retorno) => {
                    console.warn("Servico adicionado com sucesso");
                    console.warn(retorno);
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                }
            )

            if (!this.senhaPainel) {
                this.toastr.warning('colocar codigo painel de senha');
                return;
            }
        }

        if (this.acaoAgendamento == "CONFIRMARAGENDAMENTO") {
            console.warn("Confirmando agendamento");
            atendimentoRequest['confirmacao'] = moment().format(this.formatosDeDatas.dataHoraSegundoFormato);
            atendimentoRequest['protocolo'] = this.protocolo;
        }

        this.atualizaAtendimentos(atendimentoRequest);
    }

    arquivo: any = false;
    enviarAnexo(anexo) {
        this.arquivo = anexo;
    }

    atualizaAtendimentos(atendimentoRequest) {
        this.serviceAtendimento.atualizar(this.agendaAtual.id, atendimentoRequest).subscribe(
            (retorno) => {
                (this.modalAlteraStatus) ? this.modalAlteraStatus.close() : null;
                (this.modalAgendamento) ? this.modalAgendamento.close() : null;
                this.atendimentoTipoTussFaturar = [];
                this.tipoConsulta = undefined;
                this.saveAgendamentoCallBack.bind(this)
            },
            (erro) => {
                this.atendimentoTipoTussFaturar = [];
                Servidor.verificaErro(erro, this.toastr);
            }
        );
    }

    validaValorConsulta(valor) {
        if (valor) {
            return parseFloat(valor.replace(',', '.'));
        }
        return 0;
    }

    fnValidaPrestador(dado) {
        let retorno = dado.prestador ? dado.prestador.nome : undefined;

        if (!retorno) {
            if (dado.configuraHorario) {
                if (dado.configuraHorario && dado.configuraHorario.tipo == 'COLETIVA') {
                    retorno = (dado.configuraHorario.agendamentoColetivo ? dado.configuraHorario.agendamentoColetivo.nome : 'Coletiva Sem Descricao');
                } else {
                    if (dado.configuraHorario.usuarioPrestador) {
                        retorno = dado.configuraHorario.usuarioPrestador.nome
                    } else {
                        retorno = 'Atendimento sem Prestador';
                    }
                }
            } else {
                retorno = dado.usuario ? dado.usuario.nome : (dado.prestador ? (dado.prestador.nome || dado.prestador.username) : 'Atendimento sem Prestador');
            }
        }

        return retorno;
    }

    fnValidaLocal(dado) {
        let retorno = dado.local ? dado.local.descricao : undefined;

        if (!retorno) {
            if (dado.configuraHorario) {
                if (dado.configuraHorario && dado.configuraHorario.tipo == 'COLETIVA') {
                    retorno = (dado.configuraHorario.unidadeAtendimento ? dado.configuraHorario.unidadeAtendimento.descricao : 'Coletiva Sem Local');
                } else {
                    if (dado.configuraHorario.unidadeAtendimento) {
                        retorno = dado.configuraHorario.unidadeAtendimento.descricao;
                    } else {
                        retorno = 'Atendimento sem Local';
                    }
                }
            } else {
                retorno = 'Atendimento sem Configuração de Horário';
            }
        }

        return retorno;
    }

    buscaPorPlano(codigo) {
        console.log(codigo)
        this.objPacientes = codigo;
        this.valorPacienteSelecionado = codigo;

        this.servicePaciente.getPacienteLike({ carteirinha: codigo }).subscribe(
            (retorno) => {
                this.setPacienteAtendimento(retorno.dados[0] || retorno);
            }
        );
    }

    ordenarColetivas(agendas){
        /*
        // ORDENO EM ORDEM DESCRESCENTE
        let ordenados = this.respostas[`${grupoPergunta.pergunta.id}-${ordem}`].valor.sort(
            (a,b) => {  return a >= b ? -1 : 1;  }
        );
        */
        // let retornoSort = moment(a.agendamento, this.formatosDeDatas.dataHoraSegundoFormato).diff( moment(b.agendamento, this.formatosDeDatas.dataHoraSegundoFormato) );
        return agendas.sort(
            (a,b) => {  return moment(a.agendamento, this.formatosDeDatas.dataHoraSegundoFormato).diff( moment(b.agendamento, this.formatosDeDatas.dataHoraSegundoFormato) );  }
        )
    }
}