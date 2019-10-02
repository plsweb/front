import { Component, OnInit, ChangeDetectorRef, ChangeDetectionStrategy, ViewChild, ElementRef, Renderer, TemplateRef, QueryList, ViewContainerRef } from '@angular/core';
import { TabelaApi, ServiceDinamico, EnumApi, RelatorioService, EspecialidadeService, RelatorioFiltroService, LocalAtendimentoService, PacienteService, UsuarioService, FormularioService, PerguntaService, GoogleChartsBaseService, ParametrosGrafico } from '../../../services';
import { Http, Headers, Response } from '@angular/http';

import { Servidor } from '../../../services/servidor';
import { Sessao } from '../../../services/sessao';

import { FormatosData } from '../../../theme/components/agenda/agenda';
import { Saida } from '../../../theme/components/entrada/entrada.component';

import { ActivatedRoute, Router } from '@angular/router';
import { GlobalState } from '../../../global.state';
import { Notificacao, Aguardar, TopoPagina } from '../../../theme/components';
import { NgbdModalContent } from '../../../theme/components/modal/modal.component';

import { Observable } from 'rxjs/Rx';

import { ToastrService } from 'ngx-toastr';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';

import { ExcelService } from '../../../theme/services/ngx-excel-export/excel.service';
import { Util } from 'app/services/util';
import { PopoverConfig } from 'ngx-bootstrap/popover';

moment.locale('pt-br');

@Component({
	selector: 'relatorios',
	templateUrl: './relatorios.html',
    styleUrls: ['./relatorios.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [EspecialidadeService]
    
})
export class Relatorios implements OnInit {
    static ultimaAtualizacao: Date;
    private servidor;
    
    tabelaApiResposta;
    enums = [];
    listaEnums;
    listaBoolean;
    variaveisDeAmbiente = {};
    modalInstancia;
    respostas = {};
    dados = [];
    dadosExport = [];
    unidadesAtendimento = [];
    relatorioid;
    tiposCalculo;
    opcoesOperacoes = [];
    opcoesRetorno = [];
    limitExport = 200000;

    tipoRelatorio = 'tabelas';
    opcoesTipoRelatorio = [
        { id: 'respostas', nome: 'Respostas de Formulários' },
        { id: 'tabelas', nome: 'Tabelas' }
    ]

    opcoesConvert = {
        "+" : 'add',
        '-' : 'subtract'
    }

    tabelaPrincipal;
    loading;

    formatosDeDatas;
    oColorPicker = new Object();

    constructor(
        private _popOverConfig: PopoverConfig,
        private toastr: ToastrService, 
        private vcr: ViewContainerRef,
        private renderer:Renderer,
        private http: Http,
        private router: Router, 
        private modalService: NgbModal, 
        private _state: GlobalState, 
        private cdr: ChangeDetectorRef, 
        private route: ActivatedRoute,
        private serviceTabelaApi: TabelaApi,
        private serviceDinamico : ServiceDinamico,
        private googleChartsService: GoogleChartsBaseService,
        private enumApi: EnumApi,
        private perguntaService: PerguntaService,
        private serviceEspecialidade: EspecialidadeService,
        private relatorioService: RelatorioService,
        private relatorioFiltroService: RelatorioFiltroService,
        private servicePaciente: PacienteService,
        private serviceFormulario: FormularioService,
        private localAtendimentoService: LocalAtendimentoService,
        private usuarioService: UsuarioService,
        private excelService: ExcelService
    ) {
        this._popOverConfig.outsideClick = true;
        this._popOverConfig.placement = 'bottom';
        this._popOverConfig.container = 'body';
        this.servidor = new Servidor(http, router);
        this.excelService = excelService;
    }

    ngOnInit() {

        this.formatosDeDatas = new FormatosData();
        
        this._state.notifyDataChanged('menu.isCollapsed', true);

        this.variaveisDeAmbiente['tabela'] = {
            total: 0
        };

        this.tiposCalculo = [
            {id: 'SUM', nome: 'Somar'},
            {id: 'AVG', nome: 'Média'},
            {id: 'MIN', nome: 'Mínimo'},
            {id: 'MAX', nome: 'Máximo'},
            {id: 'COUNT', nome: 'Contar'}
        ];

        this.opcoesOperacoes = [
            {id: '+', nome: 'Somar'},
            {id: '-', nome: 'Subtrair'},
            {id: '*', nome: 'Multiplicar'},
            {id: '/', nome: 'Dividir'},
        ]

        this.opcoesRetorno = [
            {id: 'd', nome: 'Dias'},
            {id: 'M', nome: 'Meses'},
            {id: 'y', nome: 'Anos'},
            {id: 'w', nome: 'Semanas'},
            {id: 'h', nome: 'Horas'},
            {id: 'm', nome: 'Minutos'},
        ]

        this.iniciaFiltroData();

        this.listaBoolean = [
            {id: true, nome: 'Sim'},
            {id: false, nome: 'Não'},
        ];

        this.usuarioService.papel()
            .subscribe((papeis) => {
                this.papeis = papeis.dados;

                // this.relatorioFiltroService.getRoles(this.relatorioid).subscribe((formularioPapeis) => {
                //     this.formularioPapeis = formularioPapeis.dados || [];
                //     this.papeisCriar = this.filtrarPapeis('CRIAR', this.formularioPapeis);
                //     this.papeisVer = this.filtrarPapeis('VER', this.formularioPapeis);
                // });
            });

        this.unidadesAtendimento = Sessao.getVariaveisAmbiente('unidadesAtendimento');

        this.route.params.subscribe(params => {
            this.relatorioid = params['relatorioid'] == 'novo' ? undefined : params['relatorioid'];
            
            if( !this.relatorioid ){
                this.podeCriar = true;
                this.podeVer = true;
                this.cdr.markForCheck();
            }

            let enumLocal = JSON.parse(localStorage.getItem('enums'));
            this.enums = enumLocal;

            if( (this.enums['dados'] || this.enums) && !(this.enums['dados'] || this.enums).length ){
                this.enums = Util.enumsBackup()
            }

            let tabelaApiLocal = JSON.parse(localStorage.getItem('tabelaApi'));
            console.warn("--- Precisa deslogar e logar pra recarregar as TABELAS API ---");
            
            if( tabelaApiLocal && tabelaApiLocal.dados ){
                this.tabelaApiResposta = tabelaApiLocal;
                this.iniciaTabelasDisponiveis();

                if (this.relatorioid) {
            
                    let request = {
                        id: this.relatorioid
                    }
                    this.relatorioFiltroService.get(request).subscribe((resposta) => {

                        this.relatorio = (resposta.dados || resposta)[0];

                        if( this.relatorio ){
                            this.cdr.markForCheck();
                        
                            let aPromisesPapeis = [ 
                                this.carregaPapeis(true), 
                                this.carregaPapeisDash(true)
                            ]

                            Promise.all( aPromisesPapeis ).then(
                                () => {
                                    if( this.podeVer ){
                                        this.inicializaRelatorio();
                                        
                                    }else{
                                        this.toastr.error("Usuario sem permissão para visualizar o relatório");
                                        this.cdr.markForCheck();
                                    }
                                }
                            )

                        }else{
                            this.router.navigate([`/${Sessao.getModulo()}/relatorios/novo`]);
                        }
                    });
                    
                }else{
                    this.podeCriar = true;
                    this.podeVer = true;

                    this.cdr.markForCheck();
                }
            }else{
                this.podeVer = false;
                this.cdr.markForCheck();
            }
        });

    }

    //  #############################################
    //               Uteis da Pagina
    //  #############################################
    @ViewChild("botoesModalCfgRelatorio", {read: TemplateRef}) botoesModalCfgRelatorio: QueryList<TemplateRef<any>>;
    @ViewChild("bodyModalCfgRelatorio", {read: TemplateRef}) bodyModalCfgRelatorio: QueryList<TemplateRef<any>>;

    @ViewChild("botoesModalSalvarRelatorio", {read: TemplateRef}) botoesModalSalvarRelatorio: QueryList<TemplateRef<any>>;
    @ViewChild("bodyModalSalvarRelatorio", {read: TemplateRef}) bodyModalSalvarRelatorio: QueryList<TemplateRef<any>>;

    @ViewChild("botoesModalCamposDisponiveis", {read: TemplateRef}) botoesModalCamposDisponiveis: QueryList<TemplateRef<any>>;
    @ViewChild("bodyModalCamposDisponiveis", {read: TemplateRef}) bodyModalCamposDisponiveis: QueryList<TemplateRef<any>>;

    @ViewChild("BodyModalUsuariosPapel", {read: TemplateRef}) BodyModalUsuariosPapel: QueryList<TemplateRef<any>>;

    abreModal(tipo, titulo = '', dado = undefined) {
        // this.modalInstancia = this.modalService.open(NgbdModalContent, {size: 'lg'});
        let cfgGlobal:any = Object.assign(NgbdModalContent.getCfgGlobal(), {size: 'lg'});
        
        this.modalInstancia = this.modalService.open(NgbdModalContent, cfgGlobal );
        this.modalInstancia.componentInstance.modalHeader = `${titulo}`;

        this.modalInstancia.componentInstance.templateRefBody = this[`bodyModal${tipo}`];
        this.modalInstancia.componentInstance.templateBotoes = this[`botoesModal${tipo}`];
        if( tipo == 'CfgRelatorio' ){
            this.modalInstancia.componentInstance.custom_lg_modal = true
        }

        let fnSuccess = (agendamentoGrupoResposta) => { 
            this.variaveisDeAmbiente['colunasPorTabela'] = [];
            console.log("Modal Fechada!"); 
        };
        let fnError = (erro) => { console.log("Modal Fechada!"); };
        this.modalInstancia.result.then((data) => fnSuccess, fnError);
    }

    filtraDados_serviceTabelaApi_getColunas(dados) {
        return dados.filter((dado) => dado.tipo != 'ARRAY');
    }

    fnCfgRemote(service, metodo = 'get', term) {

        let objParam = Object.assign(this.getAutoCompleteParams(service, term), {
            quantidade: 100,
            pagina: 1
        });

        this[`${service}`][`${metodo}`](objParam).subscribe(
            (retorno) => {
                let dados = retorno.dados || retorno;

                if (this[`filtraDados_${service}_${metodo}`]) {
                    dados = this[`filtraDados_${service}_${metodo}`](dados);
                }

                this.variaveisDeAmbiente[service] = dados;
            }
        );
    }

    fnCfgRemoteDinamico(term, metodo = 'get') {

        let oParam;

        let sUrl = this.variaveisDeAmbiente['objValoresAPI'].urn;

        if( sUrl.match( /\?/ ) ){
            // PADRAO NOVO
            oParam = Object.assign(this.getAutoCompleteParamsDinamico(null, term), {
                quantidade: 10,
                pagina: 1
            });

            
            let stringParams = sUrl.split('?')[1]
            sUrl = sUrl.split('?')[0];
            if( stringParams ){
                let stringJson = stringParams.replace(/=/g, '":"').replace( /&/g, '","' );
                stringJson = '{"' + stringJson + '"}'
                stringJson = JSON.parse(stringJson)
                stringJson = Object.assign( stringJson, this.getAutoCompleteParamsDinamico(null, term) )
                oParam = Object.assign(stringJson, {
                    quantidade: 10,
                    pagina: 1
                });


            }else{
                console.warn("Nao conseguiu montar o parametros da URL:  " + sUrl);
                oParam = Object.assign(this.getAutoCompleteParamsDinamico(null, term), {
                    quantidade: 10,
                    pagina: 1
                });
            }
            
            

        }else{
            // PADRAO ANTIGO
            oParam = Object.assign(this.getAutoCompleteParamsDinamico(null, term), {
                quantidade: 10,
                pagina: 1
            });

            if( sUrl.match( /\/VAR/g ) ){
                sUrl = sUrl.split('VAR')[0];
            }
            
            sUrl = sUrl+ `${term}/1/10`
            oParam = {}
        }

        this.serviceDinamico.ajax(this.variaveisDeAmbiente['objValoresAPI'].tipo, sUrl, oParam).subscribe((resposta) => {
            this.variaveisDeAmbiente['serviceColunas'] = resposta.dados || resposta;
        });
    }

    formataObjeto(obj) {
        return JSON.stringify(obj);
    }

    getValor(id) {
        let resposta = this.respostas[`${id}`];

        if (!resposta) {
            this.respostas[`${id}`] = {valor: undefined};
        }

        return resposta && resposta.valor ? resposta.valor : '';
    }

    getResposta(ev, nome, iniciaOpcoes = false, adicionarItem = false) {
        this.respostas[`${nome}`] = {valor: (ev.valor || ev.valor == "" ? ev.valor : ev)};
        this.respostas = Object.assign({}, this.respostas);


        if (!this.classe && iniciaOpcoes) {
            this.classe = this.respostas[`${nome}`].valor.tabela.nomeJava;
            this.tabelaPrincipal = this.respostas[`${nome}`].valor;
        }

        if (iniciaOpcoes) {
            this.iniciaOpcoes(adicionarItem);
        }else if(adicionarItem) {
            let validaTipo = adicionarItem;
            this.adicionaItem(false, !validaTipo);
        }   

    }

    getAutoCompleteParamsDinamico(service, term) {
        let objParam;

        switch(service) {
            case 'serviceGrupo':
                objParam = { like : term };
                break;

            default:
                objParam = { like : term };
                break;
        }

        return objParam;
    }

    getAutoCompleteParams(service, term) {
        let objParam;

        switch(service) {
            case 'serviceGrupo':
                objParam = { like : term };
                break;

            case 'serviceTabelaApi':
                objParam = {
                    like : term
                };
                break;

            default:
                objParam = { like : term };
                break;
        }

        return objParam;
    }

    test(aa = '') {
        console.log(aa);
        this.respostas['serviceTabelaApi'];
    }
    stringJson(json) {
        if (json && json.valor) {
            return JSON.stringify(json.valor);
        }
        return '...';
    }

    formataFonteDeDados() {
        let sFonteDeDados = '[nenhuma]';

        if (this.tabelaApiResposta && this.tabelaApiResposta.dados && this.classe) {
            let oTabela = this.tabelaApiResposta.dados.filter((tabela) => tabela.nomeJava == this.classe);
            sFonteDeDados = oTabela && oTabela.length ? oTabela[0].nome : '';
        }

        return sFonteDeDados;
    }

    criaItensRequest() {
        let oItems = new Object();
        let aItems = [];
        let tempArray = this.items
        
        this.items.forEach(
            (item, i) => {

                if( oItems[item.campo]
                    //  && ( oItems[item.campo]['join'] == item.join) 
                     ){

                    if( item.tipo == 'IGUAL' ){
                        oItems[item.campo]['tipo'] = 'IN';
                        oItems[item.campo]['valorIn'].push( item.valor );
                    }else{
                        oItems[item.campo+i] = Object.assign({}, item);
                    }

                }else{
                    oItems[item.campo] = Object.assign({}, item);
                    oItems[item.campo]['valorIn'] = [
                        item.valor
                    ]

                    if( (item.tipo == "NULO" || item.tipo == "NAONULO") && item.join ){
                        oItems[item.campo]['campo'] = item.join
                        console.warn("MUDANÇA DE CAMPO POR JOIN");
                        
                        delete oItems[item.campo]['join'];
                    }

                }

            }
        )

        Object.keys( oItems ).forEach(
            (item) => {
                let filtro = oItems[item];

                if( filtro.tipo != 'IN' ){
                    delete filtro.valorIn;
                }else{
                    delete filtro.valor;
                }
                aItems.push( filtro )
            }
        )

        this.items = tempArray;

        return aItems;
    }

    erroCaminho = false;
    pegaColuna(coluna, i) {
        if (!!this.tabelaApiResposta) {
            let colunas = [];
            let iTemp = 0;
            let bEncontrado = false;
            let tabelasSelecionadas = this.variaveisDeAmbiente['tabelasSelecionadas'].slice();
            let oTabelaPrincipal = this.tabelaApiResposta.dados.filter((tabela) => {
                return tabela.nomeJava == this.classe
            });

            if( !this.validaCaminhoClasse(oTabelaPrincipal) ){
                return
            }
            
            oTabelaPrincipal = oTabelaPrincipal[0];
            tabelasSelecionadas = tabelasSelecionadas.map((tabelaId)=>{
                return this.tabelaApiResposta.dados.filter((tabela)=> tabela.id == tabelaId || tabela.id == oTabelaPrincipal.id)[0];
            });
            
            while(iTemp < tabelasSelecionadas.length && !bEncontrado) {

                let tabelaPrincipal = tabelasSelecionadas[iTemp];

                if (tabelaPrincipal) {
                    let tabelaExiste = tabelaPrincipal.colunas.filter((colunaTemp) => {
                        return (colunaTemp.tabelaClasse && coluna.coluna && coluna.coluna.tabela && colunaTemp.tabelaClasse.id == coluna.coluna.tabela.id);
                    })[0];

                    let sColuna;
                    let join;
                    
                    if (!tabelaExiste) {

                        if (coluna.coluna.tabela.nomeJava != this.classe) {

                            //  TODO: Confere isso aqui
                            if (i != 8) {
                                iTemp++;
                                continue;
                            }
                            
                            let aCampo = [];
                            let tabelaAtual = Object.assign({},tabelaPrincipal);
                            
                            let fnPegaTabelasClasses = (aTabelas) => {
                                return aTabelas.colunas.filter((col) => col.tabelaClasse);
                            }

                            let j = 0;
                            let encontrado = false;
                            let colunaTemp = Object.assign({}, coluna);
                            let tabelasSelecionadas = this.variaveisDeAmbiente['tabelasSelecionadas'];

                            while (j < 7 || encontrado) {
                                let colunas = tabelaAtual.colunas.filter((col) => col.tabelaClasse);
                                
                                let colSel = colunas.map((colId) => colId.tabelaClasse.id);
                                
                                let bbb = this.tabelaApiResposta.dados.filter( (tabela) => {
                                    let aCols = tabela.colunas.filter((col2) => {
                                        return col2.tabelaClasse && col2.tabelaClasse.id == colunaTemp.coluna.tabela.id && tabelasSelecionadas.indexOf(col2.tabela.id) != -1
                                    });

                                    if (aCols && aCols.length) {
                                        if (aCampo.filter((cmp) => cmp.tabela.id == aCols[0].tabela.id).length == 0) {
                                            //aCampo.push(aCols[0].nome);
                                            aCampo.push(aCols[0]);
                                        }

                                        tabelaAtual = Object.assign({}, this.tabelaApiResposta.dados.filter( (tbl) => tbl.id == aCols[0].tabela.id )[0] );

                                        this.tabelaApiResposta.dados.filter((tbl) => {
                                            let aCols2 = tbl.colunas.filter((col2) => {
                                                return col2.tabelaClasse && col2.tabelaClasse.id == tabelaAtual.id && tabelasSelecionadas.indexOf(col2.tabela.id) != -1
                                            });

                                            if (aCols2 && aCols2.length) {
                                                colunaTemp = {coluna: aCols2[0]};
                                            }
                                        });
                                    }
                                    return aCols.length;
                                });

                                
                                j++;
                            }

                            let s = aCampo.map((cmp) => {
                                return cmp.nome
                            }).slice();

                            sColuna = `${s[0]}.${coluna.coluna.nome}`;
                            console.log(sColuna);
                            if( s.length == 1 ){
                                s.push( tabelaAtual.descricao.toLowerCase() );
                            }
                            
                            join = s.join('.');

                            console.log(join);
                        }
                    }

                    if (!sColuna){
                        sColuna = this.classe == coluna.coluna.tabela.nomeJava ? coluna.coluna.nome : `${tabelaExiste.nome}.${coluna.coluna.nome}`;
                    }

                    if (!colunas.filter((col) => col.coluna == sColuna.toLowerCase()).length) {

                        if (i == 5) {
                            console.warn('coluna na posicao 5 *');
                        }

                        if (
                            (tabelaExiste && tabelaExiste.tipo == 'ARRAY')
                        ) {
                            let tabelaAtual = this.tabelaApiResposta.dados.filter((tabela) => tabela.id == coluna.coluna.tabela.id)[0];
                            let oColuna = tabelaAtual.colunas.filter((col) => {
                                // console.log(col);
                                return col.tabelaClasse && col.tabelaClasse.id == tabelaExiste.tabela.id
                            })[0];

                            if (oColuna) {
                                join = `${tabelaExiste.nome}.${oColuna.nome}`;
                                console.log(join);
                            }

                        } else if ((tabelaExiste && oTabelaPrincipal) && tabelaExiste.tabela && tabelaExiste.tabela.id != oTabelaPrincipal.id) {

                            let iTemp2 = 0;
                            let test2;
                            
                            while(iTemp2 < tabelasSelecionadas.length) {
                                let idTblSelecionada2 = tabelasSelecionadas[iTemp2];
                                let tabelaAtual = this.tabelaApiResposta.dados.filter((tabela) => {
                                    return tabela.id == idTblSelecionada2.id;
                                })[0];

                                let colunaEncontrada = tabelaAtual.colunas.filter((col) => col.tabelaClasse && col.tabelaClasse.id == tabelaExiste.tabelaClasse.id)[0];
                                
                                if (colunaEncontrada) {
                                    let test = tabelasSelecionadas.filter((tbl) => tbl.colunas.filter((col) => col.tabela.id == colunaEncontrada.tabela.id).length);
                                    
                                    let aCampos = tabelasSelecionadas.filter((tbl) => tbl.colunas.filter((col) => col.tabelaClasse && col.tabelaClasse.id == test.id));
                                    
                                    aCampos.forEach((aCampo) => {
                                        let test3 = aCampo.colunas.filter((campo) => {
                                            return campo.tabelaClasse && campo.tabelaClasse.id == test[0].id;
                                        });

                                        if (test3[0] && !test2){
                                            test2 = test3[0];
                                        }
                                    })
                                
                                    if (test2){
                                        let nomeTabela = colunaEncontrada.descricao.match(/ /g) ? colunaEncontrada.nome : colunaEncontrada.descricao
                                        join = `${nomeTabela}.${test2.nome}`;
                                        console.log(join);
                                    }

                                }
                                
                                iTemp2++;
                                
                            }
                        }

                        join = ((tabelaExiste && oTabelaPrincipal) && tabelaExiste.tabela.id == oTabelaPrincipal.id) ? undefined : join
                        
                        return {
                            coluna: sColuna, 
                            apenasFiltro: coluna.apenasFiltro,
                            join: join
                        };
                    }
                } else {
                    this.toastr.warning('Não foi encontrado ');
                }
                iTemp++;
            };
        }
        return;
    }

    criaColunasRequest() {
        let colunas = [];
        
        this.colunasPrincipal.forEach((coluna, i) => {

            let oCol = this.pegaColuna(coluna, i);

            if (oCol) {
                colunas.push(oCol);
            }

        });

        return colunas;
    }

    criaCalculosRequest(){
        let calculos = this.calculos;

        calculos = this.calculos.map(
            (calculo) => {
                let objcalculo = calculo;

                if( calculo.tabela && ( calculo.tabela.toUpperCase() != (this.classe.split( '.' )[ this.classe.split( '.' ).length - 1 ]).toUpperCase() ) ){
                    if( objcalculo.campo.toUpperCase().indexOf(`${calculo.tabela}.`) == -1 ){
                        objcalculo.campo = calculo.tabela.toLowerCase() + '.' + objcalculo.campo
                    }
                }

                return objcalculo;
            }
        )

        return calculos;
    }

    criaOrdem() {
        let aOrdem = [];

        Object.keys(this.ordenacao).forEach((ordem) => {
            let tipo = this.ordenacao[ordem].tipo;
            if (!!tipo) {
                aOrdem.push(`${ordem} ${tipo}`);
            }
        });

        return aOrdem.join(', ');
    }

    mostraCampoClasse = Sessao.validaPapelUsuario('WEBPEP:ADMINISTRADOR');
    novaClasse;
    criaRequestFiltro(bIniciaPaginacao = true) {
        let pagina = (bIniciaPaginacao) ? this['variaveisDeAmbiente']['tabela'].paginaAtual : 1; 
        let quantidade = (bIniciaPaginacao) ? 100 : 1;//25;
        let classe = this.classe;
        let calculos = this.criaCalculosRequest();
        let colunas = this.criaColunasRequest();
        let items = this.criaItensRequest();
        let sOrdem = this.criaOrdem();
        
        let request = {
            "classe": classe,
            "calculos": calculos,
            "colunas": colunas,
            "itens": items,
            "pagina": pagina,
            "quantidade": quantidade,
            "ordem": sOrdem,
            "tipo": this.tipoRelatorio
        }

        return request;
    }

    exportar() {
        let request = this.criaRequestFiltro();

        delete request.pagina;
        delete request.quantidade;

        if(!this.colunasPrincipal || !this.colunasPrincipal.length) {
            this.toastr.warning('Nenhuma coluna foi selecionada');
            return;
        }

        if (this.tipoRelatorio == 'tabelas') {
            this.relatorioService.post(request).subscribe(
                (resposta) => {
                    this.gerarResposta(resposta);
                }
            );
        } else {
            let requestBODY = { "likeItens" : [] };

            if (this.variaveisDeAmbiente['dataInicial'] && this.variaveisDeAmbiente['dataFinal']){
                let inicio = moment( this.variaveisDeAmbiente['dataInicial'], this.formatosDeDatas.dataFormato );
                let fim = moment( this.variaveisDeAmbiente['dataFinal'], this.formatosDeDatas.dataFormato );
                if( inicio.isAfter(fim) ){
                    this.toastr.warning("Data inicial maior que a final");
                    return;
                }
                requestBODY["dataInicial"] = this.variaveisDeAmbiente['dataInicial'];
                requestBODY["dataFinal"] = this.variaveisDeAmbiente['dataFinal'];
            }
    
            this.colunas.forEach((coluna) => { requestBODY['likeItens'].push( coluna.coluna.pergunta.id ) });
    
            this.relatorioService.postPerguntasRelatorio(requestBODY, {pagina:0, quantidade:0}).subscribe(
                (resposta) => {
                    this.gerarResposta(resposta);
                }
            );
        }
    }
    
    gerarResposta(respostaRelatorio) {
        let colunasHeader = [];
        this.colunasPrincipalVisiveis.forEach((colunas, i) => {
            colunasHeader.push(colunas.alias || colunas.coluna.descricao);
        });

        respostaRelatorio.dados.forEach((dados, i) => {
            this.formataColuna(dados, this.colunasPrincipal[i], i);

            Object.keys(colunasHeader).forEach(key => {
                let newKey = colunasHeader[key];
                dados[newKey] = dados[key];
                delete dados[key];
            });
        });

        let abaUnica = respostaRelatorio.dados.length < this.limitExport;
        let arrayDivisaoAbas = (abaUnica) ? respostaRelatorio.dados : this.dividirArray(respostaRelatorio.dados, this.limitExport);

        let nomeRelatorio = this.relatorioFiltros && this.relatorioFiltros[0] && this.relatorioFiltros[0].descricao ? 
                            this.relatorioFiltros && this.relatorioFiltros[0] && this.relatorioFiltros[0].descricao : 'relatorio';
        let data = moment().format('DD/MM/YYYY HH:mm');

        this.excelService.exportAsExcelFile(arrayDivisaoAbas, `Relatório_${nomeRelatorio}_${data}`, abaUnica);
    }

    gerarExcel(resposta, header = true){
        const rows = resposta.dados || resposta;
        
        let csvContent = 'data:application/vnd.ms-excel;charset=utf-8,"sep=,"\r\n';
        let aExport = rows.map((row) => {
            let aRow = row.slice();

            aRow.forEach((rowTemp, i) => {
                aRow[i] = this.formataColuna(aRow, this.colunasPrincipal[i], i);
            });

            return aRow;
        });

        //Verificar coluna de cor: #[a-zA-Z\d]{2,6}
        if( header ){
            let aHeaderTemp = this.colunasPrincipal.slice();
            let aHeader = [];
            aHeaderTemp.forEach((coluna, colunaIndex) => {
                let sHeader = this.formataHeader(coluna, colunaIndex);
                aHeader.push(sHeader.replace(/\r?\n|\r/g, ''));
            });

            aExport.unshift(aHeader);
        }

        aExport.forEach(function(rowArray){
            let row = rowArray.map((col) => {
                if (typeof col == 'string') {
                    col = col.replace(/\r?\n|\r/g, '| ');
                    col = col.replace(/,/g, '|');

                    return col;
                }
                return col;
                }).join(",");

            csvContent += row + "\r\n";
        });

        let nomeRelatorio = this.relatorioFiltros && this.relatorioFiltros[0] && this.relatorioFiltros[0].descricao ? 
                            this.relatorioFiltros && this.relatorioFiltros[0] && this.relatorioFiltros[0].descricao : 'relatorio';
        let data = moment().format('DD/MM/YYYY HH:mm');
        let encodedUri = encodeURI(csvContent);
        let link = document.createElement("a");
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Relatório_${nomeRelatorio}_${data}.xls`);
        link.innerHTML= 'Click Here to download';

        link.click();
    }

    pesquisar(evento = null, bIniciaPaginacao = false, retornaRequest = false) {
        
        if (bIniciaPaginacao) {
            this.dados = [];
            this['variaveisDeAmbiente']['tabela'].paginaAtual = 1;
        }

        if( this.tipoRelatorio == 'tabelas' ){


            let request = this.criaRequestFiltro( !retornaRequest );
            if( retornaRequest ){
                console.warn("Retorna request");
                return request;
            }

            request.pagina = evento ? evento.paginaAtual : this['variaveisDeAmbiente']['tabela'].paginaAtual;

            if(!this.colunasPrincipal || !this.colunasPrincipal.length) {
                this.toastr.warning('Nenhuma coluna foi selecionada');
                return;
            }

            this.loading = true;
            
            this.relatorioService.post(request).subscribe((resposta) => {
                
                this['variaveisDeAmbiente']['tabela'].paginaAtual = resposta.paginaAtual;
                let resultados = resposta.dados || resposta;
                if( resultados && resultados.length && this.colunasPrincipalVisiveis && this.colunasPrincipalVisiveis.length && request.calculos.length ){
                    
                    if( resultados[0].length > this.colunasPrincipalVisiveis.length ){
                        
                        let classe = this.classe.split( '.' )[ this.classe.split( '.' ).length - 1 ].toUpperCase();
                        let colunaCount = {
                            alias: `QTD ${classe}`,
                            apenasFiltro: false,
                            campos: undefined,
                            coluna:{
                                tipo:'INTEGER'
                            }
                        }
                        this.colunasPrincipalVisiveis.unshift(colunaCount);
                    }
                }

                this.dados = this.dados.concat(resultados);

                this['variaveisDeAmbiente']['tabela'].qtdItensTotal = resposta.qtdItensTotal;
                this['variaveisDeAmbiente']['tabela'].itensPorPagina = resposta.qtdItensPagina;
                this['variaveisDeAmbiente']['tabela'].paginaAtual = resposta.paginaAtual;
                this.loading = false;

                this.cdr.markForCheck();

            }, (err) => {
                this.toastr.error('Ocorreu um erro ao buscar os dados do relatorio');
                this.loading = false;
            });

        }else{
            // { "likeItens" : ["68","69","70"]}

            let requestBODY = { 
                "likeItens" : [
                // "68","69","70"
                ],
            };

            if( this.variaveisDeAmbiente['dataInicial'] && this.variaveisDeAmbiente['dataFinal'] ){
                let inicio = moment( this.variaveisDeAmbiente['dataInicial'], this.formatosDeDatas.dataFormato );
                let fim = moment( this.variaveisDeAmbiente['dataFinal'], this.formatosDeDatas.dataFormato );
                if( inicio.isAfter(fim) ){
                    this.toastr.warning("Data inicial maior que a final");
                    return;
                }
                requestBODY["dataInicial"] = this.variaveisDeAmbiente['dataInicial'];
                requestBODY["dataFinal"] = this.variaveisDeAmbiente['dataFinal'];
            }

            this.colunas.forEach(
                (coluna) => {
                    requestBODY['likeItens'].push( coluna.coluna.pergunta.id );
                }
            )

            let pagina = evento ? evento.paginaAtual : this['variaveisDeAmbiente']['tabela'].paginaAtual;
            let quantidade = (bIniciaPaginacao) ? 100 : ( evento.itensPorPagina || 1 );//25;

            let request = {
                pagina: pagina,
                quantidade: quantidade
            }

            this.relatorioService.postPerguntasRelatorio(requestBODY, request).subscribe((resposta) => {
                
                this.dados = this.dados.concat(resposta.dados);

                this['variaveisDeAmbiente']['tabela'].qtdItensTotal = resposta.qtdItensTotal;
                this['variaveisDeAmbiente']['tabela'].itensPorPagina = resposta.qtdItensPagina;
                this['variaveisDeAmbiente']['tabela'].paginaAtual = resposta.paginaAtual;
                this.loading = false;

                this.cdr.markForCheck();

            }, (err) => {
                this.toastr.error('Ocorreu um erro ao buscar os dados do relatorio');
                this.loading = false;
            });
            
        }
    }

    limpaTudo() {
        this.classe = undefined;
        this.items = [];
        this.calculos = [];
    }

    uniq(a) {
        let prims = {"boolean":{}, "number":{}, "string":{}}, objs = [];

        return a.filter(function(item) {
            let type = typeof item;
            if(type in prims)
                return prims[type].hasOwnProperty(item) ? false : (prims[type][item] = true);
            else
                return objs.indexOf(item) >= 0 ? false : objs.push(item);
        });
    }


    //  #############################################
    //               Tipo Data
    //  #############################################
    tipoData;
    listaTipoData;
    getTipoData(evento) {
        this.tipoData = evento.valor;
    }

    listaUltimoDataPeriodo;
    ultimoDataPeriodo;
    getUltimoDataPeriodo(evento) {
        this.ultimoDataPeriodo = evento.valor;
    }

    boolean = false;
    getBoolean(evento) {
        //this.boolean = evento.valor ? true : false;
        let bValor = evento.valor == 'true' ? true : false;
        this.respostas['serviceColunas'] = {valor: bValor};
    }

    ultimoDataQuantidade = 1;
    getUltimoDataQuantidade(evento) {
        this.ultimoDataQuantidade = evento.valor;
    }

    iniciaFiltroData() {
        this.listaTipoData = [
            {id: 'NULO', nome: 'Nulo'},
            {id: 'NAONULO', nome: 'Válido'},
            {id: 'INTERVALO', nome: 'Intervalo'},
            {id: 'ULTIMO', nome: 'Último'},
            {id: 'ANTERIOR', nome: 'Anterior'},
            {id: 'ATUAL', nome: 'Atual'},
        ];

        this.listaUltimoDataPeriodo = [
            {id: 'HOUR', nome: 'Hora'},
            {id: 'DAY', nome: 'Dia'},
            {id: 'MONTH', nome: 'Mês'},
            {id: 'YEAR', nome: 'Ano'},
        ];
    }

    //  #############################################
    //               Papeis
    //  #############################################
    papeis = [];
    papelCriar: Saida;
    papelUsuario: Saida;
    objUsuario;
    valorUsuarioSelecionado;
    usuarioPermissaoSelecionado;

    formularioPapeisDash;
    formularioPapeis;
    podeCriar;
    podeVer;

    permissoesUser;
    permissoesRole;
    permissoesRoleRelatorios = [];
    permissoesUserRelatorios = [];

    modalConfirmar;
    removerPapelDash(papel) {
        this.modalConfirmar = this.modalService.open(NgbdModalContent);
        this.modalConfirmar.componentInstance.modalHeader = `${papel.usuario ? papel.usuario.nome : 'Remover Permissão'}`;
        this.modalConfirmar.componentInstance.modalMensagem = `Deseja mesmo remover essa permissão?`;
        this.modalConfirmar.componentInstance.modalAlert = true;

        this.modalConfirmar.componentInstance.retorno.subscribe(
            (retorno) => {
                if (retorno) {
                    this.relatorioFiltroService.removeDash(papel.id).subscribe(
                        () => {
                            this.carregaPapeisDash();
                        }, (error) => {
                            Servidor.verificaErro(error, this.toastr);
                        }
                    );
                }
            }
        );
    }

    removerPapel(papel) {
        this.modalConfirmar = this.modalService.open(NgbdModalContent);
        this.modalConfirmar.componentInstance.modalHeader = `${papel.usuario.nome}`;
        this.modalConfirmar.componentInstance.modalMensagem = `Deseja mesmo remover essa permissão?`;
        this.modalConfirmar.componentInstance.modalAlert = true;

        this.modalConfirmar.componentInstance.retorno.subscribe(
            (retorno) => {
                if (retorno) {
                    this.relatorioFiltroService.removeRole(papel.id).subscribe(
                        () => {
                            this.carregaPapeis();
                        }, (error) => {
                            Servidor.verificaErro(error, this.toastr);
                        }
                    );
                }
            }
        );
    }

    fnCfgUsuarioRemote(term) {

        let objParam = { 
            like : term,
            quantidade : 10,
            pagina : 1
        };

        this.usuarioService.usuarioLike(objParam).subscribe(
            (retorno) => {
                this.objUsuario = retorno.dados || retorno;
            }
        );
    }

    getUsuario(usuario) {
        this.valorUsuarioSelecionado = usuario.nome;
        this.usuarioPermissaoSelecionado = usuario;
    }

    valorUsuarioSelecionadoPermissao
    getUsuarioPermissao(usuario){
        this.valorUsuarioSelecionadoPermissao = usuario.nome;
        this.usuarioPermissaoSelecionado = usuario;
    }

    addPapel(podeCriar = true) {
        if (this.papelCriar.valido && this.papelCriar.valor != 0) {
            let papel = {
                filtro: { id: this.relatorioid },
                papel: { guid: this.papelCriar.valor },
                tipo: podeCriar ? 'CRIAR' : 'VER' 
            };

            this.relatorioFiltroService.addDash(papel).subscribe(
                (status) => {
                    this.toastr.success("Papel de Dashboard adicionado");
                    this.carregaPapeisDash();
                }
            );
        }
    }

    addUser(podeCriar = true) {
        if (this.usuarioPermissaoSelecionado) {
            let papel = {
                filtro: { id: this.relatorioid },
                tipo: podeCriar ? 'CRIAR' : 'VER',
                usuario: { guid: this.usuarioPermissaoSelecionado.guid }
            };

            this.relatorioFiltroService.addDash(papel).subscribe(
                (status) => {
                    this.toastr.success("Usuario de Dashboard adicionado");
                    this.carregaPapeisDash();
                }
            );
        }
    }

    addUserPermissaoRelatorio(podeCriar = true){
        if (this.usuarioPermissaoSelecionado) {
            let papel = {
                filtro: { id: this.relatorioid },
                usuario: { guid: this.usuarioPermissaoSelecionado.guid },
                tipo: podeCriar ? 'CRIAR' : 'VER' 
            };

            this.relatorioFiltroService.addRole(papel).subscribe(
                (status) => {
                    this.toastr.success("Usuario de Relatorio adicionado");
                    this.usuarioPermissaoSelecionado = undefined;
                    this.carregaPapeis();
                }
            );
        }
    }

    adicionarUsuarioPermissao(usuario, tipo, podeCriar = true){

        if( tipo == 'dash' ){
            let papel = {
                filtro: { id: this.relatorioid },
                usuario: { guid: usuario.guid }
            };
    
            this.relatorioFiltroService.addDash(papel).subscribe(
                (status) => {
                    this.toastr.success("Usuario de Dashboard adicionado");
                    this.carregaPapeisDash();
                }
            );
        }else{
            
            let papel = {
                filtro: { id: this.relatorioid },
                usuario: { guid: usuario.guid },
                tipo: podeCriar ? 'CRIAR' : 'VER' 
            };
    
            this.relatorioFiltroService.addRole(papel).subscribe(
                (status) => {
                    this.toastr.success("Permissao de Usuario adicionada");
                    this.carregaPapeis();
                }
            );
        }
    }

    carregaPapeisDash(nginit = false) {
        
        let observable = this.relatorioFiltroService.getDash({relatorioFiltroId: this.relatorioid})
        this.papelCriar = new Saida();

        if( nginit ){
            return new Promise((resolve, reject) => {
                observable.subscribe((formularioPapeis) => {
                    this.funcaoGetPapeisDash(formularioPapeis);
                    resolve( true );
                })
            })
        }else{
            observable.subscribe((formularioPapeis) => {
                this.funcaoGetPapeisDash(formularioPapeis);
            });
        }
    }

    funcaoGetPapeisDash(formularioPapeis){
        this.formularioPapeisDash = formularioPapeis.dados;

        this.permissoesRole = this.filtrarPapeisDash('papel', this.formularioPapeisDash).reverse();
        this.permissoesUser = this.filtrarPapeisDash('usuario', this.formularioPapeisDash).reverse();
    }

    carregaPapeis(nginit = false) {
        let observable = this.relatorioFiltroService.getRoles({relatorioFiltroId: this.relatorioid});

        this.papelCriar = new Saida();

        if( nginit ){

            // new Promise((resolve, reject) => {
            return new Promise((resolve, reject) => {
                    observable.subscribe((formularioPapeis) => {
                    this.funcaoGetPapeis(formularioPapeis)
                    resolve( true );
                });
            })
        }else{
            observable.subscribe((formularioPapeis) => {
                this.funcaoGetPapeis(formularioPapeis);
            });
        }
    }

    funcaoGetPapeis(formularioPapeis){
        this.formularioPapeis = formularioPapeis.dados;

        if( !Sessao.validaPapelUsuario("WEBPEP:ADMINISTRADOR") && this.relatorioid){
            if( !!this.formularioPapeis.length ){
                this.podeCriar = !!this.validaPapeis('CRIAR', this.formularioPapeis).length
                this.podeVer = !!this.validaPapeis('VER', this.formularioPapeis).length;
            }
            
            
            if( !this.podeCriar ){
                this.podeCriar = this.relatorio && this.relatorio.usuario ? (this.relatorio.usuario.guid == Sessao.getUsuario()['guid']) : false;
            }
            

            ( !this.podeVer ) ? this.podeVer = this.podeCriar : null;

        }else{
            this.podeCriar = true;
            this.podeVer = true;
        }

        this.permissoesRoleRelatorios = this.filtrarPapeis('papel', this.formularioPapeis).reverse();
        this.permissoesUserRelatorios = this.filtrarPapeis('usuario', this.formularioPapeis).reverse();

        return true;
    }

    addPapelPermissao(podeCriar = true) {
        if (this.papelCriar.valido && this.papelCriar.valor != 0) {
            let papel = {
                filtro: { id: this.relatorioid },
                papel: { guid: this.papelCriar.valor },
                tipo: podeCriar ? 'CRIAR' : 'VER' 
            };

            this.relatorioFiltroService.addRole(papel).subscribe(
                (status) => {
                    if (status) {
                        this.toastr.success("Papel adicionado");
                        this.carregaPapeis();
                    }
                }
            );
        }
    }
    
    filtrarPapeisDash(tipo: string, papeis) {

        let tmp;
        if (papeis)
            tmp = papeis.filter(function (papel) {
                return papel[tipo];
            });

        return tmp;
    }

    filtrarPapeis(tipo: string, papeis) {

        let tmp;
        if (papeis)
            tmp = papeis.filter(function (papel) {
                return papel[tipo];
            });

        return tmp;
    }

    validaPapeis(tipo: string, papeis) {

        let tmp;
        if (papeis)
            tmp = papeis.filter(function (papel) {
                let objeto = papel.papel || papel.usuario

                if( papel.papel ){
                    if( Sessao.validaPapelUsuario(objeto.nome) ){
                        return papel.tipo == tipo;
                    }
                }else{
                    return papel.tipo == tipo && objeto.guid == Sessao.getUsuario()['guid'];
                }
            });

        return tmp;
    }

    getPapelCriar(evento) {
        this.papelCriar = evento;

        if( evento && evento.valor ){
            this.getUsuariosComPapel(evento.valor);
        }
    }

    usuariosComPapel = [];
    usuariosComPapelFiltro = [];
    getUsuariosComPapel(papel){
        this.usuarioService.getUsuariosPorPapel(papel).subscribe(
            (usuariosComPapel) => {
                this.usuariosComPapel = usuariosComPapel[0].papel.papeisUsuario;
                this.usuariosComPapelFiltro = usuariosComPapel[0].papel.papeisUsuario;
            }
        )
    }

    verUsuariosComPermissao(tipo){
        this.modalInstancia = this.modalService.open(NgbdModalContent, {size: 'lg'});
        this.modalInstancia.componentInstance.modalHeader = `Usuarios com Papel`;

        this.modalInstancia.componentInstance.templateRefBody = this.BodyModalUsuariosPapel;
        this.modalInstancia.componentInstance.contextObject = { tipo : tipo };
    }


    pesquisaUsuariosComPapel(texto){

        if( texto && texto.length ){
            this.usuariosComPapelFiltro = this.usuariosComPapel.filter(
                (usuario) => {
                    return ( usuario.nome.toUpperCase().trim().indexOf(texto.toUpperCase().trim()) >= 0 )
                }
            )
        }else{
            this.usuariosComPapelFiltro = this.usuariosComPapel;
        }

    }

    getPapelUsuario(evento) {
        this.papelUsuario = evento;
    }

    formularioSelecionado;
    formulario = [];
    perguntasSelecionadas = [];
    idFormularioSelecionado;
    getFormulario(formulario) {
        this.idFormularioSelecionado = formulario.id;

        this.perguntasSelecionadas = this.validaPerguntasSelecionadas();

        this.cdr.markForCheck();
        this.formularioSelecionado = formulario.titulo;
    }

    objFormularios;
    fnCfgFormularioRemote(term) {
        this.serviceFormulario.getFormularioLike(term).subscribe(
            (retorno) => {
                this.objFormularios = retorno.dados || retorno;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        );
    }

    //  #############################################
    //               Configuração de Relatorio
    //  #############################################
    cfgRelatoriAtual = 'configuracao';
    listaTabelasDisponives = [];
    iniciaTabelasDisponiveis(tabelasApi = undefined, enums = undefined) {
        let filtros = [];

        if( !tabelasApi ){
            tabelasApi = this.tabelaApiResposta;
            enums = this.enums
        }else{
            this.tabelaApiResposta = tabelasApi;
            this.enums = enums
        }
        let apis = tabelasApi.dados.filter(dado => dado.colunas && dado.colunas.length);

        apis.forEach((api) => {
            let sFiltro = api.nome;
            let campos = [];

            api.colunas.filter(coluna => coluna.filtro).forEach((filt) => {
                let opcoes;
                let paiId = filt.tabela ? filt.tabela.id : null;
                if (filt.enumClasse) {
                    opcoes = enums.filter(resp => resp.nome == filt.enumClasse)[0];
                    opcoes = opcoes ? opcoes.lista : opcoes;
                }
                
                campos.push({
                    nome: filt.descricao, 
                    tipo: filt.tipo,
                    opcoes: opcoes,
                    idProp: 'codigo',
                    descProp: 'nome',
                    paiId: paiId
                });
            });

            filtros.push({ 
                id: api.id,
                nomeJava: api.nomeJava,
                nome: sFiltro, 
                campos: campos
            });
        });
        
        this.listaTabelasDisponives = filtros.slice().map((filt) => { return {id: filt.id, nome: filt.nome, nomeJava: filt.nomeJava} });
        if (filtros && filtros.length) {
            let tipoRelatorio =  this.respostas['tipoRelatorio'] && this.respostas['tipoRelatorio'].valor && this.respostas['tipoRelatorio'].valor != '0' ? this.respostas['tipoRelatorio'] : { valor: filtros[0].id };
        }

    }

    paginaAtualPerguntas = 1;
    itensPorPaginaPerguntas = 20;
    totalPerguntas;
    perguntasPaginado = [];
    getPerguntasPaginado(evento = null, params = undefined){

        let request = {
            pagina : evento ? evento.paginaAtual : this.paginaAtualPerguntas,
            quantidade: this.itensPorPaginaPerguntas,
            // simples: true
        }

        request = Object.assign(request, params)
        
        this.perguntaService.pergunta(request).subscribe(
            (retorno) => {
                let perguntas = retorno.dados || retorno;
                this.perguntasPaginado = perguntas;
                this.totalPerguntas = retorno.qtdItensTotal;

                this.validaPerguntasSelecionadas();
                this.cdr.markForCheck()
            }
        )

    }

    pesquisarPerguntas(texto){
        this.getPerguntasPaginado({paginaAtual: 1}, { like: texto });
        
    }

    converteTipoPergunta(pergunta){
        let tipo = pergunta.tipo.toUpperCase();
        switch (tipo) {
            case 'BOOLEAN':
                tipo = 'SIM/NÃO'
                break;
            case 'RADIO':
                tipo = 'SELECIONA'
                break;
            case 'SELECAO':
                tipo = 'CHECKBOX'
                break;
            default:
                break;
        }

        return tipo;
    }

    trocaTipoRelatorio(tipoRelatorio) {
        //this.respostas['tipoRelatorioInfo'] = { valor: tipoRelatorio };
        this.variaveisDeAmbiente['colunasPorTabela'] = this.tabelaApiResposta.dados.filter(
            (api) => {
                if( api.id == tipoRelatorio ){
                    this.variaveisDeAmbiente['descricaoTabelaApi'] = api.descricao
                }
                return api.id == tipoRelatorio
            }
        )[0].colunas;
            
        
    }

    validaCheck(unidade){

    }

    validaPerguntasSelecionadas(){
        let arrayIdPerguntas = [];

        this.colunasPrincipalVisiveis.forEach(
            (pergunta) => {
                if( pergunta.coluna && pergunta.coluna.pergunta
                    // && pergunta.coluna.formulario 
                    ){
                    arrayIdPerguntas.push( pergunta.coluna.pergunta.id );
                }
            }
        )

        return arrayIdPerguntas;
    }

    validaColunasDetalheSelecionadas(){
        let arrayColunasDetalhe = [];
        
        if( this.colunasDetalhe && this.colunasDetalhe.length ){
            this.colunasDetalhe.forEach(
                (coluna) => {
                    arrayColunasDetalhe.push( (coluna.coluna || coluna).id );
                }
            )
        }
        return arrayColunasDetalhe;
    }

    validaPerguntaInserida(idpergunta){
        let arrayPerguntas = this.validaPerguntasSelecionadas()

        let retorno = false;
        if( arrayPerguntas && arrayPerguntas.length ){            
            retorno = arrayPerguntas.indexOf(idpergunta) >= 0
        }

        return retorno;
    }

    validaColunaDetalheRelatorio(idcoluna){
        let arrayColunasDetalhe = this.validaColunasDetalheSelecionadas()

        let retorno = false;
        if( arrayColunasDetalhe && arrayColunasDetalhe.length ){            
            retorno = arrayColunasDetalhe.indexOf(idcoluna) >= 0
        }

        return retorno;
    }

    getUnidadeAtendimento(evento){
        if( evento && evento != '0' ){
            let request = {
                unidadeAtendimento: {
                    id: evento
                }
            }
            this.relatorioFiltroService.put(this.relatorioid, request).subscribe((resposta) => {
                this.toastr.success("Unidade de Atendimento Salva com sucesso");
                this.unidadeAtendimento = evento;
            });
        }
    }    

    mudaVisaoColunasDisponiveis(idTabelaApi){
        this.respostas['infoTabela'] = { valor: idTabelaApi };
        this.trocaTipoRelatorio(idTabelaApi);

        this.validaFonteDeDadosRelatorio(idTabelaApi, true);
    }

    validaFonteDeDadosRelatorio(idTabela, validaSeExiste){
        if( validaSeExiste ){
            this.variaveisDeAmbiente['tabelasDisponiveis'] = !!this.variaveisDeAmbiente['tabelasDisponiveis'] ? this.variaveisDeAmbiente['tabelasDisponiveis'] : [];

            // if( this.variaveisDeAmbiente['tabelasDisponiveis'] && this.variaveisDeAmbiente['tabelasDisponiveis'].length ){
                let existe = this.variaveisDeAmbiente['tabelasDisponiveis'].filter(
                    (tabela) => {
                        return tabela.id == idTabela;
                    }
                )

                if( !existe.length ){
                    let tabela = this.listaTabelasDisponives.filter(
                        (tabela) => {
                            return tabela.id == idTabela;
                        }
                    );
                    this.variaveisDeAmbiente['tabelasDisponiveis'].push(tabela[0])
                }
            // }
        }
    }

    removeColunasDaTabela(ev, tabela){
        ev.stopPropagation();  
        
        this.variaveisDeAmbiente['tabelasDisponiveis'] = this.variaveisDeAmbiente['tabelasDisponiveis'].filter(
            (retorno) => { return retorno.id != tabela.id; }
        );

        this.variaveisDeAmbiente['tabelasSelecionadas'] = this.variaveisDeAmbiente['tabelasSelecionadas'].filter(
            (id) => { return id != tabela.id; }
        );

        this.modalConfirmar = this.modalService.open(NgbdModalContent);
        this.modalConfirmar.componentInstance.modalHeader = `${tabela.nome}`;
        this.modalConfirmar.componentInstance.modalMensagem = `Deseja excluir também todas as colunas adicionadas dessa tabela?`;
        this.modalConfirmar.componentInstance.modalAlert = true;

        this.modalConfirmar.componentInstance.retorno.subscribe(
            (retorno) => {
                if (retorno) {
                    this.colunasPrincipal = this.colunasPrincipal.filter(
                        (coluna) => { return coluna.coluna.tabela.id != tabela.id; }
                    );
            
                    this.colunas = this.colunasPrincipal;
                    this.toastr.success("Tabela removida");
                }
            }
        );
    }


    //  #############################################
    //               Configuração de Relatorio
    //  #############################################
    colunasVisiveis = [];
    tituloRelatorio;
    unidadeAtendimento;
    iniciaOpcoes(adicionarItem = false) {
        this.listaEnums = [];
        this.variaveisDeAmbiente['temFonteDados'] = true;

        if(!this.variaveisDeAmbiente['tabelasSelecionadas']) {
            this.variaveisDeAmbiente['tabelasSelecionadas'] = [];
        }
        if (this.variaveisDeAmbiente['tabelasSelecionadas'].indexOf( this.respostas['serviceTabelaApi'].valor.tabela.id ) == -1){
            this.variaveisDeAmbiente['tabelasSelecionadas'].push(this.respostas['serviceTabelaApi'].valor.tabela.id);
        }
        
        if (this[`inicializaCampo_${this.respostas['serviceTabelaApi'].valor.tipo}`]) {
            this[`inicializaCampo_${this.respostas['serviceTabelaApi'].valor.tipo}`]();
        }

        if( adicionarItem )
            this.adicionaItem();
    }

    tabelaDisponivel;
    getTabelaDisponivel(evento, ignoraTabelasDisponiveis = false) {
        if( evento && !evento.valor ){
            return;
        }
        this.tabelaDisponivel = evento.valor;
        console.log(evento);
        
        let oClasse:any = new Object();
        if (this.variaveisDeAmbiente['tabelasDisponiveis'] && !ignoraTabelasDisponiveis) {
            oClasse = this.variaveisDeAmbiente['tabelasDisponiveis'].filter((tbl) => {
                return tbl.id == evento.valor
            })[0];

            if (oClasse) {
                this.classe = oClasse.nomeJava;
            }
            //[fnOnChange]="trocaTipoRelatorio.bind(this)"formataFonteDeDados
        }else{
            if( ignoraTabelasDisponiveis ){
                oClasse = this.tabelaApiResposta.dados.filter(
                    (tbl) => {
                        return tbl.id == evento.valor
                    }
                )[0];

                if( this.variaveisDeAmbiente['tabelasSelecionadas'] && ( this.variaveisDeAmbiente['tabelasSelecionadas'].indexOf(evento.valor) < 0)){
                    this.variaveisDeAmbiente['tabelasSelecionadas'].push( evento.valor );
                }

            }
        }

        this.classe = oClasse.nomeJava || '[nenhuma]';
        
    }
    

    inicializaCampo_ENUM() {

        this.respostas['serviceTabelaApi'].valor.enumClasse;

        let oEnum = this.enums.filter((enumTemp) => {
            return enumTemp.nome == this.respostas['serviceTabelaApi'].valor.enumClasse;
        })[0];

        this.listaEnums = oEnum ? oEnum.lista : [];
    }

    inicializaCampo_CLASSE() {
        //this.tabelaClasse.nomeBanco == PACIENTE
        this.respostas['serviceTabelaApi'].valor;
        let id = this.respostas['serviceTabelaApi'].valor.tabelaClasse.id;
        let api = this.tabelaApiResposta.dados.filter((dado) => {
            return dado.id == id
        })[0];

        if (!api) {
            this.toastr.warning('Não foi encontrado nenhuma api para este tipo de campo');
            return;
        }

        //let restApi = api.rests.filter(rest => rest.autoComplete)[0];
        let restApi = api.rests[0];

        if (!restApi || restApi.tipo == 'DELETE') {
            this.toastr.warning('Não foi encontrado nenhuma fonte de dados para este tipo de campo');
            this.variaveisDeAmbiente['temFonteDados'] = false;
            return;
        }

        let campos = api.colunas.filter((coluna) => coluna.text).slice().map((coluna) => coluna.nome);
        
        this.variaveisDeAmbiente['objValoresAPI'] = {
            tipo: restApi.tipo, 
            urn: restApi.urn,
            campos: campos
        }
    }

    getTituloRelatorio(evento) {
        this.tituloRelatorio = evento.valor || evento;
    }

    colunasDetalhe = [];
    aliasesCalculo = new Object();
    getDadosDashBoard() {
        if (this.validaGrafico(false) && this.validaDados(false)) {
            return {
                titulo: this.tituloGrafico,
                tipo: this.tipoGrafico,
                legendas: this.chartLegendas,
                valores: this.chartValores,
                filtros: this.criaRequestFiltro(),
                colunasDetalhe: this.colunasDetalhe,
                aliasesCalculo: this.aliasesCalculo,
                coresDashboard: this.objCoresDashboard,
                subtitulo1: this.subtitulo1,
                subtitulo2: this.subtitulo2
            };
        }
        return;
    }

    salvarRelatorio(bAtualizar = false) {
        if (!this.tituloRelatorio || this.tituloRelatorio == '') {
            this.toastr.warning('Favor Informe o nome do relatório');
            return;
        }

        let json = {
            colunas: (this.tipoRelatorio == 'tabela') ? this.colunasPrincipal : this.colunas,
            calculos: this.calculos,
            colunasOperacoes: this.colunasOperacoes || [],
            items: this.items,
            classe: this.classe,
            tipoItemAtual: this.tipoItemAtual,
            tabelasIds: this.variaveisDeAmbiente['tabelasSelecionadas'],
            dashboard: this.getDadosDashBoard(),
            tipo: this.tipoRelatorio,
            dataInicial: this.variaveisDeAmbiente['dataInicial'],
            dataFinal: this.variaveisDeAmbiente['dataFinal']
        };

        if( this.variaveisDeAmbiente['dataInicial'] && this.variaveisDeAmbiente['dataFinal'] ){
            let inicio = moment( this.variaveisDeAmbiente['dataInicial'], this.formatosDeDatas.dataFormato );
            let fim = moment( this.variaveisDeAmbiente['dataFinal'], this.formatosDeDatas.dataFormato );
            if( inicio.isAfter(fim) ){
                this.toastr.warning("Data inicial maior que a final");
                return;
            }
            json["dataInicial"] = this.variaveisDeAmbiente['dataInicial'];
            json["dataFinal"] = this.variaveisDeAmbiente['dataFinal'];
        }

        let request = {
            "descricao": this.tituloRelatorio,
            "json": JSON.stringify(json).replace(/\n/g,"")
        };

        if( this.novaClasse ){
            let regex = new RegExp( this.classe, 'gi' );
            request['json'] = request['json'].replace( regex, this.novaClasse );
            this.classe = this.novaClasse;
        }

        if (bAtualizar) {
            this.relatorioFiltroService.put(this.relatorioid, request).subscribe((resposta) => {
                this.toastr.success("Salvo com sucesso");
                this.modalInstancia.dismiss();
            });

            return;
        }
        request["usuario"] = {
            guid : Sessao.getUsuario()['guid']
        };
        
        this.relatorioFiltroService.post(request).subscribe((resposta) => {
            this.router.navigate([`/${Sessao.getModulo()}/relatorios/${resposta}`]);
            this.relatorioid = resposta;

            this.toastr.success("Salvo com sucesso");
            this.modalInstancia.dismiss();
        });
    }

    //  #############################################
    //               Colunas
    //  #############################################
    colunas = [];
    calculos = [];
    colunasOperacoes = [];
    items = [];
    colunasPrincipal = [];
    colunasPrincipalVisiveis = [];
    classe;
    tipoItemAtual;
    removeColuna(item, itemIndex) {
        this.colunas.splice(itemIndex, 1);

        if (!this.colunas.length) {
            this.limpaTudo();
        }
    }

    removeFiltro(item, itemIndex) {
        this.items.splice(itemIndex, 1);
    }

    removeCalculo(calculo, calculoIndex) {
        this.calculos.splice(calculoIndex, 1);
    }

    removeColunaOperacao(calculo, colunaIndex){
        this.colunasOperacoes.splice(colunaIndex, 1);
    }

    alteraItens(evt, tipo) {
        this.tipoItemAtual = tipo;
    }

    validaItem(validaTipo = false) {
        let bValido = true;


        //Caso seja função de adicionar filtro rápido nao adiciona nenhum valor padrão
        if( validaTipo ){
            if (
                this.respostas['serviceTabelaApi'] && 
                this.respostas['serviceTabelaApi'].valor &&
                (
                    (
                        this.respostas['serviceTabelaApi'].valor.tipo == 'DATA' ||
                        this.respostas['serviceTabelaApi'].valor.tipo == 'DATAHORA'
                    ) &&
                    this.tipoData != 'INTERVALO' &&
                    this.tipoData != 'NULO'
                )
            ) {
                
                if (
                    !this.ultimoDataPeriodo && this.tipoData != 'NAONULO'
                ) {
                    this.toastr.warning('Por favor informe um valor para filtro');
                    return false;
                }

            } else if (
                this.respostas['serviceTabelaApi'] && 
                this.respostas['serviceTabelaApi'].valor && 
                (
                    (
                        (
                            this.respostas['serviceTabelaApi'].valor.tipo == 'DATA' ||
                            this.respostas['serviceTabelaApi'].valor.tipo == 'DATAHORA' 
                        ) && 
                        this.tipoData == 'INTERVALO'
                    ) ||
                    this.respostas['serviceTabelaApi'].valor.tipo == 'INTEGER'||
                    this.respostas['serviceTabelaApi'].valor.tipo == 'DOUBLE'
                )
            ) {
                
                if (
                    !this.respostas['intervaloInicio'] || 
                    !this.respostas['intervaloInicio'].valor || 
                    this.respostas['intervaloInicio'].valor == ''
                ) {
                    this.toastr.warning('Por favor informe um valor para filtro');
                    return false;
                }

            } else { 
                
                if (
                    this.respostas['serviceTabelaApi'].valor.tipo == 'BOOLEAN' ||
                    this.tipoData == 'NULO'
                ) {
                    return true;
                }

                if (!this.tipoItemAtual) {
                    this.toastr.warning('Para adicionar um filtro é necessário informar o tipo');
                    return false;
                }

                if (
                    (!this.respostas['serviceColunas'] || !this.respostas['serviceColunas'].valor) &&
                    (this.tipoItemAtual != 'NAONULO' && this.tipoItemAtual != 'NULO')
                ) {
                    this.toastr.warning('Por favor informe um valor para filtro');
                    return false;
                }

            }
        }else{
            this.tipoItemAtual = 'IGUAL'
            return true;
        }


        return bValido;
    }


    objParamNovaOperacao = {
        formula: [],
        label: '',
        nome: '',
        retorno: '',
        dataReferencia: ''
    }

    bBalculoData = false;
    setElementoFormula(item){

        let descColuna = item.coluna.descricao;
        let index;
        this.colunasPrincipalVisiveis.forEach(
            (coluna, i) => {
                if( descColuna == coluna.coluna.descricao ){
                    index = i;
                    return true;
                }
            }
        )

        this.objParamNovaOperacao['formula'].push( {
                index: index,
                nome: item.coluna.descricao
            }
         );
    }

    removeElementoFormula(obj, idx){
        this.objParamNovaOperacao['formula'].splice(idx, 1);
    }

    setOperacaoFormula(evento){
        if( evento && evento.valor ){
            this.objParamNovaOperacao['formula'].push( {
                    index: '',
                    nome: evento.valor 
                }
            );
        }
    }

    dataInstancia
    getDataInstancia(instancia) {
        this.dataInstancia = instancia;
    }

    getData(evento) {
        if( evento && evento.length ){
            this.objParamNovaOperacao.dataReferencia = evento[0].format('DD/MM/YYYY');
        }else{
            this.objParamNovaOperacao.dataReferencia = 'hoje';
        }
    }

    setTipoRetornoFormula(evento){
        if( evento && evento.valor ){
            this.objParamNovaOperacao['retorno'] = evento.valor;
        }
    }

    setDataReferenciaFormula(evento){
        if( evento && evento.valor ){
            this.objParamNovaOperacao.dataReferencia = evento.valor;
        }else{
            this.objParamNovaOperacao.dataReferencia = 'hoje';
        }
    }

    formataCampoFormula(coluna){
        let retorno = '';

        if(coluna.formula){
            coluna.formula.forEach(
                (elemento) => {
                    retorno += elemento.nome;
                }
            )  
        }

        return retorno;
    }

    formataCampoRetorno(coluna){
        let retorno = this.opcoesRetorno.filter(
            (retorno) => {
                return retorno.id == coluna.retorno
            }
        )

        return retorno.length ? retorno[0].nome : 'Anos';
    }

    salvarColunaOperacao(){

        if( !this.objParamNovaOperacao['retorno'] ){
            this.objParamNovaOperacao['retorno'] = 'y'
        }

        this.colunasOperacoes.push( this.objParamNovaOperacao );
        this.objParamNovaOperacao = {
            formula: [],
            label: '',
            nome: '',
            retorno: '',
            dataReferencia: ''
        }

        this.bBalculoData = false;
    }

    /*pegaCampo_CLASSE(valor) {
        let colunaApi = this.respostas['serviceTabelaApi'].valor;
        let tabelaClasse = this.tabelaApiResposta.dados.filter((tabela) => {
            return tabela.id == colunaApi.tabelaClasse.id
        })[0];

        if (!tabelaClasse)
            return;

        let oPk = tabelaClasse.colunas.filter((colunaTemp) => {
            return colunaTemp.pk
        })[0];

        let pkCampo = oPk.nome;


        return `${pkCampo}`;
    }*/

    pegaPk(valor) {
        let colunaApi = this.respostas['serviceTabelaApi'] ? this.respostas['serviceTabelaApi'].valor : valor;
        
        let tabelaPrincipal = this.tabelaApiResposta.dados.filter((tabela) => {

            //if (colunaApi && colunaApi.tabelaClasse) {
            if (colunaApi.tipo == 'CLASSE') {
                return colunaApi && colunaApi.tabelaClasse && colunaApi.tabelaClasse.id == tabela.id;
            } else {
                
                let oApi = this.tabelaApiResposta.dados.filter((api) => {
                    return api.id == colunaApi.tabela.id
                })[0];

                if (oApi) {
                    let temColuna = oApi.colunas.filter((col) => {
                        return col.tabela.id == colunaApi.tabela.id
                    })[0];

                    return !!temColuna;
                }
            }

            return;

        });

        if( !this.validaCaminhoClasse(tabelaPrincipal) ){
            return
        }

        tabelaPrincipal = tabelaPrincipal[0];

/*
        if (!tabelaPrincipal) {

            if (coluna.coluna.tabela.nomeJava != this.classe) {
                this.toastr.warning('Não foi encontra');
                return;
            }
        }
*/


        /*if (!tabelaPrincipal)
            return;*/

        let oPk = tabelaPrincipal.colunas.filter((colunaTemp) => {
            return colunaTemp.pk
        })[0];

        return oPk;
    }

    pegaClasse_CLASSE(valor, coluna) {
        let oPk = this.pegaPk(valor);

        return oPk.tipo;
    }
    pegaValor_CLASSE(valor, coluna) {
        let oPk = this.pegaPk(valor);

        return valor[oPk.nome];
    }
    pegaValor_DATA(valor, coluna) {
        let oPk = this.pegaPk(valor);

        return valor[oPk.nome];
    }
    pegaCampo_CLASSE(valor, coluna) {
        let oPk = this.pegaPk(valor);

        let pk = valor ? `.${oPk.nome}` : ''
        
        if (!valor)
            console.warn('Nao tem valor...   COLUNA:  ' + coluna.nome);
        
        return `${coluna.nome}` + pk;
    }
    pegaCampo_DATA(valor, coluna) {
        let oPk = this.pegaPk(valor);

        return `${coluna.nome}.${oPk.nome}`;
    }
    pegaCampo_ENUM(valor, coluna) {
        let tabelaPrincipal = this.tabelaApiResposta.dados.filter((tabela) =>{ return tabela.nomeJava == this.classe});

        if( !this.validaCaminhoClasse(tabelaPrincipal) ){
            return
        }

        tabelaPrincipal = tabelaPrincipal[0];
        if (coluna.tabela.id == tabelaPrincipal.id) {
            return `${coluna.nome}`;
        }

        let oTabela = tabelaPrincipal.colunas.filter((colunaTemp) => {
            return colunaTemp.tabelaClasse
        }).filter((colunaTemp) => {
            return colunaTemp.tabelaClasse.id == coluna.tabela.id;
        })[0];

        return `${oTabela.nome}.${coluna.nome}`;
    }

    pegaCampo(valor, coluna) {
        let tabelaPrincipal = this.tabelaApiResposta.dados.filter((tabela) =>{ return tabela.nomeJava == this.classe});

        if( !this.validaCaminhoClasse(tabelaPrincipal) ){
            return
        }

        tabelaPrincipal = tabelaPrincipal[0];
        coluna = coluna.coluna || coluna;

        if (tabelaPrincipal.id == coluna.tabela.id) {
            return coluna.nome;
        }

        let tabelaAtual = Object.assign({},tabelaPrincipal);
        let j = 0;
        let encontrado = false;
        let colunaTemp = coluna.coluna ? Object.assign({}, coluna) : Object.assign({}, {coluna: coluna});
        let tabelasSelecionadas = this.variaveisDeAmbiente['tabelasSelecionadas'];
        let aCampo = [];

        while (j < 7 || encontrado) {
            let colunas = tabelaAtual.colunas.filter((col) => col.tabelaClasse);
            
            let colSel = colunas.map((colId) => colId.tabelaClasse.id);
            
            let bbb = this.tabelaApiResposta.dados.filter( (tabela) => {
                let aCols = tabela.colunas.filter((col2) => {
                    return col2.tabelaClasse && col2.tabelaClasse.id == colunaTemp.coluna.tabela.id && tabelasSelecionadas.indexOf(col2.tabela.id) != -1
                });

                if (aCols && aCols.length) {
                    if (aCampo.filter((cmp) => cmp.tabela.id == aCols[0].tabela.id).length == 0) {
                        //aCampo.push(aCols[0].nome);
                        aCampo.push(aCols[0]);
                    }

                    tabelaAtual = Object.assign({}, this.tabelaApiResposta.dados.filter( (tbl) => tbl.id == aCols[0].tabela.id )[0] );

                    this.tabelaApiResposta.dados.filter((tbl) => {
                        let aCols2 = tbl.colunas.filter((col2) => {
                            return col2.tabelaClasse && col2.tabelaClasse.id == tabelaAtual.id && tabelasSelecionadas.indexOf(col2.tabela.id) != -1
                        });

                        if (aCols2 && aCols2.length) {
                            colunaTemp = {coluna: aCols2[0]};
                        }
                    });
                }
                return aCols.length;
            });

            
            j++;
        }

        let s = aCampo.map((cmp) => cmp.nome).slice();
        /* = [];
        for (let iCampo = s.length-1; iCampo >= 0; iCampo--) {
            aCampo.push(s[iCampo]);
        }*/

        let atributo = coluna.nome ? coluna.nome : coluna.coluna.nome;
        let sColuna = `${s[0]}.${atributo}`;
        
        /*let oColuna = tabelaPrincipal.colunas.filter((col) => {
            return col.tabelaClasse ? col.tabelaClasse.id == coluna.tabela.id : false;
        })[0];

        if (oColuna) {
            return `${oColuna.nome}.${coluna.nome}`;
        }*/
        return sColuna;
    }

    pegaJoin(valor, coluna) {

        let tabelaPrincipal = this.tabelaApiResposta.dados.filter((tabela) =>{ return tabela.nomeJava == this.classe});

        if( !this.validaCaminhoClasse(tabelaPrincipal) ){
            return
        }

        tabelaPrincipal = tabelaPrincipal[0];
        let oColuna = tabelaPrincipal.colunas.filter((col) => {
            return col.tabelaClasse ? col.tabelaClasse.id == coluna.tabela.id : false;
        })[0];

        if (oColuna) {
            return `${oColuna.nome}.${coluna.nome}`;
        }

        let aaa = this.pegaCampo(null, coluna);
        /*if (coluna.id == 2309) {
            return 'paciente.grupoPaciente';
        }*/

        return undefined;
    }

    pegaValor_ENUM(valor) {
        let coluna = this.respostas['serviceColunas'].valor;
        return coluna;
    }

    pegaValorLabel_CLASSE() {
        
        console.log(this.respostas['serviceColunas']);
        let valor = this.respostas['serviceColunas'].valor;
        if( !valor )
            return '';
        
        // let coluna = this.respostas['serviceColunas']
        return valor.titulo || valor.descricao || valor.nome || valor.cpf || valor.codigo || valor.id;
    }

    validaCaminhoClasse(tabelaPrincipal){
        if( !tabelaPrincipal || (tabelaPrincipal && !tabelaPrincipal.length)){
            // PERMITIR USUARIO ADMIN ALTERAR A CLASSE
            this.toastr.warning("Necessário alterar o caminho da classe");
            this.erroCaminho = true
            return false
        }

        return true
    }

    criaItem(edita = false) {
        let aIntervalos = [];
        let coluna = this.respostas['serviceTabelaApi'].valor;
        console.log(this.respostas['serviceTabelaApi'].valor);
        
        let objParam = {
            tipo: this.tipoItemAtual,
            serviceTabelaApi: this.respostas['serviceTabelaApi']
        };

        if( objParam.tipo == 'NULO' || objParam.tipo == 'NAONULO' ){
            this.respostas['serviceColunas'] = new Object();
        }

        let sCampo = this.pegaCampo(null, coluna);

        switch(coluna.tipo) {
            case 'ENUM':
                objParam['campo'] = coluna.nome;
                objParam['campo'] = this[`pegaCampo_${coluna.tipo}`](this.respostas['serviceColunas'].valor, coluna);
                objParam['join'] = this.pegaJoin(this.respostas['serviceColunas'].valor, coluna);
                objParam['classe'] = 'ENUM';
                objParam['enumNome'] = coluna.enumClasse;
                objParam['valor'] = this[`pegaValor_${coluna.tipo}`](this.respostas['serviceColunas'].valor);
                aIntervalos.push(Object.assign({}, objParam));
                break;

            case 'CLASSE':
                
                objParam['campo'] = this[`pegaCampo_${coluna.tipo}`](this.respostas['serviceColunas'].valor, coluna);
                objParam['join'] = this.pegaJoin(this.respostas['serviceColunas'].valor, coluna);

                if( objParam.tipo != 'NULO' && objParam.tipo != 'NAONULO' ){
                    objParam['valor'] = this[`pegaValor_${coluna.tipo}`](this.respostas['serviceColunas'].valor, coluna);
                }
                
                objParam['classe'] = this[`pegaClasse_${coluna.tipo}`](this.respostas['serviceColunas'].valor, coluna);
                
                objParam['label'] = this[`pegaValorLabel_CLASSE`]();
                objParam['coluna'] = this.respostas['serviceColunas'];
                aIntervalos.push(Object.assign({}, objParam));
                break;

            case 'DATA':
            case 'DATAHORA':
            case 'INTEGER':
            case 'DOUBLE':
                
                let valorInicio = this.respostas['intervaloInicio'] ? this.respostas['intervaloInicio'].valor : undefined;
                let valorFim = this.respostas['intervaloFim'] ? this.respostas['intervaloFim'].valor : undefined;
                
                if (this.tipoData == 'NAONULO') {

                    objParam['campo'] = sCampo;//this[`pegaCampo`](valorInicio, coluna);//coluna.nome;
                    objParam['join'] = this.pegaJoin((this.respostas['serviceColunas'] ? this.respostas['serviceColunas'].valor : null), coluna);
                    objParam['classe'] = coluna.tipo;
                    objParam['tipo'] = 'NAONULO';

                    aIntervalos.push(Object.assign({}, objParam));

                    break;
                }

                if (this.tipoData == 'ATUAL') {
                    if (this.ultimoDataPeriodo == 'HOUR') {
                        valorInicio = moment().format('DD/MM/YYYY HH:00:00');
                        valorFim = moment().format('DD/MM/YYYY HH:59:59');
                    }

                    if (this.ultimoDataPeriodo == 'DAY') {
                        valorInicio = moment().format('DD/MM/YYYY 00:00:00');
                        valorFim = moment().format('DD/MM/YYYY 23:59:59');
                    }

                    if (this.ultimoDataPeriodo == 'MONTH') {
                        valorInicio = moment().startOf('month').format('DD/MM/YYYY 00:00:00');
                        valorFim = moment().endOf('month').format('DD/MM/YYYY 23:59:59');
                    }

                    if (this.ultimoDataPeriodo == 'YEAR') {
                        valorInicio = moment().startOf('year').format('DD/MM/YYYY 00:00:00');
                        valorFim = moment().endOf('year').format('DD/MM/YYYY 23:59:59');
                    }
                }

                if (this.tipoData == 'ANTERIOR') {
                    let qtd = this.ultimoDataQuantidade || 1;
                    if (this.ultimoDataPeriodo == 'HOUR') {
                        valorInicio = moment().subtract(qtd,'hour').format('DD/MM/YYYY HH:00:00');
                        valorFim = moment().subtract(1,'hour').format('DD/MM/YYYY HH:59:59');
                    }

                    if (this.ultimoDataPeriodo == 'DAY') {
                        valorInicio = moment().subtract(qtd,'day').format('DD/MM/YYYY 00:00:00');
                        valorFim = moment().subtract(1,'day').format('DD/MM/YYYY 23:59:59');
                    }

                    if (this.ultimoDataPeriodo == 'MONTH') {
                        valorInicio = moment().subtract(qtd,'month').startOf('month').format('DD/MM/YYYY 00:00:00');
                        valorFim = moment().subtract(1,'month').endOf('month').format('DD/MM/YYYY 23:59:59');
                    }

                    if (this.ultimoDataPeriodo == 'YEAR') {
                        valorInicio = moment().subtract(qtd,'year').startOf('year').format('DD/MM/YYYY 00:00:00');
                        valorFim = moment().subtract(1,'year').endOf('year').format('DD/MM/YYYY 23:59:59');
                    }
                }

                if (this.tipoData == 'ULTIMO') {
                    let qtd = this.ultimoDataQuantidade || 1;
                    if (this.ultimoDataPeriodo == 'HOUR') {
                        valorInicio = moment().subtract(qtd,'hour').format('DD/MM/YYYY HH:mm:ss');
                        valorFim = moment().format('DD/MM/YYYY HH:mm:ss');
                    }

                    if (this.ultimoDataPeriodo == 'DAY') {
                        valorInicio = moment().subtract(qtd,'day').format('DD/MM/YYYY HH:mm:ss');
                        valorFim = moment().format('DD/MM/YYYY HH:mm:ss');
                    }

                    if (this.ultimoDataPeriodo == 'MONTH') {
                        valorInicio = moment().subtract(qtd,'month').format('DD/MM/YYYY HH:mm:ss');
                        valorFim = moment().format('DD/MM/YYYY HH:mm:ss');
                    }

                    if (this.ultimoDataPeriodo == 'YEAR') {
                        valorInicio = moment().subtract(qtd,'year').format('DD/MM/YYYY HH:mm:ss');
                        valorFim = moment().format('DD/MM/YYYY HH:mm:ss');
                    }
                }

                if (this.tipoData != 'INTERVALO') {
                    objParam['tipoData'] = this.tipoData;
                    objParam['ultimoDataPeriodo'] = this.ultimoDataPeriodo;
                    objParam['inicio'] = true;
                }

                if (this.tipoData == 'NULO') {
                    objParam['tipoData'] = this.tipoData;
                    objParam['ultimoDataPeriodo'] = null;
                    objParam['campo'] = sCampo;//this[`pegaCampo`](valorInicio, coluna);//coluna.nome;
                    objParam['join'] = this.pegaJoin((this.respostas['serviceColunas'] ? this.respostas['serviceColunas'].valor : null), coluna);
                    objParam['valor'] = "";
                    objParam['classe'] = coluna.tipo;
                    objParam['tipo'] = 'NULO';
                    aIntervalos.push(Object.assign({}, objParam));

                    break;
                }

                //objParam = Object.assign({}, objParam, this.criaRequestClasse(coluna));
                //  Inicio
                objParam['campo'] = sCampo;//this[`pegaCampo`](valorInicio, coluna);//coluna.nome;
                objParam['join'] = this.pegaJoin((this.respostas['serviceColunas'] ? this.respostas['serviceColunas'].valor : null), coluna);
                objParam['valor'] = valorInicio;
                objParam['classe'] = coluna.tipo;
                objParam['tipo'] = 'MAIORIGUAL';

                if( edita ){
                    delete objParam['tipo'];
                }

                aIntervalos.push(Object.assign({}, objParam));


                if (this.tipoData != 'INTERVALO') {
                    objParam['inicio'] = false;
                }
                //  Fim
                objParam['campo'] = sCampo;//this[`pegaCampo`](valorFim, coluna);//coluna.nome;
                objParam['join'] = this.pegaJoin((this.respostas['serviceColunas'] ? this.respostas['serviceColunas'].valor : null), coluna);
                objParam['valor'] = valorFim;
                objParam['classe'] = coluna.tipo;
                objParam['tipo'] = 'MENORIGUAL';

                if( edita ){
                    delete objParam['tipo'];
                }

                aIntervalos.push(Object.assign({}, objParam));
                //objParam = aIntervalos.slice();
                break;

            case 'BOOLEAN':
                objParam['valor'] = this.respostas['serviceColunas'].valor;
                objParam['tipo'] = "IGUAL";
                objParam['classe'] = coluna.tipo;
                objParam['campo'] = sCampo;//this[`pegaCampo`](this.respostas['serviceColunas'].valor, coluna);
                objParam['join'] = this.pegaJoin(this.respostas['serviceColunas'].valor, coluna);

                aIntervalos.push(Object.assign({}, objParam));
                break;

            default:
                objParam['valor'] = (this.respostas['serviceColunas']) ? this.respostas['serviceColunas'].valor : '';
                objParam['tipo'] = this.tipoItemAtual;
                objParam['classe'] = coluna.tipo;
                //objParam['campo'] = this[`pegaCampo`](this.respostas['serviceColunas'].valor, coluna);

                let oCol = this.pegaColuna({coluna: coluna}, 0);
                objParam['join'] = oCol ? oCol.join : undefined;
                objParam['campo'] = oCol ? oCol.coluna : sCampo;

                //objParam['join'] = this.pegaJoin(this.respostas['serviceColunas'].valor, coluna);

                aIntervalos.push(Object.assign({}, objParam));
                break;
        }

        return aIntervalos;
    }

    modalEditarFiltro;
    itemFiltroEdita = new Object();
    @ViewChild("adicionarColunasFiltro", {read: TemplateRef}) adicionarColunasFiltro: QueryList<TemplateRef<any>>;
    @ViewChild("botoesAdicionarColunasFiltro", {read: TemplateRef}) botoesAdicionarColunasFiltro: QueryList<TemplateRef<any>>;
    editarFiltro(item, pos){

        this.respostas['serviceTabelaApi'] = item['serviceTabelaApi'];
        delete this.respostas['serviceColunas'];

        if( this.respostas['serviceTabelaApi'] && this.respostas['serviceTabelaApi'].valor ){
            if( this.respostas['serviceTabelaApi'].valor.tipo == 'CLASSE' ){
                this.iniciaOpcoes();
            }else if( this.respostas['serviceTabelaApi'].valor.enumClasse ){
                this.inicializaCampo_ENUM()
            }
        }else{
            this.toastr.warning("Não é possível editar esse filtro");
            return;
        }

        let objContext = { 
           item:item
        }
        let cfgGlobal:any = Object.assign(NgbdModalContent.getCfgGlobal(), {size: 'lg'});
        console.log(cfgGlobal);
        
        this.modalEditarFiltro = this.modalService.open(NgbdModalContent, cfgGlobal );
        this.modalEditarFiltro.componentInstance.modalHeader = `Editar Filtro`;

        this.modalEditarFiltro.componentInstance.templateRefBody = this[`adicionarColunasFiltro`];
        this.modalEditarFiltro.componentInstance.templateBotoes = this[`botoesAdicionarColunasFiltro`];
        this.variaveisDeAmbiente['temFonteDados'] = true;
        this.itemFiltroEdita = {
            item:item,
            pos: pos
        };
        this.modalEditarFiltro.componentInstance.contextObject = objContext

    }

    salvarFiltroEdita(){
        this.adicionaItem(true);
    }

    adicionarFiltroRapido(coluna){

        if( coluna.tipoPergunta ){

            if( !coluna.coluna.formulario ){
                this.toastr.warning("Pergunta nao está vinculada a um formulário");
                return;
            }

            if( this.idFormularioSelecionado != coluna.coluna.formulario.id){
                this.formularioSelecionado = ''
                this.idFormularioSelecionado = undefined

                this.cdr.markForCheck();
                setTimeout(() => {
                    this.idFormularioSelecionado = coluna.coluna.formulario.id
                    this.formularioSelecionado = coluna.coluna.formulario.titulo

                    this.cdr.markForCheck();
                }, 300);
            }

            return;
        }

        let objServiceTabelaApi = coluna.coluna || coluna['serviceTabelaApi'];
        this.getResposta(objServiceTabelaApi, 'serviceTabelaApi', false, true);
    }

    adicionaItem(edita = false, validaTipo = true) {

        if (!this.validaItem(validaTipo)) 
            return;

        let aItems = this.criaItem(edita);
        console.log(aItems);
        
        if( !edita ){
            this.items = this.items.concat(aItems).slice();
            this.tipoItemAtual = undefined;
            let aEl = document.getElementsByName('tipoFiltro');

            for(let i = 0; i < aEl.length; i++){
                aEl[i]['checked'] = false;
            }
        }else{
            console.log(aItems);
            console.log(this.itemFiltroEdita);

            this.items[ this.itemFiltroEdita['pos'] ] = Object.assign( this.items[ this.itemFiltroEdita['pos'] ], aItems[0] );
            this.itemFiltroEdita = new Object();
            this.respostas['serviceTabelaApi'] = undefined;

            this.modalEditarFiltro.dismiss();
        }
    }

    selecionaCalculo(evt, valor) {
        this.respostas['calculoSelecionado'];
    }

    adicionaCalculo() {
        if (!this.respostas['calculoSelecionado'] || !this.respostas['calculoSelecionado'].valor || this.respostas['calculoSelecionado'].valor == '') {
            this.toastr.warning('Nenhum calculo selecionado');
            return;
        }

        this.alteraCalculos(this.respostas['calculoSelecionado'].valor);
    }

    alteraApenasFiltro(ev) {
        this.respostas['apenasFiltro'] = !this.respostas['apenasFiltro'];
    }


    alteraCalculos(tipo) {
        let index;
        let oColuna = this.respostas['serviceTabelaApi'].valor;
        let sCampo;
        let tabelaPrincipal = this.tabelaApiResposta.dados.filter((tabela) =>{ return tabela.nomeJava == this.classe})[0];

        if (oColuna.tabela.id == tabelaPrincipal.id) {
            sCampo = `${oColuna.nome}`;
        } else {
            let oTabela = tabelaPrincipal.colunas.filter((colunaTemp) => {
                return colunaTemp.tabelaClasse
            }).filter((colunaTemp) => {
                return colunaTemp.tabelaClasse.id == oColuna.tabela.id;
            })[0];

            if (oTabela) {
                sCampo = `${oTabela.nome}.${oColuna.nome}`;
            } else {
                sCampo = `${oColuna.nome}`;
            }
        }

        let calculo = {
            campo: sCampo, 
            tipo: tipo,
            tabela: (this.respostas['serviceTabelaApi'].valor.tabela.nome || this.respostas['serviceTabelaApi'].valor.tabela.serviceTabelaApi.valor.tabela.nomeBanco).toUpperCase()
        };

        this.calculos.filter((calculo, i) => {
            if (calculo.campo == oColuna.nome && calculo.tipo == tipo) {
                index = i;
            }
            return calculo.campo == oColuna.nome;
        })[0];

        let bTemCalculo = this.calculos.filter((calculo, calculoIndex) => {
            index = calculoIndex;
            return calculo.campo == oColuna.nome && calculo.tipo == tipo
        });
        
        if (bTemCalculo.length) {
            //this.calculos.splice(index, 1);
            return;
        }

        if (index) {
            this.calculos[index] = calculo
        } else {
            this.calculos.push(calculo);
        }

        if( tipo == 'COUNT' ){
            this.eCount = true;
        }

        let existeCalculo = this.calculos.filter((calculo) => {
            return calculo.campo == oColuna.nome;
        })[0];
    }

    aplicarColunas(bCarregaRelatorio = true, retornaRequest = false) {
        let colunasPrincipal = this.colunas.slice();
        let index = 0;


        if( this.tipoRelatorio != 'respostas' ){
            
            //if (bCarregaRelatorio) {
                this.calculos.forEach((calculo) => {
                    let colunaCalculo = colunasPrincipal.filter((col, i) => {
                        
                        let sCampo = this.pegaCampo(null, col.coluna);
                        if (sCampo == calculo.campo) {
                            index = i;
                        }
                        return sCampo == calculo.campo;
                    })[0];

                    if (colunaCalculo) {
                        colunaCalculo = Object.assign({}, colunaCalculo);
                        colunasPrincipal.splice(index, 0, colunaCalculo);
                        colunasPrincipal[index + 1].calculo = calculo.tipo;
                    }
                });
            //}
        }
        this.colunasPrincipal = colunasPrincipal;//.filter((col) => !col.apenasFiltro);
        this.colunasPrincipalVisiveis = colunasPrincipal.filter((col) => !col.apenasFiltro);

        if( this.tipoRelatorio == 'respostas' ){

            let colunasReordenadas = [{
                alias: 'Paciente',
                coluna: {
                    descricao: 'paciente'
                },
                apenasFiltro: false
            }]



            this.colunasPrincipalVisiveis = colunasReordenadas.concat( [], this.colunasPrincipalVisiveis );
        }

        if( retornaRequest ){
            return this.pesquisar(null, false, true);
        }else{
            this.pesquisar(null, true);
        }
    }


    formataHeader(coluna, colunaIndex) {
        if( coluna.calculo && coluna.calculo == 'COUNT' ){
            return this.formataHeaderCalculo(coluna, colunaIndex);
        }else{
            // return this.formataHeader(coluna, colunaIndex);
            return coluna.alias ? coluna.alias : (coluna.calculo ? coluna.calculo : (coluna.coluna ? coluna.coluna.descricao : ''));
        }
    }

    arrayAliasesCalculo = [
        'valor',
        'legenda'
    ]
    formataHeaderCalculo(coluna, colunaIndex) {
        if( this.aliasesCalculo && Object.keys(this.aliasesCalculo).length ){
            return this.aliasesCalculo[this.arrayAliasesCalculo[colunaIndex]]
        }else{
            return coluna.alias ? coluna.alias : (coluna.calculo ? coluna.calculo : (coluna.coluna ? coluna.coluna.descricao : ''));
        }
    }

    formataResultadoOperacao(dado, objOperacao, index){

        let formula = '';

        if( !objOperacao.retorno ){

            objOperacao.formula.forEach(
                (elemento) => {

                    if( elemento.nome.match(/[+/^*\-]/) ){
                        formula += elemento.nome;

                    }else{
                        let valorColuna = dado[elemento.index];
                        formula += valorColuna;
                    }
                }
            )

            return eval(formula);

        }else{


            let formulaData = objOperacao.formula.map( (o) => { return dado[o.index] || o.nome; } ).filter(
                (o) => {
                    return o && o.match && !o.match(/[+\-]/g);
                }
            )
            let operacoes = objOperacao.formula.map( (o) => { return o.nome } ).join('').match(/[+/^*\-]/g);
            let diffInit;
            let diff;
            let dataRef = moment();
            let hoje = false;

            if( operacoes && operacoes.length ){

                for( let i=0; i<formulaData.length; i++ ){

                    diffInit = moment( formulaData[i], 'DD/MM/YYYY hh:mm:ss' );
                    let dataReferencia = moment( formulaData[i+1], 'DD/MM/YYYY hh:mm:ss' );
                    
                    diff = diffInit.diff( dataReferencia, objOperacao.retorno ) ;

                    i+=1;
                }

            }else{

                if( objOperacao.dataReferencia ){
                    dataRef = moment(objOperacao.dataReferencia, this.formatosDeDatas.dataHoraSegundoFormato);
                }else{
                    hoje = true;
                }
                diffInit = moment(formulaData[0], this.formatosDeDatas.dataHoraSegundoFormato);

                diff = diffInit.diff( dataRef, objOperacao.retorno ) ;

                ( isNaN(diff) ) ? diff = undefined : null;

            }
            
            let unidade = this.opcoesRetorno.filter(
                (r)=>{ return r.id == objOperacao.retorno }
            )[0];
            return ((diff) ? this.validaNumero(diff, hoje) + ' ' + unidade.nome : '');
        }
    }

    validaNumero(diff, hoje){
        return ( hoje ) && ( diff < 0 ) ? diff*-1 : diff
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

    isHexaCor(dado, colunaIndex) {
        let hexaRegexp = /^#......$/;
        return dado && dado[colunaIndex] && dado[colunaIndex].match ? dado[colunaIndex].match(hexaRegexp) : false;
    }

    formataColuna(dado, coluna, colunaIndex) {
        let dataRegexp = /^....-..-..T..:..$/;

        if (dado && dado[colunaIndex] && dado[colunaIndex].date) {
            return this.formataDataPorDate(dado[colunaIndex]);
        } else if (dado && dado[colunaIndex] && dado[colunaIndex].match && dado[colunaIndex].match(dataRegexp)) {
            return moment(dado[colunaIndex], 'YYYY-MM-DDTHH:mm').format('DD/MM/YYYY HH:mm');
        }
        /*if(coluna.campos) {
            let aValor = [];

            coluna.campos.forEach((campo) => {
                aValor.push(dado[colunaIndex][campo]);
            })
            return aValor.join(' - ');
        }*/

        let eBoolean = dado[colunaIndex] == true || dado[colunaIndex] == 'true' || dado[colunaIndex] == false || dado[colunaIndex] == 'false';
        if ( (coluna) && coluna.coluna.tipo == 'BOOLEAN' && eBoolean ) {
            return this.formataBoolean(dado[colunaIndex]);
        };

        if( dado[colunaIndex] && typeof dado[colunaIndex] === 'object'){
            return this.formataObjetoColuna(dado[colunaIndex]);
        }

        return dado && dado[colunaIndex] ? dado[colunaIndex] : ( dado && dado[colunaIndex] == 0 ? '0' : '');
    }


    @ViewChild("bodyModalDetalheDash", {read: TemplateRef}) bodyModalDetalheDash: QueryList<TemplateRef<any>>;
    @ViewChild("botoesModalDetalheDash", {read: TemplateRef}) botoesModalDetalheDash: QueryList<TemplateRef<any>>;

    requestDetalhesDashboard = new Object();
    dadosDetalheDash = [];
    modalDetalheDash;
    buscaDetalhesDashboard(dado, coluna, colunaIndex) {

        if( coluna.calculo == 'COUNT' && this.relatorio.json.dashboard && this.relatorio.json.dashboard.colunasDetalhe ){

            if( this.colunasDetalhe && !this.colunasDetalhe.length ){
                this.toastr.warning("Esse relatorio nao possui colunas para detalhar os dados");
                this.abreModalGrafico();

                return;
            }

            let requestPadrao = this.trataObjetoRelatorio(this.relatorio, true);

            requestPadrao['colunas'] = this.criaColunasDetalheRequest();
            requestPadrao['quantidade'] = 100;
            requestPadrao['calculos'] = [];
            
            let objcoluna = (coluna.coluna || coluna);
            let itemFiltro = {
                campo: objcoluna.nome,
                classe: objcoluna.tipo,
                enumNome: objcoluna.enumClasse,
                tipo: "IGUAL",
                valor: dado[this.chartLegendas]
            }
            requestPadrao['itens'].push( itemFiltro );

            this.requestDetalhesDashboard = requestPadrao;

            this['variaveisDeAmbiente']['tabelaSubRelatorio'] = {
                itensPorPagina : 100,
                paginaAtual : 1
            }

            let cfgGlobal:any = Object.assign(NgbdModalContent.getCfgGlobal(), {size: 'lg'});
            
            this.modalDetalheDash = this.modalService.open(NgbdModalContent, cfgGlobal );
            this.modalDetalheDash.componentInstance.modalHeader = `Detalhes Dashboard - ${itemFiltro.valor}`;

            this.modalDetalheDash.componentInstance.templateRefBody = this[`bodyModalDetalheDash`];
            this.modalDetalheDash.componentInstance.templateBotoes = this[`botoesModalDetalheDash`];
            this.modalDetalheDash.componentInstance.custom_lg_modal = true;

            let fnSuccess = (fechar) => { this.dadosDetalheDash = [] };
            let fnError = (erro) => { this.dadosDetalheDash = [] };
            this.modalDetalheDash.result.then((data) => fnSuccess, fnError);

            this.getDadosSubRelatorio(requestPadrao);
        }

        return;
    }

    buscaDetalhesDashboardPaginacao(evento = null){
        console.log(evento);
        console.log(this.requestDetalhesDashboard);

        this.requestDetalhesDashboard['pagina'] = evento.paginaAtual || 1;

        if( evento.ordenacao ){
            console.log(this.ordenacao);
            this.requestDetalhesDashboard['ordem'] = this.criaOrdem();
        }
        this.getDadosSubRelatorio(this.requestDetalhesDashboard);
        
    }

    getDadosSubRelatorio(request){
        this.relatorioService.post(request).subscribe((resposta) => {
            console.log(resposta);
            
            this.dadosDetalheDash = resposta.dados || resposta;

            this['variaveisDeAmbiente']['tabelaSubRelatorio'].qtdItensTotal = resposta.qtdItensTotal;
            this['variaveisDeAmbiente']['tabelaSubRelatorio'].itensPorPagina = resposta.qtdItensPagina;
            this['variaveisDeAmbiente']['tabelaSubRelatorio'].paginaAtual = resposta.paginaAtual;

            this.cdr.markForCheck();

        }, (err) => {
            this.toastr.error('Ocorreu um erro ao buscar os dados do relatorio');
            this.loading = false;
        });
    }

    criaColunasDetalheRequest(){
        return this.colunasDetalhe.map(
            (coluna) => {
                return {
                    coluna: (coluna.coluna || coluna).nome, 
                    apenasFiltro: false
                }
            }
        )
    }
    
    formataBoolean(dado) {
        return dado == true || dado == 'true' ? 'Sim' : 'Não';
    }

    formataObjetoColuna(objeto){
        return objeto['descricao'] || objeto['nome'] || JSON.stringify( objeto );
    }

    formataCalculo(calculo) {
        let oCalc = this.tiposCalculo.filter((cal) => cal.id == calculo)[0];
        return oCalc ? oCalc.nome : '';
    }

    temCalculo(dado, coluna, colunaIndex) {
        let bTem = false;

        this.calculos.forEach((calculo) => {
            if (calculo.campo == coluna.coluna.nome) {
                bTem = true;
            }
        })

        return bTem;
    }

    adicionaColunaParaTabela(coluna, fnAddColuna = undefined) {

        if( fnAddColuna ){
            fnAddColuna(coluna);
            return;
        }

        this.respostas['serviceTabelaApi'] = {valor: coluna};

        if( this.fnBTabela(coluna) ){
            this.mudaVisaoColunasDisponiveis(coluna.tabelaClasse.id)
        }else{

            if (!this.classe) {
                this.classe = coluna.tabela.nomeJava;
            }
            this.iniciaOpcoes();
            
            this.respostas['apenasFiltro'] = false;
            this.adicionaColuna();
            
        }
    }

    fnAddColunaGrafico(coluna){
        console.log(coluna);

        let objColuna = {
            alias: coluna.descricao,
            coluna: coluna,
            apenasFiltro: false,
            campos: undefined
        }

        // if (!this.validaColuna(coluna, this.colunasDetalhe)) 
        //     return;

        if( this.validaColunaDetalheRelatorio( (coluna.coluna || coluna).id ) ){
            console.log("JA POSSUI COLUNA");
            this.colunasDetalhe = this.colunasDetalhe.filter(
                (objcoluna) => {
                    return (objcoluna.coluna || objcoluna).id != (coluna.coluna || coluna).id
                }
            )

            console.log("REMOVI+  " + (coluna.coluna || coluna).id);
            
        }else{
            this.colunasDetalhe.push( objColuna )
        }

        console.log(this.colunasDetalhe);

    }

    adicionaColuna() {
        let sAlias = '';
        let bApenasFiltro = this.respostas['apenasFiltro'] || false;//document.getElementById('apenasFiltro')['checked'];
        let oColuna = this.respostas['serviceTabelaApi'].valor;
        let coluna = {
            alias: sAlias,
            coluna: oColuna,
            apenasFiltro: bApenasFiltro,
            //itens: aItens
            campos: this.variaveisDeAmbiente['objValoresAPI'] ? this.variaveisDeAmbiente['objValoresAPI'].campos : undefined
        };

        //{apenasFiltro: false, coluna: "status"}

        if (!this.validaColuna(coluna)) 
            return;
        
        this.colunas.push(coluna);

        if (!this.variaveisDeAmbiente['tabelasSelecionadas']) {
            this.variaveisDeAmbiente['tabelasSelecionadas'] = [];
        } else {
            this.validaFonteDeDadosRelatorio(oColuna.tabela.id, true);
            console.log(this.tabelaApiResposta.dados, oColuna);
            // this.variaveisDeAmbiente['tabelasSelecionadas'].push();
            // this.tabelaApiResposta.dados.filter((tabela)=>{
            //     return tabela.nomeJava == this.classe
            // })[0]
        }

        delete this.respostas['serviceTabelaApi'];
    }

    validaColuna(coluna, objReferenciaColuna = this.colunas) {
        let index = 0;
        let id = this.respostas['serviceTabelaApi'] ? this.respostas['serviceTabelaApi'].valor.id : coluna.id;
        let colunaJaExiste = objReferenciaColuna.filter((coluna, i) => {
            if ((coluna.coluna || coluna).id == id) {
                index = i;
            }
            return (coluna.coluna || coluna).id == id;
        })[0];

        if (colunaJaExiste) {
            objReferenciaColuna[index] = coluna;
            this.toastr.info('Coluna já estava selecionada. E por isso foi substituída');
            return false;
        }
        this.toastr.success('Coluna adicionada.');

        return true;
    }

    fnBTabela(filtro){
        return !(filtro.grid && filtro.tipo != 'CLASSE' && filtro.tipo != 'ARRAY');
    }
        
    abreModalRelatorioFiltro(tipo, relatorioFiltro = undefined) {
        this.variaveisDeAmbiente['relatorioFiltroAtual'] = relatorioFiltro;

        return true;
    }

            /*
            === calculos: [{campo: "psicologo", tipo: "COUNT"}]
            === classe: "br.com.unimeduberaba.plsweb.webpep.VwRelatorioPsicologia"
            --- colunas: [{apenasFiltro: false, coluna: "status"}]
            itens: []
            ordem: "psicologo desc, nome asc"
            pagina: 1
            quantidade: 25
            */


    //  #############################################
    //                  Ordenação
    //  #############################################
    ordenacao = {};
    inicializaOrdenacao() {
        this.ordenacao = {
            /*'motivoBloqueio': {
                tipo: 'desc',
                ordem: 'motivoBloqueio'
            }*/
        };
    }

    ordenaTable(event, coluna, ordenarSub = false) {
        if (event.currentTarget != event.target) {
            return;
        }

        let sCampo;
        let tabelaPrincipal = this.tabelaApiResposta.dados.filter((tabela) =>{ return tabela.nomeJava == this.classe})[0];


        if (coluna.coluna.tabela.id == tabelaPrincipal.id) {
            sCampo = `${coluna.coluna.nome}`;
        } else {
            let aa = this.pegaCampo(null, coluna.coluna);
            let oTabela = tabelaPrincipal.colunas.filter((colunaTemp) => {
                return colunaTemp.tabelaClasse;
            });

            oTabela = oTabela.filter((colunaTemp) => {
                return colunaTemp.tabelaClasse.id == coluna.coluna.tabela.id;
            });

            oTabela = oTabela[0];

            if (oTabela) {
                sCampo = `${oTabela.nome}.${coluna.coluna.nome}`;
            } else {
                sCampo = aa;
            }
        }

        if (!this.ordenacao[sCampo]) {
            this.ordenacao[sCampo] = {};
        }

        this.ordenacao[sCampo].tipo = this.ordenacao[sCampo].tipo == 'asc' ? 'desc' : (this.ordenacao[sCampo].tipo == 'desc' ? undefined : 'asc');
        this.ordenacao[sCampo].ordem = sCampo;

        coluna.sort = this.ordenacao[sCampo].tipo;
        if( !ordenarSub ){
            this.pesquisar(null, true);
        }else{
            this.buscaDetalhesDashboardPaginacao( { ordenacao: true } )
        }
    }


    //  #############################################
    //               Reordenar Coluna e Troca de titulo
    //  #############################################
    trocaTitulo(event, coluna, colunaIndex) {
        if (event.currentTarget != event.target) {
            return;
        }

        let alias = event.target.innerText == "" ? " " : event.target.innerText;
            alias = alias.replace(/\n/g,"");
        if( !(coluna.calculo && coluna.calculo == 'COUNT') ){
            coluna.alias = alias;
        }else{
            this.aliasesCalculo[ this.arrayAliasesCalculo[colunaIndex] ] = alias;
        }
    }

    onDrop(event) {
        event.preventDefault();
        let ordem = event.currentTarget.cellIndex;
        let elementoColunaDrag = this.variaveisDeAmbiente['elementoColunaDrag'];
        elementoColunaDrag = elementoColunaDrag.parentElement;
        let oColunaDrag = this.variaveisDeAmbiente['colunaDrag'];

        //  inicia Ordenacao
        this.colunasPrincipal.map((coluna, index) => {
            coluna.ordem = coluna.ordem || index;
        });

        this.colunasPrincipal[elementoColunaDrag.cellIndex].ordem = ordem;
        if (elementoColunaDrag.cellIndex < ordem) {
            for(let i = elementoColunaDrag.cellIndex + 1; i <= ordem; i++) {
                this.colunasPrincipal[i].ordem--;
            }
        } else {
            for(let i = ordem; i < elementoColunaDrag.cellIndex; i++) {
                this.colunasPrincipal[i].ordem++;
            }
        }
        
        this.colunasPrincipal = this.colunasPrincipal.sort( (a, b) => {return a.ordem - b.ordem});
        this.colunas = this.colunasPrincipal.sort( (a, b) => {return a.ordem - b.ordem}).filter((col) => !col.calculo)
    
        this.aplicarColunas(false);        
        //this.pesquisar(null, true);
    }

    onDragOver(event) {
        event.preventDefault();
    }

    onDragStart(event, coluna) {
        coluna = Object.assign(coluna);

        this.variaveisDeAmbiente['elementoColunaDrag'] = event.srcElement;
        this.variaveisDeAmbiente['colunaDrag'] = coluna;

        this.colunasOperacoes.forEach(operacao => {
            if (operacao.formula[0].nome.toUpperCase() == coluna.coluna.nome.toUpperCase()) {
                operacao.formula[0].index = coluna.ordem;
                this.cdr.markForCheck();
            }
        });

        this.cdr.markForCheck();
    }

    //  #############################################
    //               Filtros Salvos
    //  #############################################
    relatorioFiltros;
    relatorio;
    inicializaRelatorio() {
        this.relatorio.json = JSON.parse( this.relatorio.json );

        this.trataObjetoRelatorio(this.relatorio);
    }

    eCount = false;
    trataObjetoRelatorio(relatorioFiltroRecuperado, retornaRequest = false){
        if (relatorioFiltroRecuperado) {
            this.tituloRelatorio = relatorioFiltroRecuperado.descricao;

            this.tipoRelatorio = relatorioFiltroRecuperado.json.tipo || 'tabelas';

            if( this.tipoRelatorio == 'respostas' ){
                this.variaveisDeAmbiente['dataInicial'] = relatorioFiltroRecuperado.json.dataInicial;
                this.variaveisDeAmbiente['dataFinal'] = relatorioFiltroRecuperado.json.dataFinal;
                this.getPerguntasPaginado();
            }

            this.unidadeAtendimento = (relatorioFiltroRecuperado.unidadeAtendimento) ? relatorioFiltroRecuperado.unidadeAtendimento.id : undefined
            this.especialidadeSelecionada = (relatorioFiltroRecuperado.especialidade) ? relatorioFiltroRecuperado.especialidade.descricao : ''
            this.calculos = relatorioFiltroRecuperado.json.calculos;

            this.eCount = this.calculos.filter(
                (calculo)=>{
                    return calculo.tipo == "COUNT";
                }
            ).length >= 1
            
            this.colunasOperacoes = relatorioFiltroRecuperado.json.colunasOperacoes || [];
            this.classe = relatorioFiltroRecuperado.json.classe;
            relatorioFiltroRecuperado.json.tabelasIds = relatorioFiltroRecuperado.json.tabelasIds || [];
            this.variaveisDeAmbiente['tabelasSelecionadas'] = relatorioFiltroRecuperado.json.tabelasIds;
            
            let oFonteDados;
            this.variaveisDeAmbiente['tabelasSelecionadas'].forEach((tbl) => {
                let oTbl;

                if (this.tabelaApiResposta && this.tabelaApiResposta.dados) {
                    this.tabelaApiResposta.dados.filter((tblTemp) => tblTemp.id == tbl)[0];
                }

                if (oTbl && oTbl.nomeJava == this.classe) {
                    oFonteDados = oTbl;
                }
            });

            if (oFonteDados) {
                this.tabelaDisponivel = oFonteDados.id;
            }

            this.variaveisDeAmbiente['tabelasDisponiveis'] = relatorioFiltroRecuperado.json.tabelasIds.map((tabelaId) => {
                let oDado;

                if (this.tabelaApiResposta && this.tabelaApiResposta.dados.length) {
                    oDado = this.tabelaApiResposta.dados.filter((tbl) => tbl.id == tabelaId)[0];
                }
                return oDado;
            }).filter((oDado) => oDado);
            
            let colunas = relatorioFiltroRecuperado.json.colunas;

                //  TODO: 
            colunas.forEach((col) => { 
                    return !col.calculo
                }
            );

            let colunasTemp = [];
            colunas.forEach((col) => {
                let bNaoTem = colunasTemp.filter((colTemp) => {
                    return colTemp.coluna.id == col.coluna.id
                });

                if (!col.calculo || (col.calculo && bNaoTem.length == 0) ) {
                    colunasTemp.push(col);
                }
            });

            console.log("   ---------    MODELO DE COLUNAS    ----------");
            console.log(colunasTemp);
            
            this.colunas = colunasTemp;

            this.items = relatorioFiltroRecuperado.json.items;
            this.tipoItemAtual = relatorioFiltroRecuperado.json.tipoItemAtual;

            if (relatorioFiltroRecuperado.json && relatorioFiltroRecuperado.json.dashboard){
                this.tituloGrafico = relatorioFiltroRecuperado.json.dashboard.titulo;
                this.tipoGrafico = relatorioFiltroRecuperado.json.dashboard.tipo;
                let valores = relatorioFiltroRecuperado.json.dashboard.valores;
                if( Array.isArray(valores) ){
                    this.chartValores = valores;
                }else{
                    this.chartValores = [valores]
                }
                this.chartLegendas = relatorioFiltroRecuperado.json.dashboard.legendas;
                this.aliasesCalculo = relatorioFiltroRecuperado.json.dashboard.aliasesCalculo || new Object();
                this.objCoresDashboard = relatorioFiltroRecuperado.json.dashboard.coresDashboard || [];
                this.subtitulo1 = relatorioFiltroRecuperado.json.dashboard.subtitulo1 || '';
                this.subtitulo2 = relatorioFiltroRecuperado.json.dashboard.subtitulo2 || '';
                if( !retornaRequest ){
                    this.colunasDetalhe = relatorioFiltroRecuperado.json.dashboard.colunasDetalhe;
                }
            }

            if( retornaRequest ){
                let retorno = this.aplicarColunas(false, true);
                return retorno;
            }else{
                this.aplicarColunas(false)
            }

        } else {
            this.router.navigate([`/${Sessao.getModulo()}/relatorios/novo`]);
        }
    }

    //  #############################################
    //               Gráfico
    //  #############################################
    colunasPrincipalTemp = [];
    atualGrafico;
    tiposGraficos = [
        {nome: 'Pizza', id: 'pie'},
        {nome: 'Linha', id: 'line'},
        {nome: 'Coluna', id: 'bar'},
        //{nome: 'Area', id: 'area'},
    ];
    pieChartData = {
        chartType: 'PieChart',
        dataTable: [
            ['Task', 'Hours per Day'],
            ['Work',     11],
            ['Eat',      2],
            ['Commute',  2],
            ['Watch TV', 2],
            ['Sleep',    7]
        ],
        options: {'title': 'Gráfico'},
    };

    @ViewChild("bodyModalGrafico", {read: TemplateRef}) bodyModalGrafico: QueryList<TemplateRef<any>>;
    @ViewChild("templateBotoesModalGrafico", {read: TemplateRef}) templateBotoesModalGrafico: QueryList<TemplateRef<any>>;

    navegarGrafico(aba) {
        this.cdr.markForCheck();
        if (aba == 'dados' && !this.validaGrafico()) {
            return;
        }

        if (aba == 'grafico' && !this.validaDados()) {
            return;
        }
        this.cdr.markForCheck();
        this.atualGrafico = aba;
    }

    abreModalGrafico(tipo = undefined, relatorioFiltro = undefined) {

        this.colunasPrincipalTemp = this.colunasPrincipal.slice().map(
            (col, colId) => {
                col.id = colId; 
                return col;
            }
        );

        this.setColunasDisponiveisTabela();

        this.atualGrafico = 'config';
        this.modalInstancia = this.modalService.open(NgbdModalContent, {size: 'lg'});
        this.modalInstancia.componentInstance.modalHeader = `Gerar Gráfico`;

        this.modalInstancia.componentInstance.templateRefBody = this[`bodyModalGrafico`];
        this.modalInstancia.componentInstance.templateBotoes = this[`templateBotoesModalGrafico`];
            
        this.cdr.markForCheck();
        let fnSuccess = (agendamentoGrupoResposta) => { console.log("Modal Fechada!"); };
        let fnError = (erro) => { console.log("Modal Fechada!"); };
        this.modalInstancia.result.then((data) => fnSuccess, fnError);
    }

    mudarVisibilidadeColuna(coluna, colunaIndex, visibilidade){
        this.colunas[colunaIndex]['naoVisivel'] = visibilidade;
    }

    //Piechart1 Data & Config
    dadosGrafico;
    config1;
    elementId1 = 'myPieChart1';
    tituloGrafico;
    tipoGrafico;
    objCoresDashboard= new Object();
    subtitulo1= '';
    subtitulo2= '';
    chartLegendas = 1;
    chartValores = [null];
    iniciaChartModal() {

        if (!this.validaGrafico()) {
            return;
        }

        this.cdr.markForCheck();

        let nomesColunas = this.colunasPrincipalTemp.map(
            (coluna, indice) => {
                return this.formataHeader(coluna, indice);
            }
        )
        let params:ParametrosGrafico = {
            objCoresDashboard: this.objCoresDashboard,
            fnFormataDataPorDate: this.formataDataPorDate.bind(this),
            chartLegendas: this.chartLegendas,
            chartValores: this.chartValores,
            tipoGrafico: this.tipoGrafico,
            colunasValores: nomesColunas
        }
        
        let objGrafico = this.googleChartsService.montaGraficos(this.dados, params);

        this.dadosGrafico = objGrafico.dados
        let config = {
            pieHole: 0.4,
            title: this.tituloGrafico,
            subtitulo1:this.subtitulo1,
            subtitulo2:this.subtitulo2,
            heigth: 900,
            colors: objGrafico.arrayCores 
        }
        this.config1 = config;

    }

    setColunasDisponiveisTabela(){
        this.variaveisDeAmbiente['colunasPorTabela'] = this.getColunasPorClasseJava( this.relatorio.json.classe );
    }

    getColunasPorClasseJava(classe, tipoTabela = false){
        let tabela = this.tabelaApiResposta.dados.filter(
            (tabela) => {
                return ( tabela.nomeJava == classe )
            }
        )[0];

        if( !tabela ){
            this.toastr.error("Nao foi encontrada essa tabela");
            return;
        }

        let colunas = tabela.colunas;
        if( !tipoTabela ){
            colunas = tabela.colunas.filter(
                (coluna) => {
                    return ( coluna.tipo != 'CLASSE' );
                }
            )
        }
        return colunas;
    }

    getTituloGrafico(evento) {
        this.tituloGrafico = evento.valor;
    }

    getTipoGrafico(evento) {
        this.tipoGrafico = evento.valor;
    }

    getChartLegendas(evento) {
        if (!evento)
            return;
        this.chartLegendas = evento.id;
    }

    getChartValores(evento, excluir = false, pos = undefined) {
        if (!evento)
            return;
        if( (this.chartValores.indexOf(evento.id) == -1) || excluir ){
            if( excluir ){
                this.chartValores = this.chartValores.filter( 
                    (legenda) => {
                        return legenda != evento.id;
                    }
                )
            }else{
                this.chartValores[pos] = evento.id;
            }
        }else{
            return;
        }
    }
    
    validaDados(bShowErros = true) {
        if (this.chartLegendas == undefined) {
            if (bShowErros){
                this.toastr.warning("Por Favor informe o campo de Legendas");
            }
            return false;
        }

        if (this.chartValores == undefined) {
            if (bShowErros){
                this.toastr.warning("Por Favor informe o campo de Valores");
            }
            return false;
        }

        return true;
    }

    validaGrafico(bShowErros = true) {
        if (!this.tituloGrafico || !this.tituloGrafico) {
            if (bShowErros) {
                this.toastr.warning("Por Favor preencha o campo Titulo");
            }
            return false;
        }

        if (!this.tipoGrafico || !this.tipoGrafico) {
            if (bShowErros) {
                this.toastr.warning("Por Favor preencha o campo Tipo de Gráfico");
            }
            return false;
        }

        return true;
    }

    objEspecialidades
    fnCfgEspecialidadeRemote(term) {
        return this.serviceEspecialidade.getEspecialidadeLike(term, 0, 10).subscribe(
            (retorno)=>{
                this.objEspecialidades = retorno.dados || retorno;
            }
        );
    }

    especialidadeSelecionada    
    getEspecialidade(especialidade) {

        if( especialidade ){
            this.especialidadeSelecionada = especialidade.descricao;

            let request = {
                especialidade: {
                    id: especialidade.id
                }
            }

            this.relatorioFiltroService.put(this.relatorioid, request).subscribe((resposta) => {
                this.toastr.success("Especialidade Salva com sucesso");
            });
        }
    }

    setTipoRelatorio(evento){
        if( evento && evento.valor ){
            
            this.tipoRelatorio = evento.valor
            this.cdr.markForCheck();
        }
    }

    selecionaPergunta(pergunta){
        // Transformar paergunta em coluna
        console.log(pergunta);
        let objpergunta = pergunta;
        if( !objpergunta.pergunta ){
            objpergunta = { pergunta: objpergunta };
        }

        let colunaPergunta = {
            alias: (objpergunta.pergunta || objpergunta).descricao,
            coluna: objpergunta,
            apenasFiltro: false,
            tipoPergunta: true
        }

        if( pergunta.remover ){
            this.colunas = this.colunas.filter(
                (coluna) => {
                    return coluna.coluna && coluna.coluna.pergunta && coluna.coluna.pergunta.id != objpergunta.pergunta.id;
                }
            )

            this.colunasPrincipalVisiveis = this.colunasPrincipalVisiveis.filter(
                (coluna) => {
                    return coluna.coluna && coluna.coluna.pergunta && coluna.coluna.pergunta.id != objpergunta.pergunta.id;
                }
            )
        }else{
            this.colunas.push( colunaPergunta );
            this.colunasPrincipalVisiveis.push( colunaPergunta );
        }
    }

    clickPerguntaTabela(pergunta){
        pergunta['remover'] = this.validaPerguntaInserida(pergunta.id);
        this.selecionaPergunta(pergunta);
    }

    dividirArray(base, max) {
        var res = [];
        
        for (var i = 0; i < base.length; i = i+max) {
          res.push(base.slice(i,(i+max)));
        }
        // res[res.length-1].push(base[0]);
        return res;
    }

    setObjColorPicker(colorPicker, id) {
        // this['oColorPicker'][id]= colorPicker.corSelecionada;
        this.objCoresDashboard[id] = colorPicker.corSelecionada;
    }

    trocaCor(valor, id) {
        if (valor.colorPicker && valor.colorPicker.corSelecionada) {
            // this['oColorPicker'][id] = valor.colorPicker.corSelecionada;
            this.objCoresDashboard[id] = valor.colorPicker.corSelecionada;
        }
    }

}
