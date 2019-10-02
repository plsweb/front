import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class CallContatoService {
    url: string = 'web/call/';
    private servidor: Servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    post(callContato) {
        const url = `${this.url}callContato/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, callContato);
    }

    get(param = null) {
        const url = `${this.url}callContato/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, param);
    }

    put(id, callContato) {
        const url = `${this.url}callContato/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, callContato);
    }

    delete(id) {
        const url = `${this.url}callContato/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDeleteSemBody(url);
    }
}