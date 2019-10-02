import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Router } from '@angular/router';
import { Sessao, Servidor } from 'app/services';

@Injectable()
export class ProgramaService {
    url: string = 'web/pep/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    get(params = {}) {
        const url = `${this.url}programaSaude/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, params);
    }

    post(request) {
        const url = `${this.url}programaSaude/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, request);
    }

    put(id, request) {
        const url = `${this.url}programaSaude/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, request);
    }

    delete(id) {
        const url = `${this.url}programaSaude/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDelete(url);
    }

}