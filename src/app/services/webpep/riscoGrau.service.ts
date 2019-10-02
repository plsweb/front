import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class RiscoGrauService {
    url: string = 'web/pep/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    post(riscoGrau) {
        const url = `${this.url}riscoGrau/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, riscoGrau);
    }

    put(riscoGrau, id) {
        const url = `${this.url}riscoGrau/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, riscoGrau);
    }

    delete(id) {
        const url = `${this.url}riscoGrau/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDelete(url);
    }

    get(param, geturl = false) {
        const url = `${this.url}riscoGrau/${Sessao.getToken()}`;

        if (geturl){
            return this.servidor.getUrl(url, param);
        }

        return this.servidor.realizarGetParam(url, param);
    }
}