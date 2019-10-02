import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { Router } from '@angular/router';
import { Sessao, Servidor } from 'app/services';

@Injectable()
export class TipoAtendimentoService {
    url: string = 'web/pep/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    getTiposConfiguracao() {
        const url = `${this.url}atendimentoTipo/${Sessao.getToken()}`;
        return this.servidor.realizarGet(url);
    }

    get() {
        const url = `${this.url}atendimentoTipo/${Sessao.getToken()}`;
        return this.servidor.realizarGet(url);
    }

    atendimentoTipo(request){
        const url = `${this.url}atendimentoTipo/${Sessao.getToken()}`;
        return this.servidor.realizarGetParam(url, request);
    }

    atendimentoTipoPaginado(pagina:number, quantidade:number) {
        const url = `${this.url}atendimentoTipoPaginado/${Sessao.getToken()}/${pagina}/${quantidade}`;
        return this.servidor.realizarGet(url);
    }

    atendimentoTipoLikePaginado(pagina:number, quantidade:number, valor) {
        const url = `${this.url}atendimentoTipoLikePaginado/${Sessao.getToken()}/${valor}/${pagina}/${quantidade}`;
        return this.servidor.realizarGet(url);
    }

    salvar(objTipo) {
        const url = `${this.url}atendimentoTipo/${Sessao.getToken()}`;
        return this.servidor.realizarPost(url, objTipo);
    }

    atualizar(id, objTipo) {
        const url = `${this.url}atendimentoTipo/${Sessao.getToken()}/${id}`;
        return this.servidor.realizarPut(url, objTipo);
    }

    excluir(id) {
        const url = `${this.url}atendimentoTipo/${Sessao.getToken()}/${id}`;
        return this.servidor.realizarDelete(url);
    }

    salvarAtendimentoTipoUnidade(objTipo) {
        const url = `${this.url}atendimentoTipoUnidade/${Sessao.getToken()}`;
        return this.servidor.realizarPost(url, objTipo);
    }

    getAtendimentoTipoUnidade(objTipo) {
        const url = `${this.url}atendimentoTipoUnidade/${Sessao.getToken()}`;
        return this.servidor.realizarGetParam(url, objTipo);
    }

    excluirAtendimentoTipoUnidade(obj) {
        const url = `${this.url}atendimentoTipoUnidade/${Sessao.getToken()}`;
        return this.servidor.realizarDelete(url, obj);
    }
}