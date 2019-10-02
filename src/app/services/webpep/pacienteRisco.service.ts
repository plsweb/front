import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class PacienteRiscoService {
    url: string = 'web/pep/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    getPacienteRisco(request){
        const url = `${this.url}pacienteRisco/${Sessao.getToken()}`;
        return this.servidor.realizarGetParam(url, request);
    }

    postPacienteRiscoFiltro(request){
        const url = `${this.url}pacienteRiscoFiltro/${Sessao.getToken()}`;
        return this.servidor.realizarPost(url, request);
    }

    deletePacienteRisco(id){
        const url = `${this.url}pacienteRisco/${Sessao.getToken()}/${id}`;
        return this.servidor.realizarDelete(url);
    }

    postPacienteRisco(request){
        const url = `${this.url}pacienteRisco/${Sessao.getToken()}`;
        return this.servidor.realizarPost(url, request);
    }

    putPacienteRisco(id, request){
        const url = `${this.url}pacienteRisco/${Sessao.getToken()}/${id}`;
        return this.servidor.realizarPut(url, request);
    }

}