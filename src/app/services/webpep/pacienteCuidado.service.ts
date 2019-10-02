import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class PacienteCuidadoService {
    url: string = 'web/pep/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    getPacienteCuidado(request){
        const url = `${this.url}pacienteCuidado/${Sessao.getToken()}`;
        return this.servidor.realizarGetParam(url, request);
    }

    postPacienteCuidadoFiltro(request, semPermissao = false){
        const url = `${this.url}pacienteCuidadoFiltro/${Sessao.getToken()}?semPermissao=${semPermissao}`;
        return this.servidor.realizarPost(url, request);
    }

    deletePacienteCuidado(id){
        const url = `${this.url}pacienteCuidado/${Sessao.getToken()}/${id}`;
        return this.servidor.realizarDelete(url);
    }

    postPacienteCuidado(request){
        const url = `${this.url}pacienteCuidado/${Sessao.getToken()}`;
        return this.servidor.realizarPost(url, request);
    }

    putPacienteCuidado(id, request){
        const url = `${this.url}pacienteCuidado/${Sessao.getToken()}/${id}`;
        return this.servidor.realizarPut(url, request);
    }

    gerarPacienteCuidado(request = {}){
        const url = `${this.url}gerarPacienteCuidado/${Sessao.getToken()}`;
        return this.servidor.realizarPost(url, request);
    }

    getPerguntasQueLevaramAoRisco(request){
        const url = `${this.url}perguntasQueLevaramAoRisco/${Sessao.getToken()}`;
        return this.servidor.realizarGetParam(url, request);
    }

    postFinalizaPacienteRisco(request){
        const url = `${this.url}finalizaPacienteRisco/${Sessao.getToken()}/${request.idPaciente}/${request.idPacienteRisco}/${request.idTipoEncerramento}`;
        return this.servidor.realizarPost(url, request);
    }
}