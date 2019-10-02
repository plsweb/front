import { Component, ViewChild, Input, Output, ElementRef, EventEmitter } from '@angular/core';

@Component({
    selector: 'mensagem',
    templateUrl: './mensagem.html',
    providers: [],
})
export class Mensagem {
	@Input() texto:string= "teste";
}