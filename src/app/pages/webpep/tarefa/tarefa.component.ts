import { Component, OnInit, OnDestroy, TemplateRef, Input, Output, Renderer2, ViewContainerRef, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef, Renderer, QueryList } from '@angular/core';
import { DashboardPepService, ConsultorioService, PapelPermissaoService, UsuarioService, PacienteCoacherService, PacienteCuidadoService, RiscoService, PacienteCuidadoExecucaoService, RiscoGrauService, CuidadoRiscoGrauService } from '../../../services';
import { Servidor } from '../../../services/servidor';
import { Sessao } from '../../../services/sessao';

import { ActivatedRoute, Router } from '@angular/router';
import { GlobalState } from '../../../global.state';
import { Notificacao, Aguardar, TopoPagina, Agenda } from '../../../theme/components';
import { FormatosData } from '../../../theme/components/agenda/agenda';
import { NgbdModalContent } from '../../../theme/components/modal/modal.component';
import { TreeviewItem } from 'ngx-treeview';

import { ToastrService } from 'ngx-toastr';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import * as jQuery from 'jquery';

moment.locale('pt-br');

@Component({
    selector: 'tarefa',
    templateUrl: './tarefa.html',
    styleUrls: ['./tarefa.scss'],
    providers: []
})

export class Tarefa implements OnInit, OnDestroy {

    atual = 'riscos';

    @Input() pacienteId;

    objParamCuidados = new Object();
    objConfigTimeline = [];
    itensEventosTimeline = [];

    acaoExecutada;
    execucaoCuidado;
    cuidados = [];
    paginaAtualCuidado = 1;
    itensPorPaginaCuidado = 5;
    qtdItensTotalCuidado;
    pacientesCoacher;
    activeModal;
    formatosDeDatas = new FormatosData();
    usuario;

    intervaloBusca:any = 1;
    intervaloBuscaTipo = "week";
    
    @ViewChild("modalCuidadoExecucao", {read: TemplateRef}) modalCuidadoExecucao: QueryList<TemplateRef<any>>;
    @ViewChild("modalCuidadoExecucaoBotoes", {read: TemplateRef}) modalCuidadoExecucaoBotoes: QueryList<TemplateRef<any>>;
    
    
    
    @ViewChild("tmplDetalheRisco", {read: TemplateRef}) tmplDetalheRisco: QueryList<TemplateRef<any>>;
    @ViewChild("footerDetalheRisco", {read: TemplateRef}) footerDetalheRisco: QueryList<TemplateRef<any>>;
    
    @ViewChild("modalCriarCuidado", {read: TemplateRef}) modalCriarCuidado: QueryList<TemplateRef<any>>;
    @ViewChild("modalCriarCuidadoBotoes", {read: TemplateRef}) modalCriarCuidadoBotoes: QueryList<TemplateRef<any>>;

    riscos = [];
    coachers = [];

    momentjs = moment;

    modalInstancia;
    variaveisDeAmbiente = {};

    constructor( 
        private _state: GlobalState, 
        public router: Router,
        private modalService: NgbModal,
        private toastr: ToastrService, 
        private vcr: ViewContainerRef,

        private servicePacienteCuidado: PacienteCuidadoService,
        private servicePacienteCuidadoExecucao: PacienteCuidadoExecucaoService,
        private serviceCuidadoRiscoGrau: CuidadoRiscoGrauService,
        private papelPermissaoService: PapelPermissaoService,
        private serviceRisco: RiscoService,
        private serviceGrauRisco: RiscoGrauService,

        private pacienteCoacherService: PacienteCoacherService,
        private usuarioService: UsuarioService,

    ) {
        this.variaveisDeAmbiente['unidade'] = JSON.parse( localStorage.getItem("variaveisAmbiente") ).unidadeAtendimentoUsuario;
        this.variaveisDeAmbiente['tipoPagina'] = ( this.router.url.indexOf('tarefas') >= 0 ) ? 'tarefas' : 'coacher';
    }
    
    ngOnInit() {
        this.usuario = JSON.parse( localStorage.getItem("usuario") );
        this.variaveisDeAmbiente['unidade'] = JSON.parse( localStorage.getItem("variaveisAmbiente") ).unidadeAtendimentoUsuario;

        if( this.pacienteId ){

            let proximaData = moment( moment(), this.formatosDeDatas.dataHoraSegundoFormato ).format( this.formatosDeDatas.dataHoraSegundoFormato )
            let fimIntervalo = moment( proximaData, this.formatosDeDatas.dataHoraSegundoFormato ).add( this.intervaloBusca, this.intervaloBuscaTipo ).format(this.formatosDeDatas.dataHoraSegundoFormato);
            let obj = {
                inicio: proximaData,
                fim: fimIntervalo
            };

            
            this.buscaCuidadosPaginado(obj, true);
        }else{
            this.buscaPacientesCoacher();
        }
    }

    ngOnDestroy() {}

    ngAfterViewInit() {
        this.formatosDeDatas = new FormatosData();

        this.objParamCuidados = {
            "idevento" : "id",
            "img" : 'cuidadoRiscoGrau.riscoGrau.risco.icone',
            "cor" : 'cuidadoRiscoGrau.riscoGrau.cor',
            "titulo" : 'cuidadoRiscoGrau.cuidado.descricao',
            "observacao" : 'cuidadoRiscoGrau.cuidado.tipo.descricao',
            "nome" : 'paciente.nome',
            "btnDetalhe" : 'Visualizar',
            "data" : 'inicio'
        }
    }

    pacientesSelecionados = [];
    pacientesSelect = [];
    riscosSelect = [];
    buscaPacientesCoacher(){
        let filtro = {
            usuarioGuid : this.usuario.guid,
            ativos : true
        }
        this.pacienteCoacherService.getPacienteCoacher(filtro).subscribe(
            (pacientes) => {
                this.pacientesCoacher = pacientes.dados;
                if( !this.pacientesSelecionados.length ){
                    this.pacientesCoacher.forEach(
                        (paciente) => {
                            // this.pacientesSelecionados.push( { id : paciente.paciente.id } );

                            this.pacientesSelect.push( { id : paciente.paciente.id, nome: paciente.paciente.nome } );
                        }
                    )
                }

            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        )

    }

    papeisAcoes = [];
    buscaPacienteResponsaveis(){
        console.log("Mostra paciente responsaveis");

        this.riscos.forEach(
            (risco)=>{
                console.log(risco);
                let nomePermissao = risco.cuidadoRiscoGrau.cuidado.permissao.nome;
                let request = {
                    permissaoNome: nomePermissao
                };
                this.papelPermissaoService.get(request).subscribe((resposta) => {
                    resposta.dados.forEach(
                        (papel)=>{
                            console.log(papel);
                        }
                    )
                });
            }
        )

    }
    
    //  #############################################
    //               Ações da tela
    //  #############################################
    refreshTimeline
    buscaCuidadosPaginado(evento = null, refreshTimeline = false) {

        let objRequestCuidados = new Object();
        console.log(this.pacienteId);
        
        if( !this.pacientesSelecionados.length){
            this.buscaPacientesCoacher();
            objRequestCuidados['pacienteLista'] = [ { id : this.pacienteId } ];
        }else{
            objRequestCuidados['pacienteLista'] = this.pacientesSelecionados;
        }

        if( evento ){
            objRequestCuidados['dataInicial'] = evento.inicio;
            objRequestCuidados['dataFinal'] = evento.fim;
        }

        this.servicePacienteCuidado.postPacienteCuidadoFiltro( objRequestCuidados )
            .subscribe((cuidados) => {
                this.cuidados = cuidados.dados;

                this.objConfigTimeline = this.cuidados.map(
                    (cuidado) => {
                        return {
                            idevento : cuidado.id,
                            dataInicio : cuidado.inicio,
                            dataFim : cuidado.fim,
                            diasParaIniciar : cuidado.cuidadoRiscoGrau.frequencia,
                            frequenciaDias : cuidado.frequencia,
                            repetir : cuidado.cuidadoRiscoGrau.repetir,
                            objEvento : cuidado
                        }
                    }
                )

                this.cuidados.forEach(
                    (cuidado) => {

                        cuidado.execucoes.forEach(
                            (execucao) => {
                                let objExecucao = {
                                    idevento       : cuidado.id,
                                    dataExecucao   : execucao.executado,
                                    dataPrevista   : execucao.previsto,
                                    executanteId   : (execucao.usuario) ? execucao.usuario.guid : undefined,
                                    executanteNome : (execucao.usuario) ? execucao.usuario.nome : undefined
                                }

                                this.itensEventosTimeline.push(objExecucao);
                            }
                        )
                    }
                )

                this.refreshTimeline = refreshTimeline;
                if( this.pacienteId ){
                    if( !this.riscos.length ){
                        this.getRiscosGrau(cuidados);
                    }
                }else{
                    this.getRiscosGrau(cuidados)
                }
                
            },
            (erro) => {Servidor.verificaErro(erro, this.toastr);}
        );
    }

    getRiscosGrau(cuidados){
        let riscos = [];
        
        cuidados.dados.forEach((risco) => {
            let bTemRisco = riscos.filter((r) => {
                return r.cuidadoRiscoGrau.riscoGrau.risco.id == risco.cuidadoRiscoGrau.riscoGrau.risco.id;
            })[0];

            if (!bTemRisco) {
                riscos.push(risco);
            }
        });

        this.riscos = riscos.slice();
        console.log(this.riscos);
        
    }

    carregaProximos(evento){
        console.log(evento);        
    }

    classificarPacientes() {
        if( this.pacienteId ){

            let request = {
                "pacienteLista" : [{
                    "id" : this.pacienteId
                }]
            }

            this.servicePacienteCuidado.gerarPacienteCuidado( request ).subscribe((resposta)=>{
                this.toastr.success("Classificação de pacientes em andamento");

                if( this.pacienteId ){
                    let proximaData = moment( moment(), this.formatosDeDatas.dataHoraSegundoFormato ).format( this.formatosDeDatas.dataHoraSegundoFormato )
                    let fimIntervalo = moment( proximaData, this.formatosDeDatas.dataHoraSegundoFormato ).add( this.intervaloBusca, this.intervaloBuscaTipo ).format(this.formatosDeDatas.dataHoraSegundoFormato);
                    let obj = {
                        inicio: proximaData,
                        fim: fimIntervalo
                    };

                    this.buscaCuidadosPaginado(obj, true);
                }
            });
        }
    }
    
    buscaPacienteCoacher() {
        let pacienteId;
        let request = {
            pacienteId: this.pacienteId
        };
        this.pacienteCoacherService.getPacienteCoacher(request).subscribe((response) => {
            this.coachers = response.dados;
        });
    }

    coacher;
    objCoacher;
    coacherSelecionado;
    getCoacher(coacher) {
        this.coacher = coacher;
        if( coacher ){
            this.coacherSelecionado = coacher.nome;
        }
    }
    
    fnCfgCoacherRemote(term) {
        this.usuarioService.usuarioPaginadoFiltro( 1, 10, term ).subscribe(
            (retorno) => {
                this.objCoacher = retorno.dados || retorno;
            }
        )
    }

    risco;
    objRiscos;
    riscoSelecionado;
    getRisco(risco) {
        this.risco = risco;
        if( risco ){
            this.riscoSelecionado = risco.nome;
            this.serviceGrauRisco.get( { idRisco : risco.id } ).subscribe(
                (grausRisco) => {
                    this.riscosSelect = grausRisco.dados.map(
                        (risco) => {
                            return {
                                id : risco.id,
                                nome : risco.descricao
                            }
                        }
                    );
                }
            )
        }
    }
    
    fnCfgRiscoRemote(term) {
        this.serviceRisco.get( { pagina : 1, quantidade: 10, like : term, simples: true} ).subscribe(
            (retorno) => {
                this.objRiscos = retorno.dados || retorno;
            }
        )
    }

    unidadeId;
    addCoacher() {
        let request = {
            "paciente": {
                "id": this.pacienteId
            },
            "usuario": {
                "guid": this.coacher.guid
            },
            "unidadeAtendimento": {
                "id": this.unidadeId
            }
        };

        this.pacienteCoacherService.postPacienteCoacher(request).subscribe((resposta) => {
            this.buscaPacienteCoacher();
        });
    }

    //  #############################################
    //          Funcionalidades da tela
    //  #############################################
    getItemSelect(item){
        let cuidado = item.item;
        
        this.execucaoCuidado = cuidado;

        let dataExecucao = moment( cuidado.data, this.formatosDeDatas.dataHoraFormato ).format( this.formatosDeDatas.dataFormato )
        this.servicePacienteCuidadoExecucao.getPacienteCuidadoExecucao( { pacienteCuidadoId : cuidado.objEvento.idevento, data: dataExecucao } ).subscribe(
            (cuidadoExecucao) => {

                if( cuidadoExecucao.dados.length ){
                    this.execucaoCuidado['execucaoCuidadoExecucao'] = cuidadoExecucao.dados[0];
                    this.abreModalCuidado(cuidado);

                }else{
                    let objPacienteExecucao = {
                        "pacienteCuidado": {
                            "id": cuidado.objEvento.idevento
                        },
                        "previsto": moment( cuidado.data, this.formatosDeDatas.dataHoraFormato ).format( this.formatosDeDatas.dataHoraSegundoFormato )
                    }

                    this.servicePacienteCuidadoExecucao.postPacienteCuidadoExecucao( objPacienteExecucao ).subscribe(
                        (idExecucao) => {

                            this.servicePacienteCuidadoExecucao.getPacienteCuidadoExecucao({ id : idExecucao }).subscribe(
                                (execucao) => {
                                    this.execucaoCuidado['execucaoCuidadoExecucao'] = execucao.dados[0];
                                    this.abreModalCuidado(cuidado);
                                }
                            )

                        }
                    )
                }       

            }
        );
    }

    fechaModalFnExecucao(){
        this.activeModal.close();
    }

    abreModalCuidado(cuidado){
        this.activeModal = this.modalService.open(NgbdModalContent, {size: 'lg'});
        this.activeModal.componentInstance.modalHeader  = `Execução do Cuidado: ${cuidado.titulo}`;
        this.activeModal.componentInstance.templateRefBody = this.modalCuidadoExecucao;
        this.activeModal.componentInstance.templateBotoes = this.modalCuidadoExecucaoBotoes;

        this.activeModal.result.then(
            (data) => this.fechaModalFnExecucao(), 
            (reason) => this.fechaModalFnExecucao() );
    }

    trocaEstadoPacienteCoacher(evento, pacienteId){
        
        if( evento ){
            this.pacientesSelecionados.push( { id: pacienteId.id } );
        }else{
            this.pacientesSelecionados = this.pacientesSelecionados.filter(
                (paciente) => {
                    return paciente.id != pacienteId.id
                }
            )
        }


        let proximaData = moment( moment(), this.formatosDeDatas.dataHoraSegundoFormato ).format( this.formatosDeDatas.dataHoraSegundoFormato )
        let fimIntervalo = moment( proximaData, this.formatosDeDatas.dataHoraSegundoFormato ).add( this.intervaloBusca, this.intervaloBuscaTipo ).format(this.formatosDeDatas.dataHoraSegundoFormato);
        let obj = {
            inicio: proximaData,
            fim: fimIntervalo
        };
        this.buscaCuidadosPaginado(obj, true);
    }

    salvarExecucao(){
        let executado = moment().format( this.formatosDeDatas.dataHoraSegundoFormato );
        let objPacienteExecucao = {
            "usuario": {
                "guid": this.usuario.guid
            },
            "executado": executado
        }

        this.servicePacienteCuidadoExecucao.putPacienteCuidadoExecucao( this.execucaoCuidado['execucaoCuidadoExecucao']["id"], objPacienteExecucao ).subscribe(
            (status) => {
                this.toastr.success("Execução salva com sucesso");
                this.fechaModalFnExecucao();
            }
        )

    }

    podeCriarCuidado = true;
    objParamsCuidadoManual = new Object();
    salvarCuidadoManual(){
        this.servicePacienteCuidado.postPacienteCuidado( this.objParamsCuidadoManual ).subscribe(
            (status) => {
                this.toastr.success("Cuidado manual salvo com sucesso");
                this.activeModal.close();
                this.buscaCuidadosPaginado();
            }, (erro) => {
                if( erro.status == 403 ){
                    this.toastr.error("Usuario sem permissao para criar esse cuidado");
                }
            }
        )
    }

    criarCuidadoManual(){
        this.activeModal = this.modalService.open(NgbdModalContent, {size: 'lg'});
        this.activeModal.componentInstance.modalHeader  = `Criar cuidado manual`;
        this.activeModal.componentInstance.templateRefBody = this.modalCriarCuidado;
        this.activeModal.componentInstance.templateBotoes = this.modalCriarCuidadoBotoes;

        this.activeModal.result.then(
            (data) => this.fechaModalFnExecucao(), 
            (reason) => this.fechaModalFnExecucao() );
    }

    mostraVigencia(coacher) {
        let sVigencia;

        if (coacher.inicio && coacher.fim) {
            return `${coacher.inicio} ate ${coacher.fim}`;
        }

        return `Desde ${coacher.inicio}`;
    }

    navegar(aba) {
        this.atual = aba;
    }

    cuidadoRiscosSelect = [];
    setRiscoGrau(riscoGrau){
        
        if( riscoGrau.valor ){
            this.serviceCuidadoRiscoGrau.get( { riscoGrauId : riscoGrau.id } ).subscribe(
                (cuidadosGrausRisco) => {
                    this.cuidadoRiscosSelect = cuidadosGrausRisco.dados.map(
                        (cuidadoGrau) => {
                            return {
                                id : cuidadoGrau.id,
                                nome : cuidadoGrau.cuidado.descricao
                            }
                        }
                    );
                }
            )
        }

    }

    setCuidadoRiscoGrau(evento){
        
        if( evento.valor ){
            this.objParamsCuidadoManual['cuidadoRiscoGrau'] = { id : evento.valor };
        }else{
            this.objParamsCuidadoManual['cuidadoRiscoGrau'] = undefined
        }
    }

    setCuidadoPaciente(evento){
        
        if( evento ){
            this.objParamsCuidadoManual['paciente'] = { id : evento.valor };
        }else{
            this.objParamsCuidadoManual['paciente'] = undefined
        }
    }

    buscaProximosCuidadosExecucao(evento){

        this.buscaCuidadosPaginado( evento );

    }

    detalhesRisco = new Object();
    verDetalhesDoRisco(risco){
        console.log(risco);

        this.servicePacienteCuidado.getPerguntasQueLevaramAoRisco( { pacienteCuidadoId : risco.id } ).subscribe(
            (dados) => {
                this.detalhesRisco['detalhes'] = dados.map(
                    (indicador) => {
                        let objret = {
                            data      : indicador.pacienteDocumento.data,
                            descricao : indicador.pergunta.descricao,
                            nome      : indicador.pacienteDocumento.usuario.nome,
                            valor     : indicador.valor
                        }

                        if( indicador.pergunta.opcoes && indicador.pergunta.opcoes.length ){
                            indicador.pergunta.opcoes.forEach(
                                (opcao) => {
                                    if( opcao.id == objret.valor ){
                                        objret.valor = opcao.descricao;
                                    }
                                }
                            )
                        }else if( indicador.pergunta.tipo == "BOOLEAN" ){
                            objret.valor = ( objret.valor == "0" ) ? 'NÃO' : 'SIM';
                        }

                        return objret;
                    }
                );

                this.detalhesRisco['risco'] = risco;

                if( this.detalhesRisco['detalhes'].length ){
                    this.modalInstancia = this.modalService.open(NgbdModalContent, {size: 'lg'});
                    this.modalInstancia.componentInstance.modalHeader = `Detalhamento do Risco`;

                    this.modalInstancia.componentInstance.templateRefBody = this.tmplDetalheRisco;
                    this.modalInstancia.componentInstance.templateBotoes = this.footerDetalheRisco;

                    // let fnError = (erro) => { console.log("Modal Fechada!"); };
                    // this.modalInstancia.result.then((data) => fnSuccess, fnError);
                }else{
                    this.toastr.warning("Nao há detalhes para esse risco");
                }

            }
        )

    }
}