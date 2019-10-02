import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';
import 'rxjs/add/operator/map';

@Injectable()
export class PacientePrescricaoItemService {
    url: string = 'web/pep/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    get(objParams) {
        const url = `${this.url}pacientePrescricaoItem/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, objParams);
    }

    salvar(objTipo) {
        const url = `${this.url}pacientePrescricaoItem/${Sessao.getToken()}`;
        
        return this.servidor.realizarPost(url, objTipo);
    }

    atualizar(id, objTipo) {
        const url = `${this.url}pacientePrescricaoItem/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, objTipo);
    }

    excluir(id) {
        const url = `${this.url}pacientePrescricaoItem/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDelete(url);
    }

    getLog(objParams) {
        const url = `${this.url}pacientePrescricaoItemLog/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, objParams);
    }

    salvarLog(objTipo) {
        const url = `${this.url}pacientePrescricaoItemLog/${Sessao.getToken()}`;
        
        return this.servidor.realizarPost(url, objTipo);
    }

    atualizarLog(id, objTipo) {
        const url = `${this.url}pacientePrescricaoItemLog/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, objTipo);
    }
}