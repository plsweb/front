import { Injectable } from '@angular/core';

export class BrowserHelpers {
    
    static validaElementContent(el): boolean {
    	let valor = el.value;

        return valor && valor.trim() != '' && valor.trim() != 'null' && valor.trim() != 'undefined' && valor.trim() != '0';
    }

    static limpaFormControl(el) {
    	el.value = '';
    }
}