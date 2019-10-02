import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class AgendamentoColetivoUsuarioService {
    url: string = 'web/pep/';
    private servidor: Servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }
    
    postAgendamentoColetivoUsuario(objParams) {
        const url = `${this.url}agendamentoColetivoUsuario/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, objParams);
    }

    getAgendamentoColetivoUsuario(param = null) {
        const url = `${this.url}agendamentoColetivoUsuario/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, param);
    }

    putAgendamentoColetivoUsuario(id, objParams) {
        const url = `${this.url}agendamentoColetivoUsuario/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, objParams);
    }

    deleteAgendamentoColetivoUsuario(id) {
        const url = `${this.url}agendamentoColetivoUsuario/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDeleteSemBody(url);
    }

}