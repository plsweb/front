import { Component, OnInit, OnDestroy, TemplateRef, Renderer2, ViewContainerRef, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef, Renderer, QueryList } from '@angular/core';

import { PacienteCoacherService, PacienteService, EspecialidadeService, ProfissionalPacienteService, CuidadoService, UnidadeAtendimentoService} from '../../../../services';

import { Servidor } from '../../../../services/servidor';
import { Sessao } from '../../../../services/sessao';

import { ActivatedRoute, Router } from '@angular/router';
import { GlobalState } from '../../../../global.state';
import { Notificacao, Aguardar, TopoPagina, Agenda } from '../../../../theme/components';
import { FormatosData } from '../../../../theme/components/agenda/agenda';
import { NgbdModalContent } from '../../../../theme/components/modal/modal.component';

import { TreeviewItem } from 'ngx-treeview';
import { ToastrService } from 'ngx-toastr';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import * as jQuery from 'jquery';

moment.locale('pt-br');

@Component({
    selector: 'coacher',
    templateUrl: './coacher.html',
    styleUrls: ['./coacher.scss'],
    providers: [ EspecialidadeService ]
})

export class Coacher implements OnInit {
    formatosDeDatas = new FormatosData();
    variaveisDeAmbiente = {};
    filtro = new Object();
    modalAcoes;

    vencidas = new Object();
    realizadas = new Object();
    total = new Object();

    quantidadePadraoPorPagina = 10;

    @ViewChild("Acoes", {read: TemplateRef}) acoesModal: TemplateRef<any>;
    @ViewChild("botoesModalAcoes", {read: TemplateRef}) botoesModalAcoes: TemplateRef<any>;

    constructor( 
        private _state: GlobalState,
        public router: Router,
        private modalService: NgbModal,
        private renderer: Renderer2,
        private toastr: ToastrService,
        private servicePaciente: PacienteService,
        private serviceCuidado: CuidadoService,
        private serviceEspecialidade: EspecialidadeService,
        private pacienteEspecialidadeService: ProfissionalPacienteService,
        private pacienteCoacherService: PacienteCoacherService,
        public service: PacienteCoacherService,
        private route: ActivatedRoute,
    ) { 

        this.variaveisDeAmbiente['unidade'] = JSON.parse( localStorage.getItem("variaveisAmbiente") ).unidadeAtendimentoUsuario;
        this.variaveisDeAmbiente['usuario'] = JSON.parse( localStorage.getItem("usuario") );
        this.variaveisDeAmbiente['tipoPagina'] = ( this.router.url.indexOf('tarefas') >= 0 ) ? 'tarefas' : 'coacher';
        
        this.variaveisDeAmbiente['mostraBotaoAdd'] = ( this.variaveisDeAmbiente['tipoPagina'] != 'tarefas' );

        this.variaveisDeAmbiente['colunasTabela'] = [
            {'titulo': 'PACIENTE', 'chave': 'paciente.nome'},
            {'titulo': 'ESPECIALIDADE', 'chave': 'especialidade.descricao', 'fnValidaOculta': this.validaColunaEspecialidade.bind(this)},
            {'titulo': 'AÇÕES REALIZADAS', 'icone': {'icn': 'check'}, 'chave': 'paciente.acoes', 'fnValidaLabel': this.acoesRealizada.bind(this),
                        'botao': {'butt': 'btn-success btn-with-icon', 'click': this.abreAcoesPaciente.bind(this, 'acoesRealizada')}},
            {'titulo': 'AÇÕES RESTANTES', 'icone': {'icn': 'search'}, 'chave': 'paciente.acoes', 'fnValidaLabel': this.acoesRestante.bind(this),
                        'botao': {'butt': 'btn-danger btn-with-icon', 'click': this.abreAcoesPaciente.bind(this, 'acoesRestante')}},
            {'titulo': 'TOTAL DE AÇÕES', 'icone': {'icn': 'warning'}, 'chave': 'paciente.acoes', 'fnValidaLabel': this.buscaAcoes.bind(this),
                        'botao': {'butt': 'btn-warning btn-with-icon', 'click': this.abreAcoesPaciente.bind(this, 'buscaAcoes')}},
            {'titulo': 'UNIDADE', 'chave': 'unidadeAtendimento.descricao'},
            {'titulo': 'INICIO', 'chave': 'inicio', 'fnValidaLabel': this.validaInicio.bind(this)},
            // {'titulo': 'PRÓXIMA AÇÃO', 'chave': 'paciente.dataUltimaAcao', 'fnValidaLabel': this.validaInicio.bind(this)},
            // {'titulo': 'RISCOS', 'chave': 'riscos', 
            //     'fnValidaLabel': ()=>{
            //         return 'Hipertensão - Grau Alto';
            //     }
            // },
        ];
    }
    
    ngOnInit() {
        this._state.notifyDataChanged('menu.isCollapsed', true);
        
        this.variaveisDeAmbiente['unidade'] = JSON.parse( localStorage.getItem("variaveisAmbiente") ).unidadeAtendimentoUsuario;
        this.variaveisDeAmbiente['usuario'] = JSON.parse( localStorage.getItem("usuario") );

        this.variaveisDeAmbiente['tabela'] = {};
        this.variaveisDeAmbiente['pacientes'] = [];
        this.variaveisDeAmbiente['pacientesCoacher'] = [];

        
        if( this.variaveisDeAmbiente['mostraBotaoAdd'] ){
            this.variaveisDeAmbiente['unidade'].forEach(unidade => {
                this.iniciaTabela(unidade.id);
            });

            this.iniciaTabela();
        }else{
            this.variaveisDeAmbiente['unidade'].forEach(unidade => {
                this.getPacienteCoacher(unidade.id);
            });

            this.iniciaTabela();
        }
    }

    dataInicio;
    dataInicioInstancia;
    getDataInicioInstancia(instancia) {
        this.dataInicioInstancia = instancia;
    }

    getData(param, evento) {
        if (!param) 
            return;
        this.variaveisDeAmbiente[param] = evento[0].format('DD/MM/YYYY');
    }

    respostas = {};

    getValor(id) {
        let resposta = this.respostas[`${id}`];
        return resposta ? resposta.valor : '';
    }

    getResposta(ev, nome) {
        this.respostas[`${nome}`] = {valor: (ev.valor || ev.valor == "" ? ev.valor : ev)};
        this.respostas = Object.assign({}, this.respostas);
    }

    fnCfgRemote(service, metodo = 'get', term) {

        let objParam = Object.assign(this.getAutoCompleteParams(service, term), {
        	quantidade: 10,
        	pagina: 1
        });

        this[`${service}`][`${metodo}`](objParam).subscribe(
            (retorno) => {
                this.variaveisDeAmbiente[service] = retorno.dados || retorno;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        );
    }

    getAutoCompleteParams(service, term) {
    	let objParam;

    	switch(service) {
            case 'serviceCuidado':
                objParam = {};
		        break;
            default:
                objParam = {};
                break;
        }

        return objParam;
    }

    iniciaTabela(unidade = undefined, objParams = {}) {
        if( objParams['filtro'] ){
            this.filtrarCoacher();
            return;
        } 

        let param = {
            usuarioGuid : this.variaveisDeAmbiente['usuario']['guid'],
            ativos: true,
            unidadeAtendimentoId: objParams['unidadeAtendimento'] || unidade,
            quantidade : this.quantidadePadraoPorPagina,
            pagina : objParams['paginaAtual'] || 1,
            like : objParams['like'] 
        }

        if( !unidade ){
            delete param['unidadeAtendimentoId']
            param['semUnidadeAtendimento'] = true;
        }

        let metodo;
        let service;

        if( this.variaveisDeAmbiente['mostraBotaoAdd'] ){
            metodo = 'getPacienteCoacher';
            service = this.service;
        }else{
            metodo = 'get';
            service = this.pacienteEspecialidadeService;
        }

    	service[metodo](param).subscribe(
            (resposta) => {
                resposta.dados.forEach(pacientes => {
                    if (param.pagina == 1) {
                        this.variaveisDeAmbiente['pacientes'].push(pacientes.paciente);
                    } else {
                        this.variaveisDeAmbiente['pacientes'].concat([],pacientes.paciente);
                    }
                });

                this.variaveisDeAmbiente['pacientesCoacher'] =  resposta.dados || resposta;
                if( unidade ){
                    this.pacienteCoacher[param.unidadeAtendimentoId] = resposta;
                }else{
                    this.pacienteSemUnidade = resposta;
                }

                this.variaveisDeAmbiente['tabela'] = {
                    total: resposta.qtdItensTotal
                };
        
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
                this.toastr.error("Houve um erro ao buscar Pacientes");
            }
        );
    }

    pesquisarPaciente(unidade, texto){
        this.iniciaTabela(unidade ? unidade.id : undefined, { like: texto });
    }

    pacienteCoacher = new Object();
    pacienteSemUnidade = [];
    getPacienteCoacher(unidade, evento:any = {}) {
        let param = {
            usuarioGuid : this.variaveisDeAmbiente['usuario']['guid'],
            unidadeAtendimentoId: unidade,
            pagina : evento.paginaAtual || 1,
            ativos: true,
            quantidade : this.quantidadePadraoPorPagina,
        }

        if( !unidade ){
            delete param['unidadeAtendimentoId']
            param['semUnidadeAtendimento'] = true;
        }

        this.pacienteEspecialidadeService.get(param)
            .subscribe((paciente) => {
                if( unidade ){
                    this.pacienteCoacher[unidade] = paciente;
                }else{
                    this.pacienteSemUnidade = paciente;
                }
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
                this.toastr.error("Houve um erro ao buscar Pacientes");
            });
    }

    limparFiltros(bAtualizaDados = true) {
        this.variaveisDeAmbiente['cuidado'] = null;
        this.dataInicio = null;

        if (this.dataInicioInstancia && this.dataInicioInstancia.limpaCampo){
            this.dataInicioInstancia.limpaCampo();
        }
    }

    filtrarCoacher(){
        let params = new Object();
            params['paginaAtual'] = 1;
            params['itensPorPagina'] = this.quantidadePadraoPorPagina;
            // params['status'] = 'AGUARDANDO';

            // ( this.variaveisDeAmbiente['prestador'] && this.variaveisDeAmbiente['prestador']['valor'] ) ? params['idPrestador'] =  this.variaveisDeAmbiente['prestador']['valor']['id'] : null;
            
            // ( this.variaveisDeAmbiente['paciente'] && this.variaveisDeAmbiente['paciente']['valor'] ) ? params['idPaciente'] = this.variaveisDeAmbiente['paciente']['valor']['id'] : null;

            // ( this.variaveisDeAmbiente['dataInicio'] ) ? params['inicio'] = this.variaveisDeAmbiente['dataInicio'] : null;
            // ( this.variaveisDeAmbiente['dataFim'] ) ? params['fim'] = this.variaveisDeAmbiente['dataFim'] : null;

            // if ( this.variaveisDeAmbiente['status'] && this.variaveisDeAmbiente['status'] != '0' ) {
            //     params['status'] = this.variaveisDeAmbiente['status'];
            // }

            // ( this.variaveisDeAmbiente['especialidade'] && this.variaveisDeAmbiente['especialidade'] != '0' ) ? params['idEspecialidade'] = this.variaveisDeAmbiente['especialidade'] : null;
            
            // ( this.variaveisDeAmbiente['grupo'] && this.variaveisDeAmbiente['grupo']['valor'] ) ? params['idGrupoTema'] = this.variaveisDeAmbiente['grupo']['valor']['id'] : null;

            // this.filtro = params;
            // console.log(this.variaveisDeAmbiente['ordenacao']);
            
        this.iniciaTabela( params );
    }

    pacienteIdSelecionado;
    abrePacienteCoacher(paciente){
        // if( paciente.paciente.id == this.pacienteIdSelecionado ){
        //     this.pacienteIdSelecionado = undefined
        // }
        console.log(paciente.paciente.id);

        this.pacienteIdSelecionado = paciente.paciente.id;
        this.router.navigate([`/${Sessao.getModulo()}/planocuidado/paciente/${this.pacienteIdSelecionado}`]);

    }

    verDetalheAcoes(evento, tipo, paciente){
        evento.preventDefault();
        evento.stopPropagation();

        console.log("TIPO:  " + tipo);
        console.log("paciente>  ");
        console.log(paciente);
    }

    abreAcoesPaciente(opcao, paciente){
        let modalTitulo: string;

        switch (opcao) {
            case 'acoesRealizada':
                modalTitulo = 'AÇÕES REALIZADAS'
                break;
            case 'acoesRestante':
            modalTitulo = 'AÇÕES RESTANTES'
                break;
            case 'buscaAcoes':
            modalTitulo = 'TOTAL DE AÇÕES'
                break;
        }

        this.modalAcoes = this.modalService.open(NgbdModalContent, {size: 'lg'});
        this.modalAcoes.componentInstance.modalHeader = opcao;

        this.modalAcoes.componentInstance.templateRefBody = this.acoesModal;
        this.modalAcoes.componentInstance.templateBotoes = this.botoesModalAcoes;

        let fnSuccess = (agendamentoGrupoResposta) => { console.log("Modal Fechada!"); };
        let fnError = (erro) => { console.log("Modal Fechada!"); };
        this.modalAcoes.result.then((data) => fnSuccess, fnError);
    }

    adicionarTratamento(){
        this.router.navigate([`/${Sessao.getModulo()}/coacher/novo`]);
    }
    
    validaInicio(item){
        return 'Desde ' + item['inicio'];
    }

    buscaAcoes(){
        // variaveisDeAmbiente
        return 50;
    }

    acoesRealizada(){

        return this.buscaAcoes() - 38;
    }

    acoesRestante(){
        
        return this.buscaAcoes() - this.acoesRealizada();
    }

    validaColunaEspecialidade(){
        return (this.variaveisDeAmbiente['mostraBotaoAdd']) ? false : true;
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
            (retorno) => {console.log(retorno)
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

    unidadeId;
    pacienteSelecionado;
    addCoacher() {
        let request = {
            "paciente": {
                "id": this.pacienteSelecionado
            },
            "usuario": {
                "guid": this.variaveisDeAmbiente['usuario']['guid']
            },
            "unidadeAtendimento": {
                "id": this.unidadeId
            }
        };

        if( !this.variaveisDeAmbiente['mostraBotaoAdd'] ){
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
                    this.iniciaTabela();
                },
                (erro) => {
                    this.toastr.error("Houve um erro ao carregar profissionais do paciente");
                }
            )

        }else{

            this.pacienteCoacherService.postPacienteCoacher(request).subscribe((resposta) => {
                this.toastr.success("Coacher adicionado com sucesso");
                this.iniciaTabela();
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            });
        }
    }
}