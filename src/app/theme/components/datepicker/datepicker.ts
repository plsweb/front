import { Component, ViewChild, Input, Output, EventEmitter, ElementRef, Renderer, OnInit, HostListener, OnChanges, Self } from '@angular/core';
import { ReturnStatement } from '@angular/compiler/src/output/output_ast';
import { ControlValueAccessor, NgModel } from '@angular/forms';

import { NgbdModalContent } from '../../../theme/components/modal/modal.component';
import { NgbModal, NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';

import { FormatosData } from '../agenda/agenda';

import * as jQuery from 'jquery';
import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';
moment.locale('pt-br');

@Component({
    selector: 'datepicker',
    templateUrl: './datepicker.html',
    styleUrls: ['./datepicker.scss'],
    host: {
        /*'(focus)': 'onFocus($event)',
        '(blur)': 'onBlur($event)'*/
    }
})
export class DatePicker implements OnInit, OnChanges {
    
    @Input() datas;
    @Input() habilitaMultiSelecao = false;
    @Input() inputForm = false;
    @Input() dataValor;
    @Input() semData = false;
    @Input() disabled = false;
    @Input() fnOnChange: Function;
    @Output() onSelect: EventEmitter<any> = new EventEmitter();
    @Output() setDatasSelecionadas: EventEmitter<any> = new EventEmitter();
    @Output() setInstancia: EventEmitter<any> = new EventEmitter();
    
    momentjs;

    //  Dados // Enums
    formatosDeDatas;
    diasDaSemana;
    semanas;

    //  variaveis de controle
    diaAtual;
    diasSelecionados;
    datepickerOpened;
    
    maxDiasSelecao = 7;
    mousePressionado;

    constructor(
        private toastr: ToastrService, 
    ) {
    }

    /*onFocus($event) {
        alert('onFocus');
    }

    onBlur($event) {
        alert('onFocus');
    }*/

    ngOnInit() {
        this.momentjs = moment;
        this.diasDaSemana = moment.weekdays();

        this.inicializaConfiguracoes();
        this.inicializaMiniCalendario();

        if (this.setInstancia) {
            this.setInstancia.emit({
                limpaCampo: this.limpaCampo.bind(this),
                fechaDatePicker: this.fechaDatePicker.bind(this),
                setValor: this.setValor.bind(this)
            });
        }
    }

    ngOnChanges(changes) {
        if (changes.datas && changes.datas.currentValue) {
            let bValido = true;
            if( changes.datas.currentValue && changes.datas.currentValue.length ){
                changes.datas.currentValue.forEach((data)=>{
                    if (!data.isValid()){
                        bValido = false;
                    }
                });
            }

            if (bValido){
                
                this.diasSelecionados = changes.datas.currentValue;
                
                if (this.diasSelecionados && this.diasSelecionados[0]) {
                    this.diaAtual = moment(this.diasSelecionados[0]);
                }
                
                this.inicializaMiniCalendario();
            }
            
        }
    }

    ngAfterViewInit() {
    }

    trackByFn(index, item) {
        return index;
    }



    //  ======================================
    //          Inicializa configurações
    //  ======================================
    inicializaConfiguracoes() {

        //  Inicia Dia atual com data de hoje
        if (!this.semData) {
            this.diaAtual = moment();
        }
        this.diasSelecionados = [moment()];

        this.formatosDeDatas = new FormatosData();

        if( !this.semData ){
            this.dataValor = ( this.dataValor ) ? moment( this.dataValor, this.formatosDeDatas.dataHoraSegundoFormato ).format(this.formatosDeDatas.dataFormato) : moment().format(this.formatosDeDatas.dataFormato);
        }
        sessionStorage.setItem('calendario-opt', JSON.stringify(this.formatosDeDatas));
    }


    setValor(data){
        this.dataValor = data[0].format(this.formatosDeDatas.dataFormato);
    }

    //  ======================================
    //          DatePicker HEADER
    //  ======================================
    periodoMesAno() {
        if (!this.diaAtual){
            return moment().format(this.formatosDeDatas.dataMesAno);
        }
        let sPeriodoMesAno = this.diaAtual.format(this.formatosDeDatas.dataMesAno);
        
        return sPeriodoMesAno;
    }

    
    abreDatePicker() {
        this.datepickerOpened = true;
    }

    fechaDatePicker() {
        this.datepickerOpened = false;
    }


    //  ======================================
    //          DatePicker Metodos
    //  ======================================

    limpaCampo() {
        this.diaAtual = null;
    }

    inicializaMiniCalendario() {

        //  Cria Dias;
        let aSemanas = [];

        //  Pega Primeiro dia do mes
        let dia = this.diaAtual || moment();
        let primeiroDiaDoMes = moment(dia).startOf('month');
        let ultimoDiaDoMes = moment(dia).endOf('month');
        
        let diaVisaoDatePicker = moment(primeiroDiaDoMes).subtract(primeiroDiaDoMes.weekday(), 'day');
        for(let i = 0; i < 6; i++) {
            let semana = [];

            for (let i = 0; i < 7; i++) {
                semana.push(moment(diaVisaoDatePicker.toDate()));

                diaVisaoDatePicker.add(1, 'day');
            }

            aSemanas.push(semana);
        }

        this.semanas = aSemanas;

        this.atualizaDatas();
    }

    atualizaDatas() {
        if (this.setDatasSelecionadas) {
            this.setDatasSelecionadas.emit(this.diasSelecionados);
        }
    }

    valorDigitado(elemento){
        let data = elemento.target.value;
        let dataMoment = moment(data, this.formatosDeDatas.dataFormato);
        if( !dataMoment.isValid() ){
            this.toastr.warning("Formato de data inválido");
            this.dataValor = moment().format( 'DD/MM/YYYY' );
            return;
        }
        if (this.fnOnChange) {
            this.dataValor = moment(data, this.formatosDeDatas.dataFormato).format( 'DD/MM/YYYY' );
            let dataRetorno = [ moment(data, this.formatosDeDatas.dataFormato) ];
            this.fnOnChange( dataRetorno );
        }
    }

    verificaSeDataNoMesAtual(data) {
        return this.diaAtual ? (this.diaAtual.format(this.formatosDeDatas.dataSelecionada) !== data.format(this.formatosDeDatas.dataSelecionada)) : false;
    }

    verificaSeDataEstaSelecionada(data) {
        var bEDataAtual = false;

        if (this.diasSelecionados.length > 1) {
            bEDataAtual = this.diasSelecionados.map((dia) => {
                return dia.format(this.formatosDeDatas.dataFormato);
            }).indexOf(data.format(this.formatosDeDatas.dataFormato)) !== -1;
        } else {
            bEDataAtual = this.diasSelecionados[0].format(this.formatosDeDatas.dataFormato) === data.format(this.formatosDeDatas.dataFormato);
        }

        return bEDataAtual;
    }



    //  ======================================
    //          DatePicker Eventos
    //  ======================================
    clicaAlterarMes(tipo) {
        this.diaAtual = moment(this.diaAtual)[tipo](1, "month");
        this.inicializaMiniCalendario();
    }

    mouseDown($event, dia) {
        let dias = [];

        this.mousePressionado = true;
        this.diaAtual = moment(dia);

        if (this.habilitaMultiSelecao && $event.ctrlKey && (this.diasSelecionados.length < this.maxDiasSelecao)) {
            this.diasSelecionados.push(moment(dia));
        } else {
            this.diasSelecionados = [moment(dia)];

            if (this.fnOnChange) {
                this.dataValor = this.diasSelecionados[0].format( 'DD/MM/YYYY' );
                this.fnOnChange(this.diasSelecionados);
            }
        }

        this.diasSelecionados = Object.assign([], this.diasSelecionados);
        this.inicializaMiniCalendario();
    }

    mouseOver($event, dia) {
        let esse = this;

        setTimeout(() => {
            if (esse.habilitaMultiSelecao && esse.mousePressionado && (esse.diasSelecionados.length <= esse.maxDiasSelecao)) {
                esse.diasSelecionados.push(moment(dia));
                esse.diasSelecionados = Object.assign([], esse.diasSelecionados);

                this.inicializaMiniCalendario();
            }
        }, 5);
    }

    mouseUp($event, dia) {
        this.mousePressionado = false;
        this.fechaDatePicker();
    }
}