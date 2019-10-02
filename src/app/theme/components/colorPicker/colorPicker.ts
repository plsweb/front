import { Component, Input, Output, ChangeDetectionStrategy, EventEmitter, ElementRef, OnInit, OnChanges } from '@angular/core';

import * as moment from 'moment';
moment.locale('pt-br');

@Component({
    selector: 'colorPicker',
    templateUrl: './colorPicker.html',
    styleUrls: ['./colorPicker.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ColorPicker implements OnInit, OnChanges {
    el;
    @Input() id;
    @Input() default;
    @Input() direcao = 'bottom';
    @Input() onColorChange: Function;
    @Output() setObjColorPicker: EventEmitter<any> = new EventEmitter();
    @Output() setColorPickerInstancia: EventEmitter<any> = new EventEmitter();

    colors = [ '#006600', '#bed700', '#eadcb9', '#ffffff', '#ec0e63', 
               '#a0228d', '#f5781e', '#ffc20f', '#c3c9c9', '#005128',
               '#410050', '#006a6a', '#79787d', '#683c0f', '#f0f0f0',
               '#000000' ];

    corSelecionada;
    
    constructor(_elementRef : ElementRef) {
        this.el = _elementRef;
    }

    ngOnInit() {
        this.corSelecionada = this.default || null;
        this.setColorPickerInstancia.emit({
            set: this.set.bind(this),
        });
    }

    ngOnChanges(changes) {
    }

    ngAfterViewInit() {
    }

    set(opt, valor) {
        if (this[opt]) {
            this[opt] = valor;

            this.trocaCor(this.corSelecionada, valor);
        }
    }

    trocaCor(evento, color) {
        if (this.id) {
            $(`#${this.id}`).click();
        } else {
            $('.bloco-cor.badge.badge-secondary').click();
        }

    	this.corSelecionada = color;
        this.setObjColorPicker.emit({
            corSelecionada: color
        });

        if (this.onColorChange) {
            this.onColorChange(color);
        }
    }
}