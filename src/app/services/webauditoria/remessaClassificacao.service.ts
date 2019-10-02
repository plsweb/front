import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class RemessaClassificacaoService {
    url: string = 'web/auditoria/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    get(request = {}, geturl = false){
        const url = `${this.url}remessaClassificacao/${Sessao.getToken()}`;

        if (geturl){
            return this.servidor.getUrl(url, request);
        }

        return this.servidor.realizarGetParam(url, request);
    }

    delete(id){
        const url = `${this.url}remessaClassificacao/${Sessao.getToken()}/${id}`;
        return this.servidor.realizarDelete(url);
    }

    post(request){
        const url = `${this.url}remessaClassificacao/${Sessao.getToken()}`;
        return this.servidor.realizarPost(url, request);
    }

    put(request){
        const url = `${this.url}remessaClassificacao/${Sessao.getToken()}/${request.id}`;
        return this.servidor.realizarPut(url, request);
    }
}