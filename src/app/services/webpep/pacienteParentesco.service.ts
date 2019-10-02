import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class PacienteParentescoService {
    url: string = 'web/pep/';
    private servidor: Servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    post(objParams) {
        const url = `${this.url}parentesco/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, objParams);
    }

    getParentescoPaginado(param = null) {
        const url = `${this.url}parentesco/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, param);
    }

    put(id, objParams) {
        const url = `${this.url}parentesco/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, objParams);
    }

    delete(id) {
        const url = `${this.url}parentesco/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDeleteSemBody(url);
    }

}