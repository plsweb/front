import { Component, OnInit, OnDestroy, TemplateRef, Input, Output, Renderer2, ViewContainerRef, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef, Renderer, QueryList, OnChanges, SimpleChanges } from '@angular/core';

import { ProfissionalPacienteService, PapelPermissaoService, UsuarioService, PacienteCoacherService, PacienteCuidadoService, PacienteRiscoService, RiscoService, PacienteCuidadoExecucaoService, RiscoGrauService, DicionarioTissService, CuidadoRiscoGrauService, PacienteDocumentoService, EspecialidadeService, PacienteService, ProgramaSaudePacienteService } from '../../../services';

import { Servidor } from '../../../services/servidor';
import { Sessao } from '../../../services/sessao';

import { ActivatedRoute, Router } from '@angular/router';
import { GlobalState } from '../../../global.state';
import { FormatosData } from '../../../theme/components/agenda/agenda';
import { NgbdModalContent } from '../../../theme/components/modal/modal.component';

import { ToastrService } from 'ngx-toastr';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';

moment.locale('pt-br');

@Component({
    selector: 'plano-cuidado',
    templateUrl: './planoCuidado.html',
    styleUrls: ['./planoCuidado.scss'],
    providers: [ EspecialidadeService ]
})

export class PlanoCuidado implements OnInit, OnDestroy, OnChanges {

    atual = 'riscos';

    @Input() pacienteId;
    @Input() pacientesSelecionados = [];
    @Input() mostraBotaoAdicionaCoacher = true;
    @Input() semAbaCoacher;
    @Input() tipoProfissional;

    objParamCuidados = new Object();
    objConfigTimeline = [];
    programaSaudePaciente;
    itensEventosTimeline = [];
    programaStatus;

    acaoExecutada;
    execucaoCuidado;
    cuidados = [];
    tiposEncerramento = [];
    paginaAtualCuidado = 1;
    itensPorPaginaCuidado = 5;
    qtdItensTotalCuidado;
    pacientesCoacher = [];
    activeModal;    
    formatosDeDatas = new FormatosData();
    usuario;
    usuarioUnidadesAtendimento;
    unidadeSelecionada;
    idAbaPacienteRiscoAberta;

    intervaloBusca:any = 1;
    intervaloBuscaTipo = "week";
    
    @ViewChild("modalCuidadoExecucao", {read: TemplateRef}) modalCuidadoExecucao: QueryList<TemplateRef<any>>;
    @ViewChild("modalCuidadoExecucaoBotoes", {read: TemplateRef}) modalCuidadoExecucaoBotoes: QueryList<TemplateRef<any>>;
    
    @ViewChild("tmplDetalheRisco", {read: TemplateRef}) tmplDetalheRisco: QueryList<TemplateRef<any>>;
    @ViewChild("footerDetalheRisco", {read: TemplateRef}) footerDetalheRisco: QueryList<TemplateRef<any>>;
    
    @ViewChild("modalCriarCuidado", {read: TemplateRef}) modalCriarCuidado: QueryList<TemplateRef<any>>;
    @ViewChild("modalCriarCuidadoBotoes", {read: TemplateRef}) modalCriarCuidadoBotoes: QueryList<TemplateRef<any>>;

    @ViewChild("tmplHistoricoRiscos", {read: TemplateRef}) tmplHistoricoRiscos: QueryList<TemplateRef<any>>;

    @ViewChild("bodyModalFormEvolucao", {read: TemplateRef}) bodyModalFormEvolucao: TemplateRef<any>;
    @ViewChild("bodyModalFormEvolucaoBotoes", {read: TemplateRef}) bodyModalFormEvolucaoBotoes: TemplateRef<any>;
    
    @ViewChild("bodyModalEncerramento", {read: TemplateRef}) bodyModalEncerramento: TemplateRef<any>;
    @ViewChild("templateBotoesModalEncerramento", {read: TemplateRef}) templateBotoesModalEncerramento: TemplateRef<any>;

    @ViewChild("modalEdita", {read: TemplateRef}) modalEdita: TemplateRef<any>;
    @ViewChild("modalEditaBotoes", {read: TemplateRef}) modalEditaBotoes: TemplateRef<any>;

    riscos = [];
    historicoRiscos = [];
    coachers = [];

    momentjs = moment;

    modalInstancia;
    tipoPaciente;

    constructor( 
        private _state: GlobalState, 
        public router: Router,
        private modalService: NgbModal,
        private toastr: ToastrService, 
        private vcr: ViewContainerRef,

        private servicePacienteCuidado: PacienteCuidadoService,
        private servicePacienteRisco: PacienteRiscoService,
        private pacienteEspecialidadeService: ProfissionalPacienteService,
        private servicePacienteCuidadoExecucao: PacienteCuidadoExecucaoService,
        private serviceProgramaSaudePaciente: ProgramaSaudePacienteService,
        private serviceCuidadoRiscoGrau: CuidadoRiscoGrauService,
        private papelPermissaoService: PapelPermissaoService,
        private serviceEspecialidade: EspecialidadeService,
        private pacienteDocumentoService: PacienteDocumentoService,
        private serviceRisco: RiscoService,
        private servicePaciente: PacienteService,
        private serviceGrauRisco: RiscoGrauService,
        private serviceTipoEncerro: DicionarioTissService,
        private route: ActivatedRoute,

        private pacienteCoacherService: PacienteCoacherService,
        private usuarioService: UsuarioService,
    ) { 

        let url = ( this.router.url.indexOf('planocuidado/paciente') >= 0 ) ? 'paciente' : 'planoCuidado';
        this.tipoPaciente = ( url == 'paciente' );

        if( this.tipoPaciente ){
            this.route.params.subscribe(params => {
                    this.pacienteId = params["idpaciente"] ? params["idpaciente"] : undefined
                }
            );
            this.semAbaCoacher = true;
        }
    }
    
    ngOnInit() {
        this.usuarioUnidadesAtendimento = JSON.parse( localStorage.getItem("variaveisAmbiente") ).unidadeAtendimentoUsuario;
        this.usuario = JSON.parse( localStorage.getItem("usuario") );
        this.programaStatus = Sessao.getEnum('ProgramaStatus').lista;
        console.log("init");

        this.serviceTipoEncerro.getTipoEncerramento().subscribe(
            (tipos) => { this.tiposEncerramento = tipos }
        );
        
        if( this.pacienteId ){
            this.inicializaTimeline();

            this.serviceProgramaSaudePaciente.get({pacienteId: this.pacienteId}).subscribe(
                (programa) => { this.programaSaudePaciente = programa.dados }
            );
        }else{
            this.buscaPacientesCoacher();
        }
    }

    ngOnChanges(changes){
        console.log(changes);
        
        if( changes['pacientesSelecionados'] && changes['pacientesSelecionados']['currentValue']){
            this.limpaTimeline();
            this.pacientesSelecionados = changes['pacientesSelecionados']['currentValue'];
            this.inicializaTimeline();
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

    pacientesSelect = [];
    riscosSelect = [];
    buscaPacientesCoacher(){
        let filtro = {};
        if( !this.semAbaCoacher ){

            if( this.mostraBotaoAdicionaCoacher ){
                filtro['ativos'] = true;
                filtro['pacienteId'] = this.pacienteId;

                this.pacienteCoacherService.getPacienteCoacher(filtro).subscribe(
                    (pacientes) => {
                        this.pacientesCoacher = pacientes.dados;
                        this.coachers = pacientes.dados;
                        if( !this.pacientesSelecionados.length ){
                            this.pacientesCoacher.forEach(
                                (paciente) => {
                                    this.pacientesSelect.push( { id : paciente.paciente.id, nome: paciente.paciente.nome } );
                                }
                            )
                        }

                    },
                    (erro) => {
                        Servidor.verificaErro(erro, this.toastr);
                    },
                )
            }else{

                filtro = { usuarioGuid : this.usuario.guid };

                if( !this.tipoProfissional ){
                    filtro['ativos'] = true;
                    this.pacienteCoacherService.getPacienteCoacher(filtro).subscribe(
                        (pacientes) => {
                            this.coachers = pacientes.dados;
                            this.pacientesCoacher = pacientes.dados;
                            if( !this.pacientesSelecionados.length ){
                                this.pacientesCoacher.forEach(
                                    (paciente) => {
                                        this.pacientesSelect.push( { id : paciente.paciente.id, nome: paciente.paciente.nome } );
                                    }
                                )
                            }
                        }
                    )
                }else{

                    this.pacienteEspecialidadeService.get(filtro).subscribe(
                        (pacientes) => {
                            this.coachers = pacientes.dados;
                            // this.pacientesCoacher = pacientes.dados;
                            if( !this.pacientesSelecionados.length ){
                                pacientes.dados.forEach(
                                    (paciente) => {
                                        if( this.pacientesSelect.length ){
                                            let possuiPaciente = this.pacientesSelect.filter( (pos) => { return pos.id == paciente.paciente.id } )

                                            if( !possuiPaciente.length ){
                                                this.pacientesSelect.push( { id : paciente.paciente.id, nome: paciente.paciente.nome } );
                                                this.pacientesCoacher.push( paciente );
                                                return;
                                            }else{
                                                return;
                                            }
                                        }
                                        
                                        this.pacientesSelect.push( { id : paciente.paciente.id, nome: paciente.paciente.nome } );
                                        this.pacientesCoacher.push( paciente );
                                    }
                                )

                            }

                        }
                    )

                }

            }

        }

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

                if ( !this.cuidados.length ) {
                    // this.limpaTimeline();
                    this.toastr.warning("Usuário nao tem permissão para visualizar as ações");
                    return;
                } else {
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

                    this.objConfigTimeline = this.cuidados.map(
                        (pacienteCuidado) => {
                            return {
                                idevento : pacienteCuidado.id,
                                dataInicio : pacienteCuidado.inicio,
                                dataFim : pacienteCuidado.fim,
                                // diasParaIniciar : pacienteCuidado.cuidadoRiscoGrau.frequencia,
                                diasParaIniciar : pacienteCuidado.cuidadoRiscoGrau.cuidado.diasInicio || 0,
                                frequenciaDias : pacienteCuidado.frequencia,
                                repetir : pacienteCuidado.cuidadoRiscoGrau.repetir,
                                objEvento : pacienteCuidado
                            }
                        }
                    )
                    
                    this.refreshTimeline = refreshTimeline;
                }
                
            },
            (erro) => {Servidor.verificaErro(erro, this.toastr);}
        );
    }

   paginaAtualRisco = 1;
   itensPorPaginaRisco = 5;
   labelRiscos = [];
   labelCuidados = [];
   carregouRiscos = true;
   carregouHistoricoRiscos = true;
    getRiscosGrau(evento = null, mostraAntigos = false){

        // if( !mostraAntigos ){
        //     this.carregouRiscos = false;
        // }else{
        //     this.carregouHistoricoRiscos = false;
        // }
        
        let objRequestCuidados = {}

        if( !this.pacientesSelecionados.length){
            objRequestCuidados['pacienteLista'] = [ { id : this.pacienteId } ];
        }else{
            objRequestCuidados['pacienteLista'] = this.pacientesSelecionados;           
        }

        objRequestCuidados['semPermissao'] = true;
        objRequestCuidados['apenasVigentes'] = !mostraAntigos;

        this.servicePacienteRisco.postPacienteRiscoFiltro( objRequestCuidados ).subscribe(
            (riscosPaciente) => {

                if( mostraAntigos ){
                    this.historicoRiscos = riscosPaciente.dados;
                    this.carregouHistoricoRiscos = true;
                }else{
                    this.riscos = riscosPaciente.dados;
                    this.carregouRiscos = true;
                }

            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        )
        
    }

    modalHistorico;
    visualizarHistoricoDeRiscos(){
        this.modalHistorico = this.modalService.open(NgbdModalContent, {size: 'lg'});
        this.modalHistorico.componentInstance.modalHeader = `Histórico de riscos do paciente`;
        this.modalHistorico.componentInstance.custom_lg_modal = true;

        // Nova forma de passar variavel de contexto para dentro do componente MODAL
        this.modalHistorico.componentInstance.contextObject = { some: 'teste',bar: 'teste' }

        this.modalHistorico.componentInstance.templateRefBody = this.tmplHistoricoRiscos;
        
        this.labelRiscos = [];
        this.historicoRiscos = [];
        this.getRiscosGrau(null, true);

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

                    this.labelRiscos = [];
                    this.riscos = [];
                    this.getRiscosGrau();
                    this.buscaCuidadosPaginado(obj, true);
                }
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            });
        }
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
    objRiscosGrau;
    riscoGrauSelecionado;
    getRisco() {
        this.serviceGrauRisco.get( { idRisco : 18 } ).subscribe(
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

    cuidadoSelecionado;
    encerramento(cuidado){

        this.cuidadoSelecionado = cuidado;

        this.modalHistorico = this.modalService.open(NgbdModalContent, {size: 'lg'});
        this.modalHistorico.componentInstance.modalHeader = `Encerramento do Cuidado`;
        this.modalHistorico.componentInstance.custom_lg_modal = true;

        this.modalHistorico.componentInstance.templateRefBody = this.bodyModalEncerramento;
        this.modalHistorico.componentInstance.templateBotoes = this.templateBotoesModalEncerramento;
         
    }

    observacaoRemocao;
    tipoRemocao;
    tipoEncerramento;
    validaConfirmaREmocao(){
        if( this.tipoEncerramento == '0' || !this.tipoEncerramento ){
            return true;
        }
    
        return false;
    }

    encerramentoRisco(){
        
        if( confirm("Confirma o encerramento desse tratamento") ){

            let request = {
                idPaciente : (this.cuidadoSelecionado.paciente) ? this.cuidadoSelecionado.paciente.id : undefined,
                idPacienteRisco : this.cuidadoSelecionado.id,
                idTipoEncerramento : this.tipoEncerramento
            }
            this.servicePacienteCuidado.postFinalizaPacienteRisco(request).subscribe(
                (retorno) => {
                    this.toastr.success("Alta dada com sucesso");
                    (this.modalHistorico) ? this.modalHistorico.close() : null;
                    this.buscaCuidadosPaginado(true);
                    this.getRiscosGrau();
                },
                (erro) => {
                    this.toastr.error("Houve um erro ao dar alta no risco");
                }
            )

        }

    }
    
    fnCfgRiscoRemote(term) {
        this.serviceCuidadoRiscoGrau.get( { pagina : 1, quantidade: 10, like : term, simples: true} ).subscribe(
            (retorno) => {
                this.objRiscosGrau = retorno.dados || retorno;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        )
    }

    pacienteSelecionado;
    addCoacher() {

        if( !this.coacher ){
            this.toastr.warning("Necessario selecionar um usuario para coacher");
            return;
        }

        if( !this.unidadeSelecionada ){
            this.toastr.warning("Necessario selecionar uma unidade para o coacher");
            return;
        }

        let request = {
            "paciente": {
                "id": this.pacienteId || this.pacienteSelecionado
            },
            "usuario": {
                "guid": (this.coacher) ? this.coacher.guid : this.usuario.guid
            },
            "unidadeAtendimento":{
                "id": this.unidadeSelecionada
            }
        };

        if( this.tipoProfissional ){
            if( !this.especialidade ){
                this.toastr.error("Obrigatório selecionar uma especialidade");
            }
            request['especialidade'] = { id : this.especialidade }
            request['inicio'] = moment().format(this.formatosDeDatas.dataHoraSegundoFormato);
    
            this.pacienteEspecialidadeService.post( request ).subscribe(
                (retorno) => {
                    this.toastr.success("Profissional adicionado ao paciente");
                    this.especialidade = new Object();
                    this.especialidadeSelecionada = '';
                    this.buscaPacientesCoacher();
                },
                (erro) => {
                    this.toastr.error("Houve um erro ao carregar profissionais do paciente");
                }
            )

        }else{

            this.pacienteCoacherService.postPacienteCoacher(request).subscribe((resposta) => {
                this.toastr.success("Coacher adicionado com sucesso");
                this.buscaPacientesCoacher();
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },);
        }
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

                        },
                        (erro) => {
                            Servidor.verificaErro(erro, this.toastr);
                        },
                    )
                }       

            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        );
    }

    fechaModalFnExecucao(){
        this.activeModal.close();
    }

    idFormulario;
    idPacienteCuidado;
    idCuidadoExecucao;
    possuiAtendimento = false;
    jaPossuiFormulario = undefined;
    jaPossuiAtendimento;
    abreModalCuidado(cuidado){
        console.log(cuidado);

        if( cuidado.execucaoCuidadoExecucao.pacienteCuidado.cuidadoRiscoGrau.cuidado.formulario ){
            this.idFormulario = cuidado.execucaoCuidadoExecucao.pacienteCuidado.cuidadoRiscoGrau.cuidado.formulario.id;

            this.idPacienteCuidado = cuidado.execucaoCuidadoExecucao.pacienteCuidado.paciente.id;

            this.jaPossuiFormulario = cuidado.execucaoCuidadoExecucao.pacienteDocumento;

            this.idCuidadoExecucao = cuidado.execucaoCuidadoExecucao.id;
        }else{
            console.log("Nao possui formulario");
            this.idFormulario = false;
        }

        if( cuidado.execucaoCuidadoExecucao.pacienteCuidado.cuidadoRiscoGrau.cuidado.tipo.tabela ){
            if( cuidado.execucaoCuidadoExecucao.pacienteCuidado.cuidadoRiscoGrau.cuidado.tipo.tabela.nome.indexOf("Atendimento") >= 0 ){
                this.possuiAtendimento = true;
            }

            if( cuidado.execucaoCuidadoExecucao.atendimento ){
                this.jaPossuiAtendimento = cuidado.execucaoCuidadoExecucao.atendimento;
            }
        }

        this.activeModal = this.modalService.open(NgbdModalContent, {size: 'lg'});
        this.activeModal.componentInstance.modalHeader  = `Execução do Cuidado: ${cuidado.titulo}`;
        this.activeModal.componentInstance.templateRefBody = this.modalCuidadoExecucao;
        this.activeModal.componentInstance.templateBotoes = this.modalCuidadoExecucaoBotoes;

        this.activeModal.result.then(
            (data) => this.fechaModalFnExecucao(), 
            (reason) => this.fechaModalFnExecucao() );
    }

    modalFormulario;
    pacienteDocumentoId;
    mostraFormulario(){
        
        if( !this.jaPossuiFormulario ){
            let param = {
                "data": moment().format(this.formatosDeDatas.dataHoraSegundoFormato),
                "formulario": {
                    "id": this.idFormulario
                },
                "paciente": {
                    "id": this.idPacienteCuidado
                }
            }

            this.pacienteDocumentoService.inserir(param).subscribe(
                (novoId) => {

                    let request = {
                        pacienteDocumento: {
                            id: novoId
                        }
                    }
                    this.servicePacienteCuidadoExecucao.putPacienteCuidadoExecucao( this.idCuidadoExecucao,  request ).subscribe(
                        (retorno) => {
                            console.warn('Fomrulario criado apontando para execução');
                            param['id'] = novoId;
                            this.execucaoCuidado['execucaoCuidadoExecucao'] = param;
                            this.jaPossuiFormulario = request.pacienteDocumento;
                        }
                    )

                    this.pacienteDocumentoId = novoId;

                    this.abreModalFormularioExecucao();

                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                    this.toastr.error("Houve um erro ao abrir formulario do paciente");
                }
            );
        }else{
            let idPacienteDocumentoExecucao = this.jaPossuiFormulario['id'];
            this.pacienteDocumentoId = idPacienteDocumentoExecucao;
            this.abreModalFormularioExecucao();
        }

    }

    detalhesAtendimento(execucao){
        alert(execucao);
    }

    direcionaAgenda(execucao){
        if( execucao.objEvento && execucao.objEvento.objEvento ){
            let idPaciente = execucao.objEvento.objEvento.paciente.id
            let unidade = localStorage.getItem('idUnidade');
            let objCuidado = execucao.objEvento.objEvento;
            objCuidado.execucaoCuidado = {
                id: execucao.execucaoCuidadoExecucao.id
            }
            Sessao.setCuidado( objCuidado );
            this.activeModal.dismiss();
            this.router.navigate([`/${Sessao.getModulo()}/agendamento/${unidade}`], {queryParams: {paciente: idPaciente}});
        }else{
            this.toastr.error("Houve um erro ao direcionar para agendamento");
        }
    }

    abreModalFormularioExecucao(){
        this.modalFormulario = this.modalService.open(NgbdModalContent, {size: 'lg'});
        this.modalFormulario.componentInstance.modalHeader  = 'Preencher Formulario da Ação';
        this.modalFormulario.componentInstance.templateRefBody = this.bodyModalFormEvolucao;
        this.modalFormulario.componentInstance.templateBotoes = this.bodyModalFormEvolucaoBotoes;
        this.modalFormulario.componentInstance.custom_lg_modal = true;
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
        this.getRiscosGrau();
        this.buscaCuidadosPaginado(obj, true);
    }

    salvarExecucao(executada = true){
        let executado = moment().format( this.formatosDeDatas.dataHoraSegundoFormato );
        let objPacienteExecucao = {
            "usuario": {
                "guid": this.usuario.guid
            },
        }

        if( executada ){
            objPacienteExecucao["executado"]= executado;
        }else{
            objPacienteExecucao["naoRealizada"]= true;
        }

        this.servicePacienteCuidadoExecucao.putPacienteCuidadoExecucao( this.execucaoCuidado['execucaoCuidadoExecucao']["id"], objPacienteExecucao ).subscribe(
            (status) => {
                this.toastr.success("Execução salva com sucesso");
                this.fechaModalFnExecucao();
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        )

    }

    podeCriarCuidado = true;
    objParamsCuidadoManual = new Object();
    salvarCuidadoManual(){

        this.objParamsCuidadoManual['paciente'] = { id : this.pacienteId }
        this.servicePacienteCuidado.postPacienteCuidado( this.objParamsCuidadoManual ).subscribe(
            (status) => {
                this.toastr.success("Cuidado manual salvo com sucesso");
                this.activeModal.close();
                this.buscaCuidadosPaginado(true);
                this.getRiscosGrau();
            }, (erro) => {

                Servidor.verificaErro(erro, this.toastr);
                if( erro.status == 403 ){
                    this.toastr.error("Usuario sem permissao para criar esse cuidado");
                }
            }
        )

    }

    criarCuidadoManual(){

        this.serviceRisco.get( { id : 18 } ).subscribe(
            (retorno) => {

                if( retorno.dados.length ){

                    this.serviceGrauRisco.get( { id : 127 } ).subscribe(
                        (retorno) => {
                            if( retorno.dados.length ){

                                this.serviceCuidadoRiscoGrau.get( { riscoGrauId: 127, simples: true} ).subscribe(
                                    (retorno) => {
                                        this.cuidadoRiscosSelect = retorno.dados.map(
                                            (cuidadoGrau) => {
                                                return {
                                                    id : cuidadoGrau.id,
                                                    nome : cuidadoGrau.cuidado.descricao
                                                }
                                            }
                                        );
                                    }
                                )

                            }else{
                                this.toastr.error("Grau de Risco Preventivo nao existe");
                                this.podeCriarCuidado = false;
                                return;
                            }
                        }
                    )

                    this.getRisco();

                    this.activeModal = this.modalService.open(NgbdModalContent, {size: 'lg'});
                    this.activeModal.componentInstance.modalHeader  = `Criar cuidado manual`;
                    this.activeModal.componentInstance.templateRefBody = this.modalCriarCuidado;
                    this.activeModal.componentInstance.templateBotoes = this.modalCriarCuidadoBotoes;

                    this.activeModal.result.then(
                        (data) => this.fechaModalFnExecucao(), 
                        (reason) => this.fechaModalFnExecucao() );

                }else{
                    this.toastr.error("Risco Preventivo nao existe");
                    this.podeCriarCuidado = false;
                    return;
                }
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        )

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
    setRiscoGrau(evento){
        if( evento.valor ){
            this.objParamsCuidadoManual['cuidadoRiscoGrau'] = { id : evento.valor };
        }else{
            this.objParamsCuidadoManual['cuidadoRiscoGrau'] = undefined
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

        /* objRequestCuidados['dataInicial'] = evento.inicio;
            objRequestCuidados['dataFinal'] = evento.fim; */

        let inicio = moment( evento.inicio, this.formatosDeDatas.dataHoraSegundoFormato );
        let fim = moment( evento.fim, this.formatosDeDatas.dataHoraSegundoFormato );

        if( inicio.isAfter( fim )){
            this.toastr.warning("Data Inicio maior que a Data Final");
            return;
        }

        this.buscaCuidadosPaginado( evento );

    }

    detalhesRisco = new Object();
    verDetalhesDoRisco(ev, risco){
        console.log(risco);
        ev.stopPropagation();

        let request = {
            pacienteId: risco.paciente.id,
            pacienteRiscoId : risco.id
        }

        this.servicePacienteCuidado.getPerguntasQueLevaramAoRisco( request ).subscribe(
            (dados) => {
                this.detalhesRisco['detalhes'] = dados.map(
                    (indicador) => {
                        let objret = {
                            data      : indicador.pacienteDocumento.data,
                            descricao : indicador.pergunta.descricao,
                            nome      : indicador.pacienteDocumento.usuario.nome,
                            valor     : indicador.valor
                        }

                        console.log(indicador);
                        
                        if( indicador.pergunta.opcoes && indicador.pergunta.opcoes.length ){
                            
                            if(indicador.pergunta.tipo != 'SELECAO'){
                                indicador.pergunta.opcoes.forEach(
                                    (opcao) => {
                                        if( opcao.id == objret.valor ){
                                            objret.valor = opcao.descricao;
                                        }
                                    }
                                )
                            }else{
                                objret.valor = this.validaOpcoesSelecao( indicador );
                            }

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

                    let fnError = (erro) => { console.log("Modal Fechada!"); };
                    this.modalInstancia.result.then((data) => "-", fnError);
                }else{
                    this.toastr.warning("Não há detalhes para esse risco");
                    // this.toastr.sucess('This toast will dismiss in 10 seconds.', null, {toastLife: 10000});
                }

            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        )

    }

    validaOpcoesSelecao(indicador){
        let valor = '';
        let ids = indicador.valor.split('+');
        let aValor = indicador.pergunta.opcoes.forEach(
            (opcao, idx) => {
                let existe = ids.filter(
                    (id) => {
                        return id == opcao.id
                    }
                )
                if( existe.length ){
                    valor += opcao.descricao+' - '
                }
            }
        )

        return valor.substr(0, valor.length-3);
    }

    // inicioRisco
    setInicioRisco(id, evento){
        if( evento ){
            let  inicioRisco:any = moment( evento, this.formatosDeDatas.dataFormato ).format( this.formatosDeDatas.dataHoraSegundoFormato );

            if( inicioRisco != "Invalid date" && inicioRisco != "Invalid Date" ){

                this.servicePacienteCuidado.putPacienteCuidado(id, { inicio: inicioRisco }).subscribe(
                    (retorno) => {
                        this.toastr.success("Data inicial do risco editada com sucesso");
                    },
                    (erro) => {
                        this.toastr.error("Houve um erro ao editar data de inicio do risco");
                    }
                )
            }else{
                this.toastr.warning("Data invalida");
            }
        }
    }

    cuidadosRiscoSelecionado;
    carregouCuidadosRisco = true;
    carregouCuidadosRiscoHistorico = true;
    abrirAbaRisco(idRiscoPaciente, historico = true) {

        let sVar = historico ? 'idRiscoPacienteHistoricoAberta' : 'idAbaPacienteRiscoAberta'
        let sVarCuidados = historico ? 'cuidadosRiscoHistoricoSelecionado' : 'cuidadosRiscoSelecionado'
        let bVarLoad = historico ? 'carregouCuidadosRiscoHistorico' : 'carregouCuidadosRisco'
        this.cuidadosRiscoSelecionado = [];

        if (this[sVar] == idRiscoPaciente) {
            this[sVar] = "";
        } else {
            this[sVarCuidados] = [];
            this[sVar] = idRiscoPaciente;
            this[bVarLoad] = false;

            let request = {
                pacienteRisco:{
                    id: idRiscoPaciente
                },
                apenasVigentes: !historico,
                semPermissao: true
            }

            this.servicePacienteCuidado.postPacienteCuidadoFiltro( request, true ).subscribe(
                (cuidados) => {
                    this[sVarCuidados] = cuidados.dados;
                    this[bVarLoad] = true;
                }
            )
        }
    }

    valorPacienteSelecionado
    getPaciente(paciente) {
        if( paciente ) {
            this.valorPacienteSelecionado = paciente.nome;
            this.pacienteSelecionado = paciente.id;
        }
    }

    objPacientes    
    fnCfgPacienteRemote(term) {

        let objParam;
        if( term.length == 11 ){
            objParam = { cpf : term };

        }else if( (term.length > 11) && !term.match(/\D/g) ){
            objParam = { carteirinha : term };

        }else{
            objParam = { like : term };

        }

        objParam['quantidade'] = 10;
        objParam['pagina'] = 1;

        this.servicePaciente.getPacienteLike(objParam).subscribe(
            (retorno) => {
                this.objPacientes = retorno.dados || retorno;
            }
        );

    }

    objEspecialidades
    fnCfgEspecialidadeRemote(term) {
        return this.serviceEspecialidade.getEspecialidadeLike(term, 0, 10).subscribe(
            (retorno)=>{
                this.objEspecialidades = retorno.dados || retorno;
            }
        );
    }

    especialidadeSelecionada;
    especialidade;  
    getEspecialidade(especialidade) {
        this.especialidade = especialidade.id
        this.especialidadeSelecionada = especialidade.descricao
    }

    modalPacienteSaude;
    novaComposicao = new Object();
    abreModalPaciente(item){

        let cfgGlobal:any = Object.assign(NgbdModalContent.getCfgGlobal(), {size: 'lg'});
        
        this.modalPacienteSaude = this.modalService.open(NgbdModalContent, cfgGlobal );
        this.modalPacienteSaude.componentInstance.modalHeader  = `Editar Paciente`;
        
        this.modalPacienteSaude.componentInstance.templateRefBody = this[`modalEdita`];
        this.modalPacienteSaude.componentInstance.templateBotoes = this[`modalEditaBotoes`];
        
        let context = new Object();
        
        context[`objPaciente`] = Object.assign({}, item);
        this.modalPacienteSaude.componentInstance.contextObject = context;
    }

    editarPaciente(paciente){
        console.log(paciente)
        let novoPaciente = Object.assign({}, paciente);
        novoPaciente['programaSaude'] = { id : paciente.programaSaude.id };
        novoPaciente['paciente'] = { id: paciente['paciente'].id };
        novoPaciente['status'] = paciente['status'];

        if (novoPaciente['status'] == 'ALTA') {
            novoPaciente['alta'] = this.encerramentoAlta;
        }

        this.serviceProgramaSaudePaciente.put( novoPaciente.id, novoPaciente ).subscribe(
            (retorno) => {
                this.toastr.success("Paciente editado");

                (this.modalPacienteSaude) ? this.modalPacienteSaude.dismiss() : null;

                this.serviceProgramaSaudePaciente.get({pacienteId: this.pacienteId}).subscribe(
                    (programa) => { this.programaSaudePaciente = programa.dados }
                );
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        )
    }

    encerramentoAlta;
    getEncerramento(evento) {
        if (evento.valido) {
            this.encerramentoAlta = {id: evento.valor};
        }
    }

    removePaciente(paciente){
        if( !confirm('Deseja remover paciente?') ){
            return;
        }

        this.serviceProgramaSaudePaciente.delete( paciente.id ).subscribe(
            this.toastr.success("Paciente removido com sucesso")
        );
    }

    inicializaTimeline(){
        let proximaData = moment( moment(), this.formatosDeDatas.dataHoraSegundoFormato ).format( this.formatosDeDatas.dataHoraSegundoFormato )
            let fimIntervalo = moment( proximaData, this.formatosDeDatas.dataHoraSegundoFormato ).add( this.intervaloBusca, this.intervaloBuscaTipo ).format(this.formatosDeDatas.dataHoraSegundoFormato);
            let obj = {
                inicio: proximaData,
                fim: fimIntervalo
            };

            
            this.buscaCuidadosPaginado(obj, true);
            this.getRiscosGrau();
    }

    removeCoacher(coacher){

        if(confirm("Deseja deletar esse coacher")){
            this.pacienteCoacherService.deletePacienteCoacher(coacher.id).subscribe(
                (retorno) => {
                    this.buscaPacientesCoacher();
                    this.toastr.success("Coacher removido com sucesso");
                }
            )
        }
    }

    limpaTimeline(){
        this.refreshTimeline = true;
        this.riscos = [];
        this.itensEventosTimeline = [];
        this.objConfigTimeline = [];
    }

    voltar(){
        window.history.go(-1);
    }

}