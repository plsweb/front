import { Component, ViewChild, Input, Output, ElementRef, EventEmitter, OnInit } from '@angular/core';

@Component({
    selector: 'botao',
    templateUrl: './botao.html',
    providers: [],
    styleUrls: ['./botao.scss'],
})
export class Botao implements OnInit {
    @Input() nome: string;
    @Input() submit: boolean;
    @Input() botao_lateral = false;
    @Input() padding_0 = false;
    @Input() desabilitado: boolean= false;
    @Input() btnVoltar: boolean;
    @Input() icone: string;
    @Input() tamanho: string;    
    @Input() classe: string;

    type: string;

    constructor(private elementRef:ElementRef) {}

    ngOnInit() {
        if (this.submit) {
            this.type = 'submit';
        } else {
            this.type = 'button';
        }

        if (!this.classe) {
            this.classe = "btn-primary";
        }
    }

    ngAfterViewInit() {
        if(this.btnVoltar){
            this.elementRef.nativeElement.addEventListener('click', this.fnVoltar.bind(this));
        }
    }

    fnVoltar(){
        window.history.go(-1);
    }
}
