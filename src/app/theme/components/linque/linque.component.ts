import { Component, ViewChild, Input, Output, ElementRef, EventEmitter } from '@angular/core';

@Component({
    selector: 'linque',
    templateUrl: './linque.html',
    providers: [],
    styleUrls: ['./linque.scss'],
})
export class Linque {
    @Input() texto: string;
}
