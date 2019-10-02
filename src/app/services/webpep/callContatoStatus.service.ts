import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class CallContatoStatusService {
    url: string = 'web/call/';
    private servidor: Servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    get(param = null) {
        const url = `${this.url}callContatoStatus/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, param);
    }
}