import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Http } from '@angular/http';
import { Servidor, Sessao } from 'app/services';

@Injectable()
export class UtilService {
    url: string = 'web/util/';
    urlPep: string = 'web/pep/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    buscaPorCep(cep) {
        const url = `${this.url}cep/${Sessao.getToken()}/${cep}`;

        return this.servidor.realizarGet(url);
    }

    getCidades(objParam){
        const url = `${this.url}cidade/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, objParam);
    }

    getUrlBuscaTabelaEntrada(urlParam, tabela, search){
        const url = `${urlParam}${tabela}/${Sessao.getToken()}/${search}`;

        return this.servidor.getUrl(url);
    }

    getUrlBuscaTabelaEntradaNomeLike(tabela, search, campoLike, adicional){
        let url = `${this.url}likeGenerico/${Sessao.getToken()}?like=${search}&nomeTabela=${tabela}&campoLike=${campoLike}&campoRetorno=${adicional}`;

        return this.servidor.realizarGet(url);
    }

    getTabelas(objParams){
        const url = `${this.url}tabela/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, objParams);
    }

    getCamposTabelas(objParams){
        const url = `${this.url}tabelaCampos/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, objParams);
    }

    getArquivo(id, link = false) {
        const url = `${this.url}arquivo/${Sessao.getToken()}/${id}`;

        return (link) ? `${this.servidor.getUrl('')}${url}` : this.servidor.realizarGet(url);
    }

    postArquivo(objParams) {
        const url = `${this.url}arquivo/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, objParams);
    }

    putArquivo(id, objParams) {
        const url = `${this.url}arquivo/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, objParams);
    }

    deleteArquivo(id) {
        const url = `${this.url}arquivo/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDeleteSemBody(url);
    }

    postSlack(mensagem) {
        const url = `${this.url}slack/${Sessao.getToken()}/${mensagem}`;

        return this.servidor.realizarPost(url);
    }
}