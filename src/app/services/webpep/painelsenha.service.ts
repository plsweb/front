import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class PainelSenhaService {
    url: string = 'painelsenha/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    get(unidade) {
        const url = `${this.url}senha/${Sessao.getToken()}/${unidade}`;

        return this.servidor.realizarGet(url);
    }

    senha(unidade) {
        const url = `${this.url}senha/${Sessao.getToken()}/${unidade}`;

        return this.servidor.realizarGetBody(url);
    }

    chamarsenha(unidade, guiche, senha) {
        const url = `${this.url}chamarSenha/${Sessao.getToken()}/${unidade}/${guiche}/${senha}`;

        return this.servidor.realizarGetBody(url);
    }

    getAtendentes(codigoVisualUnidade) {
        const url = `${this.url}getAtendentes/${Sessao.getToken()}/${codigoVisualUnidade}`;

        return this.servidor.realizarGet(url);
    }

    getGuiche(codigoVisualUnidade) {
        const url = `${this.url}getGuiche/${Sessao.getToken()}/${codigoVisualUnidade}`;

        return this.servidor.realizarGet(url);
    }

    rechamarsenha(unidade, guiche) {
        const url = `${this.url}rechamarsenha/${Sessao.getToken()}/${unidade}/${guiche}`;

        return this.servidor.realizarGetBody(url);
    }

    iniciarAtendimento(unidade, guiche) {
        const url = `${this.url}iniciarAtendimento/${Sessao.getToken()}/${unidade}/${guiche}`;

        return this.servidor.realizarPutSemBody(url, {});
    }

    finalizarAtendimento(unidade, guiche) {
        const url = `${this.url}finalizarAtendimento/${Sessao.getToken()}/${unidade}/${guiche}`;

        return this.servidor.realizarPutSemBody(url, {});
    }

    encaminharConsultorio(unidade, senha){
        const url = `${this.url}encaminharConsultorio/${Sessao.getToken()}/${unidade}/${senha}`;

        return this.servidor.realizarPutSemBody(url, {});
    }


}