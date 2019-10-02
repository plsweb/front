import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class RiscoCalculoService {
    url: string = 'web/pep/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    post(riscoCalculo) {
        const url = `${this.url}riscoCalculo/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, riscoCalculo);
    }

    postJumbo(riscoCalculo) {
        const url = `${this.url}riscoCalculoJumbo/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, riscoCalculo);
    }

    put(riscoCalculo) {
        const url = `${this.url}riscoCalculo/${Sessao.getToken()}/${riscoCalculo.id}`;

        return this.servidor.realizarPut(url, riscoCalculo);
    }

    delete(id) {
        const url = `${this.url}riscoCalculo/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDelete(url);
    }

    get(param, geturl = false) {
        const url = `${this.url}riscoCalculo/${Sessao.getToken()}`;

        if (geturl){
            return this.servidor.getUrl(url, param);
        }

        return this.servidor.realizarGetParam(url, param);
    }
}