import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class InternacaoService {
    url: string = 'web/censo/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    get() {
        const url = `${this.url}internacao/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }

    getId(id) {
        const url = `${this.url}internacao/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarGet(url);
    }

    inserir(internacao) {
        const url = `${this.url}internacao/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, internacao);
    }

    atualizar(id, internacao) {
        const url = `${this.url}internacao/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, internacao);
    }
}