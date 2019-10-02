import { Component, ViewChild, Input, Output, ElementRef, EventEmitter } from '@angular/core';

@Component({
    selector: 'ordenacao',
    templateUrl: './ordenacao.html',
    providers: [],
    styleUrls: ['./ordenacao.scss']    
})
export class Ordenacao {
	@Input() ordem;
	@Input() titulo;
	@Input() ordenacao;
	@Input() valor;
}