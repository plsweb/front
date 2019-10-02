import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class PacienteCuidadoExecucaoService {
    url: string = 'web/pep/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    getPacienteCuidadoExecucao(request, geturl = false){
        const url = `${this.url}pacienteCuidadoExecucao/${Sessao.getToken()}`;
        return this.servidor.realizarGetParam(url, request);
    }

    deletePacienteCuidadoExecucao(id){
        const url = `${this.url}pacienteCuidadoExecucao/${Sessao.getToken()}/${id}`;
        return this.servidor.realizarDelete(url);
    }

    postPacienteCuidadoExecucao(request){
        const url = `${this.url}pacienteCuidadoExecucao/${Sessao.getToken()}`;
        return this.servidor.realizarPost(url, request);
    }

    postPacienteCuidadoExecucaoFiltro(request, requestURL){
        const url = `${this.url}pacienteCuidadoExecucaoFiltro/${Sessao.getToken()}`;
        return this.servidor.realizarPost(url, request, requestURL);
    }

    putPacienteCuidadoExecucao(id, request){
        const url = `${this.url}pacienteCuidadoExecucao/${Sessao.getToken()}/${id}`;
        return this.servidor.realizarPut(url, request);
    }
}