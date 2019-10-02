import { ActivatedRoute, Router } from '@angular/router';
import { Component, ViewChild, ViewContainerRef, Input, Output, EventEmitter, OnInit, TemplateRef, QueryList } from '@angular/core';

import { ToastrService } from 'ngx-toastr';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { Sessao, Servidor, Util, AtendimentoService, FormularioService, ProfissionalPacienteService, LogAtendimentoService,
        LocalAtendimentoService, EstadoCivilService,  UtilService, PacienteParentescoService, PacienteOperadoraService,
        PacienteService, GuiaService, PacienteDocumentoService, ExameService, PainelSenhaService, UsuarioService,
        EspecialidadeService, PrescricaoItemService, ProfissionalService, PacientePrescricaoService,
        PacienteCoacherService, PacienteCuidadoExecucaoService, AtendimentoTipoTussService } from 'app/services';

import { Saida, FormatosData, NgbdModalContent, Aguardar, DatePicker } from 'app/theme/components';

import * as sha1 from 'js-sha1';

import * as moment from 'moment';
moment.locale('pt-br');


@Component({
    selector: 'view-paciente',
    templateUrl: './formulario.html',
    styleUrls: ['./formulario.scss'],
    providers: [ EspecialidadeService, DatePicker ],
})
export class FormularioPaciente implements OnInit {

    @Input() modalCadastro;
    @Input() idPaciente;
    @Input() validaCadastroBasico;
    @Output() emitpaciente = new EventEmitter();
    @Output() emitplano = new EventEmitter();
    

    contatosPaciente = [];
    opcSexo = [ { 'id' : 'M', 'descricao' : 'Masculino' }, { 'id' : 'F', 'descricao' : 'Feminino' } ];
    opcEstadoCivil;

    novaEvolucaoLoading;
    novoDocumentoLoading;

    instanciaBtnSearch;
    instanciaBtnSearchOper;
    instanciaBtnSearchParentesco;
    alertaDescricao: Saida;
    parentescos;
    operadoras;
    alertas = [];
    atendimento;
    atual = "basico";
    cids;
    consultorio: string = localStorage.getItem('consultorio');
    descricao: Saida;
    descricaoValor;
    evolucaoId: Saida;
    evolucaoIdValor;
    evolucoes;
    exames;
    prescricoes = [];
    disabledIndicador = false;
    limiteIndicePerguntas = 1;
    novoParentesco = new Object();
    novoOperadora = new Object();
    examesFiltrados;
    filtro = "";
    formularios;
    somenteLeitura;
    usuarioAtendimento;
    usuarioAtendimentoClinica;
    atendimentosPaciente = [];
    id: number;
    tipo: Saida;
    tipoValor;
    activeModal:any;
    unidade: string = localStorage.getItem('unidade');
    copiaEvolucao;
    chegou: Boolean = false;
    segundos: number = 50;
    limiteRechamada: number= 3;
    modalHtml: string;
    rda;
    codigo;
    paciente = new Object();

    idAbaAberta;
    filtroGuias;
    guias = [];
    guiasFiltrados;
    qtdItensTotal;
    paginaAtual = 1;
    itensPorPagina = 10;

    paginaAtualHist = 1;
    itensPorPaginaHist = 15;
    qtdItensTotalHist;

    paginaAtualEvolucoes = 1;
    itensPorPaginaEvolucoes = 10;
    qtdItensTotalEvolucoes;

    novoPaciente = true;

    objParamsPaciente = new Object();
    objParamsPlano = new Object();
    objParamsEndereco = new Object();
    objParamsContato = new Object();
    objParamsResponsavel = new Object();
    sessao = Sessao;

    criaNovoEndereco;
    criaNovoContato;
    criaNovoPlano;
    criaNovoResponsavel;

    momentjs = moment;
    formatosDeDatas;
    salvo = true;
    imagem;

    idFormAberto;
    modalEvolucaoInstancia;

    respostasCabecalho = {};
    respostas;

    @ViewChild("bodyModalAtendimento", {read: TemplateRef}) bodyModal: QueryList<TemplateRef<any>>;
    @ViewChild("templateBotoesAtendimento", {read: TemplateRef}) templateBotoes: QueryList<TemplateRef<any>>;
    
    @ViewChild("bodyModalAdicionaParentesco", {read: TemplateRef}) bodyModalAdicionaParentesco: TemplateRef<any>;
    @ViewChild("modalAdicionaParentescoBotoes", {read: TemplateRef}) modalAdicionaParentescoBotoes: TemplateRef<any>;

    @ViewChild("bodyModalAdicionaOperadora", {read: TemplateRef}) bodyModalAdicionaOperadora: TemplateRef<any>;
    @ViewChild("modalAdicionaOperadoraBotoes", {read: TemplateRef}) modalAdicionaOperadoraBotoes: TemplateRef<any>;

    @ViewChild("alteraStatusAgendamentoModal", {read: TemplateRef}) alteraStatusAgendamentoModal: TemplateRef<any>;
    @ViewChild("botoesModalAlteraStatusAgendamento", {read: TemplateRef}) botoesModalAlteraStatusAgendamento: TemplateRef<any>;

    @ViewChild("bodyModalLogAtendimento", {read: TemplateRef}) bodyModalLogAtendimento: TemplateRef<any>;
    @ViewChild("botoesModalLogAtendimento", {read: TemplateRef}) botoesModalLogAtendimento: TemplateRef<any>;
    
    @ViewChild("bodyInformacoesAtendimento", {read: TemplateRef}) bodyInformacoesAtendimento: TemplateRef<any>;
    @ViewChild("botoesInformacoesAtendimento", {read: TemplateRef}) botoesInformacoesAtendimento: TemplateRef<any>;

    @ViewChild("bodyGuiaAtendimento", {read: TemplateRef}) bodyGuiaAtendimento: TemplateRef<any>;
    @ViewChild("botoesGuiaAtendimento", {read: TemplateRef}) botoesGuiaAtendimento: TemplateRef<any>;
    
    @ViewChild("bodyPerguntasNaoRespondidas", {read: TemplateRef}) bodyPerguntasNaoRespondidas: TemplateRef<any>;
    
    constructor(
        private service: AtendimentoService,
        private servicePaciente: PacienteService,
        private pacienteCoacherService: PacienteCoacherService,
        private servicePacienteCuidadoExecucao: PacienteCuidadoExecucaoService,
        private serviceFormulario: FormularioService,
        private usuarioService: UsuarioService,
        private serviceEstadoCivil: EstadoCivilService,
        private serviceLocalAtendimento: LocalAtendimentoService,
        private serviceLogAtendimento: LogAtendimentoService,
        private route: ActivatedRoute,
        private serviceLocal: UtilService,
        private router: Router,
        private atendimentoTipoTussService: AtendimentoTipoTussService,
        private pacienteDocumentoService: PacienteDocumentoService,
        private servicePacientePrescricao: PacientePrescricaoService,
        private serviceParentesco: PacienteParentescoService,
        private serviceOperadora: PacienteOperadoraService,
        private guiaService: GuiaService,
        private serviceUtil: UtilService,
        private exameService: ExameService,
        private serviceEspecialidade: EspecialidadeService,
        private modalService: NgbModal,
        private serviceSenha: PainelSenhaService,
        private serviceProfissionalPaciente: ProfissionalPacienteService,
        private serviceItemPrescricao: PrescricaoItemService,
        private profissionalService: ProfissionalService,
        private toastr: ToastrService,
        public vcr: ViewContainerRef) 
    {
        this.atendimentoTipoTussService;
        this.route.params.subscribe(params => {
            let preferenciasUsuarios = Sessao.getPreferenciasUsuario();
            this.somenteLeitura = preferenciasUsuarios['atendimentoReadOnly'];
            if( Sessao.getIdUnidade() ){
                let unidadeSelecionada = Sessao.getVariaveisAmbiente().unidadeAtendimentoUsuario.filter(
                    (unidade) => {
                        return unidade.id == Sessao.getIdUnidade();
                    }
                )
        
                if( unidadeSelecionada && unidadeSelecionada.length ){
                    this.copiaEvolucao = unidadeSelecionada[0].copiaEvolucao;
                }else{
                    this.copiaEvolucao = false;
                }
                
            }else{
                this.copiaEvolucao = false;
            }

            this.id = params['id'];
            this.idPaciente = params['idpaciente'];
            
            if( this.idPaciente || this.id ){
                this.novoPaciente = false;

                if(this.id){
                    this.atual = "evolucoes";
                }
            }
        });
    }


    ngOnDestroy(){
        this.idFormAberto = undefined;
    }

    enum;
    usuarioGuid;
    formularioDocumentos = [];
    unidadesAtendimento = [];
    eResponsavel = false;
    ngOnInit() {        
        this.novaEvolucaoLoading = false;
        this.novoDocumentoLoading = false;
        this.formatosDeDatas = new FormatosData;
        this.novoParentesco = new NovoParentesco(null);
        this.novoOperadora = new NovoOperadora(null);

        this.enum = Sessao.getEnum('AtendimentoStatus').lista;
        this.unidadesAtendimento = Sessao.getVariaveisAmbiente('unidadesAtendimento');
        
        if( !this.modalCadastro ){
            this.serviceFormulario.getFormularioPorTokenAtivoTipo("CRIAR", { tipo: 'EVOLUCAO' })
                .subscribe((formularios) => {
                    this.formularios = formularios;
                },
                (erro) => {Servidor.verificaErro(erro, this.toastr);}
            );
            
            this.serviceFormulario.getFormularioPorTokenAtivoTipo("CRIAR", { tipo: 'MODELO' })
                .subscribe((documentos) => {
                    this.formularioDocumentos = documentos;
                },
                (erro) => {Servidor.verificaErro(erro, this.toastr);}
            );
        } else {
            console.log("Busca paciente modal cadastro");
            if( this.idPaciente ){
                this.novoPaciente = false;
                this.getPaciente(this.idPaciente);
            }
        }

        this.servicePaciente.getTiposContatoPaciente({}).subscribe(
            (tipos) => {
                this.contatosPaciente = tipos.dados || tipos;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        )

        this.usuarioService.usuarioSessao().subscribe(
            (usuario) => {
                this.usuarioGuid = usuario.guid;
                let usuarioAtendimentoClinica = [];
                let possuiAtendimento = usuario.papeis.filter(papel => {
                    if( papel.nome == "WEBPEP:ATENDIMENTO_CLINICAUNIMED" ){
                        usuarioAtendimentoClinica.push(papel);
                    }
                    return papel.nome == "WEBPEP:ATENDIMENTO";                    
                })
                this.usuarioAtendimento = (possuiAtendimento.length > 0);
                this.usuarioAtendimentoClinica = (usuarioAtendimentoClinica.length > 0);
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );

        this.refreshParentescos(null, false);
        this.refreshOperadoras(null, false);

        this.serviceEstadoCivil.get().subscribe(
            (dados) => {
                this.opcEstadoCivil = dados
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }


    mostraPrescricoes = true;
    ngAfterViewInit() {
        
        if( this.novoPaciente )
            return

        if (this.id) {
            this.service.getId(this.id)
                .subscribe((atendimento) => {
                    this.atendimento = atendimento.dados[0];
                    this.paciente = this.atendimento.paciente;
                    if( this.atendimento.guia && this.atendimento.guia.id ){
                        this.guiaVinculada = this.atendimento.guia.id;
                    }else if( this.atendimento.guiaImpresso ){
                        this.guiaVinculada = this.atendimento.guiaImpresso;
                    }else{
                        this.guiaVinculada = undefined;
                    }
                    
                    this.guiaValida = this.guiaVinculada;
                    if (this.atendimento.status === 'SALADEESPERA') {
                        
                        if (this.atendimento.senha && !this.somenteLeitura) {
                            this.activeModal = this.modalService.open(NgbdModalContent, { size: 'sm' });
                            this.activeModal.componentInstance.modalHeader = 'Chamando paciente';
                            this.activeModal.componentInstance.templateRefBody = this.bodyModal;
                            this.activeModal.componentInstance.templateBotoes  = this.templateBotoes;

                            let fnInicio = () => {
                                console.log("Modal Fechada!");
                            };
                            this.activeModal.result.then((data) => fnInicio, fnInicio);

                            this.inicializaModalAtendimento();

                        } else if (!this.somenteLeitura) {

                            this.iniciar();
                        }
                    }

                    this.getPaciente(this.paciente['id']);
                }, (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                }
            );
        }

        if (this.idPaciente) {
            this.getPaciente(this.idPaciente);
        }
    }

    usuarioPacienteSelecionado;
    getPaciente(pacienteId) {
        this.servicePaciente.getPaciente( { id : pacienteId } ).subscribe(
            (paciente) => {
                this.paciente = paciente.dados[0];
                this.usuarioPacienteSelecionado = this.paciente['usuario'] ? this.paciente['usuario']['nome'] : ''

                this.criaObjRespostasCabecalho();

                if( !this.modalCadastro ){
                    this.servicePaciente.getPacienteFoto(this.paciente['id'], false).subscribe(
                        (result) => {
                            if (!result.match(".*assets.*")) {
                                this.imagem = this.servicePaciente.getPacienteFoto(this.paciente['id'], true)
                            }
                        }, (erro) => {
                            // TODO erro 406 foto
                            // Servidor.verificaErro(erro, this.toastr);
                        }
                    );
                    this.buscarDocumentos();
                    // this.buscarPrescricoes();
                    // this.buscaExames();
                    this.buscaExamesPaginado();
                    this.buscaGuiasPaginado();
                    this.buscarPacienteDiagnosticos();
                    this.buscarPacienteDocumento();
                    this.buscarProfissionais();
                }

                //ATUALIZA PACIENTE PLANO PRINCIPAL
                this.fnHabilitaCheckboxPrincipal(null)
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    buscaGuiasPaginado(evento = null){

        this.paginaAtual = evento ? evento.paginaAtual : this.paginaAtual;
        if( this.paciente['id'] ){
            this.guiaService.getGuiasPorPacienteCodigoPaginado( {pacienteId: this.paciente['id'], pagina: this.paginaAtual, quantidade: this.itensPorPagina } )
                .subscribe((guias) => {
                    this.guias = (this.paginaAtual == 1) ? this.guias = guias.dados : this.guias.concat( [], guias.dados );
                    this.guiasFiltrados = this.guias;
                    this.qtdItensTotal  = guias.qtdItensTotal;
                },
                (erro) => {Servidor.verificaErro(erro, this.toastr);}
            );
        }else{
            this.toastr.warning("Nao ha paciente selecionado");
            this.guias = [];
            this.qtdItensTotal  = 0;
        }

    }

    imprimir(event, id, opcao) {
        event.preventDefault();

        if ( opcao == 'evolucao') {
            window.open(this.pacienteDocumentoService.evolucaoPdf(id), "_blank");
        }

        if ( opcao == 'documento') {
            window.open(this.pacienteDocumentoService.modeloPdf(id), "_blank");
        }

        event.stopPropagation();
    }

    idCopia;
    prepara = false;
    copiar(event, id) {
        event.preventDefault();

        if ( this.prepara ) {
            this.pacienteDocumentoService.getId({ id: this.idCopia }).subscribe(
                (documento) => {
                    this.respostas = documento.dados[0];
                    this.prepara = false;
                    this.idCopia = null;
                }, (error) => {
                    Servidor.verificaErro(error, this.toastr);
                }
            );

        } else {
            this.idCopia = id;
            this.prepara = true;
            event.stopPropagation();
        }
    }

    imprimirPrescricao(id){
        console.log("imprimir");
    }

    paginaAtualProfissional = 1;
    qtdItensTotalProfissional = 0;
    ItensPorPaginaProfissional = 10;
    profissionaisPaciente;
    buscarProfissionais(pagina = 1){
        let request = {
            pacienteId: this.atendimento ? this.atendimento.paciente.id : this.idPaciente,
            quantidade: this.itensPorPagina,
            pagina: pagina,
            ativos: true
        };
        this.serviceProfissionalPaciente.get( request ).subscribe(
            (retorno) => {
                this.profissionaisPaciente = retorno.paginaAtual == 1 ? retorno.dados : this.profissionaisPaciente.concat([], retorno.dados);

                this.paginaAtualProfissional = retorno.paginaAtual;
                this.qtdItensTotalProfissional = retorno.qtdItensTotal;
                

                this.validaProfissional();
                this.validaCoacher();
            },
            (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        )
    }

    validaProfissional(){
        if( this.profissionaisPaciente && this.profissionaisPaciente.length){
            let eProfissional = this.profissionaisPaciente.filter(
                (profissional) => {
                    return ( ( !profissional.fim ) && ( profissional.usuario.guid == Sessao.getUsuario()['guid'] ) );
                }
            )
            if( eProfissional && eProfissional.length ){
                this.eResponsavel = true;
            }
        }
    }

    validaCoacher(){
        let filtro = new Object();
        filtro['ativos'] = true;
        filtro['pacienteId'] = this.atendimento ? this.atendimento.paciente.id : this.idPaciente;
        filtro['usuarioGuid'] = Sessao.getUsuario()['guid'];

        this.pacienteCoacherService.getPacienteCoacher(filtro).subscribe(
            (retorno) => {
                let coacher = retorno.dados || retorno;
                console.log("retorno coacher " + coacher);
                
                if( coacher && coacher.length ){
                    this.eResponsavel = true;
                    
                }
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        )
    }

    especialidadeItens = [];
    setObjItensGuia(){
        this.profissionaisPaciente.forEach(
            (item) => {
                // if ( this.especialidadeItens.indexOf(item.procedimento.classe.descricao) < 0 ){
                //     this.especialidadeItens.push(item.procedimento.classe.descricao);
                // }
            }
        )
    }

    tipoContato = "text"
    getTipoContato($event) {
        if ($event.valido) {
            this.objParamsContato['tipo'] = $event.valor;
            this.tipoContato = $event.valor;
        }
    }

    getDescricaoContato($event) {
        if ($event.valido) {
            this.objParamsContato['descricao'] = $event.valor;
        }
    }

    retornaItensGuiaClasse(classe){

        let retornoArray = [];
        if( this.profissionaisPaciente && this.profissionaisPaciente.length ){
            this.profissionaisPaciente.forEach(
                (item, index) => {
                    // if( item.procedimento.classe.descricao == classe ){
                    //     item['posicao'] = index;
                    //     retornoArray.push( item );
                    // }
                }
            )

            return retornoArray;
        }
         
        return retornoArray;
    }

    adicionarProfissional(){
        if( !this.novoProfissional['usuario'] ){
            this.toastr.warning("Selecione um profissional");
            return
        }

        if( !this.novoProfissional['especialidade'] ){
            this.toastr.warning("Selecione uma especialidade");
            return
        }

        if( !this.novoProfissional['unidadeAtendimento'] ){
            this.toastr.warning("Selecione uma unidade de atendimento");
            return
        }

        this.novoProfissional['paciente'] = { id : this.atendimento ? this.atendimento.paciente.id : this.idPaciente };

        this.novoProfissional['inicio'] = moment().format(this.formatosDeDatas.dataHoraSegundoFormato);

        this.serviceProfissionalPaciente.post( this.novoProfissional ).subscribe(
            (retorno) => {
                this.toastr.success("Profissional adicionado ao paciente");
                this.novoProfissional = new Object();
                this.profissionalSelecionado = '';
                this.especialidadeSelecionada = '';
                this.buscarProfissionais();
            },
            (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        )
    }

    desativarProfissional(profissional){
        this.modalConfirmar = this.modalService.open(NgbdModalContent);
        this.modalConfirmar.componentInstance.modalHeader = `${profissional.usuario.nome} - ${profissional.especialidade.descricao}`;
        this.modalConfirmar.componentInstance.modalMensagem = `Deseja desativar esse profissional`;
        this.modalConfirmar.componentInstance.modalAlert = true;

        this.modalConfirmar.componentInstance.retorno.subscribe(
            (retorno) => {
                if (retorno) {
                    let params = { fim: moment().format(this.formatosDeDatas.dataHoraSegundoFormato) };
            
                    this.serviceProfissionalPaciente.put( profissional.id, params ).subscribe(
                        () => {
                            this.toastr.success("Profissional desativado");
                            this.buscarProfissionais(1);
                        }, (error) => {
                            Servidor.verificaErro(error, this.toastr);
                        }
                    );
                }
            }
        );
    }

    pesquisar(texto) {
        if (texto) {
            this.serviceProfissionalPaciente.get( { like: texto  } )
                .subscribe((profissionais) => {
                    this.profissionaisPaciente = profissionais.dados;
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                },
            );
        }else{
            this.buscarProfissionais();
        }
    }

    buscarPacienteDocumento() {
        let request = { 
            idPaciente: this.paciente['id'], 
            tipo: 'EVOLUCAO', 
            simples: true, 
        }

        // if( !Sessao.validaPapelUsuario('WEBPEP:ADMINISTRADOR') ){
        //     request['unidadeAtendimentoId'] = localStorage.getItem('idUnidade');
        // }
        this.pacienteDocumentoService.getPacienteToken(request)
            .subscribe((evolucoes) => {
                this.evolucoes = evolucoes.dados.filter((evolucao) => { return !evolucao.pacienteDocumentoPai});
                this.novaEvolucaoLoading = false;
            },
            (erro) => {Servidor.verificaErro(erro, this.toastr);}
        );
    }

    documentos = [];
    buscarDocumentos() {

        let request = { 
            idPaciente: this.paciente['id'], 
            tipo: 'MODELO', 
            simples: true,
        }

        // if( !Sessao.validaPapelUsuario('WEBPEP:ADMINISTRADOR') ){
        //     request['unidadeAtendimentoId'] = localStorage.getItem('idUnidade');
        // }
        this.pacienteDocumentoService.getPacienteToken(request)
            .subscribe((documentos) => {
                this.documentos = documentos.dados.filter((evolucao) => { return !evolucao.pacienteDocumentoPai});
                this.novoDocumentoLoading = false;
            },
            (erro) => {Servidor.verificaErro(erro, this.toastr);}
        );
    }

    

    buscarPacienteDiagnosticos() {
        this.pacienteDocumentoService.getCid(this.paciente['id'])
            .subscribe((cids) => {
                this.cids = cids;
            },
            (erro) => {Servidor.verificaErro(erro, this.toastr);}
        );
    }

    paginaAtualExames = 1;
    itensPorPaginaExames = 0;
    buscaExamesPaginado(evento:any = {}) {
        let request = {
            idPaciente: this.paciente['id'],
			pagina: evento.paginaAtual || this.paginaAtualExames,
			quantidade: this.itensPorPaginaExames
        }

        this.exameService.getGrupoFiltro(request)
            .subscribe((exames) => {
                this.exames = exames.dados || exames;
                this.examesFiltrados = exames.dados || exames;
            },
            (erro) => {Servidor.verificaErro(erro, this.toastr);}
        );
    }

    
    buscaExames() {
        this.exameService.getGrupo(this.paciente['id'])
            .subscribe((exames) => {
                this.exames = exames;
                this.examesFiltrados = exames;
            },
            (erro) => {Servidor.verificaErro(erro, this.toastr);}
        );
    }

    totalPrescricoes;
    itensPorPaginaPrescricoes = 20;
    paginaAtualPrescricoes = 1;
    buscarPrescricoes(evento = null){

        let request = {
            pagina : evento ? evento.paginaAtual : this.paginaAtualPrescricoes,
            quantidade: this.itensPorPaginaPrescricoes,
            validaEspecialidade: false
        }

        let requestBODY = {
            paciente: {
                id: this.atendimento ? this.atendimento.paciente.id : this.idPaciente
            }
        }

        // this.servicePacientePrescricao.get( {
        //         pacienteId : this.atendimento ? this.atendimento.paciente.id : this.idPaciente,
        //         validaEspecialidade: false
        //     } ).subscribe(
        this.servicePacientePrescricao.postPrescricaoPacienteFiltro( requestBODY, request ).subscribe(
            (prescricoesPaciente) => {
                let retorno = prescricoesPaciente.dados || prescricoesPaciente;
                this.prescricoes = (request.pagina == 1) ? retorno : this.prescricoes.concat([], retorno);
                this.totalPrescricoes = prescricoesPaciente.qtdItensTotal;
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        )
    }

    getFiltro(evento) {
        this.filtro = evento.valor;

        if (evento.valido) {
            if (evento.valor.trim() != "") {
                this.examesFiltrados = this.exames.filter(function (tmp) {
                    let filter = '.*' + evento.valor.toUpperCase() + '.*';
                    let retorno:Boolean = false;

                    tmp.exames.forEach(
                        function(val) {
                            if (!retorno) {
                                retorno = val.descricao.match(filter);
                            }
                        }
                    );

                    return retorno;
                });
            } else {
                this.examesFiltrados = this.exames;
            }
        } else {
            this.examesFiltrados = this.exames;
        }
    }

    getFiltroGuias(evento){
        this.filtroGuias = evento.valor;

        if (evento.valido) {
            if (evento.valor.trim() != "") {
                this.guiasFiltrados = this.guias.filter(function (tmp) {
                    let filter = '.*' + evento.valor.toUpperCase() + '.*';
                    let retorno:Boolean = false;

                    console.log(tmp);
                    
                    tmp.guia.itens.forEach(
                        function(val) {
                            
                            if (!retorno) {
                                retorno = val.procedimento.descricao.match(filter);
                            }
                        }
                    );

                    return retorno;
                });
            } else {
                this.guiasFiltrados = this.guias;
            }
        } else {
            this.guiasFiltrados = this.guias;
        }
    }

    inicializaModalAtendimento(){
        this.service.getId(this.id).subscribe(
            (atendimento) => {
                this.atendimento = atendimento.dados[0];

                if (!this.somenteLeitura) {
                    this.iniciar();
                }

            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );
    }

    idAbaAbertaPergunta;
    abrirAbaPergunta(idAba) {
        if (this.idAbaAbertaPergunta == idAba) {
            this.idAbaAbertaPergunta = "";
        } else {
            this.idAbaAbertaPergunta = idAba;
        }
    }

    abrir() {
        this.activeModal.close();

        let atendimento = {
            id: this.id,
            inicio: moment().format(this.formatosDeDatas.dataHoraSegundoFormato),
            status: 'EMATENDIMENTO'
        };

        this.service.atualizar(atendimento.id, atendimento).subscribe(
            () => {
                this.chegou = true;
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );

        if( this.unidade && this.consultorio ){
            this.serviceSenha.iniciarAtendimento(this.unidade, this.consultorio).subscribe(
                () => {
                    console.log("INICIAR ATENDIMENTO");
                }, (error) => {
                    console.log(error);
                    console.error("ERRO AO INICIAR ATENDIMENTO")
                    Servidor.verificaErro(error, this.toastr);
                }
            );
        }
    }

    abrirResultado(id, exame, urlExame = undefined) {
        // Validar com Eduardo o retorno de urlExame
        // exames[""0""].exame.urlExame
        // let urlExame =  (exame.exames && exame.exames.length) ? exame.exames[0].exame.urlExame
        if( !urlExame ){
            if (exame.chave || exame.anexo) {
                let url:any = this.exameService.getLink(id, true);
                window.open(url, "_blank");
                // this.exameService.getLink(id)
                //     .subscribe((link) => {
                //         let tmplink = link.text();
                //         if( tmplink ){
                //             if (tmplink.match('http')) {
                //                 window.open(tmplink, "_blank");
                //             }else{
                //                 this.toastr.warning(tmplink);
                //             }
                //         }
                //     }, (error) => {
                //         Servidor.verificaErro(error, this.toastr);
                //     },
                // );
            }
        }else{
            if (urlExame.match('http')) {
                window.open(urlExame, "_blank");
            }else{
                this.toastr.warning(urlExame);
            }
        }
    }

    abrirAbaExame(idAba) {
        if (this.idAbaAberta == idAba) {
            this.idAbaAberta = "";
        } else {
            this.idAbaAberta = idAba;
        }
    }

    cancelar() {
        this.activeModal.close();
        this.router.navigate([`/${Sessao.getModulo()}/atendimento`]);
    }

    loadingChamar = false;
    chamar() {

        if( this.loadingChamar ){
            return;
        }
        this.loadingChamar = true

        if( !this.unidade ){
            alert("Usuario nao tem nenhuma unidade selecionada");

            localStorage.removeItem('unidade');
            localStorage.removeItem('consultorio');
            localStorage.removeItem('idUnidade');
            
            this.router.navigate([`/${Sessao.getModulo()}/dashboard`]);
        }

        if( this.consultorio && this.atendimento.senha ){
            this.serviceSenha.chamarsenha(this.unidade, this.consultorio, this.atendimento.senha)
                .subscribe(
                () => {
                    this.loadingChamar = false;

                    let obj = {
                        "descricao": `Chamou a senha - ${this.atendimento.senha}`,
                        "atendimento" : {
                            "id" : this.atendimento.id
                        }
                    }
                    this.serviceLogAtendimento.post(obj).subscribe(
                        (retorno) => {
                            console.log("Senha chamada: " + retorno);   
                        }, (error) => {
                            Servidor.verificaErro(error, this.toastr);
                        }
                    )

                    Aguardar.aguardar(this.segundos, this.router).then(() => {

                        if (!this.chegou) {
                            this.rechamar();
                        }
                    });
                },
                (error) => {
                    this.erroSenha();
                    this.loadingChamar = false;
                    Servidor.verificaErro(error, this.toastr);
                    this.geraLog('Erro ao chamar a senha ' + this.atendimento.senha);
                }
            );
        }else{
            this.activeModal ? this.activeModal.close() : null;
        }
    }

    loadingRechamar = false;
    rechamar() {
        this.limiteRechamada--;
        if(this.limiteRechamada === 0){
            return;
        }

        console.log("rechamar");
        
        if( this.loadingRechamar ){
            return;
        }
        this.loadingRechamar = true
        console.log("passei. rechama");
        
        
        
        Aguardar.aguardar(this.segundos, this.router).then(() => {

            if (!this.chegou) {
                if( this.unidade && this.consultorio ){
                    this.serviceSenha.rechamarsenha(this.unidade, this.consultorio).subscribe(
                        () => {
                            this.loadingRechamar = false;

                            let obj = {
                                "descricao": `Rechamou a senha - ${this.atendimento.senha}`,
                                "atendimento" : {
                                    "id" : this.atendimento.id
                                }
                            }
                            this.serviceLogAtendimento.post(obj).subscribe(
                                (retorno) => {
                                    console.log("Senha chamada: " + retorno);   
                                }, (error) => {
                                    Servidor.verificaErro(error, this.toastr);
                                }
                            )
                        },
                        (error) => {
                            this.erroSenha();
                            this.loadingRechamar = false;
                            Servidor.verificaErro(error, this.toastr);
                            this.geraLog('Erro ao rechamar a senha ' + this.atendimento.senha);
                        }
                    );
                        
                    this.rechamar();
                }
            }
        });
    }

    modalConfirmar;
    @ViewChild("bodyModalConfirm", {read: TemplateRef}) bodyModalConfirm: QueryList<TemplateRef<any>>;
    erroSenha() {
        let modalHtml = this.modalHtml;

        let body = jQuery('#modalBody');
        body.html('Não foi possível chamar o paciente através do painel de senha.');

        jQuery('.modal-footer button.btn-primary').removeClass('btn-primary').addClass('btn-danger').html('Ciente');
    }

    geraLog(mensagem){
        if( this.atendimento && this.atendimento.id ){
            let obj = {
                "descricao": mensagem,
                "atendimento" : {
                    "id" : this.atendimento.id
                }
            }
            this.serviceLogAtendimento.post(obj).subscribe(
                (retorno) => {
                    console.log("Senha chamada: " + retorno);   
                }, (error) => {
                    Servidor.verificaErro(error, this.toastr);
                }
            )
        }
    }

    atualizar() {

    }

    validaSeIniciaAtendimento(){
        let retorno = false;
        if (this.atendimento && (this.atendimento.status === 'PENDENTE' || this.atendimento.status === 'SALADEESPERA' || this.atendimento.status === 'PREATENDIMENTO')){

            if ( this.atendimento.configuracoesHorario && !this.atendimento.configuracoesHorario.length) {
                console.warn("Atendimento sem configuração de horário");
                return true;
            } else if (this.atendimento.configuracoesHorario[0].configuraHorario.atendimentoTipo) {
                
                if (this.atendimento.configuracoesHorario[0].configuraHorario.atendimentoTipo.recepciona) {
                    retorno = true;
                }

            } else if (this.atendimento.tipo && this.atendimento.tipo.recepciona) {
                retorno = true;
            }
        }

        return retorno;
    }

    getDescricao(evento) {
        this.descricao = evento;
    }

    getAlertaDescricao(evento) {
        this.alertaDescricao = evento;
    }

    getTipo(evento) {
        this.tipo = evento;
    }

    navegar(destino) {
        this.atual = destino;
    }

    getEvolucao(evento) {
        this.evolucaoId = evento;
        this.evolucaoIdValor = evento.valor;
    }

    documentoId;
    documentoIdValor;
    getDocumento(evento) {
        this.documentoId = evento;
        this.documentoIdValor = evento.valor;
    }

    submit() {
        let pergunta = {
            "descricao": this.descricao.valor,
            "tipo": this.tipo.valor
        };

        if (!this.id) {
            this.service.inserir(pergunta).subscribe(
                (status) => {
                    if (status) {
                        this.router.navigate([`/${Sessao.getModulo()}/pergunta`]);
                    }
                }, (error) => {
                    Servidor.verificaErro(error, this.toastr);
                }
            );
        }
        else {
            this.service.atualizar(this.id, pergunta).subscribe(
                (status) => {
                    if (status) {
                        this.router.navigate([`/${Sessao.getModulo()}/pergunta`]);
                    }
                }, (error) => {
                    Servidor.verificaErro(error, this.toastr);
                }
            );
        }
    }

    novaEvolucao() {

        this.validaSeTemUnidadeSelecionada();

        if (this.novaEvolucaoLoading){
            this.novaEvolucaoLoading = false;
            return;
        }

        if( !this.evolucaoId || (this.evolucaoId && this.evolucaoId.valor == '0')){
            this.toastr.warning("Selecione um formulario");
            return;
        }

        let possuiFormulario = this.evolucoes.filter(
            (evolucao) => {
                let retorno = false;

                if( moment( evolucao.data, this.formatosDeDatas.dataHoraSegundoFormato ).format(this.formatosDeDatas.dataFormato) == moment().format(this.formatosDeDatas.dataFormato)  ){
                    console.log("Mesmo dia");

                    if( evolucao.formulario.id == this.evolucaoId.valor ){
                        console.log("Mesmo ID:  " + this.evolucaoId.valor);
                        retorno = true;
                    }
                }
            }
        )

        if( possuiFormulario.length ){
            if( !confirm('Esse formulário já existe para o paciente. \nDeseja criar outro?') ){
                return;
            }
        }

        this.novaEvolucaoLoading = true;
        let novoFormulario = {
            paciente: { id: this.paciente['id'] },
            formulario: { id: parseInt(this.evolucaoId.valor) },
            atendimento: { id: this.id },
            status:'ATIVO',
            data: moment().format(this.formatosDeDatas.dataHoraSegundoFormato),
        };

        if( !Sessao.validaPapelUsuario('WEBPEP:ADMINISTRADOR') ){
            novoFormulario['unidadeAtendimento'] = { id : localStorage.getItem('idUnidade') };
        }

        if( !this.id ){
            delete novoFormulario.atendimento;
        }

        this.pacienteDocumentoService.inserir(novoFormulario).subscribe(
            (id) => {
                // let novoParamForm = { formulario: novoFormulario.formulario.id, paciente: novoFormulario.paciente.id };
                // console.log(novoParamForm);

                // let objFormulario = [];
                // if( sessionStorage.getItem("formularios") ){
                //     console.log(sessionStorage.getItem("formularios"))
                //     objFormulario = JSON.parse( sessionStorage.getItem("formularios") )

                //     if( objFormulario[novoFormulario.paciente.id] ){

                //     }else{
                //         objFormulario[novoFormulario.paciente.id] = new Object
                //     }
                //     objFormulario.push( novoParamForm )
                // }else{
                //     console.log(objFormulario)
                //     objFormulario.push( novoParamForm );
                // }

                // sessionStorage.setItem("formularios", JSON.stringify(objFormulario))

                this.buscarPacienteDocumento();
                this.abrirFormulario(id);
            }, (error) => {
                this.novaEvolucaoLoading = false;
                Servidor.verificaErro(error, this.toastr);

                // TODO Validar o modo offline
                let sair = false;
                if (error.status == 511 && sair) {
                    let id = error.json();
                    var request = indexedDB.open('cacheRequest');
                    request.onsuccess = ($event:any) => {

                        // get database from $event
                        var db = $event.target.result;

                        // create transaction from database
                        var transaction = db.transaction('formularios', 'readwrite');

                        var formulariosStore = transaction.objectStore('formularios');
                        console.log("Vou buscar");


                        formulariosStore.openCursor(null,'next').onsuccess = (event) => {
                            var cursor = event.target.result;
                            if (cursor) {
                                console.log(cursor.value[0].formulario.id  + " =  " + cursor.value[0].formulario.titulo);
                                
                                if (cursor.value[0].formulario.id == novoFormulario.formulario.id) {
                                    console.log("Fomrulario encontrado offline");
                                    let novaEvolucao = [
                                        { 
                                            id: id, 
                                            data: moment().format(this.formatosDeDatas.dataHoraSegundoFormato), 
                                            usuario: cursor.value[0].usuario,
                                            formulario : cursor.value[0].formulario
                                        }
                                    ]
                                    
                                    this.evolucoes = novaEvolucao.concat( [], this.evolucoes );
                                    console.log(this.evolucoes);
                                    this.toastr.warning("Formulario adicionado em modo offline");
                                    this.abrirFormulario(id);

                                } else {
                                    cursor.continue();        
                                }

                                // if(cursor.value.albumTitle === 'A farewell to kings') {
                                //     var updateData = cursor.value;
                                    
                                //     updateData.year = 2050;
                                //     var request = cursor.update(updateData);
                                //     request.onsuccess = function() {
                                //         console.log('A better album year?');
                                //     };
                                // };

                            } else {
                                this.toastr.warning('Formulario nao encontrado offline');         
                                return
                            }
                        };
                    };
                }
            }
        );
    }

    novoDocumento() {
        if (this.novoDocumentoLoading){
            this.novoDocumentoLoading = false;
            return;
        }

        if( !this.documentoId || (this.documentoId && this.documentoId.valor == '0')){
            this.toastr.warning("Selecione um documento");
            return;
        }

        this.novoDocumentoLoading = true;

        let novoFormulario = {
            paciente: { id: this.paciente['id'] },
            formulario: { id: this.documentoId.valor },
            atendimento: { id: this.id },
            data: moment().format(this.formatosDeDatas.dataHoraSegundoFormato),
        };

        if( !Sessao.validaPapelUsuario('WEBPEP:ADMINISTRADOR') ){
            novoFormulario['unidadeAtendimento'] = { id : localStorage.getItem('idUnidade') };
        }

        if( !this.id ){
            delete novoFormulario.atendimento;
        }

        this.pacienteDocumentoService.inserir(novoFormulario).subscribe(
            (id) => {
                this.buscarDocumentos();
                this.abrirDocumento(id);
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    unidadeSelecionada = undefined;
    usoContinuo = false;
    transcricao = false;
    profissional = new Object();
    arquivo;
    novaPrescricao(){

        if( !this.unidadeSelecionada ){
            this.toastr.warning("Informe o local onde o paciente será medicado");
            return;
        }

        if( this.transcricao && !this.profissional ){
            this.toastr.warning("Transcrição deve ter um profissional selecionado");
            return;
        }

        if( this.transcricao && !this.arquivo ){
            this.toastr.warning("Transcrição deve ter o anexo da prescrição médica");
            return;
        }

        let param = {
            data : moment().format(this.formatosDeDatas.dataHoraSegundoFormato),
            usuario: {
                guid: this.usuarioGuid
            },
            unidadeAtendimento: { 
                id : this.unidadeSelecionada
            },
            usoContinuo: this.usoContinuo,
            transcricao: this.transcricao
        }

        if( this.transcricao ){
            param['profissional'] = this.profissional;
        }

        if( this.atendimento ){

        let paramsAtendimento = {
            atendimento: { 
                id : this.atendimento.id 
            },
            paciente: { 
                id : this.paciente['id'] 
            }
        }
        param = Object.assign(param, paramsAtendimento);
        }

        if( this.idPaciente ){
            param['paciente'] = {
                id : this.idPaciente
            }
        }

        if( this.transcricao  ){
            console.log(this.arquivo);
            
            this.serviceUtil.postArquivo(this.arquivo).subscribe(
                (arquivoId) => {
                    param['arquivo'] = {
                        id: arquivoId
                    }
                    this.salvarPrescricaoMedica(param);
                },
                (error) => {
                    Servidor.verificaErro(error, this.toastr);
                    return;
                }
            );
        }else{
            this.salvarPrescricaoMedica(param);
        }
        
    }

    salvarPrescricaoMedica(param){
        this.servicePacientePrescricao.salvar(param).subscribe(
            (retorno) => {
                let tipo = this.transcricao ? 'Transcrição' : 'Prescrição';
                this.toastr.success( tipo + ' criada com sucesso' );
                this.usoContinuo = false;
                this.transcricao = false;
                this.profissional = undefined;
                this.profissionalPrescricaoSelecionado = '';
                this.idAbaPrescricao = retorno;
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        )
    }

    enviarAnexo(anexo) {
        this.arquivo = anexo;
    }

    anexaArquivo(anexo){
        if( !anexo )
            this.arquivo = undefined
    }

    abrirAnexo(ev, id) {
        ev.stopPropagation();
        ev.preventDefault();

        window.open(this.serviceUtil.getArquivo(id, true), '_blank');
    }

    abrirFormulario(id) {
        if (this.idFormAberto == id) {
            this.idFormAberto = undefined;
            this.respostas = undefined;
            return;
        }

        this.idFormAberto = id;
    }

    diasAntes = 15;
    diasDepois = 15;
    execucoesPaciente = [];
    evolucaoCuidado;
    @ViewChild("bodyCuidadoExecucoesPaciente", {read: TemplateRef}) bodyCuidadoExecucoesPaciente: TemplateRef<any>;
    @ViewChild("botoesCuidadoExecucoesPaciente", {read: TemplateRef}) botoesCuidadoExecucoesPaciente: TemplateRef<any>;
    salvaFormulario(evolucaoSalva){
        this.evolucoes.filter(
            (evolucao) => {
                if (evolucao.id == evolucaoSalva.id) {
                    evolucao.status = "FINALIZADO";
                }
            }
        );

        if( this.eResponsavel ){

            let request = {
                pacienteLista: [
                    {
                        id: this.atendimento ? this.atendimento.paciente.id : this.idPaciente
                    }
                ],
                formulario: {
                    id: evolucaoSalva.formulario.id
                },
                dataInicial: moment().subtract( this.diasAntes, 'd' ).format(this.formatosDeDatas.dataHoraSegundoFormato),
                dataFinal: moment().add( this.diasDepois, 'd' ).format(this.formatosDeDatas.dataHoraSegundoFormato)
            }

            let requestURL = {
                semPermissao: false,
                simples: true
            }
            // VALIDA
            this.servicePacienteCuidadoExecucao.postPacienteCuidadoExecucaoFiltro(request, requestURL).subscribe(
                (retorno) => {
                    console.log(retorno);
                    let execucoes = retorno.dados || retorno;

                    execucoes = execucoes.filter(
                        (execucao) => {
                            return !execucao.executado
                        }
                    )
                    if( execucoes.length ){
                        this.toastr.success("Existem ações para esse formulário");

                        this.execucoesPaciente = execucoes;
                        this.evolucaoCuidado = evolucaoSalva.id;

                        let cfgGlobal:any = Object.assign(NgbdModalContent.getCfgGlobal(), {size: 'lg'});

                        this.activeModal = this.modalService.open(NgbdModalContent, cfgGlobal );
                        this.activeModal.componentInstance.modalHeader  = 'Cuidados do Paciente para esse Formulário';
                        this.activeModal.componentInstance.templateRefBody = this.bodyCuidadoExecucoesPaciente;
                        this.activeModal.componentInstance.templateBotoes = this.botoesCuidadoExecucoesPaciente;

                    }else{
                        this.toastr.warning("Não há ações para esse paciente desse formulário");
                    }
                }, (error) => {
                    Servidor.verificaErro(error, this.toastr);
                }
            );

        }else{
            if (this.idFormAberto == evolucaoSalva.id) {
                this.idFormAberto = undefined;
            }else{
                this.idFormAberto = evolucaoSalva.id;
            }
        }
    }

    execucaoSelecionada;
    selecionarExecucao(execucao){
        this.execucaoSelecionada = execucao;
    }

    salvarExecucaoEvolucao(){
        if( this.execucaoSelecionada && this.execucaoSelecionada.id ){
            this.atualizarPacienteDocumento(this.execucaoSelecionada.id);
            return;
        }
        this.salvarExecucao(this.execucaoSelecionada);
    }

    documentoSelecionado;
    abrirDocumento(id){
        if (this.idFormAberto == id) {
            this.idFormAberto = undefined;
            this.documentoSelecionado = undefined;
            return;
        }

        this.idFormAberto = id;
        this.pacienteDocumentoService.getId( { id : id } ).subscribe(
            (documento) => {
                this.documentoSelecionado = documento.dados[0];
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        )
    }

    salvarExecucao(param){
        let objPacienteExecucao = {
            "pacienteCuidado": {
                "id": param.pacienteCuidado.id
            },
            "previsto": param.previsto
        }

        this.servicePacienteCuidadoExecucao.postPacienteCuidadoExecucao( objPacienteExecucao ).subscribe(
            (idExecucao) => {
                this.atualizarPacienteDocumento(idExecucao);
            },
            (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        )
    }

    atualizarPacienteDocumento(idExecucao){

        let request = {
            pacienteDocumento:{
                id: this.evolucaoCuidado
            },
            executado: moment().format( this.formatosDeDatas.dataHoraSegundoFormato )
        }

        this.servicePacienteCuidadoExecucao.putPacienteCuidadoExecucao(idExecucao, request).subscribe(
            () => {
                this.toastr.success("Execução foi salva com sucesso");

                if (this.idFormAberto == this.evolucaoCuidado) {
                    this.idFormAberto = undefined;
                }else{
                    this.idFormAberto = this.evolucaoCuidado;
                }

                this.activeModal.dismiss();
            },
            (error)=>{
                Servidor.verificaErro(error, this.toastr);
                this.activeModal.dismiss();
            }
        )
    }

    inserirAlerta() {
        let alerta = {
            paciente: { id: this.paciente['id'] },
            data: moment().format(this.formatosDeDatas.dataHoraSegundoFormato),
            usuario: this.atendimento.usuario,
            descricao: this.alertaDescricao.valor
        };

        this.pacienteDocumentoService.inserirAlerta(alerta).subscribe(
            () => {
                this.alertaDescricao = new Saida();
                this.alertas.push(alerta);
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    tipoAtendimentoFatura;
    iniciar() {
        let atendimento:any = new Object();

        let unidadeVinculaGuia = Sessao.getVariaveisAmbiente().unidadeAtendimentoUsuario.filter(
            (unidade) => {
                return this.atendimento.unidadeAtendimento.id == unidade.id;
            }
        )

        if( unidadeVinculaGuia && unidadeVinculaGuia.length ){
            unidadeVinculaGuia = unidadeVinculaGuia[0].vinculaGuia;
        }else{
            unidadeVinculaGuia = undefined;
        }

        atendimento.inicio = moment().format(this.formatosDeDatas.dataHoraSegundoFormato);
        atendimento.status = 'EMATENDIMENTO';
        if( localStorage.getItem('idConsultorio') ){
            atendimento.guiche = {
                id: localStorage.getItem('idConsultorio')
            };
        }

        if ( this.atendimento.configuracoesHorario && !this.atendimento.configuracoesHorario.length ) {
            console.warn("Atendimento sem configuração de horário");
        } else if ( this.atendimento.configuracoesHorario[0].configuraHorario.tipo == "COLETIVA" ) {
            atendimento.usuario = { guid: this.usuarioGuid };
        } else {
            delete atendimento.usuario;
        }

        this.tipoAtendimentoFatura = this.atendimento && this.atendimento.tipo ? this.atendimento.tipo.faturar : null;
        if ( unidadeVinculaGuia && this.tipoAtendimentoFatura && ( (!this.atendimento.guia && !this.atendimento.guiaImpresso) || ( this.atendimento.guia && !this.atendimento.guia.id ) || ( !this.atendimento.guia && !this.atendimento.guiaImpresso ) ) ) {
            this.verificaGuia();
            return;
        }
        
        this.atualizarAtendimento(atendimento);
    }

    atendimentoTipoTussFaturar;
    atualizarGuia(){
        let atendimento:any = new Object();
        atendimento.inicio = moment().format(this.formatosDeDatas.dataHoraSegundoFormato);
        atendimento.status = 'EMATENDIMENTO';
        // atendimento.guia = {
        //     impresso: this.guiaVinculada
        // }

        if( this.tipoAtendimentoFatura ){
            atendimento.guiaImpresso = this.guiaVinculada;

            if( !this.atendimentoTipoTussFaturar || ( this.atendimentoTipoTussFaturar && !this.atendimentoTipoTussFaturar.length ) ){
                this.toastr.error("É obrigatório selecionar ao menos um procedimento para faturar");
                return
            }else{
                atendimento['atendimentoTipoTuss'] = this.atendimentoTipoTussFaturar
            }
        }

        this.atualizarAtendimento(atendimento);
    }

    atualizarAtendimento(atendimento, observableItensFaturar = null){
        this.service.atualizar(this.id, atendimento).subscribe(
            () => {
                this.atendimento.editar = true;
                if( atendimento.status ){
                    this.atendimento.status = atendimento.status;
                    this.atendimento.guia = atendimento.guia;
                }
                this.chamar();
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    guiaVinculada;
    guiaValida = true;
    verificaGuia() {
        this.activeModal ? this.activeModal.close() : null;

        if (!this.guiaValida && !this.guiaVinculada || ( (!this.atendimento.guia && !this.atendimento.guiaImpresso) || !this.atendimento.guia.id || this.atendimento.guia.id == '' ) || ( !this.atendimento.guia && !this.atendimento.guiaImpresso ) ) {
            this.activeModal = this.modalService.open(NgbdModalContent, {size: 'lg'});
            this.activeModal.componentInstance.modalHeader  = 'Impresso da Guia';
            this.activeModal.componentInstance.templateRefBody = this.bodyGuiaAtendimento;
            this.activeModal.componentInstance.templateBotoes = this.botoesGuiaAtendimento;

        } else if (this.atendimento.guia || this.atendimento.guiaImpresso) {
            return true;
        }
        return false;
    }

    validaSalvandoResposta(salvando){
        this.salvandoResposta = salvando;
        if( salvando ){
            // console.log("Tentou finalizar antes de salvar resposta");
            return
        }else{
            // console.log("Estava salvando");
            if( this.tentouFinalizar ){
                this.finalizar();
            }else{
                // console.log("Impede salvamento");
            }
        }
    }

    perguntasObrigatoriasNaoRespondidas = [];    
    salvandoResposta = false;
    tentouFinalizar = false;
    finalizar() {
        this.perguntasObrigatoriasNaoRespondidas = [];
        this.tentouFinalizar = true;
        if( this.salvandoResposta ){
            this.geraLog("Tentou finalizar antes de salvar resposta");
            return;
        }
        // TODO VALIDAR PERGUNTAS OBRIGATÓRIAS HTML
        // this.pacienteDocumentoService.getId({ atendimentoId : this.id}).subscribe(
        //     (responseEvolucao) => {
        //         let evolucoes = responseEvolucao.dados;
        //         let iValidacao = 0;
        //         if (!evolucoes.length) {
        //             // ATENDIMENTO SEM EVOLUÇÃO
        //             this.toastr.error("É necessário preencher uma evolução para esse atendimento");
        //             this.atual = 'evolucoes';
        //             return;
        //         } else {
        //             // ATENDIMENTO COM EVOLUÇAO
        //             evolucoes.forEach((evolucao, index) => {
        //                 if( evolucao.status != 'ATIVO' ){
        //                     return;
        //                 }
        //                 let objPerguntasNaoRespondidasPaciente = {
        //                     formulario: evolucao.formulario.titulo,
        //                     pergunta : []
        //                 }
        
        //                 evolucao.formulario.formularioGrupo.forEach((form) => {
        //                     let aPerguntasObrigatorias = form.grupoPergunta.filter((grupoPergunta)=>{return grupoPergunta.obrigatorio});
        
        //                     // objPerguntasNaoRespondidas['pergunta'] = [];
        
        //                     aPerguntasObrigatorias.forEach((pergunta) => {
        //                         let perguntaObrigatoria = pergunta.pergunta;
        //                         let bTemResposta = evolucao.formularioResposta.filter((resposta) => {
        //                             return pergunta.pergunta.id == resposta.pergunta.id;
        //                         });
                                
        //                         console.log("as respostas");
        //                         console.log(evolucao.formularioResposta);
        
        //                         console.log("as obrigatorias");
        //                         console.log(aPerguntasObrigatorias);
        
        //                         let objPergunta;
        //                         if (bTemResposta.length == 0) {
        //                             iValidacao--;// = false;
        //                             objPerguntasNaoRespondidasPaciente['pergunta'].push( perguntaObrigatoria );
        //                         }
        //                     });
        //                 });
        
        //                 if( objPerguntasNaoRespondidasPaciente['pergunta'] && objPerguntasNaoRespondidasPaciente['pergunta'].length ){
        //                     this.perguntasObrigatoriasNaoRespondidas.push( objPerguntasNaoRespondidasPaciente );
        //                 }
        
        //             });
        //         }
                
        //         if (this.perguntasObrigatoriasNaoRespondidas.length && iValidacao < 0) {

        //             this.atual = 'evolucoes';
        //             this.idFormAberto = responseEvolucao.dados[0].id

        //             this.toastr.error("Existem perguntas obrigatórias nao respondidas");

        //             this.activeModal = this.modalService.open(NgbdModalContent, {size: 'lg'});
        //             this.activeModal.componentInstance.modalHeader  = 'Perguntas Obrigatorias nao respondidas';
        //             this.activeModal.componentInstance.templateRefBody = this.bodyPerguntasNaoRespondidas;
        //             return;
        //         } else {
                    let atendimento = Object.assign({}, this.atendimento);

                    atendimento.fim = moment().format(this.formatosDeDatas.dataHoraSegundoFormato);
                    atendimento.status = "ATENDIDO";

                    delete atendimento.paciente;        
                    // atendimento['paciente'] = { id : this.paciente['codigo'] };

                    delete atendimento.prestador;
                    delete atendimento.local;
                    delete atendimento.usuario;
                    delete atendimento.UsuarioAgendamento;
                    delete atendimento.configuracoesHorario;
                    delete atendimento.unidadeAtendimento;
                    delete atendimento.pacientePlano;
                    delete atendimento.tipo;
                    delete atendimento.observacao;
                    delete atendimento.guia;
                    delete atendimento.guiche;

                    this.service.atualizar(this.id, atendimento).subscribe(
                        () => {
                            this.salvandoResposta = false;
                            this.tentouFinalizar = false;
                            if( this.unidade && this.consultorio ){
                                this.serviceSenha.finalizarAtendimento(this.unidade, this.consultorio).subscribe(
                                    () => {

                                    }, (error) => {
                                        Servidor.verificaErro(error, this.toastr);
                                    }
                                );
                            }
                            this.router.navigate([`/${Sessao.getModulo()}/atendimento`]);
                        }, (error) => {
                            this.salvandoResposta = false;
                            this.tentouFinalizar = false;
                            Servidor.verificaErro(error, this.toastr);
                        }
                    );
        //         }
        //     }, (error) => {
        //         Servidor.verificaErro(error, this.toastr);
        //     }
        // );
    }

    adicionarExame(internacao = false, atendimento = undefined){
    
        this.usuarioService.usuarioSessao().subscribe(
            (usuario) => {
                if( usuario["redeAtendimento"] ){

                    let local;
                    let codigo;
                    if( atendimento ){
                        this.atendimento = atendimento;
                    }
                    if( this.atendimento ){

                        codigo = this.atendimento['pacientePlano']['codigo']
                        if( !this.atendimento.local ){
                            this.toastr.warning("Usuario sem local de atendimento para esta unidade");
                            return
                        }

                        if(!this.atendimento.pacientePlano){
                            this.toastr.warning("Atendimento sem plano");
                            return
                        }

                        local = this.atendimento.local.codigo;    //MUDAR O LOCAL

                        this.rda = usuario["redeAtendimento"]["codigo"];
                        let tid = sha1(codigo + this.rda + local + 'unimed21#paz')
                        
                        this.direcionaNovoExame(tid, codigo, this.rda, local, internacao)

                    }else{
                        this.servicePaciente.getPacientePlanos( { pacienteId : this.atendimento ? this.atendimento.paciente.id : this.idPaciente } ).subscribe(
                            (planos) => {
                                let aPlanosPrincipal = (planos.dados || planos).filter(
                                    (plano) => {
                                        return plano.principal;
                                    }
                                )
                                console.log(aPlanosPrincipal);

                                let codigoPrincipal = (aPlanosPrincipal && aPlanosPrincipal.length) ? aPlanosPrincipal[0].codigo : undefined;
                                if( !codigoPrincipal ){
                                    this.toastr.warning("Paciente nao possui plano principal para solicitação de exame");
                                    return  
                                }
                                this.solicitaExamePorCodigoCarteira(codigoPrincipal, usuario, internacao);
                            }, (error) => {
                                Servidor.verificaErro(error, this.toastr);
                            }
                        )
                    }
                    
                }else{
                    alert("Usuario sem RDA");
                }
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    solicitaExamePorCodigoCarteira(codigoPlanoPrincipal, usuario, internacao){
        let codigo;
        let local;
        if( codigoPlanoPrincipal ){
            codigo = codigoPlanoPrincipal
        }else{
            this.toastr.warning("Paciente nao possui plano principal para solicitação de exame");
            return  
        }

        let idUnidade = localStorage.getItem('idUnidade');

        this.validaSeTemUnidadeSelecionada();

        this.serviceLocalAtendimento.getLocalPorUnidadeId(idUnidade).subscribe(
            (localAtendimento) => {
                if( !localAtendimento ){
                    this.toastr.warning("Usuario sem local de atendimento para esta unidade");
                    return;
                }

                local = localAtendimento.codigo;

                this.rda = usuario["redeAtendimento"]["codigo"];
                let tid = sha1(codigo + this.rda + local + 'unimed21#paz')
                
                this.direcionaNovoExame(tid, codigo, this.rda, local, internacao)
            },
            (error) => {
                Servidor.verificaErro(error, this.toastr);
                this.toastr.warning("Usuario sem local de atendimento para esta unidade");
                return;
            }
        )
    }

    acaoAgendamento;
    modalAgendamento;
    motivoCancelamento;
    agendamentoSelecionado;
    alterarStatusAgendamento() {

        if  (this.acaoAgendamento == 'DESMARCADO' && (!this.motivoCancelamento && this.motivoCancelamento.trim() == '')) {
            this.toastr.warning('Informe um motivo para cancelar o agendamento');
            return;
        }

        let esse = this;
        let atendimentoRequest = {
            "status": this.acaoAgendamento,
            "observacao": this.motivoCancelamento
        };

        this.service.atualizar(this.agendamentoSelecionado.id, atendimentoRequest).subscribe(
            () => {
                this.modalAgendamento.close(); 
                this.toastr.success("Agendamento cancelado com sucesso");
                this.agendamentoSelecionado = undefined;
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    urlPacs(event, exame){   
        event.preventDefault();
        event.stopPropagation();

        if( !exame ){
            return;
        }
        
        this.exameService.getUrlPacs( exame.guia ).subscribe(
            (retorno) => {
                if( retorno.indexOf('http') < 0 ){
                    this.toastr.warning(retorno);
                    return;
                }

                window.open( retorno, '_blank' );
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        )
    }

    direcionaNovoExame(tid, codigo, rda, local, internacao){
        let dentro =  `http://portal.unimeduberaba.com.br:81/microsiga/u_pepg002wp.apw?cartao=${codigo}&rda=${this.rda}&local=${local}&${Sessao.getModulo()}=sim&${ internacao ? `tela=internacao&` : '' }tid=${tid}`
                                
        window.open(
            dentro,
            '_blank'
        );
    }

    urlXViewer(url){
        let dentro =  url
                                
        window.open(
            dentro,
            '_blank'
        );
    }

    validaCpfPaciente(){
        if( !this.novoPaciente )
            return
            
        if( this.objParamsPaciente['cpf'].length == 11 ){
            this.servicePaciente.getPaciente( { cpf : this.objParamsPaciente['cpf'] } ).subscribe(
                (retorno) => {
                    if (retorno.dados.length > 0) {
                        this.router.navigate([`/${Sessao.getModulo()}/paciente/formulario/${retorno.dados[0]['id']}`]);
                    } else {
                        console.log("Paciente Nao existente");                        
                    }
                }, (error) => {
                    Servidor.verificaErro(error, this.toastr);
                }
            )
        }
    }

    validaCarteirinhaPaciente(){
        if( this.objParamsPlano['codigo'].length ){
            this.servicePaciente.getPaciente( { carteirinha : this.objParamsPlano['codigo'] } ).subscribe(
                (retorno) => {
                    if (retorno.dados.length > 0) {
                        // this.router.navigate([`/${Sessao.getModulo()}/paciente/formulario/${retorno.dados[0]['id']}`]);                    
                        console.log(retorno.dados);
                        
                    } else {
                        console.log("Carteirinha ja existente");                        
                    }
                }, (error) => {
                    Servidor.verificaErro(error, this.toastr);
                }
            )
        }
    }

    instanciaLogAtendimento;
    getRefreshLogAtendimento(instancia){
        this.instanciaLogAtendimento = instancia;
    }

    stopPropagation(evento){
        evento.stopPropagation();
    }

    definePlanoPrincipal(status, plano, alerta = true, pos){
        if(this.validaBloqueioPlano(plano.bloqueio)){
            plano.principal = false;
            this.toastr.error("Plano Bloqueado!");
            return;
        }
        
        if(this.validaValidadePlano(plano.validade)){
            plano.principal = false;
            this.toastr.error("Plano Vencido!");
            return;
        }

        if( status ){
            this.validaPlanoPrincipal();
        }

        this.servicePaciente.atualizarPacientePlanos( plano.id, { principal : status } ).subscribe(
            () => {
                this.toastr.success("Status atualizado com sucesso")
                // this.refreshMolduras("Planos");
                this.disabledIndicador = true;
                this.refreshPlanos();    
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    refreshPlanos(){
        this.servicePaciente.getPacientePlanos( { pacienteId : this.atendimento ? this.atendimento.paciente.id : this.idPaciente } ).subscribe(
            (planos) => {
                this.paciente['planos'] = planos.dados || planos
                this.disabledIndicador = false
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        )
    }

    fnHabilitaCheckboxPrincipal($event) {
        
        this.paciente['planos'].forEach((plano) => {
            if (plano.principal && !$event) {
                this.disabledIndicador = true;
            }else{
                plano.principal = false;
            }
            plano.vencido = moment().isAfter( moment(plano.validade, this.formatosDeDatas.dataHoraSegundoFormato) )
        });
        this.disabledIndicador = false;
    }

    validaBloqueioPlano(bloqueio){
        if(bloqueio){
            return (moment(bloqueio) < moment());
        }else{
            return false;
        }
    }

    validaValidadePlano(validade){
        if(validade){
            return (moment(validade) < moment());
        }else{
            return false;
        }
    }

    validaPlanoPrincipal(){
        let principal = this.paciente['planos'].filter(
            (plano) => {
                return plano.principal;
            }
        )

            principal.forEach(
                (plano) => {
                    this.servicePaciente.atualizarPacientePlanos( plano.id, { principal : false } ).subscribe(
                        () => {
                        
                        }, (error) => {
                            Servidor.verificaErro(error, this.toastr);
                        }
                    );
                }
            )

        return principal && principal.length;
    }

    salvarPaciente(){
        let metodo = ( (this.paciente['id']) ? "atualizar" : "salvar" ) + "Paciente";

        
        if( this.validaCadastroBasico ){
            if( !this.objParamsPaciente['nome'] ){
                this.toastr.error("Nome do paciente é obrigatorio");
                return;
            }else if( !this.objParamsPaciente['mae'] ){
                this.toastr.error("Nome da mae é obrigatorio");
                return;
            }else if( !this.objParamsPaciente['nascimento'] ){
                this.toastr.error("Data de nascimento é obrigatoria");
                return;
            }else if( !this.objParamsPaciente['pai'] ){
                this.toastr.error("Nome do pai é obrigatorio");
                return;
            }else if ( this.objParamsPaciente['cpf'] && this.objParamsPaciente['cpf'].length != 11 ){
                this.toastr.error("CPF informado invalido");
                return;
            }

            let objMomento = moment(this.objParamsPaciente['nascimento'], this.formatosDeDatas.dataHoraSegundoFormato);     
            let anoAtual = moment().year();

            if( !this.objParamsPaciente['cpf'] && (anoAtual - objMomento.year()) >= 18 ){
                this.toastr.error("Paciente com mais de 18 anos. Obrigatorio CPF");
                return
            }
        }else{
            if( !this.objParamsPaciente['nome'] ){
                this.toastr.error("Nome do paciente é obrigatorio");
                return;
            }
        }

        (this.objParamsPaciente['estadoCivil'] == '0') ? delete this.objParamsPaciente['estadoCivil'] : null;
        (this.objParamsPaciente['sexo'] == '0') ? delete this.objParamsPaciente['sexo'] : null;
        (this.objParamsPaciente['nascimento'] == '') ? delete this.objParamsPaciente['nascimento'] : null;

        this.servicePaciente[metodo](this.paciente['id'], this.objParamsPaciente).subscribe(
            (retorno) => {
                this.toastr.success("Paciente salvo com sucesso");

                if( !this.modalCadastro ){
                    if( !this.paciente['id'] ){
                        this.router.navigate([`/${Sessao.getModulo()}/paciente/formulario/${retorno}`]);
                    }else{
                        this.servicePaciente.getPaciente( { id : this.paciente['id'] } ).subscribe(
                            (paciente) => {
                                this.paciente = paciente.dados[0];
                            }, (error) => {
                                Servidor.verificaErro(error, this.toastr);
                            }
                        );
                    }
                }else{
                    this.servicePaciente.getPaciente( { id : retorno } ).subscribe(
                        (paciente) => {
                            this.paciente = paciente.dados[0];
                            let objemit = this.paciente;
                            // objemit['id'] = retorno;
                            this.emitpaciente.emit(objemit);
                        }, (error) => {
                            Servidor.verificaErro(error, this.toastr);
                        }
                    );
                    
                }
            },
            (error) => {
                console.log('erro');
                Servidor.verificaErro(error, this.toastr);
                this.toastr.error("Erro ao salvar Paciente");
            }
        )
    }

    voltar() {
        window.history.back();
    }

    abreModal(obj, labelObj){

        if( !this.modalCadastro || (this.modalCadastro && !obj) ){

            this['objParams'+labelObj] = obj || new Object();
            this.buscaCep = true;

            if( !obj ){
            this['objParams'+labelObj] = this.validaObjModal(this['objParams'+labelObj], labelObj);
            }

            this.activeModal = this.modalService.open(NgbdModalContent, {size: 'lg'});
            this.activeModal.componentInstance.modalHeader  = ( (obj) ? 'Editar' : 'Salvar Novo ' ) + labelObj;
            
            this.activeModal.componentInstance.templateRefBody = this['formulario'+labelObj+'Body'];
            this.activeModal.componentInstance.templateBotoes = this['formulario'+labelObj+'Botoes'];
        }else{

            if( labelObj == "Plano" ){
                let objemit = obj;
                this.emitplano.emit(objemit);
            }

        }

    }

    mostraVigencia(profissional) {
        let sVigencia;

        if (profissional.inicio && profissional.fim) {
            return `${profissional.inicio} ate ${profissional.fim}`;
        }

        return `Desde ${profissional.inicio}`;
    }

    validaObjModal(obj, labelObj){
        if( labelObj == 'Plano' ){
            obj['operadora'] = new Object();
            obj['operadora']['id'] = 1;
        }else if(labelObj == 'Responsavel'){
            obj['parentesco'] = new Object();
        }else if( labelObj == 'Endereco' ){
            obj['cidade'] = new Object();
        }

        return obj;
    }

    criarElementoPaciente(objParams, tipo, id){
        let metodo = ( (id) ? "atualizar" : "salvar" ) + "Paciente" + tipo;

        objParams['paciente'] = { id : this.paciente['id'] };

        objParams = this.validaObjPreSalvamento(objParams, tipo)

        this.servicePaciente[metodo](id, objParams).subscribe(
            (retorno) => {
                this.toastr.success(tipo + " salvos com sucesso");
                this.validaAposSalvamento(tipo, retorno, objParams);
                this.refreshMolduras(tipo);
                this.activeModal.close();
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
                this.toastr.error("Erro ao salvar " + tipo);
            }
        )

    }

    usuarioPaciente
    getUsuarioPaciente(usuario){
        if( usuario ){
            this.objParamsPaciente['usuario'] = { guid : usuario.guid }
            this.usuarioPacienteSelecionado = usuario['nome'];
        }else{
            this.objParamsPaciente['usuario'] = undefined;
        }
    }

    validaObjPreSalvamento(obj, tipo){
        delete obj.beneficiario;
        delete obj.excluido;

        if( tipo == "Enderecos" ){
            obj['estado'] = obj.cidade.estado
            delete obj.cidade.estado
        }else if(tipo == "Planos"){
            if (obj.bloqueio) {
                obj.bloqueio = moment(obj.bloqueio, this.formatosDeDatas.dataHoraSegundoFormato).format(this.formatosDeDatas.dataFormato);
            }

            if( this.modalCadastro ){
                let pacientePlanos

                this.servicePaciente.getPaciente({ id : obj.paciente.id}, false).subscribe(
                    (planos) => {
                        pacientePlanos = planos.dados[0].planos;

                        if(pacientePlanos.length == 1){
                            obj.principal = true;
                        }else{
                            let definiPrincipal = true;

                            pacientePlanos.forEach(plano => {
                                
                                // if(!plano.bloqueio && (moment(plano.validade) > moment() || !plano.validade)){
                                if(plano.principal){
                                    definiPrincipal = false;
                                }
                            });
                            
                            if(definiPrincipal){
                                obj.principal = true;
                                this.definePlanoPrincipal(false, obj, false, null);
                            }
                        }
                    }, (error) => {
                        Servidor.verificaErro(error, this.toastr);
                    }
                );
            }
        }
        
        return obj
    }

    validaAposSalvamento(tipo, id, objParams){
        if( tipo == "Planos" ){
            let objemit = objParams;
            objemit['id'] = id;
            this.emitplano.emit(objemit);
        }
    }

    removerElementoPaciente(evento, tipo, id){
        evento.stopPropagation();

        let metodo = "deletarPaciente" + tipo;

        if( confirm("Tem certeza que deseja excluir esse registro") ){
            this.servicePaciente[metodo](id).subscribe(
                () => {
                    this.toastr.success(tipo + " excluidos com sucesso");
                    this.refreshMolduras(tipo);
                }, (error) => {
                    Servidor.verificaErro(error, this.toastr);
                    this.toastr.error("Erro ao deletar " + tipo);
                }
            )
        }

    }

    refreshMolduras(tipo){
        let metodo = "getPaciente" + tipo;
        this.servicePaciente[metodo]({ pacienteId : this.paciente['id']}).subscribe(
            (retorno) => {
                this.paciente[tipo.toLowerCase()] = retorno.dados;
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        )
    }

    refreshParentescos(item, setObj){
        this.serviceParentesco.getParentescoPaginado().subscribe(
            (parentesco) => {
                this.parentescos = parentesco.dados;
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
        if(setObj) {
            this.objParamsResponsavel['parentesco'] = { id : item.id }
        }
    }

    refreshOperadoras(item, setObj){
        this.serviceOperadora.getOperadoraPaginado().subscribe(
            (operadora) => {
                this.operadoras = operadora.dados;
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
        if (setObj) {
            this.objParamsPlano['operadora'] = { id : item.id }
        }
    }

    getOperadora(evento){
        console.log(evento);
        
    }

    resetaObj(obj){
        this['objParams'+obj] = new Object();
    }

    buscaCep = false;
    getEndereco(cep){
        
        if( cep.valor && cep.valor.length == 8 ){
            this.serviceLocal.buscaPorCep(cep.valor).subscribe(
                (endereco) => {
                    this.objParamsEndereco['cep'] = cep.valor;    

                    if(endereco){
                        this.objParamsEndereco['logradouro'] = endereco.tipo.nome + ' ' + endereco.nome;
                        this.objParamsEndereco['bairro'] = endereco.bairro.nome;
                        this.objParamsEndereco['cidade'] = { id : endereco.cidade.id, nome: endereco.cidade.nome, estado: endereco.cidade.estado.sigla }
                    }
                    
                    this.buscaCep = endereco.cep;
                },
                (error)=>{
                    this.toastr.warning("Erro ao buscar o CEP");
                    this.buscaCep = undefined;
                    this.objParamsEndereco = new Object();
                    Servidor.verificaErro(error, this.toastr);
                }
            )
        }else{
            this.buscaCep = undefined
        }
    }

    bParticular = false;
    setOperadora(idOperadora){

        let operadoraSelecionada = this.operadoras.filter(
            (operadora) => {
                return operadora.id == idOperadora;
            }
        )[0];

        this.bParticular = operadoraSelecionada.nome.toUpperCase() == 'PARTICULAR';

        this.objParamsPlano['operadora'] = { id : idOperadora }
        delete this.objParamsPlano['validade'];
    }

    objCidades;
    fnCfgCidadeRemote(term) {
        this.serviceLocal.getCidades({ like : term}).subscribe(
            (retorno) => {
                this.objCidades = retorno.dados || retorno;
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    getImagemCompleta(objImagemBase64){
        
        let objImagem = { "imagem" : objImagemBase64["image"] }
        this.servicePaciente.salvarPacienteFoto(this.paciente['id'], objImagem).subscribe(
            () => {
                this.toastr.success("Imagem editada com sucesso.");
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );

    }

    cidadeSelecionada
    getCidadeSelect(evento){
        if( evento ){
            this.cidadeSelecionada = evento.nome
            this.objParamsEndereco['cidade'] = { id : evento['id'], estado : evento['estado']['sigla'] } 
        }else{
            this.objParamsEndereco['cidade'] = undefined
        }
    }

    modalElemPaciente;
    salvarParentesco(item){
        this.modalElemPaciente = this.modalService.open(NgbdModalContent, {size: 'lg'});
        this.modalElemPaciente.componentInstance.modalHeader  = ( (item) ? 'Editar' : 'Salvar Novo' ) + ' Parentesco';
        this.modalElemPaciente.componentInstance.templateRefBody = this.bodyModalAdicionaParentesco;
        this.modalElemPaciente.componentInstance.templateBotoes = this.modalAdicionaParentescoBotoes;

        this.modalElemPaciente.result.then(
            (data) => this.instanciaBtnSearchParentesco.buscaTodos(),
            (reason) => this.instanciaBtnSearchParentesco.buscaTodos() )

        this.novoParentesco = new NovoParentesco(item);
    }

    salvarOperadora(item){
        this.modalElemPaciente = this.modalService.open(NgbdModalContent, {size: 'lg'});
        this.modalElemPaciente.componentInstance.modalHeader  = ( (item) ? 'Editar' : 'Salvar Nova' ) + ' Operadora';
        this.modalElemPaciente.componentInstance.templateRefBody = this.bodyModalAdicionaOperadora;
        this.modalElemPaciente.componentInstance.templateBotoes = this.modalAdicionaOperadoraBotoes;

        this.modalElemPaciente.result.then(
            (data) => this.instanciaBtnSearchOper.buscaTodos(),
            (reason) => this.instanciaBtnSearchOper.buscaTodos() )

        this.novoOperadora = new NovoOperadora(item);
    }

    validaClasse(pos){
        return ( pos % 2 == 0 );
    }

    getNacimento($event){
        this.objParamsPaciente['nascimento'] = $event.valor
    }

    dataValidade;
    getValidadeInstancia(instancia) {
        this.dataValidade = instancia;
    }

    getValidade($event){
        if ($event.valor.length == 10) {
            this.objParamsPlano['validade'] = $event.valor
        }
    }

    getData(param, evento) {
        if (!param && (evento && evento.length)) {
            return;
        }

        this.objParamsPlano[param] = evento[0].format('DD/MM/YYYY');
    }

    consulta;
    agendamento;
    informacoes() {
        let param = { pagina: 1, quantidade: 1, group: false };
        let data = this.atendimento.configuracoesHorario[this.atendimento.configuracoesHorario.length-1].configuraHorario.dataFim || moment().format(this.formatosDeDatas.dataHoraSegundoFormato);
        let guid = (this.atendimento.usuario) ? this.atendimento.usuario.guid : Sessao.getUsuario()['guid'];
        let filtro = {
            statusNotIn: [],
            ignoraRda: false,
            agendamentoFinal: data,
            usuario: { guid: guid },
            paciente: { id: this.atendimento.paciente.id },
            ordernacao: 'agendamento DESC, usuario.nome ASC',
            unidadeAtendimento: { id: this.atendimento.unidadeAtendimento.id },
        };

        this.buscaAgendamento(filtro, param, 'agendamento');
        this.buscaAgendamento(filtro, param, 'consulta');

        this.activeModal = this.modalService.open(NgbdModalContent, {size: 'lg'});
        this.activeModal.componentInstance.modalHeader = 'Informações do Agendamento';
        this.activeModal.componentInstance.templateRefBody = this.bodyInformacoesAtendimento;
        this.activeModal.componentInstance.templateBotoes = this.botoesInformacoesAtendimento;
    }

    getStatus(status) {
        let retorno = this.enum.filter((item) => {
            return item.codigo == status;
        });
        return retorno.length ? retorno[0].nome : '';
    }

    buscaAgendamento(filtro, param, tipo) {
        filtro.statusNotIn = (tipo == 'consulta') ? ['PREATENDIMENTO', 'EMATENDIMENTO', 'PENDENTE', 'SALADEESPERA', 'DESMARCADO', 'FALTA'] : [];

        this.service.filtrar(filtro, param).subscribe(
            (agendamento) => {
                if (tipo == 'consulta') {
                    this.consulta = agendamento.dados[0];
                } else {
                    this.agendamento = agendamento.dados[0];
                }
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    atendimentoSelecionado;
    inicializaLogAtendimento(atendimentoId){
        this.atendimentoSelecionado = atendimentoId;

        setTimeout(()=>{
            this.instanciaLogAtendimento ? this.instanciaLogAtendimento.carregaMensagens() : null;
        }, 100);
    }

    objProfissionais;
    novoProfissional = new Object();
    fnCfgprofissionalRemote(term) {
        this.usuarioService.usuarioPaginadoFiltro( 1, 10, term ).subscribe(
            (retorno) => {
                this.objProfissionais = retorno.dados || retorno;
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        )
    }
    
    profissionalSelecionado
    getProfissional(evento){
        if( evento ){
            this.novoProfissional['usuario'] = { guid : evento['guid'] };
            this.profissionalSelecionado = evento['nome'];
        }else{
            this.novoProfissional['usuario'] = undefined;
        }
    }

    objProfissionalPrescricao;
    fnCfgprofissionalPrescricaoRemote(term) {

        let objParam: Object;
        if( !term.match(/\D/g) ){
            objParam = { conselhoNumero : term };
        }else{
            objParam = { like : term };
        }

        objParam['pagina'] = 1;
        objParam['quantidade'] = 10;

        this.profissionalService.get( objParam ).subscribe(
            (retorno) => {
                this.objProfissionalPrescricao = retorno.dados || retorno;
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        )
    }
    
    profissionalPrescricaoSelecionado
    getProfissionalPrescricao(evento){
        if( evento ){
            this.profissional = { id : evento['id'] };
            this.profissionalPrescricaoSelecionado = evento['nome'];
        }else{
            this.profissional = undefined;
        }
    }

    objEspecialidades
    fnCfgEspecialidadeRemote(term) {
        return this.serviceEspecialidade.getEspecialidadeLike(term, 0, 10).subscribe(
            (retorno)=>{
                this.objEspecialidades = retorno.dados || retorno;
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    especialidadeSelecionada    
    getEspecialidade(especialidade) {
        this.novoProfissional['especialidade'] = { id : especialidade['id'] };
        this.especialidadeSelecionada = especialidade.descricao
    }

    getUnidade(unidade) {
        this.novoProfissional['unidadeAtendimento'] = { id : unidade.valor };
    }

    // PARAMS AUCOCOMPLETE PRESCRICAO
    valorItemPrescricaoSelecionada;
    prescricaoSelecionada;
    setObjParamItemPrescricao(evento){
        if( evento ){
            this.prescricaoSelecionada = evento.id;

            this.valorItemPrescricaoSelecionada = evento.nome + ( (evento.descricao) ? ' - ' + evento.descricao : '');

        }        
    }

    objItemPrescricao;  
    fnCfgItemPrescricaoRemote(term) {
        this.serviceItemPrescricao.get({ like : term }).subscribe(
            (retorno) => {
                this.objItemPrescricao = retorno.dados || retorno;
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    idAbaPrescricao;
    abrirAbaPrescricao(idAba) {
        if (this.idAbaPrescricao == idAba) {
            this.idAbaPrescricao = "";
        } else {
            this.idAbaPrescricao = idAba;
        }
    }

    validaSeTemUnidadeSelecionada(){
        let idUnidade = localStorage.getItem('idUnidade');

        if( !idUnidade && !Sessao.validaPapelUsuario('WEBPEP:ADMINISTRADOR') ){
            localStorage.removeItem('unidade');
            localStorage.removeItem('consultorio');
            
            this.toastr.warning("É obrigatorio selecionar unidade de atendimento");
            
            this.router.navigate([`/${Sessao.getModulo()}/dashboard`]);
            return
        }
    }

    criaObjRespostasCabecalho(){
        this.respostasCabecalho['genero'] = this.paciente['sexo'];
        this.respostasCabecalho['idade'] = moment().diff(moment(this.paciente['nascimento'], this.formatosDeDatas.dataHoraSegundoFormato), 'years');
    }
}

class NovoParentesco{
    item = new Object();

    constructor(obj) {

        if ( !obj ) {
            return;
        }

        this.item["id"] = obj.id;
        this.item["nome"] = obj.nome;

    }

    setItem(item){        
        this.item = item;
        this.fecharModal(false);
    }

    salvarParentesco(obj, serviceParentesco){
        let esse = this;
        if(this.item["id"]){
            serviceParentesco.put(this.item["id"], this.item).subscribe(
                parentesco => this.fecharModal(serviceParentesco),
                err => console.error("Houve um erro ao salvar")
            )
        }
        else{

            serviceParentesco.post(this.item).subscribe(
                (id) => {
                    this.item["id"] = id;
                    this.fecharModal(serviceParentesco)
                },
                err => console.error("Houve um erro ao salvar")
            )
        }
    }

    fecharModal( serviceParentesco ){
        let element: HTMLElement = document.querySelectorAll(".close")[document.querySelectorAll(".close").length-1] as HTMLElement;
        element.click();
    }
}


class NovoOperadora{
    item = new Object();

    constructor(obj) {

        if ( !obj ) {
            return;
        }

        this.item["id"] = obj.id;
        this.item["codigoAns"] = obj.codigoAns;
        this.item["nome"] = obj.nome;

    }

    setItem(item){        
        this.item = item;
        this.fecharModal(false);
    }

    salvarOperadora(obj, serviceOperadora){
        let esse = this;
        if(this.item["id"]){
            serviceOperadora.put(this.item["id"], this.item).subscribe(
                operadora => this.fecharModal(serviceOperadora),
                err => console.error("Houve um erro ao salvar")
            )
        }
        else{

            serviceOperadora.post(this.item).subscribe(
                (id) => {
                    this.item["id"] = id;
                    this.fecharModal(serviceOperadora)
                },
                err => console.error("Houve um erro ao salvar")
            )
        }
    }

    fecharModal( serviceOperadora ){
        let element: HTMLElement = document.querySelectorAll(".close")[document.querySelectorAll(".close").length-1] as HTMLElement;
        element.click();
    }
}