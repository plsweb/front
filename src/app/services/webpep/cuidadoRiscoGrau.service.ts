import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class CuidadoRiscoGrauService {
    url: string = 'web/pep/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    post(cuidadoRiscoGrau) {
        const url = `${this.url}cuidadoRiscoGrau/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, cuidadoRiscoGrau);
    }

    put(cuidadoRiscoGrau, id) {
        const url = `${this.url}cuidadoRiscoGrau/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, cuidadoRiscoGrau);
    }

    delete(id) {
        const url = `${this.url}cuidadoRiscoGrau/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDelete(url);
    }

    get(param, geturl = false) {
        const url = `${this.url}cuidadoRiscoGrau/${Sessao.getToken()}`;

        if (geturl){
            return this.servidor.getUrl(url, param);
        }

        return this.servidor.realizarGetParam(url, param);
    }
}