import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class ResponsavelAcaoService {
    url: string = 'web/pep/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }


    getResponsaveisAcao(objParam, geturl = false){
        const url = `${this.url}paciente/${Sessao.getToken()}?like=${objParam['like']}`;

        if (geturl){
            return this.servidor.getUrl(url, objParam);
        }

        return this.servidor.realizarGet(url, objParam);
    }

    deletarResponsaveisAcao(id){
        const url = `${this.url}paciente/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDelete(url);
    }

    salvarResponsaveisAcao(id = false, objParam){
        const url = `${this.url}paciente/${Sessao.getToken()}`;
        return this.servidor.realizarPost(url, objParam);
    }

    atualizarResponsaveisAcao(id, objParam){
        const url = `${this.url}paciente/${Sessao.getToken()}/${id}`;
        return this.servidor.realizarPut(url, objParam);
    }
    
}