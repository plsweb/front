import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class LeitoService {
    url: string = 'web/censo/';
    private servidor;
    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    get() {
        const url = `${this.url}leito/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }

    getDisponiveis() {
        const url = `${this.url}leitosDisponiveis/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }

    getId(id) {
        const url = `${this.url}leito/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarGet(url);
    }

    inserir(leito) {
        const url = `${this.url}leito/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, leito);
    }

    atualizar(id, leito) {
        const url = `${this.url}leito/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, leito);
    }
}