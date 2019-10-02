import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class GrupoPerguntaService {
    url: string = 'web/pep/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    post(grupoPergunta) {
        const url = `${this.url}grupoPergunta/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, grupoPergunta);
    }

    put(grupoPergunta, id) {
        const url = `${this.url}grupoPergunta/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, grupoPergunta);
    }

    delete(id) {
        const url = `${this.url}grupoPergunta/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDelete(url);
    }

    get(param) {
        const url = `${this.url}grupoPergunta/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, param);
    }

    ordenar(grupoPergunta) {
        const url = `${this.url}grupoPerguntaTrocaOrdem/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, grupoPergunta);
    }
}