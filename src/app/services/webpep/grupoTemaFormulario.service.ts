import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class GrupoTemaFormularioService {
    url: string = 'web/pep/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    post(grupoTemaFormulario) {
        const url = `${this.url}grupoTemaFormulario/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, grupoTemaFormulario);
    }

    put(grupoTemaFormulario, id) {
        const url = `${this.url}grupoTemaFormulario/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, grupoTemaFormulario);
    }

    delete(id) {
        const url = `${this.url}grupoTemaFormulario/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDelete(url);
    }

    get(param) {
        const url = `${this.url}grupoTemaFormulario/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, param);
    }
}