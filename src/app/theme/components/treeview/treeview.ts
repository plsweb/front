import { Component, ViewChild, Input, Output, EventEmitter, ElementRef, Renderer, OnInit, HostListener, OnChanges, Self } from '@angular/core';
import { ReturnStatement } from '@angular/compiler/src/output/output_ast';
import { ControlValueAccessor, NgModel } from '@angular/forms';

import { NgbdModalContent } from '../../../theme/components/modal/modal.component';
import { NgbModal, NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';

import * as jQuery from 'jquery';
import * as moment from 'moment';
import { Item } from 'angular2-multiselect-dropdown/menu-item';
moment.locale('pt-br');

@Component({
    selector: 'treeview',
    templateUrl: './treeview.html',
    styleUrls: ['./treeview.scss'],
    host: {
        '(focus)': 'onFocus($event)',
        '(blur)': 'onBlur($event)'
    }
})
export class Treeview implements OnInit, OnChanges {

    grupo;
    todosItems;
    grupoTemp;
    selecionado = new Object();
    @Input() items;
    @Input() value;
    @Input() grupoItems;
    @Input() fnOnSelect: Function;

    @Output() setInstanciaTreeview: EventEmitter<any> = new EventEmitter();

    constructor() { }

    onFocus($event) {
        alert('onFocus');
    }

    onBlur($event) {
        alert('onFocus');
    }

    ngOnInit() {
        this.grupo = (this.grupoItems) ? true : false;
        this.inicializaConfiguracoes();
        this.inicializaTreeview();
    }

    ngOnChanges(changes) {
        if (changes.items && changes.items.currentValue) {
            this.todosItems = changes.items.currentValue;
            this.items = changes.items.currentValue;
            this.inicializaTreeview();
        }

        if (changes.grupoItems && changes.grupoItems.currentValue) {
            let strObj = JSON.stringify( changes.grupoItems.currentValue );
            this.todosItems = JSON.parse( strObj );
            this.grupoItems = JSON.parse( strObj );
            delete this.todosItems.temas;
            this.inicializaTreeview();
        }

        if (changes.value && changes.value.currentValue) {
            this.selecionado = changes.value.currentValue;
        }

        this.grupo = (this.grupoItems) ? true : false;
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
        this.setInstanciaTreeview.emit({
            id: this.selecionado['id'],
            text: this.selecionado['descricao'],
            selecionaItem: this.selecionaItem.bind(this),
            atualizaTreeview: this.atualizaTreeview.bind(this)
        });
    }


    //  ======================================
    //          Treeview Metodos
    //  ======================================
    inicializaTreeview() {
        this.atualizaTreeview();
    }

    atualizaTreeview() {
        this.selecionado = [];
    }

    selecionaItem(pai, item){

        this.items = this.items.map((itemTemp) => {
            itemTemp.collapsed = itemTemp.item.id == pai.item.id;
            return itemTemp;
        });
    }


    //  ======================================
    //          Treeview Eventos
    //  ======================================

    clickPai(item) {
        item.collapsed = !item.collapsed;
    }

    clickFilho(item, childItem) {
        if (this.fnOnSelect) {
            this.fnOnSelect(item, childItem);
            this.selecionado = JSON.parse( JSON.stringify( childItem ) );
            this.inicializaConfiguracoes();
        }
    }

    validafiltro(valida, resultado) {
        if ( valida ) {
            let mostra = false;
            if (resultado > 0) {
                mostra = true;
            }
            return mostra;

        }
        return true;
    }

    filtro = false;
    filtrar(event, inputFiltrar) {
        this.filtro = true;
        let reg = new RegExp(event.target.value, 'i');
        let strTodos = JSON.stringify( this.todosItems )
        let todosTemp = JSON.parse( strTodos );

        if (!event.target.value || event.target.value == '') {
            if ( !this.grupo ) {
                this.items = JSON.parse( strTodos )
            } else {
                this.grupoItems = JSON.parse( strTodos )
                this.grupoItems.forEach((grupos) => {
                    grupos.temas.forEach((tema) => {
                        grupos['resultado'] = tema.grupos.length;
                    });
                });
            }
            this.filtro = true;
            return;
        }
        
        if ( this.items ) {
            this.items = todosTemp.filter((item) => {
                let aFilhos = item.filhos.filter((child)=>{
                    return child.descricao.match(reg);
                });

                item.filhos = aFilhos;
                return aFilhos.length;
            });
        }

        if ( this.grupoItems ) {
            this.grupoItems.forEach((grupos) => {
                let cont = 0;
                grupos.temas.forEach((grupo) => {
                    let aFilhos = grupo.grupos.filter((childs) => {
                        return childs.descricao.match(reg);
                    });

                    cont += grupo.grupos.length;
                    grupo.grupos = aFilhos;
                    return aFilhos.length;
                });
                grupos['resultado'] = cont;
            });
        }
    }
}