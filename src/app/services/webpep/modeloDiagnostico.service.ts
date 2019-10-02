import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class ModeloDiagnosticoService {
    url: string = 'web/pep/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    getModeloDiagnostico(json) {
        let url = `${this.url}modeloDiagnostico/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, json);
    }

    postModeloDiagnostico(json){
        const url = `${this.url}modeloDiagnostico/${Sessao.getToken()}`;
        
        return this.servidor.realizarPost(url, json);
    }

    putModeloDiagnostico(id, json) {
        const url = `${this.url}modeloDiagnostico/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, json);
    }

    deleteModeloDiagnostico(id) {
        const url = `${this.url}modeloDiagnostico/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDelete(url);
    }
}