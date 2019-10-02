import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class RelatorioFiltroService {
    url: string = 'web/pep/';
    private servidor: Servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    post(relatorioFiltro) {
        const url = `${this.url}relatorioFiltro/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, relatorioFiltro);
    }

    get(param = null) {
        const url = `${this.url}relatorioFiltro/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, param);
    }

    put(id, relatorioFiltro) {
        const url = `${this.url}relatorioFiltro/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, relatorioFiltro);
    }

    delete(id) {
        const url = `${this.url}relatorioFiltro/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDeleteSemBody(url);
    }

    // id=&pagina=&quantidade=&relatorioFiltroId
    getRoles(param = null) {
        const url = `${this.url}relatorioFiltroRole/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, param);
    }

    addRole(param) {
        const url = `${this.url}relatorioFiltroRole/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, param);
    }

    removeRole(id) {
        const url = `${this.url}relatorioFiltroRole/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDeleteSemBody(url);
    }

    getRelatorioPorToken(param = null) {
        const url = `${this.url}relatorioPorToken/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, param);
    }

    getDash(param = null) {
        const url = `${this.url}relatorioFiltroDash/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, param);
    }

    addDash(param) {
        const url = `${this.url}relatorioFiltroDash/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, param);
    }

    removeDash(id) {
        const url = `${this.url}relatorioFiltroDash/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDeleteSemBody(url);
    }
}