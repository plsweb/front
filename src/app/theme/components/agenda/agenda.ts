import { Component, ViewChild, Input, Output, ChangeDetectorRef, ChangeDetectionStrategy, EventEmitter, ElementRef, OnInit, TemplateRef, HostListener, OnChanges } from '@angular/core';

import { Sessao }   from '../../../services/sessao';


import { GlobalState } from '../../../global.state';
import { NgbdModalContent } from '../../../theme/components/modal/modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import * as moment from 'moment';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject, Observable } from 'rxjs';
import { PrestadorAtendimentoService, Servidor } from 'app/services';
import { ToastrService } from 'ngx-toastr';

moment.locale('pt-br');

@Component({
    selector: 'agenda',
    templateUrl: './agenda.html',
    styleUrls: ['./agenda.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Agenda implements OnInit, OnChanges {

    el;
    offsetTop = 74;
    zoomStep = 2;
    loading;
    horariosHeight;

    @Input() datas;
    @Input() zoom = 1;
    @Input() calendarioOpt;
    @Input() habilitaSelecaoHorario = false;
    @Input() verDesmarcados = false;

    @Input() mostraMover = true;
    @Input() mostraEditar = true;
    @Input() mostraDeletar = true;
    @Input() agrupaAgendamentos = true;  //AGRUPAR AGENDAS COLETIVAS COM APENAS 1 PACIENTE AGENDADO

    @Input() habilitaCriarHorario = false;
    @Input() habilitaMoverAgenda = false;
    @Output() setDatasSelecionadas: EventEmitter<any> = new EventEmitter();
    @Output() setInstanciaAgenda: EventEmitter<any> = new EventEmitter();
    @Output() setDesmarcados: EventEmitter<any> = new EventEmitter();
    
    @Input() fnInicializaBlocos: Function;
    @Input() fnInicializaAgendas: Function;
    @Input() onDrop: Function;
    @Input() onAgendaDrop: Function;
    @Input() onCreateBloco: Function;
    @Input() onCreateAgenda: Function;
    @Input() onBlocoClick: Function;
    @Input() onBlocoRemove: Function;
    @Input() onAgendaClick: Function;
    @Input() fnPegaHoraInicial: Function;
    @Input() fnPegaHoraFinal: Function;
    @Input() parametrosObserver: Subject<any>;
    @Input() agendaAcoes;
    @Input() blocosAcoes;
    @Input() someKeyboard2: number | number[];
    @Input() contextObject;
    @Input() elementoAcoes;

    // ******************* VALIDAR NECESSIDADE DISSO ******************* //
    @Input() doisTiposAgendamento;
    // ***************************************************************** //

    novaAgenda;
    formatosDeDatas;
    cfgMousePressionado;
    mousePressionado;
    desenhandoAgenda;
    novoBloco;
    momentjs;
    horarios;
    blocosCfg;
    agendas;
    droppedBloco;
    droppedAgenda;

    fixa = false;
    estatica = true;

    modal;
    agendasColetivas = [];
    
    @ViewChild("consultaColetivaModal", {read: TemplateRef}) consultaColetivaModal: TemplateRef<any>;
    @ViewChild("consultaColetivaModalBotoes", {read: TemplateRef}) consultaColetivaModalBotoes: TemplateRef<any>;

    debounce: Subject<any> = new Subject<any>();
    _subject: Subject<any>;
    observer: Subject<any>;

    constructor(
        private _state: GlobalState,
        _elementRef : ElementRef,
        private cdr: ChangeDetectorRef,
        private modalService: NgbModal,
        private servicePrestador: PrestadorAtendimentoService,
        private toastr: ToastrService
    ) {
        this.el = _elementRef;
        this.cdr.markForCheck();
    }

    ngOnDestroy() {
        // this.cdr.markForCheck();
        this.cdr.reattach();
        this.debounce.unsubscribe();
    }

    ngOnInit() {
        this.rebuild(true);

        this.scrollPage();

        this.momentjs = moment;

        this.inicializaConfiguracoes();

        this._state.subscribe('menu.isCollapsed', () => {
            this.rebuild(true);
        });

        // Evitar bug de loop na alteração entre os elementos
        this.debounce
            .pipe(debounceTime(500))
            .subscribe(value => {
                let horarios = [];
                let inicio = value[0].split(":");
                let final = value[1].split(":");

                this.contextObject = {dados: [parseInt(inicio) * 3600, parseInt(final) * 3600]};

                for (let i = inicio[0]; i <= final[0]; i ++) {
                    horarios.push( ("0" + i).substr(-2) );
                }

                this.horarios = horarios;
                this.rebuild(false);
            }
        );

        this.setInstanciaAgenda.emit({
            rebuild: this.rebuild.bind(this),
            limpaBlocos: this.limpaBlocos.bind(this),
            limpaAgendas: this.limpaAgendas.bind(this),
            somePopover: this.somePopover.bind(this),
            removeBlocoId: this.removeBlocoId.bind(this),
            moveToDate: this.moveToDate.bind(this),
            setAgrupaAgendamentos: this.setAgrupaAgendamentos.bind(this),
            getQuantidadeAtual: this.getQuantidadeOcupada.bind(this),
            geraAgendaRecorrente: this.geraAgendaRecorrente.bind(this),
            geraBloqueioRecorrente: this.geraBloqueioRecorrente.bind(this),

            trocaTipoCalendario: this.trocaTipoCalendario.bind(this),
            mostraStatus: this.mostraStatus.bind(this),
            getOpt: this.getOpt.bind(this),
            setOpt: this.setOpt.bind(this),
        });
    }

    ngOnChanges(changes) {
        if (changes.datas && changes.datas.currentValue && !changes.datas.firstChange) {
            this.inicializaBlocos();
        }
    }

    ngAfterViewInit() {

        if( this.parametrosObserver ){
            this.parametrosObserver.pipe(
                distinctUntilChanged()
            ).subscribe(objParams => {
                if( objParams.nome && objParams.valor ){
                    if( this[objParams.nome] && this[objParams.nome].length ){
                        this[objParams.nome].push(objParams.valor);
                    }else{
                        this[objParams.nome] = objParams.valor;
                    }

                    if( objParams.fnCustomizada ){
                        this[objParams.nome] = objParams.fnCustomizada(this[objParams.nome]);
                    }
                }
            });
        }

        this.inicializaBlocos(); // E TAMBÉM AGENDAS
        // ORDEM DE INICIALIZAÇÃO - AGENDAS PRIMEIRO, DEPOIS BLOCOS
        
        $('div.agenda').popover({
            trigger: 'hover',
            placement:"auto",
            template:'<div class="popover" role="tooltip"><div class="arrow"></div><h3 class="popover-header"></h3><div class="popover-body"></div></div>'
        });

    }

    htmlToElement(html) {
        let template = document.createElement('template');
        html = html.trim();
        template.innerHTML = html;
        return template.content.firstChild;
    }

    setOpt(opt, valor) {
        Sessao.setPreferenciasUsuario('calendarioOpt', valor);
        return this.calendarioOpt[opt] = valor;
    }

    getOpt(opt) {
        return this.calendarioOpt[opt];
    }

    geraBloqueioRecorrente(configuracoes, datasSelecionadas, tipo) {
        let agendaRecorrentes = configuracoes.filter((cfg) => {
            return cfg.tipo == tipo && cfg.repetir
        });

        let tempBlocosRecorrentes = [];
        agendaRecorrentes.forEach((configuracao) => {

            var max = datasSelecionadas.reduce(function (a, b) { return a > b ? a : b; });

            datasSelecionadas.forEach((data) => {
                let tmpConfiguracao = Object.assign({}, configuracao);
                let inicioRecorrencia = moment(`${tmpConfiguracao.dataInicio} ${tmpConfiguracao.horaInicio}`, 'DD/MM/YYYY HH:mm');
                let fimRecorrencia = tmpConfiguracao.dataFim ? moment(`${tmpConfiguracao.dataFim} ${tmpConfiguracao.horaFim}`, 'DD/MM/YYYY HH:mm') : max;
                if (
                    tmpConfiguracao.recorrencia &&
                    tmpConfiguracao.recorrencia.indexOf( data.day() ) !== -1 && 
                    inicioRecorrencia.isSameOrBefore(data, 'day') &&
                    fimRecorrencia.isSameOrAfter(data, 'day')
                ) {
                    let inicio  = moment(data).hour(tmpConfiguracao.horaInicio.split(':')[0]).minute(tmpConfiguracao.horaInicio.split(':')[1]);
                    let fim     = moment(data).hour(tmpConfiguracao.horaFim.split(':')[0]).minute(tmpConfiguracao.horaFim.split(':')[1]);

                    tmpConfiguracao.dataInicio = inicio.format(this.formatosDeDatas.dataFormato);
                    tmpConfiguracao.dataFim = fim.format(this.formatosDeDatas.dataFormato);

                    tmpConfiguracao.bloqueioOriginal = Object.assign({}, configuracao);
                    tempBlocosRecorrentes.push(tmpConfiguracao);
                }
            });
        });

        agendaRecorrentes = tempBlocosRecorrentes;

        return agendaRecorrentes;
    }

    geraAgendaRecorrente(configuracoes, datasSelecionadas, tipo) {
        let blocosRecorrentes = configuracoes.filter((cfg) => {
            return cfg.tipo == tipo && cfg.repetir
        });

        let tempBlocosRecorrentes = [];
        blocosRecorrentes.forEach((configuracao) => {

            var max = datasSelecionadas.reduce(function (a, b) { return a > b ? a : b; });

            datasSelecionadas.forEach((data) => {
                
                let inicioRecorrencia = moment(`${configuracao.dataInicio} ${configuracao.horaInicio}`, 'DD/MM/YYYY HH:mm');
                let fimRecorrencia = configuracao.dataFim ? moment(`${configuracao.dataFim} ${configuracao.horaFim}`, 'DD/MM/YYYY HH:mm') : max;
                if (
                    configuracao.recorrencia &&
                    configuracao.recorrencia.indexOf( data.day() ) !== -1 && 
                    inicioRecorrencia.isSameOrBefore(data, 'day') &&
                    fimRecorrencia.isSameOrAfter(data, 'day')
                ) {
                    let inicio = moment(data).hour(configuracao.horaInicio.split(':')[0]).minute(configuracao.horaInicio.split(':')[1]);
                    let fim    = moment(data).hour(configuracao.horaFim.split(':')[0]).minute(configuracao.horaFim.split(':')[1]);

                    let agendamentosDoBloco = []
                    if( configuracao.atendimentos ){
                        agendamentosDoBloco = configuracao.atendimentos.filter(
                            (atendimento) => {
                                // VALIDA SE É O MESMO DIA
                                if( data.format( this.formatosDeDatas.dataFormato ) == moment( atendimento.agendamento, this.formatosDeDatas.dataHoraSegundoFormato ).format( this.formatosDeDatas.dataFormato ) ){
                                    // console.log("Mesma data");

                                    // VALIDA SE TA DENTRO DO RANGE DA CONIGURAÇÃO DE HORARIO
                                    if( moment( atendimento.agendamento, this.formatosDeDatas.dataHoraSegundoFormato ).isBetween(inicio, fim, null, '[]') ){
                                        // console.log("Dentro do range");
                                        return true;                                        
                                    }
                                }
                                return false
                            }
                        ).map(
                            (atendimento) => {
                                let obj = atendimento;
                                let config = Object.assign({}, configuracao)
                                let objAtendimento = Object.assign({}, atendimento)
                                delete config.atendimentos;
                                delete config.configuracoesHorario;

                                obj['configuracoesHorario'] = [{
                                    atendimento: objAtendimento,
                                    configuraHorario: config
                                }];
                                return obj;
                            }
                        )
                    }

                    tempBlocosRecorrentes.push({
                        dado: configuracao,
                        id: configuracao.id,
                        draggable: false,
                        grupo: true, 
                        
                        dataInicio: inicio.toDate(),
                        dataFim: fim.toDate(),
                        atendimentos: agendamentosDoBloco,
                        inicio: inicio.toDate(),
                        fim: fim.toDate(),

                        recorrencia : Array.isArray(configuracao.recorrencia) ? configuracao.recorrencia : configuracao.recorrencia.split(',')
                    });
                }
            });
        });

        blocosRecorrentes = tempBlocosRecorrentes;

        return blocosRecorrentes;
    }

    setAgrupaAgendamentos(agrupa:boolean){
        this.agrupaAgendamentos = agrupa;
    }

    getQuantidadeOcupada(){
        return this.quantidadeOcupada;
    }

    //  ======================================
    //          Inicializa configurações
    //  ======================================
    inicializaConfiguracoes() {
        let sCalendarioOpt = localStorage.getItem('preferenciaUsuario');

        this.formatosDeDatas = new FormatosData();

        //  TODO: pega cfg da sessao
        let calendarioOpt = !sCalendarioOpt ? new CalendarioOpt({}) : JSON.parse(sCalendarioOpt);
        this.calendarioOpt = calendarioOpt;
        this.calendarioOpt = new CalendarioOpt(this.calendarioOpt);

        if (this.calendarioOpt.visao != sessionStorage.getItem('visao')) {
            this.trocaTipoCalendario(this.calendarioOpt.visao);
            let preferencias = Sessao.getPreferenciasUsuario();

            preferencias = Object.assign( this.calendarioOpt, preferencias );
            localStorage.setItem('preferenciaUsuario', JSON.stringify( preferencias ));
            sessionStorage.setItem('calendario-opt', JSON.stringify(this.calendarioOpt));
        }

        //  Inicializa os Horarios

        let inicial = this.someKeyboard2 || [1,82800];

        inicial[0] = Math.round(inicial[0] / 3600);
        inicial[1] = Math.round(inicial[1] / 3600);

        let horarios = [];    

        for (let i = 0; i <= 23; i ++) {
            horarios.push( ("0" + i).substr(-2) );
        }

        this.horarios = horarios;
    }


    //  ======================================
    //          Agenda HEADER
    //  ======================================
    headerMesesSelecionados() {
        // this.datas = this.datas.sort( (left, right) => moment.utc(left.timeStamp).diff(moment.utc(right.timeStamp)) );

        let aDiasSelecionados = this.datas.map(data => data.format(this.formatosDeDatas.dataMesAno));
        aDiasSelecionados = aDiasSelecionados.filter((item, pos) => aDiasSelecionados.indexOf(item) == pos);
        if (this.calendarioOpt.visao != 'week') {
            return this.datas.map(data => data.format(`DD MMMM YYYY`));
        } else {
            return aDiasSelecionados.join(' - ');
        }
    }

    getWidthFixedHeader() {
        return $('#aaaa').css('width');
    }

    getLeftFixedHeader() {
        let left = $('#aaaa').get(0).getBoundingClientRect().left;
        return `${left}px`;
    }

    getHeightHorarios() {
        return $(".horarios").innerHeight() * -1;
    }


    //  ======================================
    //          Agenda Eventos
    //  ======================================
    clicaAlterarPeriodo(tipo) {
        this.datas = this.datas.map(data => moment(data)[tipo](1, this.calendarioOpt.visao));
        this.setDatasSelecionadas.emit(this.datas);
    }

    visualizaDesmarcados(event){
        this.setDesmarcados.emit(event);
    }

    clicaZoom(qtd) {
        
        if (this.zoom <= this.zoomStep && qtd == (this.zoomStep * -1)) {
            this.zoom = 1;
            this.scrollToNow();
            return;
        }

        this.zoom = this.zoom + qtd;
        this.scrollToNow();
        Sessao.setPreferenciasUsuario('zoom', this.zoom);
        this.rebuild(false);
    }

    drop(ev) {
        ev.preventDefault();

        if (this.onDrop && this.droppedBloco && this.droppedBloco.bloco) {
            let novaData = moment(ev.currentTarget.id, 'hhYYYY-MM-DD');
            this.moveToDate(this.droppedBloco.bloco, novaData);
            this.onDrop(ev.currentTarget, novaData, this.droppedBloco).then(()=>{});
        }
    }

    agendaDrop(ev, data) {
        ev.preventDefault();

        if (this.onAgendaDrop && this.droppedAgenda && this.droppedAgenda.id) {
            let novaData = moment(`${data.novaDataInicio} ${data.dado.horaInicio}`, this.formatosDeDatas.dataHoraFormato);

            let minutos = ev.layerY / this.zoom;
            novaData.add(minutos, 'minute');

            this.moveToDate({id: this.droppedAgenda.id}, novaData);
            this.droppedAgenda.cfg = data.dado;
            let promiseAgendaDrop = this.onAgendaDrop(this.droppedAgenda, ev.currentTarget, novaData);

            if (promiseAgendaDrop) {
                promiseAgendaDrop.then(() => {});
            }
        }
    }

    onDragStart(ev, data) {
        ev.dataTransfer.setData('data', JSON.stringify(data));
        this.droppedBloco = data;
    }

    onAgendaDragStart(ev, data) {
        ev.dataTransfer.setData('data', JSON.stringify(data));
        this.droppedAgenda = data;
    }

    dragenter() {
    }

    dragleave() {
    }

    dragover(ev) {
        ev.preventDefault();
    }

    mostraTooltip(ev, data) {
        try{
            
            if (!(data && data.novaDataInicio && data.dado && data.dado.horaInicio)) {
                return;
            }
            
            let posY = ev.clientY;
            let posX = ev.pageX - ev.layerX;

            let minutos = ev.layerY / this.zoom;
            let novoInicio = moment(`${data.novaDataInicio} ${data.dado.horaInicio}`, this.formatosDeDatas.dataHoraFormato).add(minutos, 'minute');

            $("#img-tooltip").css({top: posY, left: posX, position: 'fixed' });

            $('[data-toggle="tooltip"]').attr("title",novoInicio.format('HH:mm'));
            $('[data-toggle="tooltip"]').attr('data-original-title', novoInicio.format('HH:mm')).tooltip(
                {
                    animation: false

                }
            );
            
        }catch(e){
            console.log(e);
        }
    }


    clicaAgenda($event, agenda, valida) {
        this.droppedAgenda = agenda;

        // height: "490px", bgColor: "#bed700", top: "100px",
        // HEIGTH E O TOP DEVEM SER IGUAIS
        if(this.blocosCfg && agenda.tipo == "BLOQUEADO"){
            for (let i = 0; i < this.blocosCfg.length; i++) {
                const element = this.blocosCfg[i];

                if( element && element.style && agenda.style && agenda.style.height && element.style.height ){
                    let posicaoAgenda = parseInt(agenda.style.height.replace('px', ''));
                    let posicaoBloco = parseInt(element.style.height.replace('px', ''));

                    if( ( Math.abs(posicaoBloco - posicaoAgenda) < 20 ) &&
                        (element.style.top == agenda.style.top)
                      ){
                        agenda['recorrenciaModeloConfiguracao'] = element.dado.recorrencia;
                        console.warn("Encontrado bloco de configuracao");
                        console.log(element);
                        break;
                    }
                }
                
                
            }
        }
        if ( this.onAgendaClick ) {
            this.onAgendaClick(agenda);
        }
    }

    clicaBloco(ev, blocoCfg) {
        this.droppedBloco = blocoCfg;
        
        if (this.novoBloco) {
            this.novoBloco = null;
            return;
        }

        var inicioMinute = ev.layerY / this.zoom;

        let novaAgenda = {
            novoInicio: moment(`${blocoCfg.dado.dataInicio} ${blocoCfg.dado.horaInicio}`, this.formatosDeDatas.dataHoraIdFormato),
            novoFim: moment(`${blocoCfg.dado.dataFim} ${blocoCfg.dado.horaFim}`, this.formatosDeDatas.dataHoraIdFormato),
            dado: blocoCfg
        };

        if (this.onBlocoClick) {
            this.onBlocoClick(novaAgenda);
        }
    }

    removeBloco(blocoCfg) {
        
        if (this.onBlocoRemove) {
            this.onBlocoRemove(blocoCfg.dado, blocoCfg);
        }
    }

    configuracaoMouseDown(ev, blocoCfg) {

        if (ev.button != 0 || blocoCfg.bloqueado) {
            return;
        }

        this.mousePressionado = true;

        /*let posY = ev.pageY - (ev.pageY % 10);*/
        var fimMinute = ev.pageY / this.zoom;
        let posY = fimMinute - (fimMinute % 10);
        let posX = ev.pageX - ev.layerX;


        var inicioMinute = ev.layerY / this.zoom;
        var minutos = inicioMinute - (inicioMinute % 10);
        //let minutos = ev.layerY - (ev.layerY % 10);


        let novoInicio;

        if (blocoCfg && blocoCfg.dado && blocoCfg.dado.atendimentoTipo) {
            novoInicio = moment(`${blocoCfg.novaDataInicio} ${blocoCfg.dado.horaInicio}`, this.formatosDeDatas.dataHoraFormato);
        } else {
            novoInicio = moment(`${blocoCfg.novaDataInicio} ${blocoCfg.dado.horaInicio}`, this.formatosDeDatas.dataHoraFormato).add(minutos, 'minute');
        }

        this.novaAgenda = new Bloco({
            id: `${ev.pageX}-${posY}`,
            cfg: blocoCfg.dado,
            novoInicio: novoInicio,
            inicioTarget: ev.currentTarget,
            inicioPos: {
                y: posY,
                x: posX
            }
        });
    }

    configuracaoMouseMove(ev, blocoCfg) {

        if (ev.button != 0 || blocoCfg.bloqueado) {
            return;
        }
    }

    configuracaoMouseLeave() {
        // $('[data-toggle="tooltip"]').tooltip('hide');
    }

    horarioMouseDown(ev) {
        if (!this.habilitaSelecaoHorario || ev.button != 0) {
            return;
        }

        this.mousePressionado = true;
        
        let posY = ev.pageY - (ev.pageY % 10);
        let posX = ev.pageX - ev.layerX;

        let minutos = ev.layerY / this.zoom - ((ev.layerY / this.zoom) % 10);
        let novoInicio = moment(ev.currentTarget.id, 'hhYYYY-MM-DD').add(minutos, 'minute');
        
        this.novoBloco = new Bloco({
            id: `${ev.pageX}-${posY}`,
            novoInicio: novoInicio,
            inicioTarget: ev.currentTarget,
            inicioPos: {
                y: posY,
                x: posX
            }
        });
    }

    agendaMouseOver() {
        if (!this.mousePressionado) {
            return;
        }
    }
    agendaMouseMove() {
        if (!this.mousePressionado) {
            return;
        }
    }

    messagePopover = "";
    abrePopover(evento, id, agenda){
        if( !agenda.bloqueado ){

            let inicio = this.fnPegaHoraInicial ? this.fnPegaHoraInicial(agenda).format('HH:mm') : moment(agenda.agendamento, 'DD/MM/YYYY HH:mm:ss').format('HH:mm');
            let nome = agenda.paciente ? agenda.paciente.nome : agenda.nome;
            let tipo = agenda.tipo ? agenda.tipo.descricao : '';
            let telefone = agenda.telefone || '';
            let idade = agenda.paciente ? agenda.paciente.idade : ''
            let operadora = agenda.operadora ? agenda.operadora.nome : ''
            let observacao = agenda.observacao ? agenda.observacao : ''

            if (operadora == "PARTICULAR") {
                operadora += `<br><b>VALOR:</b> R$ ${(agenda.valor).toFixed(2)}`;
            }

            //VALIDA MASCARA TELEFONE
            telefone=telefone.replace(/\D/g,"").replace(/^(\d{2})(\d)/g,"($1) $2").replace(/(\d)(\d{4})$/,"$1-$2");

            this.messagePopover = ` <div class="popover popover-agenda" data-animation="false" role="tooltip">
                                        <div class="arrow"></div>
                                        <h3 class="popover-header">Paciente</h3>
                                        <div class="popover-body">
                                            <label><b>HORA:</b> ${inicio}</label><br>
                                            <label><b>TIPO:</b> ${tipo.toUpperCase()}</label>
                                            <label><b>NOME:</b> ${nome}</label>
                                            <label><b>TELEFONE:</b> ${telefone}</label>
                                            <label><b>IDADE:</b> ${idade}</label>
                                            <b>OPERADORA:</b> ${operadora}<br>
                                            <b>OBS.:</b> ${observacao}
                                        </div>
                                    </div>`;

            this.somePopover();

            $('#'+id).popover({
                trigger: 'hover focus',
                placement:'left',
                template: this.messagePopover
            });

            $('#'+id).popover('toggle')
        }
    }

    somePopover(){
        $('.popover-agenda').popover('dispose');
    }

    agendaMouseUp(ev) {
        
        if (!this.mousePressionado || ev.button != 0) {
            return;
        }

        //    Se tiver desenhando bloco
        if (this.novoBloco) {
            let path = ev.path || (ev.composedPath && ev.composedPath());

            path = path || [ev.target];
            if (path) {
                let celHorario = path.filter((e) => { 
                    if (!e.classList || !e.classList.value)
                        return;

                    return e.classList.value.indexOf('cel-horario') !== -1;
                })[0];

                if (celHorario) {
                    let minutos = ev.layerY  / this.zoom - ((ev.layerY  / this.zoom) % 10);
                    let novoFim = moment(celHorario.id, 'hhYYYY-MM-DD').add(minutos, 'minute');
                    let posY = ev.pageY - (ev.pageY % 10);
                    let posX = ev.pageX - ev.layerX;

                    novoFim.add(10, 'minute');
                    posY += 10;

                    this.novoBloco.novoFim = novoFim;
                    this.novoBloco.fimPos = {
                        y: posY,
                        x: posX
                    };
                    this.novoBloco.fimTarget = celHorario;

                    this.desenhaBloco({
                        bloco: this.novoBloco,
                        ev: ev.currentTarget,
                        draggable: false,
                        width: this.novoBloco.inicioPos.width,
                        start: {
                            posY: this.novoBloco.inicioPos.y,
                            posX: this.novoBloco.inicioPos.x
                        },
                        end: {
                            posY: this.novoBloco.fimPos.y,
                            posX: this.novoBloco.fimPos.x
                        },
                    });
                    if (this.onCreateBloco) {
                        let promiseCreateBloco = this.onCreateBloco(this.novoBloco);

                        promiseCreateBloco.then(() => {
                        }, () => {
                            //console.warn(result);
                        });
                    }
                }
            } else {
                console.warn('Path Not supported');
            }

        }
        //    Se tiver desenhando agenda
        if (this.novaAgenda) {

            let path = ev.path || (ev.composedPath && ev.composedPath());

            path = path || [ev.target];

            if (path) {
                let celConfiguracao = path.filter((e) => { 
                    if (!e.classList || !e.classList.value)
                        return;

                    return e.classList.value.indexOf('bloco-cfg') !== -1;
                })[0];

                if (celConfiguracao) {
                    let minutos = ev.layerY / this.zoom - ((ev.layerY / this.zoom) % 10);
                    let dataInicio = this.novaAgenda.novoInicio.format(this.formatosDeDatas.dataFormato);
                    //let horaInicio = this.novaAgenda.novoInicio.format(this.formatosDeDatas.horaFormato);
                    let novoFim = moment(`${dataInicio} ${this.novaAgenda.cfg.horaInicio}`, this.formatosDeDatas.dataHoraFormato).add(minutos, 'minute');
                    let posX = ev.pageX - ev.layerX;

                    let duration = moment.duration(novoFim.diff(this.novaAgenda.novoInicio));
                    let posY = duration.asMinutes();

                    if (novoFim.isSame(this.novaAgenda.novoInicio)) {
                        novoFim.add(10, 'minute');
                        posY += 10;
                    }

                    this.novaAgenda.novoFim = novoFim;
                    this.novaAgenda.fimPos = {
                        y: posY,
                        x: posX
                    };
                    this.novaAgenda.fimTarget = celConfiguracao;

                    this.desenhaAgenda({
                        bloco: this.novaAgenda,
                        ev: celConfiguracao,
                        draggable: false,
                        width: celConfiguracao.offsetWidth,
                        start: {
                            posY: this.novaAgenda.inicioPos.y,
                            posX: this.novaAgenda.inicioPos.x
                        },
                        end: {
                            posY: this.novaAgenda.fimPos.y,
                            posX: this.novaAgenda.fimPos.x
                        },
                    });
                    if (this.onCreateAgenda) {
                        let promiseCreateBloco = this.onCreateAgenda(this.novaAgenda);

                        if (promiseCreateBloco && promiseCreateBloco.then){
                            promiseCreateBloco.then(() => {
                            }, () => {
                                //console.warn(result);
                            });
                        }
                    }
                }
            } else {
                console.warn('Path Not supported');
            }

        }

        //    Reinicia variaveis
        this.mousePressionado = false;
        this.novaAgenda = null;
    }

    contextmenuValida(acao, agenda) {

        if (acao.fnValida) {
            return acao.fnValida(agenda);
        }

        return true;
    }

    contextmenuClickBloco(acao, agenda) {
        if (acao.fn){
            acao.fn(agenda);
            this.escondeContextMenu();
        }
    }

    contextmenuClick(acao, agenda) {console.log(acao);console.log(agenda)
        if (acao.fn){
            acao.fn(agenda);
            this.escondeContextMenu();
        }
    }

    abreContextMenuColetivo(ev, atendimento) {
        ev.preventDefault();

        if (atendimento.status && atendimento.status == 'BLOQUEADO') {
            return;
        }

        var bounds = ev.currentTarget.getBoundingClientRect();

        $(`.menu-context.${atendimento.id}`).show();
        $(`.menu-context.${atendimento.id}`).css({"top": bounds.top, "left": bounds.left});
    }

    abreContextMenuBloco(ev, atendimento, bBloco = false) {
        ev.preventDefault();
        // this.cdr.detach();

        if (atendimento.status && atendimento.status == 'BLOQUEADO' && bBloco == false) {
            return;
        }

        var a = document.querySelector('.calendar-header');
        var offsetLeft = a.getBoundingClientRect().left;

        $(ev.target).closest('.parent-bloco').find('.menu-context').show();
        $(ev.target).closest('.parent-bloco').find('.menu-context').css({"top": ev.pageY - this.offsetTop - 10, "left": ev.clientX - offsetLeft -  10});

        this.menuAberto = true;
    }

    menuAberto = false;
    abreContextMenu(ev, atendimento, bBloco = false) {
        ev.preventDefault();
        // this.cdr.detach();

        if (atendimento.status && atendimento.status == 'BLOQUEADO' && bBloco == false) {
            return;
        }
        
        var a = document.querySelector('.calendar-header');
        var offsetLeft = a.getBoundingClientRect().left;

        if( atendimento && atendimento.style ){
            $(ev.target).closest('.agenda-bloco').find('.menu-context').show();     //ev.pageY
            $(ev.target).closest('.agenda-bloco').find('.menu-context').css({"top": atendimento.style.top.replace("px","") - this.offsetTop - 10, "left": ev.clientX - offsetLeft - 60});
    
            this.menuAberto = true;

        }else{
            this.detalhaAgendaColetiva(atendimento);
        }
    }

    escondeContextMenu(){
        this.cdr.reattach();
        $('.menu-context').hide();
        this.menuAberto = false;
    }
    
    @HostListener('window:resize', ['$event'])
    onResize(event) {
        event.target.innerWidth;
        this.rebuild(false);
    }

    @HostListener('click', ['$event'])
    onClick(event) {
        this.somePopover();
    }

    //  ======================================
    //          Agenda Metodos
    //  ======================================
    inicializaAgenda() {
    }

    scrollToNow() {
        setTimeout(() => {
            //  Scroll para a hora atual;
            document.getElementById(moment().format('HH')).className += ' hora-atual';
            $(".grid-calendario").scrollTop(parseInt(moment().format('HH')) * (60 * this.zoom) );
        }, 1000);
    }

    formatTitle (agenda) {
        let inicio = this.fnPegaHoraInicial ? this.fnPegaHoraInicial(agenda).format('HH:mm') : moment(agenda.agendamento, 'DD/MM/YYYY HH:mm:ss').format('HH:mm');
        let nome = agenda.paciente ? agenda.paciente.nome : agenda.nome;
        let tipo = agenda.tipo ? agenda.tipo.descricao : '';
        let observacao = agenda.observacao ? `- ${agenda.observacao}` : '';

        return !agenda.bloqueado ?  `${inicio} - ${nome} - ${tipo}` : (agenda.bloqueio ? `[${agenda.bloqueio.descricao}] ${observacao}` : '');
    }

    formatTitleGrouped (agenda) {
        let inicio = this.fnPegaHoraInicial ? this.fnPegaHoraInicial(agenda[0]).format('HH:mm') : moment(agenda[0].agendamento, 'DD/MM/YYYY HH:mm:ss').format('HH:mm');
        let qtdMaximo = ''
        if( agenda && agenda[0] && agenda[0].configuracoesHorario && agenda[0].configuracoesHorario.length ){
            // if( agenda[0].configuracoesHorario[0]['configuraHorario']['maxConcorrente'] ){
            //     qtdMaximo = `/${agenda[0].configuracoesHorario[0]['configuraHorario']['maxConcorrente']}`
            // }
            // `/${agenda[0].configuracoesHorario.maxConcorrente}`
        }
        let nome = `${agenda.length}${qtdMaximo} Paciente${agenda.length > 1 ? 's' : ''}`;
        

        return `${inicio} - ${nome}`;
    }

    rebuild(bScrollToNow = true) {
        if( !this.menuAberto ){
            this.inicializaBlocos();

            // this.somePopover();
            
            if (bScrollToNow)
                this.scrollToNow();
        }
    }

    limpaBlocos() {
        this.blocosCfg = [];
        let elements = document.querySelectorAll('.bloco');
        if (elements){
            for(let i = 0; i < elements.length; i++){
                elements[i].parentNode.removeChild(elements[i]);
            }
        }
    }

    limpaAgendas() {
        this.agendas = Object.assign([], []);

        let elements = document.querySelectorAll('.agenda');
        
        if (elements){
            for(let i = 0; i < elements.length; i++){
                elements[i].parentNode.removeChild(elements[i]);
            }
        }
    }

    removeBlocoId(id) {
        let el = document.getElementById(id);
        if (el)
            el.parentNode.removeChild(el);
    }

    moveToDate(bloco, novaData) {
        let el = document.getElementById(bloco.id);
        
        if (el) {
            let minutos = parseInt(novaData.format('mm'));
            el.style.top = document.getElementById(novaData.format('hhYYYY-MM-DD')).getBoundingClientRect().top + window.scrollY - this.offsetTop + minutos +'px';
            el.style.left = document.getElementById(novaData.format('hhYYYY-MM-DD')).offsetLeft +'px';
        }
    }

    trocaTipoCalendario(tipo) {
        let data = [];
        this.calendarioOpt.visao = tipo;
        Sessao.setPreferenciasUsuario('visao', tipo);

        switch (tipo) {
            case "day":
                // code...
                data = Object.assign([], [this.datas[0]]);
                this.setDatasSelecionadas.emit(data);
                break;

            case "week":
                // code...
                let primeiroDia = moment(this.datas[0]).startOf('week');

                for(let i = 0; i < 7; i++) {
                    data.push(primeiroDia);
                    primeiroDia = moment(primeiroDia).add(1, 'day');
                }
                this.datas = data;//this.datas.map(data => moment(data)[tipo](1, this.calendarioOpt.visao));
                this.setDatasSelecionadas.emit(this.datas);
                break;

            case "month":
                // code...

                break;

            case "list":
                // code...
                data = Object.assign([], [this.datas[0]]);
                this.setDatasSelecionadas.emit(data);
                break;

            default:
                // code...
                break;
        }
    }

    bMostra = false;
    mostraStatus(mostra){
        this.bMostra = mostra;
    }

    groupBy(xs, key) {
        return xs.reduce(function(rv, x) {
            (rv[x[key]] = rv[x[key]] || []).push(x);
            return rv;
        }, {});
    }

    totalCapacidade;
    quantidadeOcupada;
    detalhaAgendaColetiva(agenda) {
        this.agendasColetivas = agenda.objAgendados;

        let modeloAgendaColetiva = this.agendasColetivas[0]
        let idAgendamentoColetivo = modeloAgendaColetiva['configuracoesHorario'][0]['configuraHorario']['agendamentoColetivo']['id'];
        let idConfiguraHorario = modeloAgendaColetiva['configuracoesHorario'][0]['configuraHorario']['id'];
        let dataReferencia = moment( modeloAgendaColetiva['agendamento'], this.formatosDeDatas.dataHoraSegundoFormato ).format( this.formatosDeDatas.dataFormato );
        let unidadeAtendimento = modeloAgendaColetiva['unidadeAtendimento']['id'];
        let params = {
            agendamentoColetivoId: idAgendamentoColetivo,
            configuraHorarioId: idConfiguraHorario,
            unidadeAtendimentoId: unidadeAtendimento,
            data: dataReferencia
        }

        Observable.fromPromise(this.servicePrestador.getCapacidadeAgendaColetiva( params ))
            .finally(
                () => {
                    this.modal = this.modalService.open(NgbdModalContent, {size: 'lg'});
                    this.modal.componentInstance.modalHeader = 'Consulta Coletiva';
                    this.modal.componentInstance.custom_lg_modal = true;
                    this.modal.componentInstance.templateRefBody = this.consultaColetivaModal;
                    this.modal.componentInstance.templateBotoes = this.consultaColetivaModalBotoes;

                    this.modal.result.then(
                        () => {console.log('Fechado')},
                        () => {console.log('Fechado')}
                    );
                }
            )
            .subscribe(
                (retorno:any) => {
                    this.totalCapacidade = retorno.capacidadeTotal;
                    this.quantidadeOcupada = retorno.capacidadeAtual; 
                    this.cdr.markForCheck();
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                },
            )

        
    }

    @Output() criaNovaColetiva = new EventEmitter();
    novoAtendimentoColetivo(){
        let objUltimoAgendamentoColetivo = this.agendasColetivas[0];

        let horaInicio;
        if( objUltimoAgendamentoColetivo.configuracoesHorario && 
            objUltimoAgendamentoColetivo.configuracoesHorario.length && 
            objUltimoAgendamentoColetivo.configuracoesHorario[0]['configuraHorario']['horaInicio'] 
        ){
            horaInicio = objUltimoAgendamentoColetivo.configuracoesHorario[0]['configuraHorario']['horaInicio']
        }else{
            horaInicio = moment( objUltimoAgendamentoColetivo.agendamento, this.formatosDeDatas.dataHoraSegundoFormato ).format(this.formatosDeDatas.horaFormato)
        }
        let configuracaoAgenda = {
            novoInicio: moment( objUltimoAgendamentoColetivo.agendamento, this.formatosDeDatas.dataHoraSegundoFormato ),
            cfg: {
                horaInicio: horaInicio
            },
            tipo:   objUltimoAgendamentoColetivo['configuracoesHorario'] && objUltimoAgendamentoColetivo['configuracoesHorario'].length && objUltimoAgendamentoColetivo['configuracoesHorario'][0].configuraHorario.atendimentoTipo 
                    ? objUltimoAgendamentoColetivo['configuracoesHorario'][0].configuraHorario.atendimentoTipo 
                    : objUltimoAgendamentoColetivo.tipo,
            configuracoesHorario: objUltimoAgendamentoColetivo.configuracoesHorario
        }
        this.criaNovaColetiva.emit( configuracaoAgenda );
    }

    inicializaBlocos() {

        let esse = this;

        this.loading = true;

        let agendasPromise;
        let possuiPromiseAgenda = true;
        if( !this.doisTiposAgendamento ){
            if( esse.fnInicializaAgendas ){
                agendasPromise = esse.fnInicializaAgendas();
            }else{
                possuiPromiseAgenda = false;
            }
        }else{
            agendasPromise = esse.fnInicializaAgendas();
        }

        let blocosPromise = esse.fnInicializaBlocos();

        if( !possuiPromiseAgenda ) {
            this.inicializaCfg(blocosPromise);
            return
        }
        agendasPromise.then(agendas => {

            let objAgendas:any = this.validaAgendas(agendas);
            this.inicializaCfg(blocosPromise, objAgendas.aDisponiveis, objAgendas.oAgendaAgrupado, objAgendas.aBloqueios);

        }, ( err ) => {
            return err;
        });

    }

    validaAgendas(agendas){
        let objAgendas = new Object();
        let tempAgendas = agendas.filter((agenda) => {
                
            let dataInicio = this.fnPegaHoraInicial ? this.fnPegaHoraInicial(agenda) : moment(agenda.agendamento, this.formatosDeDatas.dataHoraSegundoFormato);
            let id = `${dataInicio.format(this.formatosDeDatas.hora)}${dataInicio.format(this.formatosDeDatas.htmlDataFormato)}`;
            
            return document.getElementById(id);
        }).slice();

        tempAgendas.map((agenda) => {
            let dataInicio = this.fnPegaHoraInicial ? this.fnPegaHoraInicial(agenda) : moment(agenda.agendamento, this.formatosDeDatas.dataHoraSegundoFormato);
            let dataFim = this.fnPegaHoraFinal ? this.fnPegaHoraFinal(agenda) : moment(agenda.agendamentoFim, this.formatosDeDatas.dataHoraSegundoFormato);

            // TODO Validar tempo total de atendimentos
            if ( agenda.configuracoesHorario && agenda.configuracoesHorario.length && agenda.configuracoesHorario[0].configuraHorario.tipo == 'COLETIVA' ) {//É AGENDAMETNO COLETIVO?
                let fim = agenda.configuracoesHorario[0].configuraHorario.horaFim;
                dataFim.set('hour', parseInt(fim.split(':')[0]));
                dataFim.set('minute', parseInt(fim.split(':')[1]));

                let inicio = agenda.configuracoesHorario[0].configuraHorario.horaInicio;
                dataInicio.set('hour', parseInt(inicio.split(':')[0]));
                dataInicio.set('minute', parseInt(inicio.split(':')[1]));
            }else if (agenda.horaFim) {
                dataFim.set('hour', parseInt(agenda.horaFim.split(':')[0]));
                dataFim.set('minute', parseInt(agenda.horaFim.split(':')[1]));
            } else if (!dataFim) {
                dataFim.add(10, 'minute');
            }

            let id = `${dataInicio.format(this.formatosDeDatas.hora)}${dataInicio.format(this.formatosDeDatas.htmlDataFormato)}`;
            let ev = document.getElementById(id);

            var duration = moment.duration(dataFim.diff(dataInicio));

            let posYEnd = duration.asMinutes();
            let end = (posYEnd * this.zoom) || 10;

            if (!ev) {
                return;
            }

            let posMinuto = parseInt(dataInicio.format(this.formatosDeDatas.minuto));

            let posYStart = ev.offsetTop + (posMinuto * this.zoom);

            let encaixeSub = agenda.encaixe ? 20 : 0;

            agenda.style = {
                // bgColor: '#fcc',
                top: `${posYStart}px`,
                left: `${ev.offsetLeft - 2 + encaixeSub}px`,
                width: `${ev.offsetWidth - 2 - encaixeSub}px`,
                height: `${end}px`
            };

            if (this.calendarioOpt.visao != 'week') {
                agenda.style['left'] = agenda.encaixe ? `50%` : `${ev.offsetLeft}px`
                agenda.style['width'] = agenda.encaixe ? `50%` : `${ev.offsetWidth - 2}px`
            }
            if( this.agrupaAgendamentos ){
                if( agenda.configuracoesHorario && 
                    agenda.configuracoesHorario.length && 
                    agenda.configuracoesHorario[0].configuraHorario && 
                    agenda.configuracoesHorario[0].configuraHorario.atendimentoTipo
                ){
                    agenda.style['bgColor'] = this.validaCor( agenda.configuracoesHorario[0].configuraHorario )
                }
            }
            
            return agenda;
        });

        let aBloqueios = tempAgendas.filter((bloq)=>{return bloq.tipo == "BLOQUEADO"});
        let aDisponiveis = tempAgendas.filter((bloq)=>{
            return bloq.tipo != "BLOQUEADO" 
        });
        let oDisponiveis = this.groupBy(aDisponiveis, 'agendamento');
        let oAgendaAgrupado = Object.keys(oDisponiveis).map((data)=>{                
            let agrupado = {
                "agendamento": data,
                "objAgendados": oDisponiveis[data]
            };

            return agrupado;
        });

        oAgendaAgrupado = oAgendaAgrupado.filter((agrupado) => {
            return agrupado.objAgendados.length
        });

        if( !this.agrupaAgendamentos ){
            aDisponiveis = aDisponiveis.filter(
                (disponivel) => {
                    return ( oDisponiveis[disponivel.agendamento].length == 1 )
                }
            )
        }

        // BLOCO VALIDA DESMARCADOS
        if( this.bMostra ){
            let posDelete = [];
            oAgendaAgrupado.forEach(
                (objAgendado, INDEX) => {
                    let desmarcados = [];
                    let normais = [];

                    for(let o=0; o<objAgendado.objAgendados.length; o++ ){
                        let agenda = objAgendado.objAgendados[o];
                        if( agenda.status == "DESMARCADO" ){
                            desmarcados.push( agenda );
                        }else{
                            normais.push( agenda )
                        }
                    }
                    if( normais.length ){

                        if( desmarcados.length ){
                            if( normais.length == 1 ){
                                posDelete.push( INDEX );
                                oAgendaAgrupado[INDEX]['DELETE'] = true;
                                aDisponiveis.push( normais[0] );
                            }else if( normais.length > 1 && desmarcados.length > 1){
                            }else{
                            }
                        }else if( normais.length == 1 ) {
                        }

                    }else if( desmarcados.length ) {
                        posDelete.push( INDEX );
                        oAgendaAgrupado[INDEX]['DELETE'] = true;
                        aDisponiveis.push( desmarcados[ desmarcados.length-1 ] );
                    }
                }
            )

            oAgendaAgrupado = oAgendaAgrupado.filter(
                (objAgenda) => {
                    return !objAgenda['DELETE']
                }
            )
        }

        if( !this.agrupaAgendamentos ){
            // aDisponiveis = []
            oAgendaAgrupado = [];
        }

        objAgendas = {
            aDisponiveis: aDisponiveis,
            oAgendaAgrupado: oAgendaAgrupado,
            aBloqueios: aBloqueios
        }

        return objAgendas;
    }
    
    eAgrupado(agenda) {
        return agenda.objAgendados && this.agrupaAgendamentos;
    }

    validaDataList(agenda, hora) {
        agenda = agenda.split(" ")[1];
        agenda = agenda.slice(0,5);
        return agenda == hora;
    }

    validaHorarioList(agenda, hora) {
        agenda = agenda.split(":");
        return agenda[0] == hora;
    }

    validaBlocoAgenda(){
        // if( agenda.objAgendados && agenda.objAgendados.length ){
        //     agenda.objAgendados = agenda.objAgendados.filter(
        //         (agenda) => {
        //             return agenda.status != "DESMARCADO"
        //         }
        //     )

        //     // if( agenda.objAgendados && agenda.objAgendados.length ){
        //     //     this.agendas[pos] = agenda.objAgendados[0];
        //     // }
        //     return agenda.objAgendados[0];
        // }
    }

    inicializaCfg(blocosPromise, aDisponiveis = undefined, oAgendaAgrupado = undefined, aBloqueios = undefined){
        blocosPromise.then(blocos => {

            this.blocosCfg = [];

            let i = 0;
            let tempBlocoCfg = [];
            while(i < blocos.length) {
                let bloco = blocos[i];

                bloco.dataInicio = moment(bloco.dataInicio);

                let id = `${bloco.dataInicio.format(this.formatosDeDatas.hora)}${bloco.dataInicio.format(this.formatosDeDatas.htmlDataFormato)}`;
                let ev = document.getElementById(id);

                if (ev) {
                    let posMinuto = parseInt(moment(bloco.inicio).format(this.formatosDeDatas.minuto)); //posMinuto = posMinuto - (posMinuto % 10);
                    let posYStart = (ev.offsetTop + (posMinuto * this.zoom)); //let posYStart = ev.getBoundingClientRect().top + window.scrollY + posMinuto;
                    let posX = ev.getBoundingClientRect().left;
                    var duration = moment.duration(moment(bloco.fim).diff(moment(bloco.inicio)));
                    let posYEnd = duration.asMinutes(); //posYEnd = (posYEnd - (posYEnd % 10));
                    let end = (posYEnd * this.zoom) || 10;
                    let novoBloco = new Bloco({
                        id: `${ev.offsetLeft}-${posYStart}`,
                        pageStartY: posYStart,
                        novoInicio: bloco.dataInicio
                    });

                    tempBlocoCfg.push(
                        {
                            dado: Object.assign({}, bloco.dado),
                            novaDataInicio: moment(bloco.inicio).format(this.formatosDeDatas.dataFormato),
                            novaDataFim: moment(bloco.fim).format(this.formatosDeDatas.dataFormato),
                            bloco: novoBloco,
                            draggable: `${bloco.draggable}`,
                            grupo: bloco.grupo,
                            bloqueado: bloco.bloqueado,
                            ev: ev,
                            start: {
                                posY: posYStart,
                                posX: posX
                            }, 
                            end: {
                                posY: posYEnd
                            }, 
                            style: {
                                width: `${ev.offsetWidth - 2}px`, 
                                height: `${end}px`,
                                bgColor:this.validaCor(bloco.dado), //default #575287
                                top: `${posYStart}px`,
                                left: `${ev.offsetLeft}px`
                            }
                        }
                    );
                }
                i++;
            };
            this.limpaBlocos();

            if( !this.agrupaAgendamentos ){
                if( aDisponiveis && aBloqueios && oAgendaAgrupado ){
                    this.agendas = aDisponiveis.concat(oAgendaAgrupado, aBloqueios);//.slice(); )
                }
            }else{
                // AGENDAMENTO COLETIVO
                let agendamentosAgrupados = [];
                blocos.forEach(
                    (bloco) => {
                        if( bloco.atendimentos && bloco.atendimentos.length ){

                            let objAgendas:any = this.validaAgendas(bloco.atendimentos);

                            if(objAgendas.aDisponiveis && objAgendas.aDisponiveis.length){
                                let atendimentoModelo = objAgendas.aDisponiveis[0];
                                
                                let dataAtendimentos = moment( atendimentoModelo.agendamento, this.formatosDeDatas.dataHoraSegundoFormato ).format( this.formatosDeDatas.dataFormato );
                                let objAgendasAgrupado = {
                                    "agendamento": dataAtendimentos,
                                    "objAgendados": objAgendas.aDisponiveis
                                };

                                agendamentosAgrupados.push( objAgendasAgrupado )

                            }else{
                                agendamentosAgrupados = []
                            }
                        }
                    }
                )

                this.agendas = aBloqueios.concat(agendamentosAgrupados);//.slice(); )
            }
            this.cdr.markForCheck();

            this.blocosCfg = tempBlocoCfg;
            this.cdr.markForCheck();

            this.loading = false;
        }, () => {
            this.loading = false;
        });
    }

    validaCor(bloco){
        try {
            if ( bloco['atendimentoTipo'] ) {
                return bloco['atendimentoTipo']["cor"];
            } else if( bloco['grupo'] ) {
                return bloco['grupo']["tema"]["cor"];
            } else if( bloco['tema'] ) {
                return bloco["tema"]["cor"];
            } else {
                return `#575287`;
            }
        } catch(e) {
            return `#575287`;
        }
    }

    mostraIconeCheck(agenda){
        return agenda.tipo != 'BLOQUEADO';
    }

    validaIconeCheck(agenda){
        return ( agenda.confirmacao ) ? 'done_all' : 'done';
    }

    validaTitleCheck(agenda){
        return ( agenda.confirmacao ) ? 'Atendimento Confirmado' : 'Não foi confirmado';
    }
    
    desenhaBloco(blocoCfg) {
        let end = blocoCfg && blocoCfg.end && blocoCfg.end.posY ? blocoCfg.end.posY - blocoCfg.start.posY : 10;
        let html = ``;
        let style = `
            position: absolute; 
            width: ${blocoCfg.bloco.inicioTarget.offsetWidth - 2}px; 
            height: ${end}px; 
            background-color: #575287; 
            box-shadow: 1px 3px 5px #171435;
            border-radius: 5px;
            color: white; 
            top: ${blocoCfg.start.posY}px; 
            left: ${blocoCfg.start.posX}px;
            cursor: pointer;
        `;
        let el = this.htmlToElement(`
            <div 
                id='${blocoCfg.bloco.id}' 
                class='bloco' 
                style='${style}'
                draggable="${blocoCfg.draggable}"
            >
                ${html}
            </div>
        `);

        document.body.appendChild(el);
    }

    desenhaAgenda(blocoCfg) {
        let end = blocoCfg && blocoCfg.end && blocoCfg.end.posY || 10;
        let html = ``;
        let style = `
            position: absolute; 
            width: ${blocoCfg.ev.offsetWidth - 2}px; 
            height: ${end}px; 
            background-color: #171435; 
            box-shadow: 1px 3px 5px #171435;
            border-radius: 5px;
            border: thin solid #000;
            color: white; 
            top: ${blocoCfg.start.posY}px; 
            left: ${blocoCfg.start.posX}px;
            cursor: pointer;
        `;
        let el = this.htmlToElement(`
            <div 
                id='${blocoCfg.bloco.id}' 
                class='bloco' 
                style='${style}'
                draggable="${blocoCfg.draggable}"
            >
                ${html}
            </div>
        `);

        document.body.appendChild(el);
    }

    scrollPage(){
        let esse = this;

        $(".grid-calendario").scroll(() => {
            let height = $(".grid-calendario").scrollTop();

            this.somePopover();

            if( height > 102 && esse.estatica){
                let elemStatic = $('.static-bar');
                if( elemStatic.length ){
                    esse.fixa = true;
                }

            }else if( height < 102 && esse.fixa ) {
                let elemFixed = $('.fixed-bar');
                if( elemFixed.length ){
                    esse.fixa = false;
                }
            }
        });
    }
}

export class FormatosData {
    diaDaSemana = 'ddd';
    ano = 'YYYY';
    diaDaSemanaCompleto = 'dddd';
    htmlDataFormato = 'YYYY-MM-DD';
    dataFormato = 'DD/MM/YYYY';
    hora = 'HH';
    minuto = 'mm';
    horaFormato = 'HH:mm';
    dataHoraFormato = 'DD/MM/YYYY HH:mm';
    dataHoraSegundoFormato = 'DD/MM/YYYY HH:mm:ss';
    dataHoraIdFormato = 'DD-MM-YYYY-T-HH-mm';
    dataSelecionada = 'MMM YYYY';
    dataMesAno = 'MMMM YYYY';
    dateJSFormato = 'YYYY-MM-DDTHH:MM';
}

class CalendarioOpt {
    diaAtual;
    visao = 'day';

    formato = new FormatosData()

    constructor(obj) {
        if (!obj)
            obj = {};

        this.diaAtual = obj.diaAtual || moment();
        this.visao = obj.visao || this.visao;
    }
}

class Bloco {
    id;
    cfg;
    pageStartY;
    novoInicio;
    inicioPos;
    novoFim;
    fimPos;
    fimTarget;
    inicioTarget;
    agendaInstancia = true;

    constructor(obj) {
        if (!obj)
            obj = {}

        this.id = obj.id;
        this.cfg = obj.cfg;
        this.pageStartY = obj.pageStartY;
        this.novoInicio = obj.novoInicio;
        this.inicioPos = obj.inicioPos;
        this.novoFim = obj.novoFim;
        this.fimPos = obj.fimPos;
        this.fimTarget = obj.fimTarget;
        this.inicioTarget = obj.inicioTarget;
    }
}



