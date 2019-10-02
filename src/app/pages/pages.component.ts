import { Component } from '@angular/core';
import { Router } from '@angular/router';
import * as $ from 'jquery';

@Component({
	selector: 'pages',
	templateUrl: './page.html'
})
export class Pages {

	constructor(public router: Router,) {
		let tema = this.validaLocalStorage();
		$("head")["0"].innerHTML += `<link id="tema" href="assets/css/` + tema + `.css" rel="stylesheet">`;
	}

	validaLocalStorage(){

		if (this.router.url == '/webauditoria/dashboard'){
			localStorage.setItem("tema", "light_tema");
		}
		
		if( localStorage.getItem("tema") == undefined ){
			localStorage.setItem("tema", "dark_tema");
		}
		
		if (this.router.url !== '/login' && !localStorage.getItem("token")) {
			this.router.navigate(['/login']);
		}

		return localStorage.getItem("tema");
	}
}