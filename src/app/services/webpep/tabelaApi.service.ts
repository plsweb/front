import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class TabelaApi {
    url: string = 'web/pep/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    get(param = null) {
        const url = `${this.url}tabelaApi/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, param);
    }

    salvar(id = null, param = null) {
        const url = `${this.url}tabelaApi/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, param);
    }

    atualizar(id, param) {
        const url = `${this.url}tabelaApi/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, param);
    }

    deletar(id) {
        const url = `${this.url}tabelaApi/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDelete(url);
    }

    getColunas(param = null) {
        const url = `${this.url}tabelaApiColuna/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, param);
    }

    salvarColunas(id = null, param = null) {
        const url = `${this.url}tabelaApiColuna/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, param);
    }

    atualizarColunas(id, param = null) {
        const url = `${this.url}tabelaApiColuna/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, param);
    }

    deletarColunas(id) {
        const url = `${this.url}tabelaApiColuna/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDelete(url);
    }

    getRests(param = null) {
        const url = `${this.url}tabelaApiRest/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, param);
    }

    salvarRests(id = null, param = null) {
        const url = `${this.url}tabelaApiRest/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, param);
    }

    atualizarRests(id, param = null) {
        const url = `${this.url}tabelaApiRest/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, param);
    }

    deletarRests(id) {
        const url = `${this.url}tabelaApiRest/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDelete(url);
    }

    getTiposColuna(param){
        const url = `${this.url}filtroClasse/${Sessao.getToken()}`;
        return this.servidor.realizarGetParam(url, param);
    }

    getTiposRest(param){
        const url = `${this.url}apiTipo/${Sessao.getToken()}`;
        return this.servidor.realizarGetParam(url, param);
    }
}