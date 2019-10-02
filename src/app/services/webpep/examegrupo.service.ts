import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class ExameGrupoService {
    url: string = 'web/pep/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    get() {
        const url = `${this.url}exameGrupo/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }

    getId(id) {
        const url = `${this.url}exameGrupo/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarGet(url);
    }

    exameGrupoPaginado(pagina:number, quantidade:number) {
        const url = `${this.url}exameGrupoPaginado/${Sessao.getToken()}/${pagina}/${quantidade}`;

        return this.servidor.realizarGet(url);
    }

    inserir(exameGrupo) {
        const url = `${this.url}exameGrupo/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, exameGrupo);
    }

    atualizar(id, exameGrupo) {
        const url = `${this.url}exameGrupo/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, exameGrupo);
    }

    getExameGrupoItem() {
        const url = `${this.url}exameGrupoItem/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }

    getExameGrupoItemId(id) {
        const url = `${this.url}exameGrupoItem/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarGet(url);
    }

    getExameGrupoItemExame(exameId) {
        const url = `${this.url}exameGrupoItemPorExameGrupo/${Sessao.getToken()}/${exameId}`;

        return this.servidor.realizarGet(url);
    }

    inserirExameGrupoItem(exameGrupoItem) {
        const url = `${this.url}exameGrupoItem/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, exameGrupoItem);
    }

    atualizarExameGrupoItem(id, exameGrupoItem) {
        const url = `${this.url}exameGrupoItem/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, exameGrupoItem);
    }

    apagarExameGrupoItem(id) {
        const url = `${this.url}exameGrupoItem/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDeleteSemBody(url);
    }
}