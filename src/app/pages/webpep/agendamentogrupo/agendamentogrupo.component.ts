import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { Router } from '@angular/router';

import { Sessao } from '../../../services/sessao';
import { Servidor } from '../../../services/servidor';
import { EspecialidadeService, UsuarioService, AgendamentoGrupoService, AtendimentoEsperaService, AtendimentoService, LocalAtendimentoService, TemaGrupoService} from '../../../services';

import { GlobalState } from '../../../global.state';
import { Agenda, Treeview } from '../../../theme/components';
import { FormatosData } from '../../../theme/components/agenda/agenda';

import { ToastrService } from 'ngx-toastr';

import * as moment from 'moment';
import { ProgramaService } from 'app/services/webpep/programa.service';

moment.locale('pt-br');

@Component({
    selector: 'agendamentogrupo',
    templateUrl: './agendamentogrupo.html',
    styleUrls: ['./agendamentogrupo.scss'],
    providers: [Agenda, Treeview, EspecialidadeService, UsuarioService, AgendamentoGrupoService, AtendimentoEsperaService, AtendimentoService, LocalAtendimentoService]
})

export class AgendamentoGrupo implements OnInit {

    unidadesAtendimento;

    datasSelecionadas;
    instanciaAgenda;

    modalAgendamento;
    agendamentoPromiseResolve;

    novoAtendimento;
    formatosDeDatas;
    tipoConfiguracao
    recorrencia = new Object();
    modalConfirmar
    modalConfigurarAgenda

    tipoConsulta;
    tiposConsulta;
    senhaPainel;
    senhasPainelDeSenha;
    motivoCancelamento;
    pacientes;
    especialidades;
    objFiltro = [];
    usuario;
    usuarioGuid = Sessao.getUsuario()['guid'];

    acaoAgendamento;
    activeModal;
    novaListaEspera

    blocoAtual
    novoHorario;
    unidadeAtendimento;
    objParams = new Object();
    objParamsListaEspera = new Object();
    objParamsLog = new Object();
    initialValuePaciente;
    excluirListaEspera = false;
    disableInputPaciente = false;
    verDesmarcados = false;
    instanciaBtnSearch;
    idPacienteListaEspera;
    instanciaTreeview;
    grupo;
    paciente;
    gruposTema;
    todosprestadores;
    prioridades;
    agendaAtual;
    calendarioOpt = {visao: "week"};

    @ViewChild("acoesListaEspera", {read: TemplateRef}) acoesListaEspera: TemplateRef<any>;
    @ViewChild("btnAdicionarListaEspera", {read: TemplateRef}) btnAdicionarListaEspera: TemplateRef<any>;
    @ViewChild("bodyModalAdicionaListaEspera", {read: TemplateRef}) bodyModalAdicionaListaEspera: TemplateRef<any>;
    @ViewChild("modalAdicionaListaEsperaBotoes", {read: TemplateRef}) modalAdicionaListaEsperaBotoes: TemplateRef<any>;
    @ViewChild("filtrosListaEspera", {read: TemplateRef}) filtrosListaEspera: TemplateRef<any>;

    @ViewChild("agendamentoModal", {read: TemplateRef}) agendamentoModal: TemplateRef<any>;
    @ViewChild("botoesModalAgendamento", {read: TemplateRef}) botoesModalAgendamento: TemplateRef<any>;

    @ViewChild("botoesModalAgendamentoComplexa", {read: TemplateRef}) botoesModalAgendamentoComplexa: TemplateRef<any>;
    @ViewChild("agendamentoModalComplexa", {read: TemplateRef}) agendamentoModalComplexa: TemplateRef<any>;

    constructor(
        private router: Router,
        private _state: GlobalState,
        private toastr: ToastrService,
        private serviceTemaGrupo: TemaGrupoService,
        private serviceGrupo: AgendamentoGrupoService,
        private serviceAtendimentoEspera: AtendimentoEsperaService,
    ) {
        this.unidadeAtendimento = Sessao.getPreferenciasUsuario()['localAtendimentoAgenda'] ? Sessao.getPreferenciasUsuario()['localAtendimentoAgenda'] : Sessao.getIdUnidade();
    }
    
    ngOnInit() {
        this._state.notifyDataChanged('menu.isCollapsed', true);
        this.formatosDeDatas = new FormatosData();

        let objParam = {};
        if( this.unidadeAtendimento && this.unidadeAtendimento != '0' ){
            this.objParams["codigoDto"] = this.unidadeAtendimento
            objParam = { idUnidadeAtendimento: this.unidadeAtendimento };
        }

        this.unidadesAtendimento = Sessao.getVariaveisAmbiente('unidadeAtendimentoUsuario');
        this.serviceAtendimentoEspera.getPrioridades().subscribe( prioridades => this.prioridades = prioridades  );
        this.buscaGruposEspecialidades(objParam);
    }

    getEspecialidade(item, valor) {
        this.grupo = { id : valor.id, nome: valor.descricao };

        if (this.grupo) {
            this.instanciaAgenda.rebuild();
        }
    }

    getGrupoEspecialidade(valor) {
        if ( valor && !!this.instanciaAgenda) {
            this.instanciaTreeview = valor;
            this.grupo = { id : valor.id, nome: valor.text };
            this.instanciaAgenda.rebuild();
            this.fnInicializaBlocos();
        }
    }

    getPaciente(paciente) {
        if(!this.disableInputPaciente){
            this.paciente = paciente;
        }
    }

    getTipoConsulta(evento) {
        this.tipoConsulta = evento.valor;
    }

    getUnidadeAtendimento(evento) {
        if( evento.valor && !!this.instanciaAgenda){
            this.unidadeAtendimento = evento.valor;
            Sessao.setPreferenciasUsuario('localAtendimentoAgenda', this.unidadeAtendimento);
            this.buscaGruposEspecialidades({ idUnidadeAtendimento: this.unidadeAtendimento });
            (this.instanciaTreeview) ? this.instanciaTreeview.atualizaTreeview() : null;
        }else{
            this.buscaGruposEspecialidades();
        }
    }

    setDatasSelecionadas(datas) {
        this.datasSelecionadas = datas;
        (this.instanciaAgenda) ? this.instanciaAgenda.rebuild() : null
    }

    buscaGruposEspecialidades(request = {}) {
        request = { 
            pagina: 0,
            quantidade: 0,
            apenasGruposAtivos: true,
            unidadeAtendimentoId: this.unidadeAtendimento 
        }

        this.serviceTemaGrupo.getEspecialidadeTemaGrupo(request).subscribe(
            (programa) => { 
                this.gruposTema = programa.dados;
                this.inicializa_treeview(programa.dados);
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );
    };

    fnVisualizaDesmarcados($event){
        this.verDesmarcados = !this.verDesmarcados;
        this.instanciaAgenda.rebuild();
    }

    inicializa_treeview(grupo) {
        this.gruposTema = grupo;
    }

    getDatasSelecionadas(datas) {
        this.datasSelecionadas = datas;

        if ( datas.length > 1 ) {
            this.instanciaAgenda.setOpt('visao', 'week');
            this.instanciaAgenda.rebuild();
            this.fnInicializaBlocos();
        }
    }

    getInstanciaAgenda(instancia) {
        this.instanciaAgenda = instancia;
    }

    onDatePickerChange(datas) {
        if ( datas.length == 1 ) {
            this.instanciaAgenda.setOpt('visao', 'day');
            this.instanciaAgenda.rebuild();
            this.fnInicializaBlocos();
        }
    }

    fnInicializaBlocos() {
        let esse = this;
        let resolveConfiguracoes;
        let rejectConfiguracoes;
        let promiseConfiguracoes =  new Promise((resolve, reject) => {
            resolveConfiguracoes = resolve;
            rejectConfiguracoes = reject;
        });

        if (!this.grupo) {
            return promiseConfiguracoes;
        }

        var min = this.datasSelecionadas.reduce(function (a, b) { return a < b ? a : b; }); 
        var max = this.datasSelecionadas.reduce(function (a, b) { return a > b ? a : b; });

        if( this.grupo && this.grupo.id ){

            let grupoFiltroRequest = {
                "id": this.grupo.id,
                "agendamentoInicial": min.format(this.formatosDeDatas.dataFormato),
                "agendamentoFinal": max.format(this.formatosDeDatas.dataFormato)
            };

            this.serviceGrupo.postFiltro(grupoFiltroRequest).subscribe(
                (configuracoes) => {
                    let blocos = [];
                    let dataEncerramento;
                    configuracoes.forEach((configuracao) => {
                        let diaInicial = moment(configuracao.dataPrimeiraSessao, this.formatosDeDatas.dataFormato);
                        let encerramento = (configuracao.encerramento) ? moment(configuracao.encerramento, this.formatosDeDatas.dataFormato) : undefined;
                        dataEncerramento = encerramento;
                        while(max.isSameOrAfter(diaInicial)){
                            
                            let diasRepeticoes = configuracao.recorrencias.map((recorrencia)=>{return recorrencia.diaDaSemana});
                            let diaAtual = configuracao.recorrencias.filter((recorrencia)=>{return recorrencia.diaDaSemana == diaInicial.weekday()})[0];

                            if( !configuracao.recorrenciaVariavel ){
                                if (
                                        diaAtual && 
                                        diasRepeticoes.indexOf(diaInicial.weekday()) != -1 && 
                                        // ( !encerramento || (encerramento && encerramento.isAfter( diaInicial )) ) &&
                                        ( !encerramento || ( (encerramento && encerramento.isAfter( diaInicial )) || ( diaInicial.format(this.formatosDeDatas.dataFormato) == encerramento.format(this.formatosDeDatas.dataFormato) ) ) ) &&
                                        ((configuracao.dataUltimaSessao && moment(configuracao.dataUltimaSessao, esse.formatosDeDatas.dataFormato).isSameOrAfter(diaInicial)) || ! configuracao.dataUltimaSessao)
                                    ) {

                                    let inicio = `${diaInicial.format(esse.formatosDeDatas.dataFormato)} ${diaAtual.horaInicio}`;
                                    let fim = `${diaInicial.format(esse.formatosDeDatas.dataFormato)} ${diaAtual.horaFim}`;

                                    blocos.push({
                                        dado: configuracao,
                                        id: configuracao.id,
                                        draggable: false,
                                        cor: configuracao.tema.cor,
                                        
                                        dataInicio: moment(moment(`${inicio}:00`, 'DD/MM/YYYY HH:mm:ss').toDate()),
                                        dataFim: moment(moment(`${fim}:00`, 'DD/MM/YYYY HH:mm').toDate()),

                                        inicio: moment(moment(`${inicio}:00`, 'DD/MM/YYYY HH:mm:ss').toDate()),
                                        fim: moment(moment(`${fim}:00`, 'DD/MM/YYYY HH:mm:ss').toDate()),

                                        recorrencia : [],

                                        status: !(configuracao.excluido) ? 'EXCLUIDO' : 'ATIVO'
                                    });
                                }
                            }else{
                                console.log(diaInicial);
                                
                                let dataAtual = configuracao.recorrencias.filter(
                                    (recorrencia)=>{
                                        return moment(recorrencia.data, this.formatosDeDatas.dataFormato).format(this.formatosDeDatas.dataFormato) == diaInicial.format(this.formatosDeDatas.dataFormato);
                                    }
                                )[0];

                                console.log((dataAtual) ? dataAtual.data : dataAtual);

                                if( dataAtual ){
                                    let data = moment(dataAtual.data, this.formatosDeDatas.dataFormato).format(this.formatosDeDatas.dataFormato);
                                    blocos.push({
                                        dado: configuracao,
                                        id: configuracao.id,
                                        draggable: false,
                                        cor: configuracao.tema.cor,
                                        
                                        dataInicio: moment(moment(`${data} ${dataAtual.horaInicio}:00`, 'DD/MM/YYYY HH:mm:ss').toDate()),
                                        dataFim: moment(moment(`${data} ${dataAtual.horaFim}:00`, 'DD/MM/YYYY HH:mm:ss').toDate()),
    
                                        inicio: moment(moment(`${data} ${dataAtual.horaInicio}:00`, 'DD/MM/YYYY HH:mm:ss').toDate()),
                                        fim: moment(moment(`${data} ${dataAtual.horaFim}:00`, 'DD/MM/YYYY HH:mm:ss').toDate()),
    
                                        recorrencia : [],
    
                                        status: !(configuracao.excluido) ? 'EXCLUIDO' : 'ATIVO'
                                    });
                                }
                                

                                // blocos.push({
                                //     dado: configuracao,
                                //     id: configuracao.id,
                                //     draggable: false,
                                //     cor: configuracao.tema.cor,
                                    
                                //     dataInicio: moment(moment(`${inicio}:00`, 'DD/MM/YYYY HH:mm:ss').toDate()),
                                //     dataFim: moment(moment(`${fim}:00`, 'DD/MM/YYYY HH:mm').toDate()),

                                //     inicio: moment(moment(`${inicio}:00`, 'DD/MM/YYYY HH:mm:ss').toDate()),
                                //     fim: moment(moment(`${fim}:00`, 'DD/MM/YYYY HH:mm:ss').toDate()),

                                //     recorrencia : [],

                                //     status: !(configuracao.excluido) ? 'EXCLUIDO' : 'ATIVO'
                                // });
                            }

                            diaInicial.add(1, 'day');
                        }
                    });

                    if( dataEncerramento && min.isAfter(dataEncerramento)){
                        this.toastr.warning("Esse grupo já foi encerrado dia: " + dataEncerramento.format(this.formatosDeDatas.dataFormato))
                    }

                    resolveConfiguracoes(blocos);
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                    //console.error("Houve um erro ao buscar configurações da agenda. GUID: " + this.grupo.guid);
                }
            );

        }

        return promiseConfiguracoes;
    }

    fnOnUpdateBloco(agendamentoModal, botoesModalAgendamento, bloco) {
        return new Promise((resolve, reject) => {
            this.instanciaAgenda.removeBlocoId(bloco.id);

            let objParams = {
                "grupo" : {
                    "id" : bloco.cfg.id
                },
                "usuarioExecucao": {
                    "guid": Sessao.getUsuario()['guid']
                },
                "data" :  moment( bloco.novoFim, this.formatosDeDatas.dataFormato ).format( this.formatosDeDatas.dataFormato )
            }

            let hoje = moment();
            let dataSessao = moment( bloco.novoFim, this.formatosDeDatas.dataFormato );

            if( hoje.diff(dataSessao, 'days') <= 1  ){

                this.serviceGrupo.iniciarSessao( objParams ).subscribe(
                    (response) => {
                        if (response && response.mensagem) {
                            this.router.navigate([`/${Sessao.getModulo()}/agendamentogrupo/grupo/${bloco.cfg.id}`]);

                            setTimeout(() => {
                                this.toastr.warning(response.mensagem);
                            },500);
                            return;
                        }
                        this.router.navigate([`/${Sessao.getModulo()}/agendamentogrupo/grupo/${bloco.cfg.id}/sessao/${response}/visualizar`])
                    },
                    (erro) => {
                        Servidor.verificaErro(erro, this.toastr);
                        console.error(erro);
                        this.router.navigate([`/${Sessao.getModulo()}/agendamentogrupo/grupo/${bloco.cfg.id}`]);
                    }
                )
            }else{
                this.toastr.warning("Não é permitido iniciar sessão com 2 ou mais dias de atraso");

                setTimeout(() => {
                    this.router.navigate([`/${Sessao.getModulo()}/agendamentogrupo/grupo/${bloco.cfg.id}`]);
                },2000);
            }
            
            reject();
        });
    }
}