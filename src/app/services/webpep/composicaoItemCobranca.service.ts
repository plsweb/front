import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class ComposicaoItemCobrancaService {
    url: string = 'web/pep/';
    urlErp: string = 'web/erp/';
    private servidor: Servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    post(objParams) {
        const url = `${this.url}cobrancaComposicao/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, objParams);
    }

    get(param = null) {
        const url = `${this.url}cobrancaComposicao/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, param);
    }

    put(id, objParams) {
        const url = `${this.url}cobrancaComposicao/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, objParams);
    }

    delete(id) {
        const url = `${this.url}cobrancaComposicao/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDeleteSemBody(url);
    }

    // TODO CobrancaService
    // getStatus() {
    //     const url = `${this.url}cobrancaStatus/${Sessao.getToken()}`;

    //     return this.servidor.realizarGet(url);
    // }

    getUnidadeSaude(param){
        const url = `${this.urlErp}unidadeSaude/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, param);
    }
}