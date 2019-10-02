import {
    Component,
    ViewChild,
    Input,
    Output,
    EventEmitter,
    ElementRef,
    AfterViewChecked,
    Renderer,
    OnInit,
    TemplateRef,
    QueryList,
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

import { NgbdModalContent } from '../../../theme/components/modal/modal.component';
import { NgbModal, NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'botaoSearchAcoes',
    templateUrl: './botaoSearchAcoes.html',
    styleUrls: ['./botaoSearchAcoes.scss'],
})


export class BotaoSearchAcoes implements OnInit {
    id = "BotaoSearch" + new Date().getTime() + Math.round((Math.random()*100));

    @Input() label;
    @Input() icone;
    @Input() service;
    @Input() fnService;
    @Input() objParams;
    @Input() camposFiltro;
    @Input() params;
    @Input() elementoAcoes;
    @Input() actionsFirst;
    @Input() custom_lg;
    @Input() btnAdicionar;
    @Input() hideColunaAdd = false;

    @Input() objetoUnico:any = false;
    
    @Output() onSelect: EventEmitter<any> = new EventEmitter();
    @Output() setInstanciaBtnSearch: EventEmitter<any> = new EventEmitter();

    @ViewChild("bodyModal", {read: TemplateRef}) bodyModal: TemplateRef<any>;

    lista = [];

    paginaAtual = 1;
    itensPorPagina = 5;
    qtdItensTotal;
    descValor = "";
    searchById = false;
    
    activeModal;
    modalFechada = true;

    constructor(
        private modalService: NgbModal) {
    }

    ngOnInit() {        
        this.setInstanciaBtnSearch.emit({
            buscaTodos: this.buscaTodos.bind(this, { paginaAtual : 1 })
        });        
    }

    buscaTodos(evento){
        this.paginaAtual = (evento["paginaAtual"]) ? evento.paginaAtual : 1;

        if( this.objParams ){
            if( this.objetoUnico ){
                this.service[this.fnService[0]]( { pagina: this.paginaAtual, quantidade : this.itensPorPagina } ).subscribe((dados) => {
                    this.funcaoPaginado(dados);
                });
            }else{
                this.service[this.fnService[0]](this.paginaAtual, this.itensPorPagina, this.objParams).subscribe((dados) => {
                    this.funcaoPaginado(dados);
                });
            }
        }else{
            this.service[this.fnService[0]](this.paginaAtual, this.itensPorPagina).subscribe((dados) => {
                this.funcaoPaginado(dados);
            });
        }
    }

    buscaLikePaginado(){
        let paginaAtual = 1;
        let itensPorPagina = 5;
        
        if( !this.objParams ){
            if( !(this.descValor == "") && !(this.descValor == undefined) ){
                this.service[this.fnService[1]](paginaAtual, itensPorPagina, this.descValor).subscribe((dados) => {
                    this.funcaoPaginado(dados);
                });
            }else{
                this.buscaTodos({ paginaAtual : 1 });
            }
        }else{
            if( this.objetoUnico ){

                if( !(this.descValor == "") && !(this.descValor == undefined) ){

                    let param = { 
                        pagina : paginaAtual, 
                        quantidade: itensPorPagina
                    }

                    param[this.objetoUnico] = this.descValor;
                    this.service[this.fnService[1]]( param ).subscribe((dados) => {
                        this.funcaoPaginado(dados);
                    });
                }else{
                    this.buscaTodos({ paginaAtual : 1 });
                }

            }else{
                this.buscaTodos({ paginaAtual : 1 });
            }
        }
    }

    buscaPaginado(evento) {
        let paginaAtual = evento.paginaAtual || this.paginaAtual;
        let itensPorPagina = evento.itensPorPagina || this.itensPorPagina;
        
        if( !this.objParams ){
            if( !(this.descValor == "") && !(this.descValor == undefined) ){
                this.service[this.fnService[1]](paginaAtual, itensPorPagina, this.descValor).subscribe((dados) => {
                    this.funcaoPaginado(dados);
                });
            }else{
                this.service[this.fnService[0]](paginaAtual, itensPorPagina).subscribe((dados) => {
                    this.funcaoPaginado(dados);
                });
            }
        }else{

            if( this.objetoUnico ){

                let param = { 
                    pagina : paginaAtual, 
                    quantidade: itensPorPagina
                }

                this.service[this.fnService[1]]( param ).subscribe((dados) => {
                    this.funcaoPaginado(dados);
                });

            }else{

                this.paginaAtual = paginaAtual
                this.itensPorPagina = itensPorPagina
                this.buscaTodos({ paginaAtual : this.paginaAtual });

            }
        }
    }

    abreModal(){        
        if(this.modalFechada){
            this.modalFechada = false;

            this.activeModal = this.modalService.open(NgbdModalContent, {size: 'lg'});
            this.activeModal.result.then((result) => {
                this.modalFechada = true
              }, (reason) => {
                this.modalFechada = true
              });

            this.activeModal.componentInstance.modalHeader  = 'Buscar';
            this.activeModal.componentInstance.templateRefBody = this.bodyModal;
            
            if( this.custom_lg ){
                this.activeModal.componentInstance.custom_lg_modal = true;
            }
            
        }
    }

    funcaoPaginado(dados){
        this.lista = dados.dados;

        this.qtdItensTotal = dados.qtdItensTotal;
        this.itensPorPagina = dados.itensPorPagina || this.itensPorPagina;
        this.paginaAtual = dados.paginaAtual || 1;
        
        this.abreModal();
    }

    getDescricao(evento){
        this.descValor = evento.valor;
    }

    retornaLabelTabela(col){
        if(typeof col === "object"){
            return this.validaLabelComplexo(col);
        }
        if( col.indexOf('.') >= 0 )
            return col.split('.')[0].toUpperCase();

        return col.toUpperCase();
    }

    retornaValorLista(itemLista, pos, valor, mostraValor){
        if(typeof pos === "object"){
            let valor = '';
            if( pos.name.indexOf('.') >= 0 ){

                if( itemLista[pos.name.split(".")[0]] )
                    valor = itemLista[pos.name.split(".")[0]][pos.name.split(".")[1]];
                else
                    return '';
            }else{
                valor = itemLista[pos.name];
            }

            if ( pos.colunaCor ){
                if( mostraValor ){
                    return this.validaValorComplexo(pos, valor);                
                }else{
                    return '';
                }

            }
            return this.validaValorComplexo(pos, valor);                
        }

        if( (typeof(valor) === "boolean") ){
            return ( valor ) ? "SIM" : "NÃO";

        }else if( pos.indexOf('.') >= 0 ){
            let retorno = ( itemLista[pos.split(".")[0]] ) ? itemLista[pos.split(".")[0]][pos.split(".")[1]] : "";
            return retorno;
        }

        // valida callback
        
        return valor;
    }

    validaLabelComplexo(col){  

        if( col.colunaCor ){
            return ''
        }else{
            if(col.name.indexOf('.') >= 0 ){
                return col.name.split(".")[0]
            }
        }

        return col.name;
    }

    validaValorComplexo(col, valor){   

        if( col.callback ){
            return col.callback(valor);
        }

        return valor;
    }

    clickLinha(item){
        this.onSelect.emit(item);
    }

}