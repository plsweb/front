import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class EstoqueService {
    url: string = 'web/pep/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    get(objParams) {
        const url = `${this.url}baixaEstoque/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, objParams);
    }

    post(objTipo) {
        const url = `${this.url}baixaEstoque/${Sessao.getToken()}`;
        
        return this.servidor.realizarPost(url, objTipo);
    }

    put(id, objTipo) {
        const url = `${this.url}baixaEstoque/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, objTipo);
    }

    delete(id) {
        const url = `${this.url}baixaEstoque/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDelete(url);
    }

}
