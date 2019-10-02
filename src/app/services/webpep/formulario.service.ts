import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class FormularioService {
    url: string = 'web/pep/';
    private servidor: Servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    get() {
        const url = `${this.url}formulario/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }

    getFormularioLike(formularioLike) {
        const url = `${this.url}formulario/${Sessao.getToken()}?like=${formularioLike}&simples=true`;

        return this.servidor.realizarGet(url);
    }

    // getPerguntaPorFormularioGrupo(formularioId) {// TODO
    //     const url = `${this.url}grupoPerguntaPorFormularioGrupo/${Sessao.getToken()}/${formularioId}`;

    //     return this.servidor.realizarGet(url);
    // }

    // getAtivos() {// TODO
    //     const url = `${this.url}formularioAtivo/${Sessao.getToken()}`;

    //     return this.servidor.realizarGet(url);
    // }

    formularioPaginadoLike(objParams) {
        const url = `${this.url}formulario/${Sessao.getToken()}`;

        return this.servidor.getUrl(url, objParams);
    }

    formularioPaginado(objParams) {
        const url = `${this.url}formulario/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, objParams);
    }

    getId(id) {
        const url = `${this.url}formulario/${Sessao.getToken()}?id=${id}`;

        return this.servidor.realizarGet(url);
    }

    getFormularioPorToken() {
        const url = `${this.url}formularioPorToken/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }

    getFormularioPorTokenAtivo() {
        const url = `${this.url}formularioPorTokenAtivo/${Sessao.getToken()}`;
        return this.servidor.realizarGet(url);
    }

    getFormularioPorTokenAtivoTipo(tipo, request) {
        const url = `${this.url}formularioPorTokenAtivo/${Sessao.getToken()}/${tipo}`;
        return this.servidor.realizarGetParam(url, request);
    }

    getRoles(id) {
        const url = `${this.url}formularioRolePorFormulario/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarGet(url);
    }

    postFormularioResposta(obj){
        const url = `${this.url}formularioResposta/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, obj);
    }

    putFormularioResposta(id, obj){
        const url = `${this.url}formularioResposta/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, obj);
    }

    getGrupos(id) {
        const url = `${this.url}formularioGrupoPorFormulario/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarGet(url);
    }

    getformularioGrupo() {
        const url = `${this.url}formularioGrupo/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }

    getformularioGrupoPorId(id) {
        const url = `${this.url}formularioGrupo/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarGet(url);
    }

    putformularioGrupoPorId(id, obj) {
        const url = `${this.url}formularioGrupo/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, obj);
    }

    deleteGrupo(id) {
        const url = `${this.url}formularioGrupo/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDeleteSemBody(url);
    }

    addGrupo(grupo) {
        const url = `${this.url}formularioGrupo/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, grupo);
    }

    putGrupo(id, grupo) {
        const url = `${this.url}formularioGrupo/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, grupo);
    }

    addRole(papel) {
        const url = `${this.url}formularioRole/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, papel);
    }

    removeRole(id) {
        const url = `${this.url}formularioRole/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDeleteSemBody(url);
    }

    inserir(formulario) {
        const url = `${this.url}formulario/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, formulario);
    }

    atualizar(id, formulario) {
        const url = `${this.url}formulario/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, formulario);
    }

    ordenar(formularioGrupo) {
        const url = `${this.url}formularioGrupoTrocaOrdem/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, formularioGrupo);
    }

}