import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Router } from '@angular/router';
import { Sessao, Servidor } from '../../services';

@Injectable()
export class OrcamentoService {
    url: string = 'web/pep/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    getOrcamento(param) {
        let url = `${this.url}orcamento/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, param);
    }

    postOrcamento(param){
        const url = `${this.url}orcamento/${Sessao.getToken()}`;
        
        return this.servidor.realizarPost(url, param);
    }

    putOrcamento(id, param) {
        const url = `${this.url}orcamento/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, param);
    }

    deleteOrcamento(id) {
        const url = `${this.url}orcamento/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDelete(url);
    }
}