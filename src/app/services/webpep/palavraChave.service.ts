import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class PalavraChaveService {
    url: string = 'web/pep/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    get(request, geturl = false){
        const url = `${this.url}formularioPalavrasChave/${Sessao.getToken()}`;

        if (geturl){
            return this.servidor.getUrl(url, request);
        }

        return this.servidor.realizarGetParam(url, request);
    }

    delete(id){
        const url = `${this.url}formularioPalavrasChave/${Sessao.getToken()}/${id}`;
        return this.servidor.realizarDelete(url);
    }

    post(request){
        const url = `${this.url}formularioPalavrasChave/${Sessao.getToken()}`;
        return this.servidor.realizarPost(url, request);
    }

    put(id, request){
        const url = `${this.url}formularioPalavrasChave/${Sessao.getToken()}/${id}`;
        return this.servidor.realizarPut(url, request);
    }

}