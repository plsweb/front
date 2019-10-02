import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class ServiceDinamico {
    url: string = 'web/pep/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    ajax(tipo = '', sUrl = '', param = null) {
        let url = `${sUrl}`;

        url = url.replace(/TOKEN/, Sessao.getToken());

        return this.servidor.realizarGetParam(url, param);
    }
}