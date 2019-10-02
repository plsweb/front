import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Http } from '@angular/http';

import { Sessao, Servidor } from 'app/services';

@Injectable()
export class CentroCustoRegrasService {
    url: string = 'web/pep/';
    private servidor: Servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    get(param = null) {
        const url = `${this.url}centroCustoRegras/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, param);
    }

    put(id, objParams) {
        const url = `${this.url}centroCustoRegras/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, objParams);
    }

    post(objParams) {
        const url = `${this.url}centroCustoRegras/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, objParams);
    }

    ordenar(objParams) {
        const url = `${this.url}centroCustoRegrasTrocaOrdem/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, objParams);
    }

    delete(id) {
        const url = `${this.url}centroCustoRegras/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDeleteSemBody(url);
    }
}