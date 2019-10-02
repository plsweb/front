import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class TipoFaltaService {
    url: string = 'web/pep/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    post(tipoFalta) {
        const url = `${this.url}tipoFalta/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, tipoFalta);
    }

    put(tipoFalta, id) {
        const url = `${this.url}tipoFalta/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, tipoFalta);
    }

    delete(id) {
        const url = `${this.url}tipoFalta/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDelete(url);
    }

    get(param = null) {
        const url = `${this.url}tipoFalta/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, param);
    }
}