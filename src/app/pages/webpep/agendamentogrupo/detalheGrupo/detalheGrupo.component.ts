import { ActivatedRoute, Router } from '@angular/router';
import { Component, ViewChild, OnInit, TemplateRef, QueryList } from '@angular/core';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';

import { Sessao, Servidor, DicionarioTissService, AtendimentoEsperaService, PacienteService, LocalAtendimentoService, AgendamentoGrupoService, TemaGrupoService, UsuarioService, GrupoRecorrenciaService } from 'app/services';

import { NgbdModalContent, FormatosData } from 'app/theme/components';

import * as moment from 'moment';
import * as jQuery from 'jquery';

@Component({
    selector: 'detalheGrupo',
    templateUrl: './detalheGrupo.html',
    styleUrls: ['./detalheGrupo.scss'],
    providers: [GrupoRecorrenciaService, AtendimentoEsperaService]
})
export class DetalheGrupo implements OnInit {

    qtdItensTotal;
    paginaAtual = 1;
    itensPorPagina = 15;
    usuario;

    qtdItensTotalResponsaveis;
    paginaAtualResponsaveis = 1;
    itensPorPaginaResponsaveis = 15;

    qtdItensTotalSessoes;
    paginaAtualSessoes = 1;
    itensPorPaginaSessoes = 15;


    paginaAtualListaEspera = 1
    itensPorPaginaListaEspera = 15;
    qtdItensTotalListaEspera;

    recorrenciaInstancia;
    recorrenciaPacienteTable
    recorrenciaInstanciaPaciente;
    objRecorrenciaPacienteAtual;
    linhaSelecionada;
    pacienteSelecionado;
    ocultaMolduraListaEspera = true;
    todasSessoes = true;
    tiposEncerramento;
    tipoEncerramento;

    planos = [];
    planoSelecionado;

    atual
    idGrupo;
    fnRemove;
    observacaoRemocao;
    tipoRemocao

    textoModalExclusao
    itemRemocao
    modalInstancia;
    activeModal;

    novoGrupo = new Object();
    sessoes = [];
    unidadesAtendimento;
    listaEspera = [];
    temas;    

    pacientes = [];
    responsaveis = [];
     
    responsaveisFiltro
    pacientesFiltro;
    
    objFiltroTema = ['descricao', 'descricao'];
    objFiltro = [ 'nome', 'nome' ];

    formatosDeDatas;
    objParamsAddPaciente = new Object()
    objParamsAddResponsavel = new Object()

    recorrencia = new Object();
    recorrenciaPaciente = new Object();
    momentjs = moment;

    dataInicio

    recorrenciasVariaveis

    @ViewChild("bodyModalRemoverItem", {read: TemplateRef}) bodyModalRemoverItem: QueryList<TemplateRef<any>>;
	@ViewChild("templateBotoesModalRemoverItem", {read: TemplateRef}) templateBotoesModalRemoverItem: QueryList<TemplateRef<any>>;

    // TODO TESTAR UNIDADE ATENDIMENTO
    constructor(
        private serviceTipoEncerr: DicionarioTissService,
        private usuarioService: UsuarioService,
        private grupoRecorrenciaService: GrupoRecorrenciaService,
        private serviceGrupo: AgendamentoGrupoService,
        private serviceTemaGrupo: TemaGrupoService,
        private route: ActivatedRoute,
        private router: Router,
        private localAtendimentoService: LocalAtendimentoService,
        private serviceAtendimentoEspera: AtendimentoEsperaService,
        private servicePaciente: PacienteService,
        private modalService: NgbModal,
        private toastr: ToastrService, 
    ) {
        this.route.params.subscribe(params => {
            this.idGrupo = (params["groupid"] != 'novo') ? params["groupid"] : undefined
        });
    }

    recorrenciaVariavel = false;
    ngOnInit() {
        this.formatosDeDatas = new FormatosData;

        this.dataInicio = moment().format(this.formatosDeDatas.dataHoraFormato);

        this.atual = "geral";

        if( this.idGrupo ){
            this.setGrupo();
            this.buscarPacientes({});
        }else{
            this.recorrenciasVariaveis = [{
                data: this.dataInicio
            }];
        }

        this.usuarioService.usuarioSessao().subscribe(
            (usuario) => { 
                this.usuario = usuario 
                this.permiteUsuarioEditar = this.podeEditarRecorrencia();
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        )

        this.objParamsAddPaciente['recorrencias'] = [];

        this.unidadesAtendimento = Sessao.getVariaveisAmbiente('unidadesAtendimento');

    }

    setRecorrenciaInstancia(instancia) {
        this['recorrenciaInstancia'] = instancia;
    }

    setRecorrenciaInstanciaPaciente(instancia){
        this['recorrenciaInstanciaPaciente'] = instancia;
    }

    setRecorrenciaInstanciaPacienteTable(instancia){
        this['recorrenciaInstanciaPacienteTable'] = instancia;
    }

    navegar(aba){
        this.atual = aba;

        switch (aba) {
            case 'geral': 
                this.setGrupo();
                break;

            case 'pacientes':
                this.paginaAtual = 1;
                this.paginaAtualListaEspera = 1;
                // this.buscarPacientes();
                this.linhaSelecionada = undefined;
                this.buscarAtendimentoEsperaPaginado();
                break;
                
            case 'responsaveis':
                this.paginaAtualResponsaveis = 1;
                this.buscarResponsaveis();                
                break;

            case 'sessoes':
                this.paginaAtualSessoes = 1;
                this.buscarSessoesGrupo();
                break; 
            
            default:
                break;
        }
    }

    pesquisar(texto) {
        this.buscarPacientes(null, texto);
    }

    buscarPacientes(evento = null, paciente = null, naoConcat = true){
        let request = {
            grupoId: this.idGrupo, 
            pagina: evento ? evento.paginaAtual : this.paginaAtual, 
            quantidade: this.itensPorPagina,  
            pacienteId: (paciente || ''), 
            removido: false
        }

        this.serviceGrupo.buscarPacientes(request).subscribe(
            (pacientes) => {
                console.log(pacientes)
                this.pacientes = (pacientes.paginaAtual == 1) ? pacientes.dados : this.pacientes.concat([], pacientes.dados);

                this.pacientesFiltro = this.pacientes;
                this.qtdItensTotal = pacientes.qtdItensTotal;
                this.paginaAtual = pacientes.paginaAtual;
                this.todasSessoes = true;

            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );

        this.serviceTipoEncerr.getTipoEncerramento().subscribe(
            (tipos) => {
                this.tiposEncerramento = tipos;
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }
    
    buscarSessoesGrupo(evento = null, naoConcat = true){

        this.paginaAtualSessoes = evento ? evento.paginaAtual : this.paginaAtualSessoes;
        this.serviceGrupo.grupoSessao( { grupoId : this.idGrupo, pagina: this.paginaAtualSessoes, quantidade: this.itensPorPaginaSessoes  } ).subscribe( sessoes => {

            this.sessoes = (this.paginaAtualSessoes == 1) ? sessoes.dados : this.sessoes.concat([],sessoes.dados);

            this.qtdItensTotalSessoes = sessoes.qtdItensTotal;
        },
        (erro) => {
            Servidor.verificaErro(erro, this.toastr);
        })
        
        if( !this.novoGrupo['tema']['formularios'] ){
            this.setGrupo();
        }

    }

    buscarResponsaveis(evento = null, naoConcat = true){

        this.paginaAtualResponsaveis = evento ? evento.paginaAtual : this.paginaAtualResponsaveis;
        this.serviceGrupo.getGrupoResponsavel( { grupoId : this.idGrupo, pagina: this.paginaAtualResponsaveis, quantidade: this.itensPorPaginaResponsaveis, removido : false } ).subscribe( responsaveis => {

            this.responsaveis = (this.paginaAtualResponsaveis == 1) ? responsaveis.dados : this.responsaveis.concat([],responsaveis.dados);

            this.responsaveisFiltro = this.responsaveis.slice();
            this.qtdItensTotalResponsaveis = responsaveis.qtdItensTotal;
        },
        (erro) => {
            Servidor.verificaErro(erro, this.toastr);
        })
    }

    defineUsuarioPrincipal(status, responsavel){
        this.serviceGrupo.atualizarGrupoResponsavel( { principal : status }, responsavel.id ).subscribe( responsaveis => {
            this.toastr.success("Status atualizado com sucesso")
        });
    }

    salvarGrupo(){
        let bRecorrenciaValida = true;
        let aRecorrencia = [];
        let esse = this;

        if( !this.recorrenciaVariavel ){
            if (!this.recorrencia['frequencia']){
                this.toastr.warning('Por Favor informe o horário das sessões');
                return;
            }

            this.recorrencia['frequencia'].forEach((frequencia) => {
                if (!this.validaFrequencia(frequencia)) {
                    bRecorrenciaValida = false;
                    return;
                }
                aRecorrencia.push(esse['recorrencia']['objRecorrenciaDetalhada'][frequencia]);
            });
        }
        
        if (!bRecorrenciaValida) {return;}

        if (!this.novoGrupo['tema'] || !this.novoGrupo['tema']['id']) {
            this.toastr.warning('Por favor selecione um tema');
            return;
        }

        if (!this.novoGrupo['dataPrimeiraSessao']) {
            this.toastr.warning('Por favor selecione uma data para a primeira sessão');
            return;
        }

        if (!this.novoGrupo['tema'] || !this.novoGrupo['tema']['id']) {
            this.toastr.warning('Por favor selecione um tema');
            return;
        }

        if (!this.novoGrupo['descricao']) {
            this.toastr.warning('Por favor informe um nome');
            return;
        }

        if (!this.novoGrupo['qtdMaxPaciente']) {
            this.toastr.warning('Por favor informe a quantidade de participantes');
            return;
        }

        if (!this.novoGrupo['qtdFaltas'] || this.novoGrupo['qtdFaltas'] == 0 || this.novoGrupo['qtdFaltas'] == '0') {
            this.toastr.warning('Por favor informe a quantidade de faltas maior que 0');
            return;
        }

        if( this.novoGrupo['dataUltimaSessao'] ){
            if( moment(`${this.novoGrupo['dataPrimeiraSessao']} ${this.novoGrupo['dataPrimeiraSessao']}`, `${this.formatosDeDatas.htmlDataFormato}`).isSameOrAfter( moment(`${this.novoGrupo['dataUltimaSessao']} `, `${this.formatosDeDatas.htmlDataFormato}`) ) ){
                this.toastr.warning('Data de inicio depois da data final');
                return;
            }
        }

        let objNovoGrupo = Object.assign({}, this.novoGrupo);
            delete objNovoGrupo['sessoes'];
            delete objNovoGrupo['pacientes'];
            delete objNovoGrupo['vagasDisponiveis'];
            delete objNovoGrupo['excluido'];

        objNovoGrupo['recorrencias'] = aRecorrencia;

        objNovoGrupo['dataPrimeiraSessao'] = moment(`${objNovoGrupo['dataPrimeiraSessao']} ${objNovoGrupo['dataPrimeiraSessao']}`, `${this.formatosDeDatas.htmlDataFormato}`).format(`${this.formatosDeDatas.dataFormato}`);
        objNovoGrupo['dataUltimaSessao'] = moment(`${objNovoGrupo['dataUltimaSessao']} `, `${this.formatosDeDatas.htmlDataFormato}`).format(`${this.formatosDeDatas.dataFormato}`);

        objNovoGrupo['unidadeAtendimento'] = { id : objNovoGrupo['unidadeAtendimento']['id'] }

        objNovoGrupo['recorrenciaVariavel'] = this.recorrenciaVariavel;

        if( objNovoGrupo['dataUltimaSessao'] == 'Invalid date'){
            delete objNovoGrupo['dataUltimaSessao'];
        }

        objNovoGrupo['qtdMaxPaciente'] = parseInt(objNovoGrupo['qtdMaxPaciente']);
        
        ( objNovoGrupo['qtdFaltas'] && (parseInt(objNovoGrupo['qtdFaltas']) > 0) ) ? objNovoGrupo['qtdFaltas'] = parseInt(objNovoGrupo['qtdFaltas']) : null;
        
        objNovoGrupo["tema"] = { id : objNovoGrupo['tema']['id'] }
        
        if(!this.idGrupo){
            this.serviceGrupo.salvarGrupo(objNovoGrupo).subscribe(
                retorno => {
                    this.idGrupo = retorno;
                    this.router.navigate([`/${Sessao.getModulo()}/agendamentogrupo/grupo/${retorno}`]);
                    this.toastr.success("Grupo "+objNovoGrupo['descricao']+" adicionado com sucesso");
                    this.setGrupo();
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                }
            ) 
        }else{
            this.serviceGrupo.atualizarGrupo(objNovoGrupo, this.idGrupo).subscribe(
                retorno => {
                    this.toastr.success("Grupo "+objNovoGrupo['descricao']+" atualizado com sucesso");
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                }
            ) 
        }
    }

    validaFrequencia(frequencia) {
        if ( !this['recorrencia']['objRecorrenciaDetalhada'] || !this['recorrencia']['objRecorrenciaDetalhada'][frequencia] || !this['recorrencia']['objRecorrenciaDetalhada'][frequencia].horaInicio ) {
            this.toastr.warning('Por favor informe o horário de inicio na ' + moment().weekday(frequencia).format(this.formatosDeDatas.diaDaSemanaCompleto));
            
            return false;
        }
        if ( !this['recorrencia']['objRecorrenciaDetalhada'] || !this['recorrencia']['objRecorrenciaDetalhada'][frequencia] || !this['recorrencia']['objRecorrenciaDetalhada'][frequencia].horaFim ) {
            this.toastr.warning('Por favor informe o horário de término na ' + moment().weekday(frequencia).format(this.formatosDeDatas.diaDaSemanaCompleto));
            
            return false;
        }

        return true;
    }

    validaStatusSessao(sessao, LABEL){
        let objretorno = { 'tipo': 'nao iniciada',  'cor' : '#79787d' }

        if( sessao.dataInicio && sessao.dataFim ){
            objretorno = { 'tipo': 'finalizada',  'cor' : '#005128' }

        }else if( sessao.dataInicio ){
            objretorno = { 'tipo': 'iniciada',  'cor' : '#ffc20f' }
        }

        let hoje = moment().format(this.formatosDeDatas.dataFormato);
        let dataSessao = moment(sessao.dataSessao, this.formatosDeDatas.dataHoraSegundoFormato ).format(this.formatosDeDatas.dataFormato);
        if( hoje == dataSessao && LABEL ){
            objretorno['tipo'] = 'podeIniciarHoje';
        }

        return objretorno;
    }

    visualizaSessao(id, sessao){
        jQuery("#preloader").fadeIn(10);

        let tipo = this.validaStatusSessao(sessao, false)['tipo'];
        
        this.router.navigate([`/${Sessao.getModulo()}/agendamentogrupo/grupo/${this.idGrupo}/sessao/${id}/visualizar`])
    }

    realizaSessao(id, sessao){
        jQuery("#preloader").fadeIn(10);
        
        let tipo = this.validaStatusSessao(sessao, true)['tipo'];

        if( tipo == "podeIniciarHoje"  ){
            this.router.navigate([`/${Sessao.getModulo()}/agendamentogrupo/grupo/${this.idGrupo}/sessao/${id}/realizar`]);
            
        }else{
            jQuery("#preloader").fadeOut(10);
        }
        
    }

    detalheSessao(id){
    }

    validaDatasHoras(tipoIni, tipoFim){
        let inicio = this.novoGrupo[tipoIni];
        let fim = this.novoGrupo[tipoFim];

        let tipo = tipoIni.match("data") ? "data" : "hora";

        let diferenca = (tipo == "data") ? moment.duration(moment(fim).diff(moment(inicio))).days() : moment.duration(moment(fim, this.formatosDeDatas.horaFormato).diff(moment(inicio, this.formatosDeDatas.horaFormato))) ;

        if( diferenca < 0 ){
            this.novoGrupo[tipoFim] = inicio;
        }

        if (this.recorrencia && ( (this.recorrencia['frequencia'] && this.recorrencia['frequencia'].length == 1) || !this.recorrencia['frequencia'] ) ) {
            let dia = moment(this.novoGrupo['dataPrimeiraSessao'], this.formatosDeDatas.htmlDataFormato).weekday();
            
            // if( this.idGrupo ){
            setTimeout(() => {
                this.recorrenciaInstancia.set('frequencia', [dia]);
            }, 800);
        // }
        }
    }

    setGrupo(){
        this.serviceGrupo.get({ id : this.idGrupo }).subscribe(
            grupo => {
                this.novoGrupo = this.validaGrupo(grupo.dados[0]);
                
                this.recorrenciaVariavel = this.novoGrupo['recorrenciaVariavel'];

                if( !this.recorrenciaVariavel ){
                    (this['recorrenciaInstancia']) ? this['recorrenciaInstancia'].atualizaRecorrenciaDia(this.novoGrupo["recorrencias"]) : null;
                }else{
                    if( this.novoGrupo["recorrencias"] && this.novoGrupo["recorrencias"].length ){
                        this.recorrenciasVariaveis = this.novoGrupo["recorrencias"];
                        this.recorrenciasVariaveis.push( {
                            data: this.dataInicio
                        } )
                    }else{
                        this.recorrenciasVariaveis = [
                            {
                                data: this.dataInicio
                            }
                        ];
                    }
                }

            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        )
    }

    validaGrupo(grupo){
        grupo['dataPrimeiraSessao'] = moment(`${grupo['dataPrimeiraSessao']} ${grupo['dataPrimeiraSessao']}`, `${this.formatosDeDatas.dataFormato}`).format(`${this.formatosDeDatas.htmlDataFormato}`);
        grupo['dataUltimaSessao'] = moment(`${grupo['dataUltimaSessao']} ${grupo['dataUltimaSessao']}`, `${this.formatosDeDatas.dataFormato}`).format(`${this.formatosDeDatas.htmlDataFormato}`);

        (grupo['recorrencia']) ? this.recorrencia["frequencia"] = (grupo['recorrencia']).split(',') : null;
        (grupo['repetir'] != undefined ) ? this.recorrencia["repetir"] = grupo['repetir'].toString() : null;

        return grupo;
    }

    pesquisarPacientes(evento) {

        if (evento.trim() != "") {
            this.pacientesFiltro = this.pacientes.filter(function (paciente) {
                let filter = '.*' + evento.toUpperCase() + '.*';

                return paciente.paciente.nome.match(filter);
            });
        } else {
            this.pacientesFiltro = this.pacientes;
        }

    }

    pesquisarResponsaveis(evento) {

        if (evento.trim() != "") {
            this.responsaveisFiltro = this.pacientes.filter(function (responsavel) {
                let filter = '.*' + evento.toUpperCase() + '.*';

                return responsavel.nome.match(filter);
            });
        } else {
            this.responsaveisFiltro = this.responsaveis;
        }

    }
    
    adicionarPaciente(){
        this.objParamsAddPaciente['grupo'] = { id : this.idGrupo };

        if( this.todasSessoes ){
            // delete this.objParamsAddPaciente['recorrencias'];
            this.objParamsAddPaciente['recorrencias'] = this.novoGrupo['recorrencias'].map(
                (recorrencia) => {
                    if( recorrencia.id ){
                        return {
                            grupoRecorrencia : {
                                id : recorrencia.id
                            }
                        }
                    }else{
                        return 
                    }
                }
            ).filter( 
                (recorrencia) => {
                    return recorrencia && recorrencia.grupoRecorrencia && recorrencia.grupoRecorrencia.id
                } 
            )          

        }else if( !this.recorrenciaVariavel ){
            this.validaRecorrenciaPaciente();
        }
        
        if( this.jaExistePaciente( this.objParamsAddPaciente['paciente']['id'] ) ){
            this.toastr.warning("Esse paciente já esta adicionado no grupo")
            return;
        }

        if( !this.planoSelecionado ){
            this.toastr.warning("Informe o plano do Paciente")
            return;
        }
        this.objParamsAddPaciente['pacientePlano'] = { "id": this.planoSelecionado['id'] };

        if( isNaN(parseInt(this.objParamsAddPaciente['qtdSessoes'])) || parseInt(this.objParamsAddPaciente['qtdSessoes']) <= 0)
            delete this.objParamsAddPaciente['qtdSessoes'];

        console.log(this.objParamsAddPaciente);
            
        let request = JSON.parse(JSON.stringify(this.objParamsAddPaciente));
        request.paciente = {id: request.paciente.id};
        this.serviceGrupo.salvarPacientes( request ).subscribe( 
            pacientes => {
                this.toastr.success("Paciente adicionado com sucesso");
                (this['recorrenciaInstanciaPaciente']) ? this['recorrenciaInstanciaPaciente'].atualizaRecorrenciaDia(this.novoGrupo["recorrencias"]) : null;
                this.todasSessoes = true;
                if( this.listaEspera.length > 0 ){
                    this.atualizaLista();
                }else{
                    this.buscarPacientes({ paginaAtual: 1 }, null, true);                    
                }

                this.activeModal.close();
                this.objParamsAddPaciente = new Object();
                this.objParamsAddPaciente['recorrencias'] = [];
            }, erro => {
                this.toastr.error("Limite de pacientes do grupo excedido");
                this.activeModal.close();
            }
        )
    }
    jaExistePaciente(id){
        let existe = this.pacientes.filter( (paciente) => { return paciente.paciente.id == id } )
        return (existe.length > 0);
    }

    editarPaciente(){
        console.log(this.objParamsAddPaciente);
        
        this.serviceGrupo.atualizarPacientes( this.pacienteSelecionado.id, this.objParamsAddPaciente ).subscribe( 
            pacientes => {
                this.toastr.success("Paciente editado com sucesso");
                this.buscarPacientes();

                this.activeModal.close();
                this.objParamsAddPaciente = new Object();
            }, erro => {
                this.toastr.error("Houve um erro ao editar o paciente");
                this.activeModal.close();
            }
        )
    }

    validaRecorrenciaPaciente(){

        let tempRec = [];
        let objRec = this.recorrenciaPaciente['objRecorrenciaDetalhada'];
        this.recorrenciaPaciente['frequencia'].forEach(
            (idFreq) => {
                let obj = {  "grupoRecorrencia" : { id : objRec[idFreq]['id'] } };
            
                this.objParamsAddPaciente['recorrencias'].push( obj )  
            }
        )
    }

    adicionarResponsavel(){
        this.objParamsAddResponsavel['grupo'] = { id : this.idGrupo };
        
        if (this.jaExisteReponsavel( this.objParamsAddResponsavel['usuario']['guid'] )){
            this.toastr.warning("Esse responsável já esta adicionado no grupo")
            return;
        }

        this.serviceGrupo.salvarGrupoResponsavel( this.objParamsAddResponsavel ).subscribe( responsaveis => {
            this.toastr.success("Responsável adicionado com sucesso");
            this.buscarResponsaveis();
        })
    }
    jaExisteReponsavel(guid){
        let existe = this.responsaveis.filter( (responsavel) => { return responsavel.usuario.guid == guid } )
        return (existe.length > 0);
    }

    removeItem( id, nome, tipo ){
        this.modalInstancia = this.modalService.open(NgbdModalContent, {size: 'lg'});
        this.modalInstancia.componentInstance.modalHeader = `Remover ${tipo} do Grupo ${this.novoGrupo['descricao']}` ;

        this.modalInstancia.componentInstance.templateRefBody = this.bodyModalRemoverItem;
        this.modalInstancia.componentInstance.templateBotoes = this.templateBotoesModalRemoverItem;
        
        this.observacaoRemocao = "";
        this.tipoRemocao = tipo;
        this.tipoEncerramento = '0';
        this.textoModalExclusao = `Você esta removendo o ${tipo} ${nome} deste Grupo.`
        this.fnRemove = ( tipo == 'paciente' ) ? this.removePaciente(id) : this.removeResponsavel(id) ;
        this.itemRemocao = id;
    }

    validaConfirmaREmocao(){
        if( this.observacaoRemocao == '' || !this.observacaoRemocao ){
            return true;
        }

        if( this.tipoRemocao == 'paciente' ){
            if( this.tipoEncerramento == '0' || !this.tipoEncerramento ){
                return true;
            }
        }
        
        return false;
    }

    removerDaLista(itemRemocao){
        this.fnRemove();
        this.modalInstancia.close();
    }

    buscarAtendimentoEsperaPaginado(evento = null, paciente = null) {
        this.paginaAtualListaEspera = evento ? evento.paginaAtualListaEspera : this.paginaAtualListaEspera;
        this.serviceAtendimentoEspera.atendimentoEsperaPaginado(this.paginaAtualListaEspera, this.itensPorPaginaListaEspera, { idGrupoTema: this.novoGrupo['tema']['id'] }).subscribe(
            (listaEspera) => {
                this.listaEspera = this.listaEspera.concat([], listaEspera.dados);
                this.qtdItensTotalListaEspera = listaEspera.qtdItensTotal;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );
    }

    temaSelecionado
    getTemaGrupo(evento){
        if( evento ){
            this.temaSelecionado = evento['descricao']
            this.novoGrupo['tema'] = { 
                id : evento['id'], 
                descricao: evento['descricao'], 
                especialidade: { descricao : evento['especialidade']['descricao'] } 
            }

         }else{
            this.novoGrupo['tema'] = undefined
         } 

    }

    atualizaLista(){
        let id = this.pacienteSelecionado;
        if( id ){
            let atendimentoEsperaRequest = {
                "saida": moment().format(this.formatosDeDatas.dataHoraSegundoFormato),
                "observacao": "Removido ao adicionar ao grupo"
            };
            this.serviceAtendimentoEspera.atualizar(id, atendimentoEsperaRequest).subscribe(
                () =>{
                    this.buscarAtendimentoEsperaPaginado();
                }, 
                erro => {
                    console.warn("Paciente nao estava na lista de espera. ok")
                }
            )
        }
        this.pacienteSelecionado = undefined;
        this.linhaSelecionada = undefined
    }

    removeResponsavel(id){
        return function(){
                let dataAtual = moment( moment() ).format( this.formatosDeDatas.dataHoraSegundoFormato )
                this.serviceGrupo.excluirGrupoResponsavel( id, this.observacaoRemocao ).subscribe( responsaveis => {
                this.toastr.success("Responsavel excluido com sucesso");
                this.buscarResponsaveis();
            })
        }
    }

    removePaciente(id){
        return function(){
                let dataAtual = moment( moment() ).format( this.formatosDeDatas.dataHoraSegundoFormato )

                this.serviceGrupo.deleteGrupoPaciente( id, this.observacaoRemocao,  this.tipoEncerramento, dataAtual ).subscribe( paciente => {
                    
                this.serviceGrupo.excluirGrupoPaciente(id).subscribe( ()=>{ console.log("Paciente excluido do grupo"); } );

                this.toastr.success("Paciente excluido com sucesso");
                this.buscarPacientes();
            })
        }
    }

    objResponsaveis
    fnCfgResponsavelRemote(term) {
        this.usuarioService.usuarioPaginadoFiltro( 1, 10, term ).subscribe(
            (retorno) => {
                this.objResponsaveis = retorno.dados || retorno;
            }
        )
    }
    
    responsavelSelecionado
    getResponsavel(evento){
        if( evento ){
            this.objParamsAddResponsavel['usuario'] = { guid : evento['guid'] };
            this.responsavelSelecionado = evento['nome'];
        }else{
            this.objParamsAddResponsavel['usuario'] = undefined;
        }
    }
    

    objPacientes    
    fnCfgPacienteRemote(term) {
        this.servicePaciente.getPacienteLike({ like : term, simples: false}, false, true).subscribe(
            (retorno) => {
                this.objPacientes = retorno.dados || retorno;
            }
        );
    }

    objTemas;    
    fnCfgTemaRemote(term) {
        return this.serviceTemaGrupo.get( { like : term } ).subscribe(
            (retorno)=> {
                this.objTemas = retorno.dados || retorno;
            }
        )
    }

    voltar() {
        this.router.navigate([`/${Sessao.getModulo()}/agendamentogrupo/grupos`]);
    }
    
    selecionaRecorrencia(item, idRec){
        (!jQuery(item).hasClass("selecionado")) ? jQuery(item).addClass("selecionado") : jQuery(item).removeClass("selecionado")

        this.objParamsAddPaciente['recorrencias'].push(idRec)
        
    }

    pegaDiaSemana(dia){
         
    }

    fnRecorrenciaSelecionado(evento){
    }

    fnRecorrenciaMostraBotao(recorrencia) {
        if (!this.idGrupo) {
            return false;
        }
        return !recorrencia.id || recorrencia.alterado;
    }


    permiteUsuarioEditar = true;
    fnSalvaRecorrencia(frequencia, isDelete = false) {

        if( !this.podeEditarRecorrencia() ){
            this.toastr.error("O Usuario nao tem permissao para editar");
            return;
        }

        if (!isDelete && !this.validaFrequencia(frequencia.diaDaSemana)) {
            return;
        }

        frequencia['grupo'] = {id: this.idGrupo};

        console.log(frequencia);
        
        if (isDelete && frequencia.id) {
            
            this.grupoRecorrenciaService.delete(frequencia.id).subscribe( recorrenciaResponse => {
                this.toastr.success("Recorrencia removida");
                this.setGrupo();
            }, erro => {
                Servidor.verificaErro(erro, this.toastr);
            });

        } else if(isDelete && !frequencia.id) {
            return;

        } else if (frequencia.id) {
            this.grupoRecorrenciaService.put(frequencia,frequencia.id).subscribe( recorrenciaResponse => {
                this.toastr.success("Recorrencia atualizada");
                this.setGrupo();
            }, erro => {
                Servidor.verificaErro(erro, this.toastr);
            });

        } else {
            this.grupoRecorrenciaService.post(frequencia).subscribe( recorrenciaResponse => {
                this.toastr.success("Recorrencia adicionada");
                this.setGrupo();
            }, erro => {
                Servidor.verificaErro(erro, this.toastr);
            });
        }
    }
    salvaRecorrenciaPacienteTable(){

    }

    objRecorrenciaPacienteTable(){
        return this.novoGrupo["recorrencias"];
    }

    recorrenciasPaciente = [];
    abreRecorrenciaPaciente(modalEditarPaciente, modalEditarPacienteBotoes, paciente, pos, abreAposSelecionar = false){

        this.pacienteSelecionado = paciente;
        
        this.activeModal = this.modalService.open(NgbdModalContent, {size: 'lg'});
        this.activeModal.componentInstance.modalHeader  = `Editar Paciente ${paciente.paciente.nome}`;
        this.activeModal.componentInstance.templateRefBody = modalEditarPaciente;
        this.activeModal.componentInstance.templateBotoes = modalEditarPacienteBotoes;

        if( !this.recorrenciaVariavel ){
            let objRec = [];
            let objFreq = [];

            paciente.recorrencias.forEach(
                (recorrencia) => {
                    let rec = recorrencia.grupoRecorrencia
                    delete rec['grupo'];
                    delete rec['excluido'];
                    rec['id'] = recorrencia.id
                    rec['desativado'] = false;
                    objRec.push( rec )

                    objFreq.push( rec.diaDaSemana );
                }
            )

            this.novoGrupo["recorrencias"].forEach(
                (recGrupo) => {

                    if( objRec.filter( (recPac) => { return recPac.diaDaSemana == recGrupo.diaDaSemana } ).length == 0 ){
                        delete recGrupo['grupo'];
                        delete recGrupo['excluido'];
                        recGrupo['desativado'] = true;
                        objRec.push( recGrupo )
                                
                    }
                }
            )

            this.objRecorrenciaPacienteAtual = objRec;

            setTimeout(()=>{
                this['recorrenciaInstanciaPacienteTable'].atualizaRecorrenciaDia(this.objRecorrenciaPacienteAtual);
                this['recorrenciaInstanciaPacienteTable'].set('frequencia', objFreq);
            },1000);
        }else{
            let objrecorrenciaPaciente = Object.assign([], this.recorrenciasVariaveis.map(
                (recorrencia) => {
                    return Object.assign({}, recorrencia);
                }
            ));
            objrecorrenciaPaciente.forEach(
                (objrecorrencia, idx) => {

                    let recorrenciasPaciente = paciente.recorrencias.map(
                        (recorrencia) => {
                            return {
                                id: recorrencia.id,
                                grupoRecorrencia:{
                                    id: recorrencia.grupoRecorrencia.id
                                }
                            }
                        }
                    )

                    let existe = recorrenciasPaciente.filter(
                        (recorrenciaPaciente) => {
                            return recorrenciaPaciente.grupoRecorrencia.id == objrecorrencia.id
                        }
                    )

                    if( existe && existe.length ){
                        (this.objParamsAddPaciente['recorrencias']) ? this.objParamsAddPaciente['recorrencias'].push(existe[0]) : this.objParamsAddPaciente['recorrencias'] = [ existe[0] ];
                        objrecorrenciaPaciente[idx]['checado'] = true;
                        console.log(existe[0]);
                        
                        objrecorrenciaPaciente[idx]['grupoRecorrencia'] = {
                            id: existe[0].grupoRecorrencia.id
                        }
                        objrecorrenciaPaciente[idx]['id'] = existe[0].id;
                        
                    }
                }
            )

            this.recorrenciasPaciente = objrecorrenciaPaciente
        }
    }

    recorrenciaPacienteObjTable(recorrencia, isDelete = false) {
        
        let esse = this;
        if (isDelete) {
            this.serviceGrupo.deletarRecorrenciaPaciente(recorrencia.id).subscribe( recorrenciaResponse => {
                esse.toastr.success("Recorrencia removida");
                recorrencia.grupoRecorrencia = {
                    id : (recorrencia.grupoRecorrencia) ? recorrencia.grupoRecorrencia.id : recorrencia.id
                };
                esse.buscarPacientes();
            }, erro => {
                Servidor.verificaErro(erro, this.toastr);
            });

        } else {
            let objparam = {
                "grupoPaciente": {
                    "id": this.pacienteSelecionado.id
                },
                "grupoRecorrencia": {
                    "id": (recorrencia.grupoRecorrencia) ? recorrencia.grupoRecorrencia.id : recorrencia.id
                }
            }
            this.serviceGrupo.salvarRecorrenciaPaciente(objparam).subscribe( recorrenciaResponse => {
                esse.toastr.success("Recorrencia adicionada");
                recorrencia.grupoRecorrencia = {
                    id : (recorrencia.grupoRecorrencia) ? recorrencia.grupoRecorrencia.id : recorrencia.id
                };
                recorrencia.id = recorrenciaResponse;
                esse.buscarPacientes();
            }, erro => {
                Servidor.verificaErro(erro, this.toastr);
            });
        }

        this.linhaSelecionada = undefined;
    }

    abreModalAdicionaPaciente(modalAdicionarPaciente, modalAdicionarPacienteBotoes){
        this.activeModal = this.modalService.open(NgbdModalContent, {size: 'lg'});
        this.activeModal.componentInstance.modalHeader  = 'Adicionar Paciente ao Grupo';
        this.activeModal.componentInstance.templateRefBody = modalAdicionarPaciente;
        this.activeModal.componentInstance.templateBotoes = modalAdicionarPacienteBotoes;
        
        setTimeout(()=>{
            (this['recorrenciaInstanciaPaciente']) ? this['recorrenciaInstanciaPaciente'].atualizaRecorrenciaDia(this.novoGrupo["recorrencias"]) : null;
        },1000);

        this.recorrenciasPaciente = this.recorrenciasVariaveis.map(
            (recorrencia) => {
                return {
                    id: (recorrencia.grupoRecorrencia) ? recorrencia.grupoRecorrencia.id : recorrencia.id,
                    grupoRecorrencia: recorrencia.grupoRecorrencia,
                    horaFim: recorrencia.horaFim,
                    horaInicio: recorrencia.horaInicio,
                    checado: false
                }
            }
        )

        this.activeModal.result.then(
            (data) => this.buscarPacientes(),
            (reason) => this.buscarPacientes() )
    }

    getPlano(plano){
        this.planoSelecionado = plano;
    }

    valorPacienteSelecionado;
    setObjParamPaciente(evento){
        if( evento ){
            this.objParamsAddPaciente['paciente'] = { 
                id : evento.id,
                beneficiarios: evento.beneficiario,
                planos: evento.planos
            };
            
            if( evento['paciente'] )
                this.pacienteSelecionado = evento.id;
            else
                this.pacienteSelecionado = undefined        

            this.valorPacienteSelecionado = evento.nome;

        }        
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

    iniciarSessaoDeHoje(ontem = false){

        let dataSessao = (ontem) ? moment().subtract(1, "day").format( this.formatosDeDatas.dataFormato ) : moment().format( this.formatosDeDatas.dataFormato )

        let objParams = {
            "grupo" : {
                "id" : parseInt(this.idGrupo)
            },
            "usuarioExecucao": {
                "guid": this.usuario.guid
            },
            "data" : dataSessao,
            "sessaoAtual" : ((ontem) ? false : true)
        }

        this.serviceGrupo.iniciarSessao( objParams, ((ontem) ? false : true) ).subscribe(
            (response) => {
                if (response && response.mensagem) {
                    this.router.navigate([`/${Sessao.getModulo()}/agendamentogrupo/grupo/${this.idGrupo}`]);

                    setTimeout(() => {
                        this.toastr.warning(response.mensagem);
                    }, 500);
                    return;
                }
                this.router.navigate([`/${Sessao.getModulo()}/agendamentogrupo/grupo/${this.idGrupo}/sessao/${response}/visualizar`]);
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
                this.router.navigate([`/${Sessao.getModulo()}/agendamentogrupo/grupo/${this.idGrupo}`]);
            }
        )

    }

    encerrarGrupo() {
        let request = {"encerramento": moment().format(this.formatosDeDatas.dataFormato)};

        this.serviceGrupo.atualizarGrupo(request, this.idGrupo).subscribe(
            retorno => {
                this.toastr.success("Grupo " + this.novoGrupo['descricao'] + " encerrado com sucesso");
                this.router.navigate([`/${Sessao.getModulo()}/agendamentogrupo/grupos`]);
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        ) 
    }

    podeEditarRecorrencia(){
        let isAdm = this.usuario.papeis.filter(papel => {
            return papel.nome == "WEBPEP:ADMINISTRADOR" || papel.nome == "WEBPEP:CONFIGURAGRUPOS";                    
        })
        return (isAdm.length > 0);
    }

    novaRecorrenciaVariavel(recorrencia = undefined){
        console.log(this.recorrenciasVariaveis);

        if( !moment(recorrencia.data, this.formatosDeDatas.dataHoraSegundoFormato).isValid() ){
            this.toastr.warning("A data selecionada deve ser válida");
            return
        }else if( !recorrencia.horaInicio ){
            this.toastr.warning("Hora inicio deve ser valida");
            return
        }else if( !recorrencia.horaFim ){
            this.toastr.warning("Hora fim deve ser valida");
            return
        }

        console.log(recorrencia);

        if( recorrencia ){

            recorrencia['grupo'] = { id: this.idGrupo };
            this.recorrenciasVariaveis.push( {
                data: recorrencia['data']
            } );

            if (recorrencia.id) {
                this.grupoRecorrenciaService.put(recorrencia,recorrencia.id).subscribe( recorrenciaResponse => {
                    this.toastr.success("Recorrencia atualizada");
                    this.setGrupo();
                }, erro => {
                    Servidor.verificaErro(erro, this.toastr);
                });

            } else {
                this.grupoRecorrenciaService.post(recorrencia).subscribe( recorrenciaResponse => {
                    this.toastr.success("Recorrencia adicionada");
                    this.setGrupo();
                }, erro => {
                    Servidor.verificaErro(erro, this.toastr);
                });
            }
        }
    }

    adicionarRecorrenciaPaciente(recorrencia, naoSalva = false){
        if( recorrencia.checado ){
            console.warn("Desmarcando");
            
            this.objParamsAddPaciente['recorrencias'] = this.objParamsAddPaciente['recorrencias'].filter(
                (objrecorrencia) => {
                    let obj = (objrecorrencia && objrecorrencia.length) ? objrecorrencia[0] : objrecorrencia
                    return ( (obj.grupoRecorrencia.id) != ((recorrencia.grupoRecorrencia) ? recorrencia.grupoRecorrencia.id : obj.grupoRecorrencia.id) ) || (obj.id != recorrencia.id)
                }
            ) 
            recorrencia.checado = false;
            if( !naoSalva ){
                this.recorrenciaPacienteObjTable(recorrencia, true);
            }
        }else{
            console.warn("Marcando");
            if(this.objParamsAddPaciente['recorrencias'] && this.objParamsAddPaciente['recorrencias'].length){
                this.objParamsAddPaciente['recorrencias'].push( {
                    id: recorrencia.id,
                    grupoRecorrencia : {
                        id : (recorrencia.grupoRecorrencia) ? recorrencia.grupoRecorrencia.id : recorrencia.id
                    }
                } )
            }else{
                this.objParamsAddPaciente['recorrencias'] = [{ 
                    id: recorrencia.id,
                    grupoRecorrencia : {
                        id : (recorrencia.grupoRecorrencia) ? recorrencia.grupoRecorrencia.id : recorrencia.id
                    }
                }]
            }

            recorrencia.checado = true;
            if( !naoSalva ){
                this.recorrenciaPacienteObjTable(recorrencia, false);
            }
        }
        
    }

    removeRecorrenciaVariavel(recorrencia){
        this.grupoRecorrenciaService.delete(recorrencia.id).subscribe( recorrenciaResponse => {
            this.toastr.success("Recorrencia removida");
            this.setGrupo();
        }, erro => {
            Servidor.verificaErro(erro, this.toastr);
        });
    }

    validaDesabilitar(){
        return false;
    }
}