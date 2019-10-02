import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class MenorValorService {
    url: string = 'web/pep/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    getMenorValorPorImpresso(impresso) {
        const url = `${this.url}menorValorPorImpresso/${Sessao.getToken()}/${impresso}`;

        return this.servidor.realizarGet(url);
    }

    getMenorValorPorImpressoPdf(impresso) {
        return `${this.servidor.getUrl(this.url)}menorValorPorImpressoPdf/${Sessao.getToken()}/${impresso}`;
    }

    getMenorValorPorImpressoGrupo(impresso) {
        const url = `${this.url}menorValorPorImpressoGrupo/${Sessao.getToken()}/${impresso}`;

        return this.servidor.realizarGet(url);
    }

    menorValor(json) {
        const url = `${this.url}menorValor/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, json);
    }
}