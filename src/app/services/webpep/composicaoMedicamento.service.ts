import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class ComposicaoMedicamentoService {
    url: string = 'web/pep/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    get(objParams) {
        const url = `${this.url}medicamentoComposicao/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, objParams);
    }

    salvar(objTipo) {
        const url = `${this.url}medicamentoComposicao/${Sessao.getToken()}`;
        
        return this.servidor.realizarPost(url, objTipo);
    }

    atualizar(id, objTipo) {
        const url = `${this.url}medicamentoComposicao/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, objTipo);
    }

    excluir(id) {
        const url = `${this.url}medicamentoComposicao/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDelete(url);
    }


    // //////////////////////////////////////

    getComposicao(objParams) {
        const url = `${this.url}composicao/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, objParams);
    }

    salvarComposicao(objTipo) {
        const url = `${this.url}composicao/${Sessao.getToken()}`;
        
        return this.servidor.realizarPost(url, objTipo);
    }

    atualizarComposicao(id, objTipo) {
        const url = `${this.url}composicao/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, objTipo);
    }

    excluirComposicao(id) {
        const url = `${this.url}composicao/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDelete(url);
    }

}
