import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class RelatorioService {
    url: string = 'web/pep/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    post(param, geturl = false) {
        //console.log(JSON.stringify(param));
        //var objJsonB64 = btoa(JSON.stringify(param));
        const url = `${this.url}relatorio/${Sessao.getToken()}`;

        if (geturl){
            return this.servidor.getUrl(url);
        }

        return this.servidor.realizarPost(url, param);
    }

    postPerguntasRelatorio(requestBODY, requestURL){
        const url = `${this.url}perguntaRelatorio/${Sessao.getToken()}?pagina=${requestURL.pagina}&quantidade=${requestURL.quantidade}`;

        return this.servidor.realizarPost(url, requestBODY);
    }
}