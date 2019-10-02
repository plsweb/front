import { Component, Input, ViewEncapsulation } from '@angular/core';

@Component({
    selector: 'icone',
    templateUrl: './icone.html',
    encapsulation: ViewEncapsulation.None,
    providers: [],
    styleUrls: ['./icone.scss']    
})
export class Icone {
    @Input() nome: string;
    @Input() title: string;
    @Input() tamanho: string;
    @Input() classe: string;
    @Input() loading;
}