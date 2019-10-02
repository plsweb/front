import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class TipoBloqueioService {
    url: string = 'web/pep/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    getTiposBloqueio() {
        const url = `${this.url}atendimentoBloqueio/${Sessao.getToken()}`;
        return this.servidor.realizarGet(url);
    }

    atendimentoBloqueio(request){
        const url = `${this.url}atendimentoBloqueio/${Sessao.getToken()}`;
        return this.servidor.realizarGetParam(url, request);
    }

    atendimentoBloqueioPaginado(pagina:number, quantidade:number) {
        const url = `${this.url}atendimentoBloqueioPaginado/${Sessao.getToken()}/${pagina}/${quantidade}`;
        return this.servidor.realizarGet(url);
    }

    atendimentoBloqueioLikePaginado(pagina:number, quantidade:number, valor) {
        const url = `${this.url}atendimentoBloqueioLikePaginado/${Sessao.getToken()}/${valor}/${pagina}/${quantidade}`;
        return this.servidor.realizarGet(url);
    }

    salvar(objTipo) {
        const url = `${this.url}atendimentoBloqueio/${Sessao.getToken()}`;
        return this.servidor.realizarPost(url, objTipo);
    }

    atualizar(id, objTipo) {
        const url = `${this.url}atendimentoBloqueio/${Sessao.getToken()}/${id}`;
        return this.servidor.realizarPut(url, objTipo);
    }

    excluir(id) {
        const url = `${this.url}atendimentoBloqueio/${Sessao.getToken()}/${id}`;
        return this.servidor.realizarDelete(url);
    }

}
