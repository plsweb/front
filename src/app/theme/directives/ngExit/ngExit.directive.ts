import {Directive, Input} from '@angular/core';

@Directive({
	selector: '[ngExit]',
	exportAs: 'ngExit'
}) 
export class NgExit {
	@Input() values: any = {};
	@Input() ngExit;
    ngOnDestroy() {
        if(this.ngExit) { this.ngExit(); }
    }

}