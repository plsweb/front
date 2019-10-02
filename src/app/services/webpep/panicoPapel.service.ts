import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class PanicoPapelService {
    url: string = 'web/seguranca/';
    private servidor: Servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    post(request) {
        const url = `${this.url}panicoPapel/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, request);
    }

    get(param = null) {
        const url = `${this.url}panicoPapel/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, param);
    }

    put(id, request) {
        const url = `${this.url}panicoPapel/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, request);
    }

    delete(id) {
        const url = `${this.url}panicoPapel/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDeleteSemBody(url);
    }
}