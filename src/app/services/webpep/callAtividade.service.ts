import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class CallAtividadeService {
    url: string = 'web/call/';
    private servidor: Servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    post(callAtividade) {
        const url = `${this.url}callAtividade/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, callAtividade);
    }

    getAtividadeIdPaciente(obj) {
        const url = `${this.url}callAtividade/${Sessao.getToken()}`;
        return this.servidor.realizarGetParam(url, obj);
    }

    get(param, geturl = false) {
        var objJsonB64 = btoa(JSON.stringify(param));
        
        const url = `${this.url}callAtividadeFiltro/${Sessao.getToken()}/${objJsonB64}`;

        return this.servidor.realizarGet(url);
    }

    put(id, callAtividade) {
        const url = `${this.url}callAtividade/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, callAtividade);
    }

    delete(id) {
        const url = `${this.url}callAtividade/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDeleteSemBody(url);
    }

    finalizaCallAtividade(request) {
        const url = `${this.url}finalizaCallAtividade/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, request);
    }

    iniciaCallAtividade(request) {
        const url = `${this.url}iniciaCallAtividade/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, request);
    }
}