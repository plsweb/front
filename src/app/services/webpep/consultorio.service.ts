import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class ConsultorioService {
    url: string = 'web/pep/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    getConsultorio(unidade) {
        const url = `${this.url}consultorio/${Sessao.getToken()}/${unidade}`;

        return this.servidor.realizarGet(url);
    }

    postGuicheAtendimento(request) {
        const url = `${this.url}guicheAtendimento/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, request);
    }

    putGuicheAtendimento(id, request) {
        const url = `${this.url}guicheAtendimento/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, request);
    }

    deleteGuicheAtendimento(id) {
        const url = `${this.url}guicheAtendimento/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDelete(url);
    }

    getGuicheAtendimento(request) {
        const url = `${this.url}guicheAtendimento/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, request);
    }

    getUnidadeAtendimento() {
        const url = `${this.url}unidadeAtendimento/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }

    getConsultoriosPorUnidadeId(unidadeId) {
        const url = `${this.url}consultorioPorUnidadeId/${Sessao.getToken()}/${unidadeId}`;

        return this.servidor.realizarGet(url);
    }
}
