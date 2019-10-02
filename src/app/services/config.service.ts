import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Sessao } from './sessao';
import { Servidor } from './servidor';

@Injectable()
export class ConfigService {
    url: string = 'web/auditoria/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    getCfg(request = {}, geturl = false) {
        const url = `${this.url}guiaAdmissao/${Sessao.getToken()}`;

        if (geturl){
            return this.servidor.getUrl(url, request);
        }

        return this.servidor.realizarGetParam(url, request);
    }

    delete(id){
        const url = `${this.url}configService/${Sessao.getToken()}/${id}`;
        return this.servidor.realizarDelete(url);
    }

    post(request){
        const url = `${this.url}configService/${Sessao.getToken()}`;
        return this.servidor.realizarPost(url, request);
    }

    put(request){
        const url = `${this.url}configService/${Sessao.getToken()}/${request.id}`;
        return this.servidor.realizarPut(url, request);
    }
}