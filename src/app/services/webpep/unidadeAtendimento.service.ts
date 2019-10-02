import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class UnidadeAtendimentoService {
    url: string = 'web/pep/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    get(params = {}) {
        const url = `${this.url}unidadeAtendimento/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, params);
    }

    post(request) {
        const url = `${this.url}unidadeAtendimento/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, request);
    }

    put(id, request) {
        const url = `${this.url}unidadeAtendimento/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, request);
    }

    delete(id) {
        const url = `${this.url}unidadeAtendimento/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDelete(url);
    }

}