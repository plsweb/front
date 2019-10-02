import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class PerguntaCondicao {
    url: string = 'web/pep/';
    private servidor: Servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    post(perguntaCondicao) {
        const url = `${this.url}perguntaCondicao/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, perguntaCondicao);
    }

    get(param = null) {
        const url = `${this.url}perguntaCondicao/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, param);
    }

    put(id, perguntaCondicao) {
        const url = `${this.url}perguntaCondicao/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, perguntaCondicao);
    }

    delete(id) {
        const url = `${this.url}perguntaCondicao/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDeleteSemBody(url);
    }
}