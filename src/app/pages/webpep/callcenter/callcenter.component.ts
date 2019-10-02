import { Component, OnInit, OnDestroy, TemplateRef, Renderer2, ViewContainerRef, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef, Renderer, QueryList } from '@angular/core';
import { EspecialidadeService, UsuarioService, PacienteService, AgendamentoGrupoService, AtendimentoEsperaService, AtendimentoService, LocalAtendimentoService, CallTipoContatoService, CallAtividadeService, CallContatoService, CallContatoStatusService} from '../../../services';
import { Servidor } from '../../../services/servidor';
import { Sessao } from '../../../services/sessao';

import { ActivatedRoute, Router } from '@angular/router';
import { GlobalState } from '../../../global.state';
import { Notificacao, Aguardar, TopoPagina, Agenda } from '../../../theme/components';
import { FormatosData } from '../../../theme/components/agenda/agenda';
import { NgbdModalContent, Moldura } from '../../../theme/components/';
import { TreeviewItem } from 'ngx-treeview';

import { ToastrService } from 'ngx-toastr';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import * as jQuery from 'jquery';

moment.locale('pt-br');

@Component({
    selector: 'callcenter',
    templateUrl: './callcenter.html',
    styleUrls: ['./callcenter.scss'],
    providers: [Agenda, Moldura, EspecialidadeService, UsuarioService, PacienteService, AgendamentoGrupoService, AtendimentoEsperaService, AtendimentoService, LocalAtendimentoService, CallAtividadeService, CallContatoService, CallContatoStatusService]
})

export class CallCenter implements OnInit, OnDestroy {
    buscando;
    refreshListInterval;

    contatoStatus;
    atendimentoEsperaPrioridades;

    usuario;

    qtdItensTotal = 0;
    paginaAtual = 1;
    itensPorPagina = 15;

    filtro = new Object();

    formatosDeDatas;
    lista = [];
    listaModal = [];
    atual = "listaatividades";

    atendimentoSelecionado;
    modalAtendimentoInstancia;

    novaObservacao;

    contatos;

    novoTipoContato;
    tiposContato = [];
    statusAtividades = [
        {id: 'PENDENTE', descricao: 'PENDENTE'},
        {id: 'EMATENDIMENTO', descricao: 'EM ATENDIMENTO'},
        {id: 'CONCLUIDO', descricao: 'CONCLUIDO'},
        {id: 'PAUSADO', descricao: 'PAUSADO'},
        {id: 'DESMARCADO', descricao: 'DESMARCADO'}
    ]
    paginaAtualTpC = 1;
    itensPorPaginaTpC = 15
    qtdItensTotalTpC;

    possuiAgendamento = false;
    dataAgendamento;
    horaAgendamento;

    telefone;

    colunasTabela;
    ordenacao;
    filtroCallAtividade = {};
    objParamAddNovaLigacao = new Object();

    @ViewChild("bodyModalAtendimento", {read: TemplateRef}) bodyModalAtendimento: QueryList<TemplateRef<any>>;
    @ViewChild("templateBotoesModalAtendimento", {read: TemplateRef}) templateBotoesModalAtendimento: QueryList<TemplateRef<any>>;

    @ViewChild("bodyModalNovaLigacao", {read: TemplateRef}) bodyModalNovaLigacao: QueryList<TemplateRef<any>>;
    @ViewChild("templateBotoesModalNovaLigacao", {read: TemplateRef}) templateBotoesModalNovaLigacao: QueryList<TemplateRef<any>>;

    @ViewChild('row') row: ElementRef;

    inclusaoFim;
    inclusaoInicio;

    constructor( 
        private _state: GlobalState, 
        public router: Router,
        private modalService: NgbModal,
        private serviceEspecialidade: EspecialidadeService,
        private usuarioService: UsuarioService,
        private tipoContatoService: CallTipoContatoService,
        private serviceGrupo: AgendamentoGrupoService,
        public serviceAtendimentoEspera: AtendimentoEsperaService,
        public serviceAtendimento: AtendimentoService,
        private localAtendimentoService: LocalAtendimentoService,
        private renderer: Renderer2,
        private serviceCallAtividade: CallAtividadeService,
        private serviceCallContato: CallContatoService,
        private serviceCallContatoStatus: CallContatoStatusService,
        private pacienteService: PacienteService,
        private toastr: ToastrService, 
        private vcr: ViewContainerRef,
        public teste: Moldura,
    ) { 
        this.ordenacao = {
            tipo: undefined,
            ordem: 'status desc inclusao asc prioridade desc',
            paginaAtual: 1,
            itensPorPagina: 30
        };
        this.colunasTabela = [
            {'titulo': '', 'chave': 'status', 'ocultaLabel' : true, 'ordem': 'status', 'ordemFiltro': 'status', 'classe': 'status-tabela', 'filtroClasse': 'ENUM', 'filtroTipo': 'IN', 'enumNome': 'CallStatus'},

            {'titulo': '', 'icone': {'icn': 'call', 'click': this.abreModalAtendimento.bind(this), 'classe': 'text-success', 'seCondicao': this.fnMostraIcone} },

            {'titulo': 'PACIENTE', 'chave': 'paciente.nome', 'ordem': 'paciente.nome', 'ordemFiltro': 'paciente.nome',  'classe': '', 'filtroClasse': 'STRING', 'filtroTipo': 'LIKE', 'fnValidaLabel' : this.fnValidaPaciente.bind(this)},

            {'titulo': 'DATA', 'chave': 'inclusao', 'ordem': 'inclusao', 'ordemFiltro': 'inclusaoInicio', 'classe': '', 'filtroClasse': 'DATA',   'filtroTipo': 'MAIORIGUAL'},
            {'titulo': 'DATA', 'chave': 'inclusao', 'ordem': 'inclusao', 'ordemFiltro': 'inclusaoFim', 'classe': '', 'filtroClasse': 'DATA', 'filtroTipo': 'MENORIGUAL', oculto: true},

            {'titulo': 'AGENDADO', 'chave': 'agendado', 'ordem': 'agendado', 'ordemFiltro': 'agendadoInicio', 'classe': '', 'filtroClasse': 'DATA', 'filtroTipo': 'MAIORIGUAL'},
            {'titulo': 'AGENDADO', 'chave': 'agendado', 'ordem': 'agendado', 'ordemFiltro': 'agendadoFim', 'classe': '', 'filtroClasse': 'DATA', 'filtroTipo': 'MENORIGUAL', oculto: true},

            {'titulo': 'TIPO', 'chave': 'tipo.id', 'ordem': 'tipo.id', 'ordemFiltro': 'tipo.id', 'filtroClasse': 'INTEGER', 'filtroTipo': 'IN', oculto: true},
            {'titulo': 'TIPO', 'chave': 'tipo.descricao', 'ordem': 'tipo.descricao', 'ordemFiltro': 'tipo.descricao', 'filtroClasse': 'STRING', 'filtroTipo': 'IN'},

            {'titulo': 'protocolo', 'ordemFiltro': 'protocolo', 'filtroTipo': 'STRING', 'chave': 'tipo.descricao', oculto: true},

        ];

        let filtro = localStorage.getItem('filtrosCallcenter');
        if (filtro) {
            this.filtro = JSON.parse(filtro);

            let ordenacao = localStorage.getItem('ordenacaoCallcenter');
            if (ordenacao) {
                this.ordenacao = JSON.parse(ordenacao);
                this.ordenacao.paginaAtual = 1;
            }
            
            if( this.filtro['inclusaoInicio'] ){
                this.inclusaoInicio = [moment(this.filtro['inclusaoInicio'].valor, 'DD/MM/YYYY')];
            }

            if( this.filtro['inclusaoFim'] ){
                this.inclusaoFim = [moment(this.filtro['inclusaoFim'].valor, 'DD/MM/YYYY')];
            }

        } else {
            this.limparFiltros();
        } 


        this.limparFiltros();

    }
    
    ngOnInit() {
        this.formatosDeDatas = new FormatosData();

        this.usuarioService.usuarioSessao().subscribe(
            (usuario) => { this.usuario = usuario },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        );

        this.serviceCallContatoStatus.get().subscribe(
            (contatoStatus) => { this.contatoStatus = contatoStatus }
        );

        this.serviceAtendimentoEspera.getPrioridades().subscribe(
            (atendimentoEsperaPrioridade) => { this.atendimentoEsperaPrioridades = atendimentoEsperaPrioridade }
        );

        if( Sessao.getPreferenciasUsuarioLocalStorage()['atividadeEmAndamento'] && Sessao.getPreferenciasUsuarioLocalStorage()['atividadeEmAndamento']['inicioAtendimento'] ){
            this.atendimentoSelecionado = Sessao.getPreferenciasUsuarioLocalStorage()['atividadeEmAndamento'];
            this.atendimentoSelecionado.iniciado = true;
            this.limparFiltros();
            this.abreModalAtendimento(null, Sessao.getPreferenciasUsuarioLocalStorage()['atividadeEmAndamento']);
        }else{
            this.atualizaDados();
        }
    }

    ngOnDestroy() {
        this.stopRefreshList();
    }

    ngAfterViewInit() {

    }

    startRefreshList() {
        let esse = this;
        this.atualizaDados(this.ordenacao);
        this.refreshListInterval = setInterval(()=>{
            
            if(!esse.buscando) {
                
                esse.atualizaDados(esse.ordenacao);
            }
        }, 5000);

        this.buscaTiposContato();
        // this.buscaListaCallCenter();

    }

    stopRefreshList() {
        clearInterval(this.refreshListInterval);
    }

    //  #############################################
    //               Ações da tela
    //  #############################################
    navegar(aba) {
        this.atual = aba;

        if (aba !== 'listaatividades') {
            this.stopRefreshList();
        }
    }

    abreModalNovaLigacao() {

        this.stopRefreshList();

        this.paciente = undefined;
        this.filtro = {};
        this.pacienteSelecionado = undefined;
        this.contatos = undefined;

        this.modalAtendimentoInstancia = this.modalService.open(NgbdModalContent, {size: 'lg'});
        this.modalAtendimentoInstancia.componentInstance.modalHeader = 'Nova Ligação';

        this.modalAtendimentoInstancia.componentInstance.templateRefBody = this.bodyModalNovaLigacao;
        this.modalAtendimentoInstancia.componentInstance.templateBotoes = this.templateBotoesModalNovaLigacao;

        let fnFecharModal = (agendamentoGrupoResposta) => { 
                this.stopRefreshList();

                this.ordenacao['tipo'] = undefined
                this.ordenacao['ordem'] = 'status desc inclusao asc prioridade desc';
                this.filtro = {};
                
                this.startRefreshList();
        };
        this.modalAtendimentoInstancia.result.then(fnFecharModal, fnFecharModal);
    }

    validaNovaLigacao() {
        if (!this.paciente || !this.paciente.id) {
            this.toastr.warning("Selecione Paciente");
            return false;
        }

        if (!this.objParamAddNovaLigacao['protocolo'] || this.objParamAddNovaLigacao['protocolo'] == '0' || this.objParamAddNovaLigacao['protocolo'] == '' ) {
            this.toastr.warning("Preencha campo Protocolo");
            return false;
        }

        if (!this.objParamAddNovaLigacao['prioridade'] || this.objParamAddNovaLigacao['prioridade'] == '0' || this.objParamAddNovaLigacao['prioridade'] == '' ) {
            this.toastr.warning("Preencha campo Prioridade");
            return false;
        }

        if (!this.objParamAddNovaLigacao['tipo'] || this.objParamAddNovaLigacao['tipo'] == '0' || this.objParamAddNovaLigacao['tipo'] == '') {
            this.toastr.warning("Preencha campo Assunto");
            return false;
        }

        if (!this.objParamAddNovaLigacao['status'] || this.objParamAddNovaLigacao['status'] == '0' || this.objParamAddNovaLigacao['status'] == '') {
            this.toastr.warning("Preencha campo Status");
            return false;
        }

        if (!this.objParamAddNovaLigacao['observacao']) {
            this.toastr.warning("Preencha campo Observação");
            return false;
        }

        return true;
    }

    salvarLigacao() {
        if (!this.validaNovaLigacao()) {
            return;
        }

        let idUnidade = localStorage.getItem('idUnidade');

        if( !idUnidade ){
            localStorage.removeItem('unidade');
            localStorage.removeItem('consultorio');
            
            this.toastr.warning("É obrigatorio selecionar unidade de atendimento");
            
            this.router.navigate([`/${Sessao.getModulo()}/dashboard`]);
            return
        }

        let callAtividadeRequest = {
            "paciente": {
                "id": this.paciente.id
            },
            "observacao": this.objParamAddNovaLigacao['observacao'],
            "prioridade": this.objParamAddNovaLigacao['prioridade'],
            "status": this.objParamAddNovaLigacao['status'],
            "tipo": {
                "id": this.objParamAddNovaLigacao['tipo']
            },
            "unidadeAtendimento": {
                "id" : localStorage.getItem('idUnidade')
            }
        };

        this.serviceCallAtividade.post(callAtividadeRequest).subscribe((resp) => {
            let callContatoRequest = {
                "atividade": {
                    "id": resp
                },
                "observacao": this.objParamAddNovaLigacao['observacao'],
                "protocolo": this.objParamAddNovaLigacao['protocolo'],
                "status": this.objParamAddNovaLigacao['status']
            };

            this.serviceCallContato.post(callContatoRequest).subscribe((resp) => {
                this.toastr.success("Ligação registrada com sucesso");
                // this.limparFiltros();
                this.modalAtendimentoInstancia.close();
            }, () => {
                this.toastr.warning("Falha ao registrar contato");
            });
        }, () => {
            this.toastr.warning("Falha ao registrar Ligação");
        });
    }

    abreModalAtendimento(ev, atendimento) {
        if( atendimento ){
            this.atendimentoSelecionado = atendimento;
        }
        if (atendimento.status == 'EMATENDIMENTO') {
            this.stopRefreshList();
        }

        this.refreshModal();
        
        this.modalAtendimentoInstancia = this.modalService.open(NgbdModalContent, {size: 'lg'});
        this.modalAtendimentoInstancia.componentInstance.modalHeader = 'Atividade';

        this.modalAtendimentoInstancia.componentInstance.templateRefBody = this.bodyModalAtendimento;
        this.modalAtendimentoInstancia.componentInstance.templateBotoes = this.templateBotoesModalAtendimento;
        this.modalAtendimentoInstancia.componentInstance.custom_lg_modal = true;

        let fnFecharModal = (agendamentoGrupoResposta) => { 
            //if (!this.refreshListInterval) {
                this.stopRefreshList();
                this.startRefreshList();
            //}
        };
        this.modalAtendimentoInstancia.result.then(fnFecharModal, fnFecharModal);
    }


    refreshModal(contatoFinalizado = false) {

        let filtro = {
            "pagina":1,
            "quantidade":30,
            "ordem":"prioridade desc",
            "itens":[
                {
                    "campo":"paciente.id",
                    "classe":"INTEGER",
                    "tipo":"IGUAL",
                    "valor": (this.atendimentoSelecionado.paciente) ? this.atendimentoSelecionado.paciente.id : ''
                }
            ]
        };
        if( !this.atendimentoSelecionado.paciente ){

            filtro['itens'][0] = {
                "campo":"atendimento.nome",
                "classe":"STRING",
                "tipo":"IGUAL",
                "valor": this.atendimentoSelecionado.atendimento.nome
            }
        }

        this.serviceCallAtividade.get( filtro ).subscribe(
            (atividade) => {console.log(atividade)
                
                this.listaModal = atividade.dados.filter((item)=>{
                    return item.status !== "CONCLUIDO"
                });

                if( this.listaModal.length == 0 ){
                    Sessao.setPreferenciasUsuarioLocalStorage('atividadeEmAndamento', null);
                    this.atendimentoSelecionado.iniciado = false;
                }

                if (contatoFinalizado && !this.listaModal.length) {
                    this.modalAtendimentoInstancia.close();
                }
            }
        );

    }

    iniciaAtividade() {
        this.stopRefreshList();

        let iniciaAtividadeRequest = {
            id: this.atendimentoSelecionado.id, 
        };
        
        if( !this.atendimentoSelecionado.paciente && this.atendimentoSelecionado.atendimento && this.atendimentoSelecionado.atendimento.paciente ){

            let request = { 
                paciente: {
                    id: this.atendimentoSelecionado.atendimento.paciente.id
                }
            }
            this.serviceCallAtividade.put( this.atendimentoSelecionado.id,  request ).subscribe(
                ( retorno ) => {
                    this.iniciaCallAtividade(iniciaAtividadeRequest);
                }
            )
        }

        this.iniciaCallAtividade(iniciaAtividadeRequest);
    }

    finalizarContato(novaObservacao, inputDataAgendamento, callAtividade, status = 'CONCLUIDO') {
        
        let value = novaObservacao.value.trim();
        let agendado;

        if (!value || value == "") {
            this.toastr.warning('Preenchimento do campo Observação é obrigatório!');
            return;
        }

        let contatoStatusSelecionado = this.contatoStatus.filter((status) => {return status.checked});
        if (!contatoStatusSelecionado.length) {
            this.toastr.warning('Preenchimento do status do contato é obrigatório!');
            return;
        }

        if(inputDataAgendamento.value && status !== 'CONCLUIDO'){
            agendado = moment(inputDataAgendamento.value, 'YYYY-MM-DDTHH:mm').format('DD/MM/YYYY HH:mm:00');
            status = 'PAUSADO';
        }

        let inicio = Sessao.getPreferenciasUsuarioLocalStorage()['atividadeEmAndamento']['inicioAtendimento'];

        let request = {
            atividade: { 
                id: callAtividade.id,
                status: status,
                agendado: agendado,
            },
            observacao: value,
            contatoStatus: contatoStatusSelecionado[0].codigo
        };

        // Finaliza Atividade
        this.serviceCallAtividade.finalizaCallAtividade(request).subscribe((callContatoResponse) => {

            let requestCallContato = {
                "atividade": {
                    "id": callAtividade.id
                },
                "inicio": inicio,
                "fim": moment().format(this.formatosDeDatas.dataHoraSegundoFormato),
                "observacao": value,
                "status": contatoStatusSelecionado[0].codigo,
                "confirmacao": (callAtividade.confirmado) ? moment().format(this.formatosDeDatas.dataHoraSegundoFormato) : undefined,
                "cancelado": (callAtividade.tipo.id == 2) ? callAtividade.cancelado : undefined
            }

            this.serviceCallContato.post(requestCallContato).subscribe();

            //this.atendimentoSelecionado = undefined;
            this.toastr.success(`Atividade ${callAtividade.tipo.descricao} finalizada`);

            this.refreshModal(true);
        }); 
    }


    trocaStatus(statusAtual) {
        this.contatoStatus.forEach((status) => {
            status.checked = false;
        });

        statusAtual.checked = true;
    }

    validaTipoContato(atividade, tipo){
        if( atividade.tipo ){
            if( tipo == 'avaliar' ){
                return atividade.tipo.descricao == "Avaliar reposta"
            }else if( tipo == 'cancelar' ){
                return atividade.tipo.descricao == "Cancelamento"
            }
        }

        return false;
    }

    validaTipoContatoCancelamento(atividade){

    }

    getValor(evento, param) {
        let label = this.filtro[param] ? param : evento;
        if (!param || !this.filtro[label]) {
            return;
        }

        if( this.filtro[label].tipo == 'IN' ){
            // this.filtro[label].valor = this.setId(evento);
            this.filtro[label].valor = evento.valor;
        }else if( this.filtro[evento] && this.filtro[evento].classe == 'DATA' ){  // NO CASO DE DATAS OS PARAMETROS SAO INVERTIDOS
            this.filtro[label].valor = param[0].format('DD/MM/YYYY');
        }else{
            this.filtro[label].valor = evento.valor;
        }
    }

    setId(locais){
        if( locais && locais.valor ){
            let ids = locais.valor.map(
                (local) => {
                    return local.id || local
                }
            )
            
            return ids;
        }else{
            return [];
        }
    }

    paciente;
    objPaciente;
    pacienteSelecionado;
    getPaciente(paciente) {
        this.paciente = paciente;
        if( paciente ){
            this.pacienteSelecionado = paciente.nome;

            this.pacienteService.getPacienteContatos({pacienteId:paciente.id}).subscribe((resp) => {
                this.contatos = resp.dados;
            });
        }
    }

    fnCfgPacienteRemote(term) {
        let request = {
            pagina: 1, 
            quantidade: 10, 
            like: term
        };
        this.pacienteService.getPacienteLike( request ).subscribe(
            (retorno) => {
                this.objPaciente = retorno.dados || retorno;
            }
        )
    }

    dataInclusaoInicioInstancia;
    dataInclusaoFimInstancia;
    getDataInclusaoInicioInstancia(instancia) {
        this.dataInclusaoInicioInstancia = instancia;
    }
    getDataInclusaoFimInstancia(instancia) {
        this.dataInclusaoFimInstancia = instancia;
    }

    pesquisarTiposContato(texto){
        this.buscaTiposContato( { paginaAtual : 1 }, texto);
    }

    adicionarTipoContato(){
        this.tipoContatoService.salvar( { descricao : this.novoTipoContato } ).subscribe(
            (retorno) => { 
                this.toastr.success("Tipo de Contato salvo com sucesso") 
                this.novoTipoContato = '';
                this.buscaTiposContato();
            },
            (erro) => { this.toastr.error("Erro ao salvar tipo de contato") },
        )
    }

    buscaTiposContato(evento = null, desc = null){
        this.paginaAtualTpC = evento ? evento.paginaAtual : this.paginaAtualTpC;
        this.tipoContatoService.get( { like : (desc || ''), pagina: this.paginaAtualTpC, quantidade: this.itensPorPaginaTpC } ).subscribe( tipos => {
            this.tiposContato = tipos.dados
            this.qtdItensTotalTpC = tipos.qtdItensTotal;
        });
    }

    removeTipoContato(id){
        if( confirm("Deseja realmente excluir esse tipo de contato") ){
            this.tipoContatoService.excluir( id ).subscribe(
                (retorno) => {
                    this.buscaTiposContato();
                    this.toastr.success("Tipo de Contato foi excluido sucesso");
                },(erro) => { this.toastr.error("Erro ao excluir tipo de contato") }
            )
        }
    }

    editarTipo(descricao, idTpC, pos, requisicaoSalvar){
        let element = jQuery(`tr[data-index='${pos}']`);

        this.editar(true, element);
        
        if( requisicaoSalvar ){
            this.tipoContatoService.atualizar( idTpC, { descricao : descricao } ).subscribe(
                (retorno) => {
                    this.editar(false, element)                    
                    this.toastr.success("Tipo de contato editado com sucesso") 
                },
                (erro) => { this.toastr.error("Erro ao editar tipo de contato") }
            )
        }
        
    }

    editar(estado, element){
        if( estado ){
            jQuery(`tr[data-index] #edit-desc:not(.hide)`).addClass('hide')
            jQuery(`tr[data-index] p`).show();
            element.find('p').hide();
            element.find('#edit-desc').removeClass('hide');
        }else{
            element.find('p').show();
            element.find('#edit-desc').addClass('hide');
        }
    }

    setColorBackgroundStatus(prioridade) {
        switch (prioridade) {
            case "PENDENTE":
                return "gray"
            case "EMATENDIMENTO":
                return "orange"
            case "PAUSADO":
                return "yellow"
            case "CONCLUIDO":
                return "green"

            default:
                return "black"  
        }
    }

    getStatusAtividade(status, atividade){        
        return (( status != "EMATENDIMENTO" ) ? status : "EM ATENDIMENTO") + ' - ' + atividade;
    }

    limparFiltros() {
        
        this.colunasTabela.filter((coluna) => {
            return coluna.filtroTipo;
        }).slice().forEach((coluna) => {
            this.filtro[coluna.ordemFiltro] = {
                valor: this.validaInicializacaoValores(coluna),
                tipo: coluna.filtroTipo,
                classe: coluna.filtroClasse,
                enumNome: coluna.enumNome,
                oculto: coluna.oculto
            }
        });

        this.inclusaoInicio = null;
        this.inclusaoFim = null;
        if (this.dataInclusaoInicioInstancia && this.dataInclusaoInicioInstancia.limpaCampo.limpaCampo){
            this.dataInclusaoInicioInstancia.limpaCampo();
            this.dataInclusaoFimInstancia.limpaCampo();
        }

        if (this.atendimentoSelecionado && this.atendimentoSelecionado.iniciado) {
            // this.filtro['status'] = {"valor": [{"id": "EMATENDIMENTO"}]};
        } else {
            // this.filtro['status'] = {"valor": [{"id": "PENDENTE"}]};
        }

        this.atualizaDados();
    }

    validaInicializacaoValores(coluna){

        switch (coluna.ordemFiltro) {
            case 'status':
                return [{"id": "PENDENTE"}];
            default:
                return undefined;
        }
    }

    iniciaCallAtividade(iniciaAtividadeRequest){
        this.serviceCallAtividade.iniciaCallAtividade(iniciaAtividadeRequest).subscribe(
            (callAtividadeId) => {
                if (callAtividadeId && !callAtividadeId.length) {
                    return; 
                }

                this.atendimentoSelecionado.iniciado = true;

                this.listaModal = callAtividadeId.slice();
                this.atendimentoSelecionado['inicioAtendimento'] = moment().format(this.formatosDeDatas.dataHoraSegundoFormato);
                Sessao.setPreferenciasUsuarioLocalStorage('atividadeEmAndamento', this.atendimentoSelecionado);
                this.refreshModal();
            },
            (erro) => { this.toastr.warning(erro); }
        );
    }

    atualizaDados(obj = {}) {
        this.ordenacao = Object.assign(this.ordenacao, obj);
        this.buscando = true;
        let buscaConcluidos = false;

        let arrItens = [];
        Object.keys(this.filtro).forEach((key) => {
            if (this.filtro[key] && this.filtro[key].valor && this.filtro[key].valor != '0') {
                let filt = {
                    "campo": key,
                    "classe": this.filtro[key].classe,
                    "tipo": this.filtro[key].tipo,
                    "valor": this.filtro[key].valor
                };

                if( filt['campo'].toUpperCase() == 'STATUS' ){
                    if( filt['valor'] == 'CONCLUIDO' ){
                        buscaConcluidos = true;
                    }
                }

                if( filt['tipo'] == 'IN'){
                    filt['valorIn'] = this.setId(this.filtro[key]);
                    delete filt.valor;
                }

                if (this.filtro[key].enumNome) {
                    filt['enumNome'] = this.filtro[key].enumNome;
                }

                if( this.filtro[key].classe == "DATA" ){
                    filt['campo'] = filt['campo'].replace("Inicio", "").replace("Fim", "");
                }

                if (filt.campo && filt.classe && filt.tipo && (filt.valor || filt['valorIn'])) {
                    arrItens.push(filt);
                }
            }
        });

        let request = {
            pagina: this.ordenacao.paginaAtual, 
            quantidade: this.ordenacao.itensPorPagina,
            // ordem: `${this.ordenacao.ordem} ${this.ordenacao.tipo}`,
        };

        request['ordem'] = !(this.ordenacao.tipo) ? this.ordenacao.ordem : `${this.ordenacao.ordem} ${this.ordenacao.tipo}`
        
        if (arrItens.length) {
            request['itens'] = arrItens;
        } else {
            request['itens'] = [{
                campo: "status",
                classe: "ENUM",
                enumNome: "CallStatus",
                tipo: "IGUAL",
                valor: "PENDENTE"
            }];
        }
        
        if( !Sessao.validaPapelUsuario('WEBPEP:CALLCENTER') ){

            request['itens'].push({
                campo: "unidadeAtendimento.id",
                classe: "INTEGER",
                tipo: "IGUAL",
                valor: ( localStorage.getItem('idUnidade') )
            })
            
        }

        if (this.ordenacao.like) {
            request['likeItens'] = [ 'paciente.nome' ];
            request['likeStr'] = this.ordenacao.like;
        }

        request['itens'].push({
            campo: "excluido",
            classe: "BOOLEAN",
            tipo: "IGUAL",
            valor: false
        })

        // let preferenciasUsuario = Sessao.getPreferenciasUsuarioLocalStorage();
        // if (preferenciasUsuario && preferenciasUsuario['atividadeEmAndamento'] && preferenciasUsuario['atividadeEmAndamento']['paciente']){
        //     request['pacienteId'] = preferenciasUsuario['atividadeEmAndamento']['paciente']['id'];
        // }

        this.serviceCallAtividade.get(request)
            .subscribe((callAtividadeLista) => {
                this.buscando = false;
                
                this.lista = callAtividadeLista.dados;

                localStorage.setItem('filtrosCallcenter', JSON.stringify(this.filtro));
                localStorage.setItem('ordenacaoCallcenter', JSON.stringify(this.ordenacao));

                this.qtdItensTotal = callAtividadeLista.qtdItensTotal;
                
            },
            (erro) => {
                this.buscando = false;
                Servidor.verificaErro(erro, this.toastr);
            },
        );
    }

    clickLog(ev, linha) {
        ev.stopPropagation();
        // this.router.navigate([`/${Sessao.getModulo()}/previa/historico/${linha.id}`]);
    }

    fnMostraIcone(dado) {
        return dado.status != 'CONCLUIDO';
    }

    fnValidaPaciente(dado){
        return dado['paciente'] ? dado['paciente']['nome'] : ( ( dado['atendimento'] ) ? dado['atendimento']['nome'] : '' );
    }
}