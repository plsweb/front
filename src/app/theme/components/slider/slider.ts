import { Component, Input, ElementRef, OnInit } from '@angular/core';

@Component({
    selector: 'slider',
    templateUrl: './slider.html',
    providers: [],
    styleUrls: ['./slider.scss'],
})
export class Slider implements OnInit {
    @Input() nome: string;


    type: string;

    constructor(private elementRef:ElementRef) {}

    ngOnInit() {

        jQuery( "#myRange" ).slider({
            orientation: "vertical",
            range: true,
            values: [ 17, 67 ],
            slide: function( event, ui ) {
              $( "#amount" ).val( "$" + ui.values[ 0 ] + " - $" + ui.values[ 1 ] );
            }
          });
    }

    ngAfterViewInit() {
        
    }

}
