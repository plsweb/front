import { Component, ViewChild, ViewContainerRef, TemplateRef, QueryList } from '@angular/core';
import { DashboardPepService, ConsultorioService, UsuarioService, RelatorioFiltroService, RelatorioService, AtendimentoService, PanicoPapelService, GoogleChartsBaseService, ParametrosGrafico, Util } from '../../../services';

import { Servidor } from '../../../services/servidor';
import { Sessao } from '../../../services/sessao';

import { ActivatedRoute, Router } from '@angular/router';
import { NgbdModalContent } from '../../../theme/components/modal/modal.component';

import { Saida } from '../../../theme/components/entrada/entrada.component';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ToastrService } from 'ngx-toastr';

import * as moment from 'moment';

moment.locale('pt-br');

@Component({
	selector: 'dashboard',
	templateUrl: './dashboard.html',
    styleUrls: ['./dashboard.scss'],
    providers: [Util]
})
export class Dashboard {

	consultorio:string = localStorage.getItem('consultorio');
	consultorioObj;
	consultorios = [];

	unidade:string = localStorage.getItem('unidade');

	idUnidade = localStorage.getItem('consultorio');
	unidadeObj;
	unidades = [];

	dashboards = [];
	activeModal:any;

	usuarioId;
	senha:string;
    novasenha:Saida;
    confirmacao:Saida;

	@ViewChild("bodyModalConsult", {read: TemplateRef}) bodyModal: QueryList<TemplateRef<any>>;
	@ViewChild("templateBotoesConsult", {read: TemplateRef}) templateBotoes: QueryList<TemplateRef<any>>;

	@ViewChild("bodyModalSenha", {read: TemplateRef}) bodyModalSenha: QueryList<TemplateRef<any>>;
	@ViewChild("botoesModalSenha", {read: TemplateRef}) botoesModalSenha: QueryList<TemplateRef<any>>;

	constructor(
        private router: Router,
        private modalService: NgbModal,
		private service: DashboardPepService,
		private serviceConsult: ConsultorioService,
        private relatorioFiltroService: RelatorioFiltroService,
        private googleChartsService: GoogleChartsBaseService,
        private relatorioService: RelatorioService,
        private panicoPapelService: PanicoPapelService,
		private serviceUsu: UsuarioService,
        private atendimentoService: AtendimentoService,
		private toastr: ToastrService,
        private vcr: ViewContainerRef,
        private utilService: Util,
    ) { }

	ngOnInit() {

        // this.utilService.salvarRespostas(this.servicePacienteDocumento);

		this.service.getDashboard().subscribe(
			(dashboards) => {
				this.dashboards = dashboards;
			},
			(erro) => {
				Servidor.verificaErro(erro, this.toastr);
			},
		);
	}

	ngAfterViewInit(){
		let bAlterarSenha = localStorage.getItem('alterarSenha') == 'true';
		this.usuarioId = JSON.parse(localStorage.getItem('usuario')).guid;

		if (bAlterarSenha) {
			this.alterarSenha(this.bodyModalSenha, this.botoesModalSenha);
			return;
		}

		this.abreConsultorio();
        this.abreRelatorios();
        this.carregaDadosCache();
	}

    carregaDadosCache() {
        let filtro = {
            agendamentoLista: null,
            agendamentoInicial: moment().format("DD/MM/YYYY 00:00:00"), 
            agendamentoFinal: moment().format("DD/MM/YYYY 23:59:59"), 
            statusNotIn: [
                'PREATENDIMENTO',
            ]
        };
        
        this.atendimentoService.filtrar(filtro);
    }

    relatoriosDados = [];
    relatorioRequest() {
        let oRequest = {};

        return oRequest;
    };
    abreRelatorios() {
        this.relatorioFiltroService.getRelatorioPorToken().subscribe((resp) => {

            resp.dados.forEach((dado, id) => {
                if( dado.retorno && dado.retorno.dados && dado.retorno.dados.length){
                    dado.relatorioFiltro.json = JSON.parse(dado.relatorioFiltro.json);
                    let objRelatorio = dado.relatorioFiltro.json;

                    let dadosGrafico = dado.retorno.dados.slice();

                    let rel = Object.assign({}, dado.relatorioFiltro, {resposta: dadosGrafico} );

                    let nomesColunas = rel.json.colunas.map(
                        (coluna) => {
                            return coluna.alias || coluna.coluna.descricao;
                        }
                    )
                    let params:ParametrosGrafico = {
                        objCoresDashboard: objRelatorio.dashboard.coresDashboard,
                        fnFormataDataPorDate: this.formataDataPorDate.bind(this),
                        chartLegendas: objRelatorio.dashboard.legendas,
                        colunasValores: nomesColunas,
                        chartValores: objRelatorio.dashboard.valores,
                        tipoGrafico: objRelatorio.dashboard.tipo
                    }
                    let objGrafico = this.googleChartsService.montaGraficos(dado.retorno.dados, params);
            
                    let dadosTratadosGrafico = objGrafico.dados
                    let config = {
                        pieHole: 0.4,
                        title: objRelatorio.dashboard.titulo,
                        subtitulo1: objRelatorio.dashboard.subtitulo1,
                        subtitulo2: objRelatorio.dashboard.subtitulo2,
                        heigth: 900,
                        colors: objGrafico.arrayCores 
                    }

                    this.relatoriosDados.push({
                        tipo: dado.relatorioFiltro.json.dashboard.tipo,
                        dadosGrafico: dadosTratadosGrafico,
                        config: config,
                        elementId: `myPieChart${id}`,
                        rel: rel
                    });
                }

            });

        });
    }

    navegaProRelatorio(rel) {
        this.router.navigate([`/${Sessao.getModulo()}/relatorios/${rel.rel.id}`]);
    }

    formataDataPorDate(dado) {
        let dia = `0${dado.date.day}`;
        dia = dia.slice(-2);
        let mes = `0${dado.date.month}`;
        mes = mes.slice(-2);
        let ano = `${dado.date.year}`;
        let hora = `0${dado.time.hour}`;
        hora = hora.slice(-2);
        let minuto = `0${dado.time.minute}`;
        minuto = minuto.slice(-2);

        return moment(`${dia}-${mes}-${ano}-T-${hora}-${minuto}`, 'DD-MM-YYYY-T-HH-mm').format('DD/MM/YYYY HH:mm')
    }

	abreConsultorio(inicializaModal = true) {

		if (!this.consultorio && !this.unidade) {
	        this.activeModal = this.modalService.open(NgbdModalContent, {size: 'sm'})
			this.activeModal.componentInstance.modalHeader  = 'Selecione o consultório';
			this.activeModal.componentInstance.templateRefBody = this.bodyModal;
			this.activeModal.componentInstance.templateBotoes  = this.templateBotoes;

            this.activeModal.result.then(
                (clickFechar) => {
                    if( !localStorage.getItem('idUnidade') ){
                        this.abreConsultorio(false);
                    }
                },
                (clicarFora) => {
                    if( !localStorage.getItem('idUnidade') ){
                        this.abreConsultorio(false);
                    }
                }
            );

            if( inicializaModal ){
                this.inicializaModalConsultorio();
            }
		}
	}

	alterarSenha(bodyModal, templateBotoes){
        this.activeModal = this.modalService.open(NgbdModalContent, {size: 'sm'})
        this.activeModal.componentInstance.modalHeader = 'Alteração de Senha';
        this.activeModal.componentInstance.templateRefBody = bodyModal;
        this.activeModal.componentInstance.templateBotoes = templateBotoes;

        let fnModalFechada = (erro) => { 
            if( localStorage.getItem('alterarSenha') == 'false' ){
                this.abreConsultorio();
            }else{
                this.alterarSenha(this.bodyModalSenha, this.botoesModalSenha);
            }
        };
        this.activeModal.result.then(
            fnModalFechada, 
            fnModalFechada
        );
    }

	inicializaModalConsultorio(){
		// this.serviceConsult.getUnidadeAtendimento()
		// 	.subscribe((unidades) => {
		// 		this.unidades = unidades;
		// 	},
		// 	(erro) => {Servidor.verificaErro(erro, this.toastr);}
        // );
        
        this.serviceUsu.usuarioSessao().subscribe(
            (usuario) => {
                this.serviceUsu.getUsuarioUnidadeAtendimento({ usuarioGuid : usuario.guid }).subscribe((unidades) => {
                    if( !(unidades.dados || unidades).length ){
                        this.toastr.warning("Usuario nao tem nenhuma unidade");
                        return;
                    }else if((unidades.dados || unidades).length == 1){
                        if (unidades.dados) {
                            unidades = unidades.dados;
                        }

                        localStorage.setItem('idUnidade', unidades[0].unidadeAtendimento.id);

                        this.unidades = (unidades.dados || unidades).map(
                            (unidade) => {
                                return {
                                    id: (unidade.unidadeAtendimento || unidade).id,
                                    descricao: (unidade.unidadeAtendimento || unidade).descricao,
                                    cidade: (unidade.unidadeAtendimento || unidade).cidade,
                                    codigoVisual: (unidade.unidadeAtendimento || unidade).codigoVisual
                                }
                            }
                        )
                        this.serviceConsult.getConsultoriosPorUnidadeId(unidades[0].unidadeAtendimento.id)
                            .subscribe((consultorios) => {
                                if( !consultorios.length ){
                                    localStorage.setItem('unidade', unidades[0].unidadeAtendimento.codigoVisual || null);
                                    localStorage.setItem('idUnidade', unidades[0].unidadeAtendimento.id);
                                    
                                    this.toastr.success("Local selecionado: " + unidades[0].unidadeAtendimento.descricao);
                                    this.activeModal.close();
                                    return;
                                }
                            },
                            (erro) => {Servidor.verificaErro(erro, this.toastr);}
                        );
                    } else {
                        this.unidades = (unidades.dados || unidades).map(
                            (unidade) => {
                                return {
                                    id: (unidade.unidadeAtendimento || unidade).id,
                                    descricao: (unidade.unidadeAtendimento || unidade).descricao,
                                    cidade: (unidade.unidadeAtendimento || unidade).cidade,
                                    codigoVisual: (unidade.unidadeAtendimento || unidade).codigoVisual
                                }
                            }
                        )
                    }

                });
            }
        )
	}

	getUnidade(evento) {
        this.unidadeObj = evento;

        if (this.unidadeObj.valor && this.unidadeObj.valor != 0) {
            this.serviceConsult.getConsultoriosPorUnidadeId(this.unidadeObj.valor)
                .subscribe((consultorios) => {
                    this.consultorios = consultorios;
                },
                (erro) => {Servidor.verificaErro(erro, this.toastr);}
            );
        }
    }

    getConsultorio(evento) {
        if (this.consultorios.length > 0) {
            this.consultorioObj = evento;
        } else {
            this.consultorioObj = null;
        }
    }

    salvar() {

        let unidadeObj= this.unidadeObj.valor;
        unidadeObj= this.unidades.filter(function (tmp) {
            return tmp.id == unidadeObj;
        });

        if ( this.consultorios.length && this.consultorioObj != null && this.consultorioObj.valor != null && this.consultorioObj.valor != 0 ) {
            let consultorioObj= this.consultorioObj.valor;
            consultorioObj= this.consultorios.filter(function (tmp) {
                return tmp.id == consultorioObj;
            });
            localStorage.setItem('consultorio', consultorioObj[0].idVisual);
            localStorage.setItem('idConsultorio', consultorioObj[0].id);
        }

		localStorage.setItem('unidade', unidadeObj[0].codigoVisual || null);
        localStorage.setItem('idUnidade', unidadeObj[0].id);
        
        // GET PANICO PAPEL
        this.panicoPapelService.get({ unidadeAtendimentoId: localStorage.getItem('idUnidade') }).subscribe(
            (papeis) => {
              console.log(papeis);

                papeis.dados.forEach(
                    (papel) => {
                        let objpapel =  papel.papel.nome;

                        if( Sessao.validaPapelUsuario(objpapel) ){
                            Sessao.setResponsavelPanico(true);
                        }
                    }
                )

            }
        )

        this.activeModal.close();
	}

	getNovaSenha(evento){
        this.novasenha = evento;        
    }

    getConfirmacao(evento){
        this.confirmacao = evento;        
    }

    salvarSenha(){
        this.senha = ( this.novasenha.valido && ( this.novasenha.valor == this.confirmacao.valor ) ) ? this.novasenha.valor : null;
        if( this.senha ){
            var objUsuario = {
                "senha" : this.senha,
                "alterarSenha" : false,
            }

            if( this.senha.length < 8 ){
                this.toastr.warning("Senha deve ter no mínimo 8 caracteres");
                return;
            }

            this.serviceUsu.atualizar(this.usuarioId, objUsuario).subscribe(
                (guid) => {
                    localStorage.setItem('alterarSenha', 'false');
                    this.toastr.success("Senha alterada com sucesso");
                    this.activeModal.close();
				},
				(erro) => {
					this.toastr.error("Houve um erro ao alterar a senha");
				}
			);

        }else{
			this.toastr.warning("Senhas informadas não coincidem");
        }
	}
}