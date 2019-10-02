import {
    Component,
    ViewChild,
    Input,
    Output,
    EventEmitter,
    ElementRef,
    Renderer,
    OnInit,
    HostListener,
    OnChanges,
    Self,
} from '@angular/core';

import {
    ControlValueAccessor,
    NgModel
} from '@angular/forms';

import * as jQuery from 'jquery';
import { ReturnStatement } from '@angular/compiler/src/output/output_ast';
import Inputmask from "inputmask";

import { NgbdModalContent } from '../../../theme/components/modal/modal.component';
import { NgbModal, NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'entradaBuscar',
    templateUrl: './entradaBuscar.html',
    styleUrls: ['./entradaBuscar.scss'],
})
export class EntradaBuscar implements OnInit, OnChanges {
    id = "EntradaBuscar" + new Date().getTime() + Math.round((Math.random()*100));
    @Input() service;
    @Input() fnService;
    @Input() elementoModalAdd;
    @Input() params;
    @Input() legenda;
    @Input() placeholders;
    @Input() returnObj;
    @Input() arrayReturnObj;
    @Input() inline;
    @Input() mascaras;
    @Input() limparCampo;
    @Input() setValor;

    @Output() onSelect: EventEmitter<any> = new EventEmitter();
    @Output() getValor: EventEmitter<any> = new EventEmitter();
    @Output() getSearchById: EventEmitter<any> = new EventEmitter();

    lista = [];

    paginaAtual = 1;
    itensPorPagina = 5;
    qtdItensTotal;
    descCalor = "";
    searchById = false;
    

    activeModal;

    constructor(
        private modalService: NgbModal) {
    }

    ngOnInit() {

        if (!this.placeholders || !this.placeholders[0]) {
            this.placeholders = [];
        }                
    }

    ngOnChanges() {}

    ngAfterViewInit() {
        if( this.setValor ){            
            jQuery(".entradaBuscar#" + this.id + " .id").val(this.setValor[0]);
            jQuery(".entradaBuscar#" + this.id + " .desc").val(this.setValor[1]);
        }

        if (this.mascaras) {
            ( this.mascaras[0] ) ? Inputmask({"mask": this.mascaras[0]}).mask( document.querySelector(".entradaBuscar#" + this.id + " .id") )   : null;        
            ( this.mascaras[1] ) ? Inputmask({"mask": this.mascaras[1]}).mask( document.querySelector(".entradaBuscar#" + this.id + " .desc") ) : null;
        }
    }

    atualizaId() {
        const id = this.id;
        let valor = jQuery(".entradaBuscar#" + id + " .id").val().replace(/\s/g, '');
        
        if (valor == '') {
            this.setDescricao('', null);
        }
    }

    pesquisaPorId(evento){
        if(this.arrayReturnObj){
            var bloqueia = !(evento.target.value == "") ? true : false;
            this.searchById = bloqueia;

            for(var a=0; a<this.arrayReturnObj.length; a++){
                var campo = jQuery("[data-param-search='"+this.arrayReturnObj[a]+"'] .form-control");
                var valorNull = ( campo.prop("tagName") == "SELECT" ) ? "0" : "";
                campo.val(valorNull).prop("disabled", bloqueia);
            }
        }
    }

    getId() {
        const id = this.id;

        if( this.arrayReturnObj && !this.searchById ){
            let retornoArray = new Object();

            if(this.arrayReturnObj.length > 0){
                for(var a=0; a<this.arrayReturnObj.length; a++){
                    let labelCampo = this.arrayReturnObj[a];
                    var campo = jQuery("[data-param-search='"+this.arrayReturnObj[a]+"'] .form-control");
                    (campo.val() != undefined) ? retornoArray[labelCampo] = campo.val() : null;
                }

                return retornoArray;
            }else{
                console.error("Faltando parametro array no componente buscaEntrada");
            }
        }
        let descValor = jQuery(".entradaBuscar#" + id + " .desc").val();
        if( descValor != '' ){
            return descValor;
        }
        return jQuery(".entradaBuscar#" + id + " .id").val().replace(/\s/g, '');
    }

    setId(valor) {
        if( this.limparCampo )
            valor = "";

        const id = this.id;
        jQuery(".entradaBuscar#" + id + " .id").val(valor.replace(/\s/g, ''));
    }

    getDescricao() {
        const id = this.id;
        return jQuery(".entradaBuscar#" + id + " .desc").val();
    }

    setDescricao(valor, dado) {
        if( this.limparCampo )
            valor = "";

        const id = this.id;
        jQuery(".entradaBuscar#" + id + " .desc").val(valor);
        this.onSelect.emit(dado);
    }

    abrirModal(bodyModal, params) {

        if(!params){
            this.service[this.fnService[1]](this.paginaAtual, this.itensPorPagina).subscribe((dados) => {
                this.funcaoPaginado(dados);
            });
        }else{
            this.service[this.fnService[1]](this.paginaAtual, this.itensPorPagina, params).subscribe((dados) => {
                this.funcaoPaginado(dados);
            });
        }
        this.abreModal(bodyModal);
        
    }

    abreModal(bodyModal){
        this.activeModal = this.modalService.open(NgbdModalContent, {size: 'lg'});
        this.activeModal.componentInstance.modalHeader  = 'Buscar';
        this.activeModal.componentInstance.templateRefBody = bodyModal;
    }

    funcaoPaginado(dados){
        this.lista = dados.dados;

        this.qtdItensTotal = dados.qtdItensTotal;
        this.itensPorPagina = dados.itensPorPagina || this.itensPorPagina;
        this.paginaAtual = dados.paginaAtual || 1;
    }

    getDataSearch(evento) {
        this.descCalor = evento.valor;
    }

    search(evento) {

        let paginaAtual = 1;
        let itensPorPagina = 5;
        
        if( !(this.descCalor == "") && !(this.descCalor == undefined) ){
            this.service[this.fnService[2]](paginaAtual, itensPorPagina, this.descCalor).subscribe((dados) => {
                this.lista = dados.dados;
                
                this.qtdItensTotal = dados.qtdItensTotal;
                this.itensPorPagina = dados.itensPorPagina || this.itensPorPagina;
                this.paginaAtual = dados.paginaAtual || 1;
            });
        }else{
            this.service[this.fnService[1]](paginaAtual, itensPorPagina).subscribe((dados) => {
                this.funcaoPaginado(dados);
            });
        }
    }

    clickLinha(linha) {
        this.setId(linha[this.params[0]]);
        this.setDescricao(linha[this.params[1]], linha);

        this.getValor.emit(linha);
        this.searchById = false;
        
        this.activeModal.close();
    }

    buscaPaginado(evento) {

        let idBusca = this.getId();
        let paginaAtual = evento.paginaAtual || this.paginaAtual;
        let itensPorPagina = evento.itensPorPagina || this.itensPorPagina;
        
        
        if( !(this.descCalor == "") && !(this.descCalor == undefined) ){
            this.service[this.fnService[2]](paginaAtual, itensPorPagina, this.descCalor).subscribe((dados) => {
                this.funcaoPaginado(dados);
            });
        }else{
            if( !( (typeof idBusca === "object") && (idBusca !== null) ) ){
                this.service[this.fnService[1]](paginaAtual, itensPorPagina).subscribe((dados) => {
                    this.funcaoPaginado(dados);
                });
            }else{
                this.service[this.fnService[1]](paginaAtual, itensPorPagina, idBusca).subscribe((dados) => {
                    this.funcaoPaginado(dados);
                });
            }
        }

    }

    buscaPorId(bodyModal) {
        let idBusca = this.getId();
        
        if( ( idBusca && idBusca != "" ) && !( (typeof idBusca === "object") && (idBusca !== null) ) ) {
            
            this.service[this.fnService[0]](idBusca).subscribe(
                (dados) => {
                    if (dados && dados[this.params[0]]) {
                        this.setDescricao(dados[this.params[1]], dados)
                    }else {
                        console.warn(dados);
                        // this.abrirModal(bodyModal, null);
                        this.searchLikePaginado("Busca nao retornou resultados", idBusca, bodyModal)
                    }
                },
                (err) => this.searchLikePaginado(err, idBusca, bodyModal)
            );
        } else {
            this.abrirModal(bodyModal, idBusca);
        }
    }

    searchLikePaginado(err, idBusca, bodyModal){
        console.warn("Houve um erro na consulta:  " + err);
                    
        this.service[this.fnService[2]](1, 5, idBusca).subscribe((dados) => {
            console.warn("realiza busca paginada.");
            this.descCalor = idBusca;
            this.funcaoPaginado(dados);
            this.abreModal(bodyModal);
        });
        
    }

    eventoClique(bodyModal) {
        if (this.service && this.fnService && this.fnService.length > 0) {
            this.buscaPorId(bodyModal);
        } else {
            console.error("Verifique as funções");
        }
    }

    adicionarRegistro(){
        this.activeModal = this.modalService.open(NgbdModalContent, {size: 'lg'});
        this.activeModal.componentInstance.modalHeader  = 'Adicionar';
        this.activeModal.componentInstance.modalAdicionar  = true;
        this.activeModal.componentInstance.templateRefBody = this.elementoModalAdd[0];
        this.activeModal.componentInstance.templateBotoes = this.elementoModalAdd[1];
        
    }
}