import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Http } from '@angular/http';

import { Sessao, Servidor } from '../../services';

@Injectable()
export class AtendimentoTipoTussService {
    url: string = 'web/pep/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    get(param) {
        const url = `${this.url}atendimentoTipoTuss/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, param);
    }

    put(id, params) {
        const url = `${this.url}atendimentoTipoTuss/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, params);
    }

    post(params) {
        const url = `${this.url}atendimentoTipoTuss/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, params);
    }

    delete(id) {
        const url = `${this.url}atendimentoTipoTuss/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDelete(url);
    }
}