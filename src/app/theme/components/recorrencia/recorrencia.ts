import { Component, ViewChild, Input, Output, ChangeDetectorRef, ChangeDetectionStrategy, EventEmitter, ElementRef, Renderer, OnInit, HostListener, OnChanges, Self } from '@angular/core';
import { ReturnStatement } from '@angular/compiler/src/output/output_ast';
import { ControlValueAccessor, NgModel } from '@angular/forms';

import { NgbdModalContent } from '../../../theme/components/modal/modal.component';
import { NgbModal, NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';

import { FormatosData } from '../../../theme/components/agenda/agenda';

import * as jQuery from 'jquery';
import * as moment from 'moment';
moment.locale('pt-br');

@Component({
    selector: 'recorrencia',
    templateUrl: './recorrencia.html',
    styleUrls: ['./recorrencia.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Recorrencia implements OnInit, OnChanges {
    el;
    momentjs;
    formatosDeDatas;
    objRecorrenciaDetalhada = new RecorrenciaDetalhada();
    @Input() obj;
    @Input() bloqueiaRecorrenciaForaDaConfiguracao;
    @Input() horaPorDia = false;
    @Input() habilitaDiaTodo = true;
    @Input() habilitaRecorrencia = true;
    @Input() habilitaTipoFrequencia = false;
    @Input() onDiaTodoChange: Function;
    @Input() podeEditar = true;

    @Input() fnRecorrenciaMostraBotao: Function;
    @Input() fnSalvaRecorrencia: Function;

    @Output() setObjRecorrencia: EventEmitter<any> = new EventEmitter();
    @Output() setRecorrenciaInstancia: EventEmitter<any> = new EventEmitter();
    // @Output() fnRecorrenciaSelectCheckbox: EventEmitter<any> = new EventEmitter();

    repetir;
    frequencia = [];
    diaTodo;
    diasDaSemana;
    qtdFrequencia;
    tipoFrequencia;
    diasSelecionados = new Object();
    
    constructor(private _elementRef : ElementRef, private cdr: ChangeDetectorRef) {
        
        this.formatosDeDatas = new FormatosData();
        this.momentjs = moment;
        this.el = _elementRef;
        this.repetir = false;
        this.frequencia;
        this.diaTodo = false;
        this.qtdFrequencia = 1;
        this.tipoFrequencia = 'week';
        this.diasDaSemana;
    }

    ngOnInit() {
    }

    ngOnChanges(changes) {
    }

    ngAfterViewInit() {
        setTimeout(()=>{
            if (!this.horaPorDia) {
                let frequencia =   (this.obj.frequencia || this.frequencia) || [];
                frequencia.sort( (left, right) => left - right );
                this.frequencia = frequencia;
            }
            this.fnRefreshComponent();
        },100);
    }

    fnRefreshComponent() {
        this.repetir = this.horaPorDia || this.obj.repetir;

        this.frequencia = this.frequencia || [];
        this.diaTodo = this.obj.diaTodo;

        this.setRecorrenciaInstancia.emit({
            set: this.set.bind(this),
            get: this.get.bind(this),
            atualizaRecorrenciaDia: this.atualizaRecorrenciaDia.bind(this)
        });

        this.diasDaSemana = moment.weekdays().map((diaDaSemana, diaValor) => {
            
            let obj =  {
                diaDaSemana: diaDaSemana,
                dia: diaDaSemana.substr(0,3),
                ativo: (this.frequencia.indexOf(diaValor) != -1),
                valor: diaValor
            }

            if( this.obj.frequencia )
                obj['desativado'] = ( this.obj.frequencia[diaValor] ) ? this.obj.frequencia[diaValor]['desativado'] : false;

            return obj;
        });
    }

    set(opt, valor) {
        if (this[opt]) {
            this[opt] = valor;

            this.trocaRepetir(null);
            this.fnRefreshComponent();
        }
    }

    get(opt) {
        if (this[opt]) {
            return this[opt]
        }else{
            console.warn("Nao existe essa variável:  " + opt);
        }
        return
    }

    atualizaRecorrenciaDia(recorrencia) {

        this.objRecorrenciaDetalhada = new RecorrenciaDetalhada();
        let frequencia = recorrencia.map((dia)=>{ 

            this.objRecorrenciaDetalhada[dia.diaDaSemana].id = dia.id;
            this.objRecorrenciaDetalhada[dia.diaDaSemana].horaInicio = dia.horaInicio;
            this.objRecorrenciaDetalhada[dia.diaDaSemana].horaFim = dia.horaFim;
            this.objRecorrenciaDetalhada[dia.diaDaSemana].desativado = dia.desativado;
            if( !dia.desativado )
                return dia.diaDaSemana
        });

        frequencia.sort( (left, right) => left - right );
        this.frequencia = frequencia;
        this.trocaRepetir(null);
        this.fnRefreshComponent();
    }

    trocaRepetir($event) {
        this.atualizaObjRecorrencia();
    }

    trocaEstadoCheckbox($event, novoHorario) {
        this.diaTodo = $event;

        let diaTodo = {diaTodo: this.diaTodo};
        if (this.diaTodo) {
            diaTodo['horaInicio'] = '00:00';
            diaTodo['horaFim'] = '23:59';
        }

        if (this.onDiaTodoChange) {
            this.onDiaTodoChange(diaTodo);
        }

        this.atualizaObjRecorrencia();
    }

    atualizaObjRecorrencia() {
        this.setObjRecorrencia.emit(new RecorrenciaModel({
            repetir: this.repetir,
            diaTodo: this.diaTodo,
            frequencia: this.frequencia,
            objRecorrenciaDetalhada: this.objRecorrenciaDetalhada,
            qtdFrequencia: this.qtdFrequencia,
            tipoFrequencia: this.tipoFrequencia
        }));
    }

    ativaDesativaDia(dia) {

        if( !this.podeEditar ){
            return;
        }

        if( this.bloqueiaRecorrenciaForaDaConfiguracao && (!this.objRecorrenciaDetalhada[dia.valor]['desativado'] && !this.objRecorrenciaDetalhada[dia.valor]['id']) ){      
            return
        }

        dia.ativo = !dia.ativo;
        
        let frequencia =  this.diasDaSemana.filter((d)=>{return d.ativo == true}).map((d)=>{ return d.valor});
        frequencia.sort( (left, right) => left - right );
        this.frequencia = frequencia;

        this.atualizaObjRecorrencia();
        
        if (!dia.ativo){
            this.salvaRecorrencia(this.objRecorrenciaDetalhada[dia.valor], true);
        }else if(this.bloqueiaRecorrenciaForaDaConfiguracao){
            this.salvaRecorrencia(this.objRecorrenciaDetalhada[dia.valor], false);
        }
    }

    mostraBotao(recorrencia) {
        if (this.fnRecorrenciaMostraBotao) {
            return this.fnRecorrenciaMostraBotao(recorrencia);
        }
        return !recorrencia.id;
    }

    salvaRecorrencia(recorrencia, isDelete = false) {
        if (this.fnSalvaRecorrencia) {
            return this.fnSalvaRecorrencia(recorrencia, isDelete);
        }
    }
}


class RecorrenciaModel {
    repetir;
    diaTodo;
    frequencia;
    objRecorrenciaDetalhada;
    qtdFrequencia;
    tipoFrequencia;

    constructor(obj) {
        if (!obj)
            obj = {}

        this.repetir = obj.repetir;
        this.diaTodo = obj.diaTodo;
        
        let frequencia =  obj.frequencia;
        frequencia.sort( (left, right) => left - right );
        this.frequencia = frequencia;

        this.objRecorrenciaDetalhada = obj.objRecorrenciaDetalhada;
        
        this.qtdFrequencia = obj.qtdFrequencia;
        this.tipoFrequencia = obj.tipoFrequencia;
    }
}

class RecorrenciaDetalhada {
    "0" = {diaDaSemana: 0};
    "1" = {diaDaSemana: 1};
    "2" = {diaDaSemana: 2};
    "3" = {diaDaSemana: 3};
    "4" = {diaDaSemana: 4};
    "5" = {diaDaSemana: 5};
    "6" = {diaDaSemana: 6};
}