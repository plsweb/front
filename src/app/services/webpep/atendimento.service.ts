import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class AtendimentoService {
    url: string = 'web/pep/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    get() {
        const url = `${this.url}atendimento/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }

    post(atendimento) {
        const url = `${this.url}atendimento/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, atendimento);
    }

    postEncaixe(atendimento, id) {
        const url = `${this.url}atendimentoEncaixe/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPost(url, atendimento);
    }

    getId(id) {
        const url = `${this.url}atendimento/${Sessao.getToken()}?id=${id}`;

        return this.servidor.realizarGet(url);
    }

    filtrar(filtro, objParam = null) {
        let url = `${this.url}atendimentoFiltro/${Sessao.getToken()}`;

        if( objParam ){
            url += `?pagina=${objParam['pagina']}&quantidade=${objParam['quantidade']}&group=${objParam['group'] || false}`;
        }

        return this.servidor.realizarPost(url, filtro);
    }

    inserir(atendimento) {
        const url = `${this.url}atendimento/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, atendimento);
    }

    atualizar(id, atendimento) {
        const url = `${this.url}atendimento/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, atendimento);
    }
}