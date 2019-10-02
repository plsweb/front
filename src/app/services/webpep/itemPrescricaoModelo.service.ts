import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Http } from '@angular/http';
import { Sessao } from '../sessao';

@Injectable()
export class ItemPrescricaoModeloService {
    url: string = 'web/pep/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    get(objParams) {
        const url = `${this.url}prescricaoModeloItem/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, objParams);
    }

    salvar(objTipo) {
        const url = `${this.url}prescricaoModeloItem/${Sessao.getToken()}`;
        
        return this.servidor.realizarPost(url, objTipo);
    }

    atualizar(id, objTipo) {
        const url = `${this.url}prescricaoModeloItem/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, objTipo);
    }

    excluir(id) {
        const url = `${this.url}prescricaoModeloItem/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDelete(url);
    }

    ordenar(objParams) {
        const url = `${this.url}prescricaoModeloItemTrocaOrdem/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, objParams);
    }
}