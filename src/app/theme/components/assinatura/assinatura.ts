import { Component, ViewChild, Input, Output, ChangeDetectorRef, ChangeDetectionStrategy, EventEmitter, ElementRef, Renderer, OnInit, HostListener, OnChanges, Self } from '@angular/core';
import { ReturnStatement } from '@angular/compiler/src/output/output_ast';
import { ControlValueAccessor, NgModel } from '@angular/forms';

import { NgbdModalContent } from '../../../theme/components/modal/modal.component';
import { NgbModal, NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';

import * as jQuery from 'jquery';
import * as moment from 'moment';
moment.locale('pt-br');



/*  =================================================================
    <div class="row">
        <div class="col">
            <assinatura
                [label]="'Ass. Beneficiário'"
                [onConfirma]="salvaAssinatura.bind(this)"
            ></assinatura>
        </div>
    </div>
    
    salvaAssinatura(imagem){
        console.log('salva');
        console.log(imagem);
    }
=================================================================   */
@Component({
    selector: 'assinatura',
    templateUrl: './assinatura.html',
    styleUrls: ['./assinatura.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Assinatura implements OnInit, OnChanges {
    el;
    @Input() default;
    @Input() label;
    @Input() onConfirma: Function;
    @Output() setObjAssinatura: EventEmitter<any> = new EventEmitter();
    @Output() setAssinaturaInstancia: EventEmitter<any> = new EventEmitter();

    started;
    assinatura;

    canvas;
    context;

    touchX;
    touchY;
    
    constructor(private _elementRef : ElementRef, private cdr: ChangeDetectorRef) {
        this.el = _elementRef;
    }

    ngOnInit() {
        this.assinatura = this.default || null;
    }

    ngOnChanges(changes) {
        if (changes.default && changes.default.currentValue) {
            this.assinatura = changes.default.currentValue;
        }
    }

    ngAfterViewInit() {
        this.initCanvas();
    }

    
    createCanvas() {
        var canvas = document.createElement('canvas');
        var pNaoSuportado = document.createElement('p');
        var text = document.createTextNode('Infelizmente, seu navegador não suporta este recurso.');
        pNaoSuportado.appendChild(text);
        canvas.appendChild(pNaoSuportado);

        let canvasWidth = $('.col.area-assinatura').css('width').replace('px', '');
        let canvasHeigth = $('.col.area-assinatura').css('height').replace('px', '');

        canvas.id = "assinatura";
        canvas.width = parseInt(canvasWidth);
        canvas.height = parseInt(canvasHeigth);

        var elAreaAssinatura = document.getElementById("area-assinatura");
        while (elAreaAssinatura.hasChildNodes()) {
            elAreaAssinatura.removeChild(elAreaAssinatura.lastChild);
        }

        elAreaAssinatura.appendChild(canvas);
    }

    initCanvas() {
        this.createCanvas();

        this.canvas = document.getElementById('assinatura');
        if (!this.canvas) {
            console.error('Erro: Elemento canvas não encontrado!');
            return;
        }

        if (!this.canvas.getContext) {
            console.error('Erro: Canvas Context não encontrado!');
            return;
        }
        this.context = this.canvas.getContext('2d');

        if (!this.context) {
            console.error('Erro: Falha ao pegar o Context!');
            return;
        }

        // Attach the mousemove event handler.
        this.canvas.addEventListener('mousemove', this.ev_mousemove.bind(this), false);
        
        this.canvas.addEventListener('mousedown', this.ev_mousedown.bind(this), false);
        this.canvas.addEventListener('mouseup', this.ev_mouseup.bind(this), false);

        this.canvas.addEventListener("touchstart", this.ev_mousedown.bind(this), false);
        this.canvas.addEventListener("touchmove", this.ev_touchmove.bind(this), false);
        this.canvas.addEventListener('touchend', this.ev_mouseup.bind(this), false);
    }

    ev_mousedown(ev) {
        this.started = true;
    }

    ev_mouseup(ev) {
        this.started = false;
    }

    ev_mousemove(ev) {
        var x, y;

        if (ev.layerX || ev.layerX == 0) { // Firefox
            x = ev.layerX;
            y = ev.layerY;
        } else if (ev.offsetX || ev.offsetX == 0) { // Opera
            x = ev.offsetX;
            y = ev.offsetY;
        }

        if (!this.started) {
            this.context.beginPath();
            this.context.moveTo(x, y);
        } else {
            this.context.lineTo(x, y);
            this.context.stroke();
        }
    }

    ev_touchmove(ev) {
        ev.preventDefault();

        if(ev.touches) {
            if (ev.touches.length == 1) { // Somente desenha se usar apenas 1 dedo (not multigesture)
                var touch = ev.touches[0];

                this.touchX = touch.clientX - touch.target.getClientRects()[0].left;
                this.touchY = touch.clientY - touch.target.getClientRects()[0].top;
                
                if (!this.started) {
                    this.context.beginPath();
                    this.context.moveTo(this.touchX, this.touchY);
                } else {
                    this.context.lineTo(this.touchX, this.touchY);
                    this.context.stroke();
                }
            }
        }
    }

    limpar(evento) {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
    confirmar(evento) {
        if (this.onConfirma) {
            let imagem64;

            var img_b64 = this.canvas.toDataURL();
            var arr = img_b64.split(','), mime = arr[0].match(/:(.*?);/)[1];
            var bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);

            while(n--){
                u8arr[n] = bstr.charCodeAt(n);
            }
            var arquivo = new File([u8arr], 'photo.png', {type:mime});

            const reader = new FileReader();
            reader.addEventListener('load', (event: Event) => {
              imagem64 = (<any>event.target).result;
              
              this.onConfirma(imagem64);
            }, false);

            reader.readAsDataURL(arquivo);
        }
    }
}