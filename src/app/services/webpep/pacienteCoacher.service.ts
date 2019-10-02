import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class PacienteCoacherService {
    url: string = 'web/pep/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    getPacienteCoacher(request, geturl = false){
        const url = `${this.url}pacienteCoacher/${Sessao.getToken()}`;
        return this.servidor.realizarGetParam(url, request);
    }

    deletePacienteCoacher(id){
        const url = `${this.url}pacienteCoacher/${Sessao.getToken()}/${id}`;
        return this.servidor.realizarDelete(url);
    }

    postPacienteCoacher(request){
        const url = `${this.url}pacienteCoacher/${Sessao.getToken()}`;
        return this.servidor.realizarPost(url, request);
    }

    putPacienteCoacher(request){
        const url = `${this.url}pacienteCoacher/${Sessao.getToken()}/${request.id}`;
        return this.servidor.realizarPut(url, request);
    }

    getAcoes(param){
        const url = `${this.url}acoesCoacher/${Sessao.getToken()}`;
        return this.servidor.realizarGetParam(url, param);
    }
}