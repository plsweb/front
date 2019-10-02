import { Component, ViewContainerRef, Input, ChangeDetectorRef, Output, ChangeDetectionStrategy, SimpleChanges, ElementRef, EventEmitter, OnInit, OnChanges, HostListener } from '@angular/core';
import { GlobalState } from '../../../global.state';
import { Router } from '@angular/router';
import { UsuarioService } from '../../../services';

import { Sessao } from '../../../services/sessao';

import { ToastrService } from 'ngx-toastr';

import { FormatosData } from '../../../theme/components/agenda/agenda';

import { debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';

import * as $ from 'jquery';

import * as moment from 'moment';
moment.locale('pt-br');

@Component({
    selector: 'timeline',
    templateUrl: './timeline.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [],
    styleUrls: ['./timeline.scss'],
})

export class Timeline implements OnInit, OnChanges {

    @Input() objParams;
    /*
    EX.:
    {
        "img" : 'imagem',
        "titulo" : 'titulo do item',
        "observacao" : 'observacao do item',
        "btnDetalhe" : 'Visualizar',
        "data" : '02/05/2018'
    }
    */

    @Input() objItensEventoTimeline;

    @Input() objConfigTimeline;
    /*
    EX.:
    [
        {
            "idevento" : 2,
            "dataInicio" : '02/05/2018 10:00:00',
            "dataFim" : '02/05/2018 10:00:00',
            "diasParaIniciar" : '20',
            "frequenciaDias" : '5',
            "repetir" : true
        }, {
            "idevento" : 2,
            "dataInicio" : '02/05/2018 10:00:00',
            "dataFim" : '02/05/2018 10:00:00',
            "diasParaIniciar" : '5',
            "frequenciaDias" : '5',
            "repetir" : true
        },
    ]
    */

    @Input() acao;

    @Input() refreshTimeline;

    @Input() intervaloBusca:any = 1;

    @Input() tipoIntervaloBusca:any = "week";

    @Input()

    formatosDeDatas = new FormatosData();

    podeEditar = true;
    podeExcluir = true;
    iniciouConfig = false;

    hoje = moment();

    dataRef = moment();

    paginaAtual = 1
    qtdItensPorPagina = 10;
    tolerancia = 20;

    momentjs = moment;
    objUltimosEventos = [];
    itensTimeline = [];
    itensEventosTimeline = new Object();

    opcoesVisao = [
        { id: 'day' ,   descricao: "Dia"    },
        { id: 'week' ,  descricao: "Semana" },
        { id: 'month' , descricao: "Mês"    },
        { id: 'year'  , descricao: "Ano"    },
    ]

    @Output() getItemSelect: EventEmitter<any> = new EventEmitter();

    @Output() carregaProximos: EventEmitter<any> = new EventEmitter();

    dataInicioBusca = moment()
    dataFimBusca = moment().add( this.intervaloBusca, this.tipoIntervaloBusca );

    @HostListener('scroll', ['$event'])
    container_timeline;

    debounce: Subject<any> = new Subject<any>();

    constructor(
        private _state: GlobalState, 
        private router: Router, 
        private service: UsuarioService,
        private cdr: ChangeDetectorRef,
        private toastr: ToastrService, 
        private vcr: ViewContainerRef,
    ) { }

    ngOnChanges(changes: SimpleChanges){
        
        if( changes['objConfigTimeline'] ){          
            this.objConfigTimeline = this.ordenaConfigTimeline( changes['objConfigTimeline']['currentValue'] );
            let refreshTimeline = ( changes['refreshTimeline'] ) ? changes['refreshTimeline']['currentValue'] : this.refreshTimeline;

            if( refreshTimeline ){
                this.carregaItensEventoTop(null, refreshTimeline);
            }else if( this.objConfigTimeline.length ) {
                this.setItensEvento(this.objItensEventoTimeline);
            }
        }
    }

    ngOnDestroy() {
        this.cdr.detach();
        this.debounce.unsubscribe();
    }

    getScrollTop() {
        return (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body)['scrollTop'];
    }

    getDocumentHeight() {
        const body = document.body;
        const html = document.documentElement;
        
        return Math.max(
            body.scrollHeight, body.offsetHeight,
            html.clientHeight, html.scrollHeight, html.offsetHeight
        );
    };

    ngAfterViewInit() {}

    ngAfterViewChecked() {
        if (!this.container_timeline && $("#timeline").length > 0) {
            this.container_timeline = $("#timeline");
            console.log(this.container_timeline)
        }

        if( !this.iniciouConfig && !this.objConfigTimeline.length){
            // this.objConfigTimeline = this.ordenaConfigTimeline( this.objConfigTimeline );
            this.iniciouConfig = true;

            this.setItensEvento(this.objItensEventoTimeline);            
            this.carregaItensEventoTop(null);
        }
    } 

    onScroll(event) {
        // let barra_timeline = (this.container_timeline.scrollTop() + $(".botao_descer_rolagem").offset().top) - this.container_timeline.offset().top;
        let scroll_timeline = $(".botao_descer_rolagem").offset().top - this.container_timeline.offset().top;
        
        if (scroll_timeline - this.container_timeline.height() <= 0) {
            
            let proximaData = moment( this.dataFimBusca, this.formatosDeDatas.dataHoraSegundoFormato ).format(this.formatosDeDatas.dataHoraSegundoFormato);

            this.dataFimBusca = moment( this.dataFimBusca, this.formatosDeDatas.dataHoraSegundoFormato ).add( this.intervaloBusca, this.tipoIntervaloBusca )
            let fimIntervalo = this.dataFimBusca.format(this.formatosDeDatas.dataHoraSegundoFormato);

            this.carregaProximos.emit( { inicio: proximaData, fim: fimIntervalo } );
            this.carregaItensEventoTop(true);
        }
    }

    ordenaConfigTimeline(objConfigTimeline){

        let objetoOrdenado = objConfigTimeline.sort(
            (a,b) => {
                let retornoSort = a.diasParaIniciar - b.diasParaIniciar;

                if( retornoSort == 0 ){
                    retornoSort = a.frequenciaDias - b.frequenciaDias;
                }

                return retornoSort;
            } 
        ); 

        return objetoOrdenado;
    }

    ngOnInit() {
        let esse = this;
        
        this.debounce.pipe(debounceTime(500)).subscribe(value => {
            console.log("debounceTime");
            
            console.log($("#timeline").prop('scrollHeight'))
            if (!!$("#timeline").prop('scrollHeight')) {
                $(".barra_timeline").height($("#timeline").prop('scrollHeight'));
            }

            this.onScroll(value);
        });
    }

    carregaItensEventoTop(dataReferencia, reiniciaConf = null){

        // let this.objUltimosEventos = this.objUltimosEventos;

        if( this.dataInicioBusca.isAfter( this.dataFimBusca )){
            // this.toastr.warning("Data Inicio maior que a Data Final");
            return;
        }

        if( reiniciaConf ){
            this.reiniciaConf();
        }

        this.objConfigTimeline.forEach(
            (config) => {
                
                if( !config.repetir ){

                    let jaExiste = this.objUltimosEventos.filter(
                        (evento) => {
                            return evento.idevento == config.idevento;
                        }
                    )
                    if( jaExiste && jaExiste.length ){
                        console.warn("Evento nao repete e já foi criado: idPacienteCuidado:  " + jaExiste[0].idevento);
                        return;
                    }
                }

                let proxDataEvento;
                if( !dataReferencia ){
                    proxDataEvento = moment( config.dataInicio, this.formatosDeDatas.dataHoraSegundoFormato ).add(config.diasParaIniciar, "days");

                    // if( config.repetir ){
                        // let fim = moment( moment(this.dataFimBusca).format(this.formatosDeDatas.dataFormato) + ' 23:59:59', this.formatosDeDatas.dataHoraSegundoFormato ) ;
                        // let inicio = moment( moment(this.dataInicioBusca).format(this.formatosDeDatas.dataFormato) + ' 00:00:00', this.formatosDeDatas.dataHoraSegundoFormato ) ;

                    //     //  (moment(proxDataEvento).add( config['frequenciaDias'], "days" )).isBetween( inicio, fim )
                    //     // ENQUANTO NAO ESTIVER NO INTERVALO DE BUSCA
                    //     // while( !( (moment(proxDataEvento).add( config['frequenciaDias'], "days" )).isBetween( inicio, fim ) ) ){
                    //     //     proxDataEvento = moment(proxDataEvento).add( config['frequenciaDias'], "days" );
                    //     // }
                    // }

                    // CODIGO ANTIGO - VALIDAR NECESSIDADE - DESDE 22/02/2019 - SAMUEL GONÇALVES MIRANDA
                    if( config.repetir ){
                        let fim = moment( moment(this.dataFimBusca).format(this.formatosDeDatas.dataFormato) + ' 23:59:59', this.formatosDeDatas.dataHoraSegundoFormato ) ;
                        let inicio = moment( moment(this.dataInicioBusca).format(this.formatosDeDatas.dataFormato) + ' 00:00:00', this.formatosDeDatas.dataHoraSegundoFormato ) ;
                        while( 
                            (
                                ( moment(proxDataEvento).add( config['frequenciaDias'], "days" ).diff( inicio ) < 0 ) &&
                                ( moment(proxDataEvento).add( config['frequenciaDias'], "days" ).diff( fim ) < 0 ) 
                            )
                        ){
                            proxDataEvento = moment(proxDataEvento).add( config['frequenciaDias'], "days" );
                        }
                    }


                }else{
                    dataReferencia = undefined;
                    this.objUltimosEventos.forEach(
                        (obj) => {
                            if( obj['idevento'] == config.idevento ){
                                dataReferencia = obj['ultimaData'];
                            }
                        }
                    )
                    if( !dataReferencia ){
                        proxDataEvento = moment( config.dataInicio, this.formatosDeDatas.dataHoraSegundoFormato ).add(config.diasParaIniciar, "days");

                        if( config.repetir ){
                            if( !proxDataEvento.isBetween(this.dataInicioBusca, this.dataFimBusca) && !proxDataEvento.isAfter( this.dataFimBusca )){
                                let maiorQueFim = false;
                                while( !maiorQueFim ){
                                    proxDataEvento = moment( proxDataEvento, this.formatosDeDatas.dataHoraSegundoFormato ).add(config['frequenciaDias'], "days");

                                    if( proxDataEvento.isBetween(this.dataInicioBusca, this.dataFimBusca) || proxDataEvento.isSameOrBefore(this.dataFimBusca)){
                                        maiorQueFim = true;
                                    }
                                }
                            }
                        }

                    }else{

                        if( config.repetir )
                            proxDataEvento = moment( dataReferencia, this.formatosDeDatas.dataHoraSegundoFormato ).add(config['frequenciaDias'], "days" );
                        else
                            proxDataEvento = moment( config.dataInicio, this.formatosDeDatas.dataHoraSegundoFormato ).add(config.diasParaIniciar, "days");
                    }
                }
                
                let objDatasEventos = new Object();
                    objDatasEventos['primeiraData'] = moment(proxDataEvento, this.formatosDeDatas.dataHoraSegundoFormato).format(this.formatosDeDatas.dataHoraSegundoFormato);

                let dentroCfgEvento; 
                let inicio;
                let fim;
                if( config["dataFim"] ){
                    inicio = moment( config["dataInicio"], this.formatosDeDatas.dataHoraSegundoFormato );
                    fim    = moment( config["dataFim"], this.formatosDeDatas.dataHoraSegundoFormato );
                    dentroCfgEvento = proxDataEvento.isBetween(inicio, fim);
                }else{
                    dentroCfgEvento = true;
                }

                if( dentroCfgEvento ){

                    // for (let index = 0; ( (index < this.qtdItensPorPagina) && dentroCfgEvento ); index++) {

                    if( !proxDataEvento.isBetween(this.dataInicioBusca, this.dataFimBusca) ){
                        return
                    }

                    while( dentroCfgEvento ){
                        let proximoItem = {
                            titulo  : this.validaPosicaoObj(this.objParams['titulo'], config['objEvento']),
                            img     : this.validaPosicaoObj(this.objParams['img'], config['objEvento']),
                            cor     : this.validaPosicaoObj(this.objParams['cor'], config['objEvento']),
                            nome     : this.validaPosicaoObj(this.objParams['nome'], config['objEvento']),
                            observacao : this.validaPosicaoObj(this.objParams['observacao'], config['objEvento']),
                            objEvento  : config
                        }
                        
                        proximoItem['data'] = moment(proxDataEvento, this.formatosDeDatas.dataHoraSegundoFormato).format(this.formatosDeDatas.dataHoraSegundoFormato);
                        proximoItem['idelemento'] = "elemento"+config.idevento+(moment(proxDataEvento, this.formatosDeDatas.dataHoraSegundoFormato).format(this.formatosDeDatas.dataFormato)).replace(/\//g, "");
                        proxDataEvento = proxDataEvento.add( config['frequenciaDias'], "days" );

                        if( fim ){
                            dentroCfgEvento = ( proxDataEvento.isBetween(inicio, fim) && proxDataEvento.isBetween(this.dataInicioBusca, this.dataFimBusca));
                        }else{
                            dentroCfgEvento = proxDataEvento.isBetween(this.dataInicioBusca, this.dataFimBusca);
                        }

                        if( !this.itensEventosTimeline[ proximoItem['idelemento'] ] ){
                            this.itensEventosTimeline[ proximoItem['idelemento'] ] = {
                                crieiNovo : true
                            };
                        }
                        
                        this.itensTimeline.push( proximoItem );

                        if( !config.repetir ){
                            // VALIDA SE AÇÃO REPETE OU NÃO
                            dentroCfgEvento = false;
                        }

                    }
                    
                    objDatasEventos['ultimaData'] = this.itensTimeline[ (this.itensTimeline.length-1) ]['data'];
                    objDatasEventos['idevento'] = config.idevento;

                    this.objUltimosEventos.push( objDatasEventos );
                }
            }
        )

        //ORDENA PARA MOSTRAR OS PROXIMOS EM SEQUENCIA
        this.itensTimeline = this.itensTimeline.sort(
            (a,b) => {
                let retornoSort = moment(a.data, this.formatosDeDatas.dataHoraSegundoFormato).diff( moment(b.data, this.formatosDeDatas.dataHoraSegundoFormato) );

                return retornoSort;
            } 
        );

        //ORDENA ULTIMOS EVENTOS
        this.objUltimosEventos = this.objUltimosEventos.sort(
            (a,b) => {
                let retornoSort = moment(a.ultimaData, this.formatosDeDatas.dataHoraSegundoFormato).diff( moment(b.ultimaData, this.formatosDeDatas.dataHoraSegundoFormato) );

                return retornoSort;
            } 
        );
        
        console.log("---- PROXIMOS EVENTOS ORDENADOS ---");
        console.log(this.itensTimeline);

        this.cdr.markForCheck();
    }

    subirRolagem(dataReferencia){
        // let this.objUltimosEventos = this.objUltimosEventos;

        this.dataFimBusca = moment( this.dataInicioBusca, this.formatosDeDatas.dataHoraSegundoFormato );
        this.dataInicioBusca = moment(  this.dataInicioBusca, this.formatosDeDatas.dataHoraSegundoFormato).subtract( this.intervaloBusca, this.tipoIntervaloBusca );

        let divInicioRolagem = "";
        this.objConfigTimeline.forEach(
            (config, index) => {

                // PERCORRER DESDE A DATA DE INICIO ATÉ A DATA DE HOJE
                // PRA PEGAR AS PROXIMAS X DATAS DESSE EVENTO
                
                if( !config.repetir ){

                    let jaExiste = this.objUltimosEventos.filter(
                        (evento) => {
                            return evento.idevento == config.idevento;
                        }
                    )
                    if( jaExiste && jaExiste.length ){
                        console.warn("Evento nao repete e já foi criado: idPacienteCuidado:  " + jaExiste[0].idevento);
                        return;
                    }
                }

                let proxDataEvento;
                this.objUltimosEventos.forEach(
                    (obj) => {
                        // moment( dataReferencia, this.formatosDeDatas.dataHoraSegundoFormato )
                        if( obj['idevento'] == config.idevento ){

                            if( !dataReferencia ){
                                dataReferencia = obj['primeiraData'];

                            }else{

                                if( ( moment( obj['primeiraData'], this.formatosDeDatas.dataHoraSegundoFormato ).diff( moment( dataReferencia, this.formatosDeDatas.dataHoraSegundoFormato ) ) < 0 ) ){
                                    dataReferencia = obj['primeiraData'];
                                }

                            }

                        }
                    }
                )

                if( !dataReferencia ){
                    dataReferencia = moment( config.dataInicio, this.formatosDeDatas.dataHoraSegundoFormato ).add(config.diasParaIniciar, "days");
                }

                if( index == 0 ){
                    divInicioRolagem = "elemento"+config.idevento+(moment(dataReferencia, this.formatosDeDatas.dataHoraSegundoFormato).format(this.formatosDeDatas.dataFormato)).replace(/\//g, "");
                }
                console.log("Primeira data:  " + moment( dataReferencia, this.formatosDeDatas.dataHoraSegundoFormato ).format(this.formatosDeDatas.dataFormato) );
                
                proxDataEvento = moment( dataReferencia, this.formatosDeDatas.dataHoraSegundoFormato ).subtract(config['frequenciaDias'], "days" );
                console.log("DEPOIS:  " + proxDataEvento.format(this.formatosDeDatas.dataFormato));

                let objDatasEventos = new Object();
                objDatasEventos['primeiraData'] = moment(proxDataEvento, this.formatosDeDatas.dataHoraSegundoFormato).format(this.formatosDeDatas.dataHoraSegundoFormato)

                let dentroCfgEvento; 
                let inicio;
                let fim;
                if( config["dataFim"] ){
                    inicio = moment( config["dataInicio"], this.formatosDeDatas.dataHoraSegundoFormato );
                    fim    = moment( config["dataFim"], this.formatosDeDatas.dataHoraSegundoFormato );
                    dentroCfgEvento = proxDataEvento.isBetween(inicio, fim);
                }else{
                    dentroCfgEvento = true;
                }

                if( dentroCfgEvento ){

                    // for (let index = 0; ( (index < this.qtdItensPorPagina) && dentroCfgEvento ); index++) {

                    if( !proxDataEvento.isBetween(this.dataInicioBusca, this.dataFimBusca) ){
                        return
                    }

                    for (let index = 0; index < this.qtdItensPorPagina; index++) {

                        let proximoItem = {
                            titulo  : this.validaPosicaoObj(this.objParams['titulo'], config['objEvento']),
                            img     : this.validaPosicaoObj(this.objParams['img'], config['objEvento']),
                            cor     : this.validaPosicaoObj(this.objParams['cor'], config['objEvento']),
                            nome     : this.validaPosicaoObj(this.objParams['nome'], config['objEvento']),
                            observacao : this.validaPosicaoObj(this.objParams['observacao'], config['objEvento']),
                            objEvento  : config
                        }

                        
                        proximoItem['data'] = moment(proxDataEvento, this.formatosDeDatas.dataHoraSegundoFormato).format(this.formatosDeDatas.dataHoraSegundoFormato);
                        proximoItem['idelemento'] = "elemento"+config.idevento+(moment(proxDataEvento, this.formatosDeDatas.dataHoraSegundoFormato).format(this.formatosDeDatas.dataFormato)).replace(/\//g, "");
                        proxDataEvento = proxDataEvento.add( config['frequenciaDias'], "days" );

                        this.itensTimeline.push( proximoItem );

                        if( !config.repetir ){
                            // VALIDA SE AÇÃO REPETE OU NÃO
                            index = this.qtdItensPorPagina + 1;
                        }

                    }
                    
                    objDatasEventos['ultimaData'] = this.itensTimeline[ (this.itensTimeline.length-1) ]['data'];
                    objDatasEventos['idevento'] = config.idevento;

                    this.objUltimosEventos.push( objDatasEventos );

                }

            }
        )

        //ORDENA PARA MOSTRAR OS PROXIMOS EM SEQUENCIA
        this.itensTimeline = this.itensTimeline.sort(
            (a,b) => {
                let retornoSort = moment(a.data, this.formatosDeDatas.dataHoraSegundoFormato).diff( moment(b.data, this.formatosDeDatas.dataHoraSegundoFormato) );

                return retornoSort;
            } 
        );

        //ORDENA ULTIMOS EVENTOS
        this.objUltimosEventos = this.objUltimosEventos.sort(
            (a,b) => {
                let retornoSort = moment(a.ultimaData, this.formatosDeDatas.dataHoraSegundoFormato).diff( moment(b.ultimaData, this.formatosDeDatas.dataHoraSegundoFormato) );

                return retornoSort;
            } 
        );
        
        $(".cd-timeline__container").animate({
            scrollTop: $(`.${divInicioRolagem}`).offset().top
        }, 1);

        this.cdr.markForCheck();
    }

    descerRolagem(dataReferencia) {
        let divInicioRolagem = "";

        this.objConfigTimeline.forEach((config, index) => {
            this.objUltimosEventos.forEach((obj) => {
                if( obj['idevento'] == config.idevento ){
                    if ( !dataReferencia ){
                        dataReferencia = obj['ultimaData'];
                    } else {
                        if( ( moment( obj['ultimaData'], this.formatosDeDatas.dataHoraSegundoFormato ).diff( moment( dataReferencia, this.formatosDeDatas.dataHoraSegundoFormato ) ) < 0 ) ){
                            dataReferencia = obj['ultimaData'];
                        }
                    }

                    if( !dataReferencia ){
                        dataReferencia = moment( config.dataInicio, this.formatosDeDatas.dataHoraSegundoFormato ).add(config.diasParaIniciar, "days");
                    }

                    divInicioRolagem = "elemento" + config.idevento+(moment(dataReferencia, this.formatosDeDatas.dataHoraSegundoFormato).format(this.formatosDeDatas.dataFormato)).replace(/\//g, "");
                }
            });
        });

        let proximaData = moment( this.dataFimBusca, this.formatosDeDatas.dataHoraSegundoFormato ).format(this.formatosDeDatas.dataHoraSegundoFormato);

        this.dataFimBusca = moment( this.dataFimBusca, this.formatosDeDatas.dataHoraSegundoFormato ).add( this.intervaloBusca, this.tipoIntervaloBusca )
        let fimIntervalo = this.dataFimBusca.format(this.formatosDeDatas.dataHoraSegundoFormato);

        this.carregaProximos.emit( { inicio: proximaData, fim: fimIntervalo } );
        this.carregaItensEventoTop(true, true);
        this.cdr.markForCheck();   
    }

    setItensEvento( itens ){
        console.log(itens);
        
        itens.forEach(
            (item) => {
                // let objEvento = item.objEvento;
                
                let idEvento = item.idevento

                let dataPrevista = item.dataPrevista;
                let dataExecucao = item.dataExecucao;
                let idelemento = "elemento"+idEvento+(moment(dataPrevista, this.formatosDeDatas.dataHoraSegundoFormato).format(this.formatosDeDatas.dataFormato)).replace(/\//g, "");

                this.itensEventosTimeline[ idelemento ] = item;
            }
        );

        this.cdr.markForCheck();
    }

    clickItemEvento(item, acao){
        this.acao = acao;
        this.getItemSelect.emit({ item : item, acaoExecutada : acao });
    }


    validaStatusItemEvento(item){
        let status = "nao_executada";
        
        var idelemento = item.idelemento
        if( !this.itensEventosTimeline[idelemento] || ( this.itensEventosTimeline[idelemento] && ( this.itensEventosTimeline[idelemento]['crieiNovo'] || !this.itensEventosTimeline[idelemento]['dataExecucao'] ) ) ){
            let intervaloDias = moment( item.data, this.formatosDeDatas.dataHoraSegundoFormato ).diff( this.hoje, "days" );
            if( intervaloDias >= this.tolerancia ){
                status = "nao_executada";
            }else{
                status = "atrasada";
            }
        }else{
            let intervaloDiasExecucao = moment( this.itensEventosTimeline[idelemento]['dataPrevista'], this.formatosDeDatas.dataHoraSegundoFormato ).diff( this.itensEventosTimeline[idelemento]['dataExecucao'], "days" );
            
            if( intervaloDiasExecucao < 0 ){
                status = "executada_fora_prazo";
            }else{
                status = "executada_prazo";
            }
        }        

        return status;
    }

    validaPosicaoObj(pos, itemLista){

        let valor;
        
        if( pos.indexOf(".") > 0 ){
  
            //POSICAO
            let arrayPos = pos.split(".");

            let valorFinal = itemLista;
            arrayPos.forEach(
                (pos) => {
                    valorFinal = valorFinal[pos];
                }
            );

            valor = valorFinal;

        }else{
            if( itemLista[pos] ){
                valor = itemLista[pos];
            }else{
                console.error("Erro nos parametros: " + pos);
                valor = "";
            }
        }
        
        return valor;
    }

    reiniciaConf(){
        this.objUltimosEventos = [];
        this.itensTimeline = [];
        this.itensEventosTimeline = new Object();
    }

    setVisao(evento){console.log(evento)
        if( evento && evento.valor && evento.valor != '0' ){
            this.tipoIntervaloBusca = evento.valor;
        }

        this.itensTimeline = [];
        this.dataInicioBusca = moment();
        this.dataFimBusca = moment().add( this.intervaloBusca, this.tipoIntervaloBusca );

        this.carregaProximos.emit({
            inicio: this.dataInicioBusca.format(this.formatosDeDatas.dataHoraSegundoFormato),
            fim: this.dataFimBusca.format(this.formatosDeDatas.dataHoraSegundoFormato)
        });

        this.carregaItensEventoTop(true, true);
    }

    setDataInicioBusca(evento){console.log(evento)
        if( evento.target && evento.target.value ){
            this.dataInicioBusca = moment( moment( evento.target.value, this.formatosDeDatas.dataHoraSegundoFormato ).format( this.formatosDeDatas.dataHoraSegundoFormato ), this.formatosDeDatas.dataHoraSegundoFormato );
            let proximaData = moment( this.dataInicioBusca, this.formatosDeDatas.dataHoraSegundoFormato ).format(this.formatosDeDatas.dataHoraSegundoFormato);

            let fimData = moment( this.dataFimBusca, this.formatosDeDatas.dataFormato ).format(this.formatosDeDatas.dataFormato);

            this.dataFimBusca = moment( fimData + ' 23:59:59', this.formatosDeDatas.dataHoraSegundoFormato );
            let fimIntervalo = this.dataFimBusca.format(this.formatosDeDatas.dataHoraSegundoFormato);
            
            console.log("inicio", proximaData);
            console.log("fim", fimIntervalo);

            if( proximaData == 'Invalid date' || fimIntervalo == 'Invalid date' ){
                this.toastr.warning("Data Inválida");
                return
            }

            this.carregaProximos.emit( { inicio: proximaData, fim: fimIntervalo } );
            
            this.carregaItensEventoTop(true, true);
        }
    }

    setDataFimBusca(evento){console.log(evento)
        if( evento && evento.target.value ){
            this.dataFimBusca = moment( moment( evento.target.value + ' 23:59:59', this.formatosDeDatas.dataHoraSegundoFormato ).format( this.formatosDeDatas.dataHoraSegundoFormato ), this.formatosDeDatas.dataHoraSegundoFormato );
            let fimIntervalo = moment( this.dataFimBusca, this.formatosDeDatas.dataHoraSegundoFormato ).format(this.formatosDeDatas.dataHoraSegundoFormato);

            this.dataInicioBusca = moment( this.dataInicioBusca, this.formatosDeDatas.dataHoraSegundoFormato );
            let inicioBusca = this.dataInicioBusca.format(this.formatosDeDatas.dataHoraSegundoFormato);

            console.log("inicio", inicioBusca);
            console.log("fim", fimIntervalo);

            if( inicioBusca == 'Invalid date' || fimIntervalo == 'Invalid date' ){
                this.toastr.warning("Data Inválida");
                return
            }
            
            this.carregaProximos.emit( { inicio: inicioBusca, fim: fimIntervalo } );
            
            this.carregaItensEventoTop(true, true);
        }
    }
}