import { Component, Input, ElementRef, OnInit } from '@angular/core';

@Component({
    selector: 'progressBar',
    templateUrl: './progress.html',
    providers: [],
    styleUrls: ['./progress.scss'],
})
export class ProgressBar implements OnInit {
    @Input() nome: string;
    @Input() labelTitle;
    @Input() maior;
    @Input() menor;
    @Input() classe;

    type: string;

    constructor(private elementRef:ElementRef) {}

    ngOnInit() {}

    ngAfterViewInit() {}

}
