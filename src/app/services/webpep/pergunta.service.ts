import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class PerguntaService {
    url: string = 'web/pep/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    get() {
        const url = `${this.url}pergunta/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }

    getId(id) {
        const url = `${this.url}pergunta/${Sessao.getToken()}?id=${id}`;

        return this.servidor.realizarGet(url);
    }

    inserir(pergunta) {
        const url = `${this.url}pergunta/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, pergunta);
    }

    atualizar(id, pergunta) {
        const url = `${this.url}pergunta/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, pergunta);
    }

    excluir(id) {
        const url = `${this.url}pergunta/${Sessao.getToken()}?id=${id}`;

        return this.servidor.realizarDeleteSemBody(url);
    }

    pergunta(objParams, geturl = false){
        const url = `${this.url}pergunta/${Sessao.getToken()}`;

        if (geturl){
            return this.servidor.getUrl(url, objParams);
        }

        return this.servidor.realizarGetParam(url, objParams);
    }

    perguntaPaginado(pagina:number, quantidade:number) {
        const url = `${this.url}perguntaPaginado/${Sessao.getToken()}/${pagina}/${quantidade}`;

        return this.servidor.realizarGet(url);
    }

    perguntaLikePaginado(pagina:number, quantidade:number, like, geturl = false) {
        const url = `${this.url}perguntaLikePaginado/${Sessao.getToken()}/${like}/${pagina}/${quantidade}`;

        if (geturl){
            return this.servidor.getUrl(url);
        }

        return this.servidor.realizarGet(url);
    }

    adicionarEmUmGrupo(grupoPergunta) {
        const url = `${this.url}grupoPergunta/${Sessao.getToken()}`;

        delete grupoPergunta.ordem;
        
        return this.servidor.realizarPost(url, grupoPergunta);
    }

    excluirDeUmGrupo(id){
        const url = `${this.url}grupoPergunta/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDeleteSemBody(url);
    }

    getPerguntaGrupo() {
        const url = `${this.url}grupoPergunta/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }

    getPerguntaGrupoPorId(id) {
        const url = `${this.url}grupoPergunta/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarGet(url);
    }

    getPerguntaTipo() {
        const url = `${this.url}perguntaTipo/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }
}