import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class MenuService {
    url: string = 'web/seguranca/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor= new Servidor(http, router);
    }

    getItens() {
		const url = `${this.url}menuPorToken/${Sessao.getToken()}/${Sessao.getModulo()}`;

        return this.servidor.realizarGet(url);
    }
}