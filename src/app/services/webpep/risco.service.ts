import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class RiscoService {
    url: string = 'web/pep/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    post(risco) {
        const url = `${this.url}risco/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, risco);
    }

    put(risco, id) {
        const url = `${this.url}risco/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, risco);
    }

    delete(id) {
        const url = `${this.url}risco/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDelete(url);
    }

    get(param, geturl = false) {
        const url = `${this.url}risco/${Sessao.getToken()}`;

        if (geturl){
            return this.servidor.getUrl(url, param);
        }

        return this.servidor.realizarGetParam(url, param);
    }
}