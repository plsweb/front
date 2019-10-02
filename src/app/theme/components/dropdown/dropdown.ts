import { Component, ViewChild, Input, SimpleChanges, Output, EventEmitter, ElementRef, Renderer, OnInit, HostListener, OnChanges, Self } from '@angular/core';
import { ReturnStatement } from '@angular/compiler/src/output/output_ast';
import { ControlValueAccessor, NgModel } from '@angular/forms';

import { concat } from 'rxjs/observable/concat';

import { NgbdModalContent } from '../../../theme/components/modal/modal.component';
import { NgbModal, NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';

import { FormatosData } from '../agenda/agenda';

import * as jQuery from 'jquery';
import * as moment from 'moment';
moment.locale('pt-br');

@Component({
    selector: 'dropdown',
    templateUrl: './dropdown.html',
    styleUrls: ['./dropdown.scss']
})
export class DropDown implements OnInit {
    
    momentjs;
    @Input() hidden = true;
    @Input() someAoClicar = true;
    @Input() title;
    @Input() relative = false;

    constructor(private _eref: ElementRef) {
    }

    ngOnInit() {
    }

    
    ngAfterViewInit() {
    }

    trackByFn(index, item) {
        return index;
    }

    toggle($event: any) {
        this.hidden = !this.hidden;
    }

    @HostListener('focusout', ['$event'])
    oculta($event: any) {
        console.log(this._eref.nativeElement.contains(event.target));
        
        if (!this._eref.nativeElement.contains(event.target)) { // or some similar check
            this.hidden = true;
        }
    }
    
    @HostListener('click', ['$event'])
    fnClickOpcao($event){
        if( this.someAoClicar ){
            if($event.target){
                let elementoClick = jQuery($event.target);
                let parent = jQuery(".dropdown.opcoes").find(elementoClick);
                
                if( parent && parent.length ){
                    this.hidden = true
                }
            }
        }
    }
}