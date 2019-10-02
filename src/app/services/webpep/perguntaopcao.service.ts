import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class PerguntaOpcaoService {
    url: string = 'web/pep/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    get() {
        const url = `${this.url}perguntaOpcao/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }

    getId(id) {
        const url = `${this.url}perguntaOpcao/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarGet(url);
    }

    getPorPerguntaId(idPergunta) {
        const url = `${this.url}perguntaOpcaoPorPerguntaId/${Sessao.getToken()}/${idPergunta}`;

        return this.servidor.realizarGet(url);
    }

    inserir(perguntaOpcao) {
        const url = `${this.url}perguntaOpcao/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, perguntaOpcao);
    }

    atualizar(id, perguntaOpcao) {
        const url = `${this.url}perguntaOpcao/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, perguntaOpcao);
    }

    apagar(id) {
        const url = `${this.url}perguntaOpcao/${Sessao.getToken()}/${id}`;
        return this.servidor.realizarDeleteSemBody(url);
    }
}