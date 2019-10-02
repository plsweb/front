import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class FormularioModeloService {
    url: string = 'web/pep/';
    private servidor: Servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    salvarModelo(request){
        const url = `${this.url}formularioModelo/${Sessao.getToken()}`;
        return this.servidor.realizarPost(url, request);
    }

    getModelos(objParams){
        const url = `${this.url}formularioModelo/${Sessao.getToken()}`;
        return this.servidor.realizarGetParam(url, objParams);
    }

    atualizarModelo(id, request){
        const url = `${this.url}formularioModelo/${Sessao.getToken()}/${id}`;
        return this.servidor.realizarPut(url, request);
    }

    deletarModelo(id){
        const url = `${this.url}formularioModelo/${Sessao.getToken()}/${id}`;
        return this.servidor.realizarDeleteSemBody(url);
    }

}