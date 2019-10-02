import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class DicionarioTissService {
    url: string = 'tiss/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor= new Servidor(http, router);
    }

    getCaraterAtendimento() {
        const url = `${this.url}caraterAtendimento/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }

    getTipoInternacao() {
        const url = `${this.url}tipoInternacao/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }

    getTipoEncerramento() {
        const url = `${this.url}tipoEncerramento/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }

    getTipoAtendimento() {
        const url = `${this.url}tipoAtendimento/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }
    
    getTipoFaturamento() {
        const url = `${this.url}tipoFaturamento/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }
    getRegimeInternacao() {
        const url = `${this.url}regimeInternacao/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }
    getTissAcidente() {
        const url = `${this.url}acidente/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }
    getTipoConsulta() {
        const url = `${this.url}tipoConsulta/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }
    getUnidadeMedida() {
        const url = `${this.url}unidadeMedida/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }
    getViaAcesso() {
        const url = `${this.url}viaAcesso/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }
    getDespesa() {
        const url = `${this.url}despesa/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }
    getTecnica() {
        const url = `${this.url}tecnica/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }
    

    getMensagemTISS(objParams) {
        const url = `${this.url}mensagem/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, objParams);
    }
}
