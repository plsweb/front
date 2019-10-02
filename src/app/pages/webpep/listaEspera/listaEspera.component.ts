import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef, Renderer, TemplateRef, QueryList, ViewContainerRef } from '@angular/core';
import { PrestadorAtendimentoService, EspecialidadeService, PacienteService, TemaGrupoService, AtendimentoEsperaService } from '../../../services';

import { Servidor } from '../../../services/servidor';
import { Sessao } from '../../../services/sessao';

import { ActivatedRoute, Router } from '@angular/router';
import { GlobalState } from '../../../global.state';
import { Notificacao, Aguardar, TopoPagina, FormatosData } from '../../../theme/components';
import { NgbdModalContent } from '../../../theme/components/modal/modal.component';


import { ToastrService } from 'ngx-toastr';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { THIS_EXPR } from '@angular/compiler/src/output/output_ast';

moment.locale('pt-br');

@Component({
	selector: 'listaEspera',
	templateUrl: './listaEspera.html',
	styleUrls: ['./listaEspera.scss'],
	providers: [PrestadorAtendimentoService, PacienteService, EspecialidadeService, TemaGrupoService, AtendimentoEsperaService]
})
export class ListaEspera implements OnInit {
    static ultimaAtualizacao: Date;
    
    variaveisDeAmbiente = {};

    constructor(
        private toastr: ToastrService, 
        private vcr: ViewContainerRef,
        private renderer:Renderer,
        private router: Router, 
        private modalService: NgbModal, 
        private cdr: ChangeDetectorRef, 
        private _state: GlobalState, 
        private route: ActivatedRoute,

        private servicePrestador: PrestadorAtendimentoService,
        private servicePaciente: PacienteService,
        private serviceEspecialidade: EspecialidadeService,
        private serviceGrupo: TemaGrupoService,
        private serviceAtendimentoEspera: AtendimentoEsperaService
    ) {

        this.variaveisDeAmbiente['colunasTabela'] = [
            {'titulo': '', 'chave': 'prioridade', 'ocultaLabel' : true, 'classe': 'status-tabela'},
            //{'titulo': 'ID', 'chave': 'id'},
            //{'titulo': '', 'icone': {'icn': 'delete', 'click': this.deletaPaciente.bind(this), 'classe': 'text-danger'} },
            {'titulo': '', 'icone': {'icn': 'check', 'legenda': 'Agendar', 'click': this.agendarPacienteDaLista.bind(this)} },
            {'titulo': '', 'icone': {'icn': 'edit', 'legenda': 'Editar', 'click': this.editarStatusPaciente.bind(this)} },
            {'titulo': 'PACIENTE', 'chave': 'paciente.nome' },
            {'titulo': 'INCLUSÃO', 'chave': 'inclusao'},
            {'titulo': 'STATUS', 'chave': 'status'},
            {'titulo': 'ESPECIALIDADE', 'chave': 'especialidade.descricao'},
            {'titulo': 'GRUPO', 'chave': 'grupoTema.descricao'},
            {'titulo': 'PRESTADOR', 'chave': 'prestador.nome'},
            //{'titulo': 'OBSERVAÇÃO', 'chave': 'observacao'},
        ];
    }

    ngOnInit() {
    	this._state.notifyDataChanged('menu.isCollapsed', true);

        this.serviceEspecialidade.get().subscribe( especialidades => this.variaveisDeAmbiente['especialidades'] = (especialidades.dados || especialidades)  )
        
        if( sessionStorage.getItem("agendaEspera") ){
            let esperaJson = JSON.parse(sessionStorage.getItem("agendaEspera"));
            
            if( esperaJson['pacienteAgendado'] ){
                this.toastr.success(`Paciente ${esperaJson.paciente.nome} agendado com sucesso`);
                sessionStorage.removeItem("agendaEspera");
            }
        }

        this.variaveisDeAmbiente['formatosDeDatas'] = new FormatosData();

        this.serviceAtendimentoEspera.getPrioridades().subscribe( prioridades => this.variaveisDeAmbiente['prioridades'] = (prioridades.dados || prioridades) );
        this.serviceAtendimentoEspera.atendimentoEsperaStatus().subscribe(
            (status) => {
                this.variaveisDeAmbiente['statusEspera'] = (status.dados || status);
            }
        );
        this.serviceAtendimentoEspera.atendimentoEsperaSaida().subscribe(
            (statusSaida) => {
                this.variaveisDeAmbiente['statusSaida'] = (statusSaida.dados || statusSaida);
            }
        );

        this.variaveisDeAmbiente['tabela'] = {};
        this.variaveisDeAmbiente['listaEspera'] = [];
        this.variaveisDeAmbiente['ordenacao'] = {
            paginaAtual: 1,
            itensPorPagina: 30
        };
        this.respostas['status'] = 'AGUARDANDO';

        // this.iniciaTabela();
    }

    dataInicio;
    dataFim;
    dataInicioInstancia;
    dataFimInstancia;
    filtro = new Object();
    getDataInicioInstancia(instancia) {
        this.dataInicioInstancia = instancia;
    }

    getDataFimInstancia(instancia) {
        this.dataFimInstancia = instancia;
    }

    getData(param, evento) {
        if (!param) 
            return;
        this.respostas[param] = evento[0].format('DD/MM/YYYY');
    }

    //  #############################################
    //               Ações da tela
    //  #############################################


    //  #############################################
    //               Filtros
    //  #############################################
    respostas = {};

    getValor(id) {
        let resposta = this.respostas[`${id}`];
        return resposta ? resposta.valor : '';
    }

    getResposta(ev, nome) {
        if (nome == "paciente") {
            this.respostas = Object.assign({}, this.respostas);
        }

        this.respostas[`${nome}`] = {valor: (ev.valor || ev.valor == "" ? ev.valor : ev)};
        this.respostas = Object.assign({}, this.respostas);
    }

    setResposta(ev, nome) {
        this.respostas[`${nome}`] = undefined;
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
            case 'servicePaciente':

		        if ( ( term.length == 11 ) && !term.match(/\D/g) ) {
		            objParam = { cpf : term };
		        } else if ( (term.length > 11) && !term.match(/\D/g) ) {
		            objParam = { carteirinha : term };
		        }else{
		            objParam = { like : term };
		        }
		        break;

            case 'servicePrestador':
                objParam = { like : term };
                break;

            case 'serviceGrupo':
                objParam = { like : term };
                break;

            default:
                objParam = {};
                break;
        }

        return objParam;
    }

    //  #############################################
    //               Tabela
    //  #############################################
    listaEspera = [];

    iniciaTabela(objParams = {}) {
        this.variaveisDeAmbiente['ordenacao'] = objParams;
        let paginacao = { 
            paginaAtual : objParams['paginaAtual'],
            itensPorPagina: objParams['itensPorPagina']
        };

        if( objParams['filtro'] ){
            this.filtrarListaEspera();
            return;
        } 

        if (this.filtro['status'] == undefined) {
            this.filtro['status'] = this.respostas && this.respostas['status'] && this.respostas['status'] != '0' ? this.respostas['status'] : 'AGUARDANDO';
        }

    	this.serviceAtendimentoEspera.atendimentoEsperaPaginado(paginacao['paginaAtual'], paginacao['itensPorPagina'], this.filtro).subscribe(
            (resposta) => {
                this.variaveisDeAmbiente['listaEspera'] = (paginacao['paginaAtual'] == 1) ? resposta.dados : this.variaveisDeAmbiente['listaEspera'].concat([],resposta.dados);

                this.variaveisDeAmbiente['tabela'] = {
                    total: resposta.qtdItensTotal
                };

            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );
    }

    limparFiltros(bAtualizaDados = true) {
        this.dataInicio = null;
        this.dataFim = null;
        /*this.respostas['status'] = 'AGUARDANDO';
        this.respostas['paciente'] = null;
        this.respostas['prestador'] = null;
        this.respostas['especialidade'] = null;
        */
        this.respostas = {'status': 'AGUARDANDO'};

        if (this.dataInicioInstancia && this.dataInicioInstancia.limpaCampo){
            this.dataInicioInstancia.limpaCampo();
            this.dataFimInstancia.limpaCampo();
        }
    }


    //  #############################################
    //               Editar Lista espera
    //  #############################################
    @ViewChild("bodyModalEditarListaEspera", {read: TemplateRef}) bodyModalEditarListaEspera: QueryList<TemplateRef<any>>;
    @ViewChild("templateBotoesModalEditarListaEspera", {read: TemplateRef}) templateBotoesModalEditarListaEspera: QueryList<TemplateRef<any>>;

    @ViewChild("bodyModalSalvarListaEspera", {read: TemplateRef}) bodyModalSalvarListaEspera: QueryList<TemplateRef<any>>;
    @ViewChild("templateBotoesModalSalvarListaEspera", {read: TemplateRef}) templateBotoesModalSalvarListaEspera: QueryList<TemplateRef<any>>;

    abreModal(espera = undefined) {
        this.variaveisDeAmbiente['esperaAtual'] = espera;
        let tipo = ( espera ) ? 'Editar' : 'Salvar';

        if( tipo == "Salvar" ){
            this.respostas = {};
        }
        
        this.variaveisDeAmbiente['modalInstancia'] = this.modalService.open(NgbdModalContent, {size: 'lg'});
        this.variaveisDeAmbiente['modalInstancia'].componentInstance.modalHeader = `${tipo} Lista Espera`;

        this.variaveisDeAmbiente['modalInstancia'].componentInstance.templateRefBody = this[`bodyModal${tipo}ListaEspera`];
        this.variaveisDeAmbiente['modalInstancia'].componentInstance.templateBotoes = this[`templateBotoesModal${tipo}ListaEspera`]
        
        this.variaveisDeAmbiente['modalInstancia'].result.then((data) => {
            this.respostas = {};
        }, ()=>{ 
            this.respostas = {};
         });
    }

    atualizarEspera(tipo, obj = undefined) {
        
        if( obj ){
            
            let objParam = this.validaListaEspera(this.variaveisDeAmbiente['esperaAtual'], tipo);
            let retorno = this.podeSalvar(objParam);
            if( retorno['erro'] ){
                this.toastr.error(retorno['mensagem']);
                return;
            }
            this.serviceAtendimentoEspera.salvar(objParam).subscribe(
                (retorno) => {
                    this.toastr.success("Lista de Espera atualizada com sucesso");
                    this.variaveisDeAmbiente['modalInstancia'].close();
                    this.variaveisDeAmbiente['esperaAtual'] = undefined;
                },
                erro => {
                    Servidor.verificaErro(erro, this.toastr);
                    this.toastr.error("Erro ao atualizar lista de espera");
                }
            )

        }else{

            let obj = this.validaListaEspera(this.respostas, tipo);

            let retorno = this.podeSalvar(obj);
            if( retorno['erro'] ){
                this.toastr.error(retorno['mensagem']);
                return;
            }

            obj['status'] = 'AGUARDANDO';
            this.serviceAtendimentoEspera.salvar(obj).subscribe(
                (retorno) => {
                    this.toastr.success("Paciente adicionado na Lista de Espera");
                    this.iniciaTabela( { paginaAtual : 1, itensPorPagina : 30 } );
                    this.variaveisDeAmbiente['modalInstancia'].close();
                    this.respostas = {};
                }, 
                erro => {
                    this.toastr.error("Erro ao salvar paciente na lista de espera");
                }
            )
        }
    }

    podeSalvar(obj){

        let retorno = {};

        if( !obj.paciente ){
            retorno['erro'] = true;
            retorno['mensagem'] = 'Informe um paciente';
        }

        if( !(obj.especialidade || obj.prestador || obj.grupo)){
            retorno['erro'] = true;
            retorno['mensagem'] = 'Informe uma Especialidade, ou Grupo ou Prestador';
        }

        if( !obj.prioridade){
            retorno['erro'] = true;
            retorno['mensagem'] = 'É obrigatório informar uma prioridade';
        }else if( typeof obj.prioridade === 'object' ) {
            retorno['erro'] = true;
            retorno['mensagem'] = 'É obrigatório informar uma prioridade';
        }

        return retorno;

    }

    validaListaEspera(obj, tipo){

        let novoobj = {};
        if( tipo == "Salvar" ){

            novoobj = {
                "prioridade":obj['prioridade']['valor'],
                "observacao":obj['observacao'] && obj['observacao']['valor'] ? obj['observacao']['valor'] : '',
                "excluido":false
            };

            if(( obj['paciente'] && obj['paciente']['valor'] && obj['paciente']['valor']['id'])){
                novoobj["paciente"] = {
                    "id":obj['paciente']['valor']['id']
                }
            }

            if( obj['observacao'] && obj['observacao']['valor'] ){
                if( typeof(obj['observacao']['valor'] ) == 'object' ){
                    delete novoobj['observacao'];
                }
            }

            ( obj['especialidade'] && obj['especialidade'] != '0') ? novoobj['especialidade'] = { id : obj['especialidade'] } : null;

            if ( obj && obj['prestador'] && obj['prestador']['valor'] && obj['prestador']['valor']['codigo'] ) {
                novoobj["prestador"] = {
                    "codigo": obj['prestador']['valor']['codigo']
                };
            }

            if ( obj && obj['grupo'] && obj['grupo']['valor'] && obj['grupo']['valor']['id'] ) {
                novoobj["grupoTema"] = {
                    "id": obj['grupo']['valor']['id']
                };
            }

        }

        return novoobj;
    }

    validaCamposLista(obj, tipo){
        if( tipo == "Salvar" ){
            
            // if( !(obj['especialidade'] && obj['especialidade']['valor']) ){
            //     this.toastr.error("Preencha especialidade");
            // }

            // obj = {
            //     "especialidade":{"id":obj['especialidade']['valor']['id']},
            //     "prestador":{"codigo":obj['prestador']['valor']['codigo']},
            //     "paciente":{"id":obj['paciente']['valor']['id']},
            //     "prioridade":obj['prioridade']['valor'],
            //     "observacao":obj['observacao']['valor'],
            //     "excluido":false
            // }
        }else{

        }

        return true;
    }

    filtrarListaEspera(){
        this.filtro['status'] = '';

        let params = new Object();
        params['status'] = '';
        params['itensPorPagina'] = 30;
        params['paginaAtual'] = this.variaveisDeAmbiente['ordenacao'].paginaAtual;

        ( this.respostas['prestador'] && this.respostas['prestador']['valor'] ) ? params['idPrestador'] =  this.respostas['prestador']['valor']['id'] : null;
        
        ( this.respostas['paciente'] && this.respostas['paciente']['valor'] ) ? params['idPaciente'] = this.respostas['paciente']['valor']['id'] : null;

        ( this.respostas['dataInicio'] ) ? params['inicio'] = this.respostas['dataInicio'] : null;
        ( this.respostas['dataFim'] ) ? params['fim'] = this.respostas['dataFim'] : null;

        if ( this.respostas['status'] && this.respostas['status'] != '0' ) {
            params['status'] = this.respostas['status'];
        }

        ( this.respostas['especialidade'] && this.respostas['especialidade'] != '0' ) ? params['idEspecialidade'] = this.respostas['especialidade'] : null;
        
        ( this.respostas['grupo'] && this.respostas['grupo']['valor'] ) ? params['idGrupoTema'] = this.respostas['grupo']['valor']['id'] : null;

        this.filtro = params;
            
        console.log(params)
        this.iniciaTabela( params );
    }

    deletaPaciente(ev, paciente){
        ev.stopPropagation();
        
        if( confirm(`Deseja remover ${paciente.paciente.nome} da lista de espera?`) ){

            let saida = moment( new Date() ).format( this.variaveisDeAmbiente['formatosDeDatas'].dataHoraSegundoFormato )

            this.serviceAtendimentoEspera.atualizar(paciente.id, { saida : saida }).subscribe(
                (retorno) => {
                    this.toastr.success("Paciente removido da Lista de Espera");
                },
                err => {
                    this.toastr.error("Erro ao remover paciente");   
                }
            )

        }

    }

    agendarPacienteDaLista(ev, paciente){
        ev.stopPropagation();

        let string = JSON.stringify(paciente);
        sessionStorage.setItem('agendaEspera' , string);
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

        this.router.navigate([`/${Sessao.getModulo()}/agendamento`]);
    }

    
    
    @ViewChild("bodyModalStatusListaEspera", {read: TemplateRef}) bodyModalStatusListaEspera: QueryList<TemplateRef<any>>;
    @ViewChild("templateBotoesModalStatusListaEspera", {read: TemplateRef}) templateBotoesModalStatusListaEspera: QueryList<TemplateRef<any>>;

    editarStatusPaciente(ev, paciente){
        ev.stopPropagation();

        this.variaveisDeAmbiente['esperaMudaStatus'] = paciente;

        this.variaveisDeAmbiente['modalInstancia'] = this.modalService.open(NgbdModalContent, {size: 'lg'});
        this.variaveisDeAmbiente['modalInstancia'].componentInstance.modalHeader = `Editar Espera do paciente ${paciente.paciente.nome}`;

        this.variaveisDeAmbiente['modalInstancia'].componentInstance.templateRefBody = this[`bodyModalStatusListaEspera`];
        this.variaveisDeAmbiente['modalInstancia'].componentInstance.templateBotoes = this[`templateBotoesModalStatusListaEspera`];

        let fnCLose = (agendamentoGrupoResposta) => { 
            this.iniciaTabela( { paginaAtual : 1, itensPorPagina : 30 } );
        };
        this.variaveisDeAmbiente['modalInstancia'].result.then((data) => fnCLose, fnCLose);

        
    }

    mudaStatusListaEspera(){

        if( !this.variaveisDeAmbiente['esperaMudaStatus']['novoStatus'] ){
            this.toastr.warning("Selecione um status");
            return;
        }

        if( !this.variaveisDeAmbiente['esperaMudaStatus']['prioridade'] ){
            this.toastr.warning("Selecione uma prioridade");
            return;
        }

        let param = {
            prioridade : this.variaveisDeAmbiente['esperaMudaStatus']['prioridade'],
            status : this.variaveisDeAmbiente['esperaMudaStatus']['novoStatus'],
            observacao : this.variaveisDeAmbiente['esperaMudaStatus']['observacao'],
            saidaTipo: this.variaveisDeAmbiente['esperaMudaStatus']['statusSaida'] || 'NORMAL',
            usuario: {
                guid: Sessao.getUsuario()['guid']
            }
        }

        if( this.variaveisDeAmbiente['esperaMudaStatus']['novoStatus'] == 'FINALIZADO' || this.variaveisDeAmbiente['esperaMudaStatus']['novoStatus'] == 'TERCEIROCONTATO' ){
            param['saida'] = moment().format(this.variaveisDeAmbiente['formatosDeDatas'].dataHoraSegundoFormato);
        }
        this.serviceAtendimentoEspera.atualizar( this.variaveisDeAmbiente['esperaMudaStatus']['id'], param ).subscribe(
            (retorno)=>{
                let desc = '';
                this.variaveisDeAmbiente['statusEspera'].forEach(
                    (status) => {
                        if( status.codigo == param.status ){
                            desc = status.nome;
                        }
                    },
                    (erro) => {
                        Servidor.verificaErro(erro, this.toastr);
                    }
                )

                let params = new Object();
                    params['paginaAtual'] = 1;
                    params['itensPorPagina'] = 30;
                    
                this.iniciaTabela( params );
                
                this.variaveisDeAmbiente['modalInstancia'].close();                
                this.toastr.success(`Status do paciente ${this.variaveisDeAmbiente['esperaMudaStatus']['paciente']['nome']} foi alterado para ${desc}`);
                
            }
        )

    }


}