import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';
import 'rxjs/add/operator/map';

@Injectable()
export class ProdutoItemService {
    url: string = 'web/pep/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    get(objParams) {
        const url = `${this.url}prescricaoItemProduto/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, objParams);
    }

    salvar(objTipo) {
        const url = `${this.url}prescricaoItemProduto/${Sessao.getToken()}`;
        
        return this.servidor.realizarPost(url, objTipo);
    }

    atualizar(id, objTipo) {
        const url = `${this.url}prescricaoItemProduto/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, objTipo);
    }

    excluir(id) {
        const url = `${this.url}prescricaoItemProduto/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDelete(url);
    }

    getFrequencias(objParams){
        const url = `${this.url}prescricaoFrequencia/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, objParams);
    }

    getUnidades(objParams){
        const url = `${this.url}prescricaoUnidade/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, objParams);
    }

    getViasAcesso(objParams){
        const url = `${this.url}viaAcesso/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, objParams);
    }

}
