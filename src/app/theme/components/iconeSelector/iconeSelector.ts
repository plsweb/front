import { Component, ViewChild, Input, Output, ChangeDetectorRef, ChangeDetectionStrategy, EventEmitter, ElementRef, Renderer, OnInit, HostListener, OnChanges, Self } from '@angular/core';
import { ReturnStatement } from '@angular/compiler/src/output/output_ast';
import { ControlValueAccessor, NgModel } from '@angular/forms';

import { NgbdModalContent } from '../../../theme/components/modal/modal.component';
import { NgbModal, NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';

import * as jQuery from 'jquery';
import * as moment from 'moment';
moment.locale('pt-br');

@Component({
    selector: 'iconeSelector',
    templateUrl: './iconeSelector.html',
    styleUrls: ['./iconeSelector.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class IconeSelector implements OnInit, OnChanges {
    el;
    @Input() default;
    @Input() onIconChange: Function;
    @Output() setObjIconeSelector: EventEmitter<any> = new EventEmitter();
    @Output() setColorPickerInstancia: EventEmitter<any> = new EventEmitter();

    icons = [ 
        'sentiment_very_satisfied', 'sentiment_very_dissatisfied',      'sentiment_satisfied', 'sentiment_neutral', 
        'favorite',                 'airline_seat_individual_suite',    'whatshot',            'check_circle',
        'restaurant',               'healing',                          'add_alert',           'star',
        'wc',                       'all_inclusive',                    'group',               'cake',
        'child_care',               'fitness_center',                   'smoking_rooms',       'directions_walk',
    ];

    iconeSelecionado;
    
    constructor(private _elementRef : ElementRef, private cdr: ChangeDetectorRef) {
        this.el = _elementRef;
    }

    ngOnInit() {
        this.iconeSelecionado = this.default || null;
        this.setColorPickerInstancia.emit({
            set: this.set.bind(this),
        });
    }

    ngOnChanges(changes) {
        if (changes.default && changes.default.currentValue) {
            this.iconeSelecionado = changes.default.currentValue;
        }
    }

    ngAfterViewInit() {
    }

    set(opt, valor) {
        if (this[opt]) {
            this[opt] = valor;

            this.trocaIcone(null, this.iconeSelecionado);
        }
    }

    trocaIcone($event, icone) {
    	this.iconeSelecionado = icone;
        this.setObjIconeSelector.emit({
            iconeSelecionado: icone
        });

        if (this.onIconChange) {
            this.onIconChange(icone);
        }
    }
}