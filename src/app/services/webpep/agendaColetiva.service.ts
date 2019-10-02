import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class AgendamentoColetivoService {
    url: string = 'web/pep/';
    private servidor: Servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }
    
    postAgendamentoColetivo(objParams) {
        const url = `${this.url}agendamentoColetivo/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, objParams);
    }

    getAgendamentoColetivo(param = null) {
        const url = `${this.url}agendamentoColetivo/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, param);
    }

    putAgendamentoColetivo(id, objParams) {
        const url = `${this.url}agendamentoColetivo/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, objParams);
    }

    deleteAgendamentoColetivo(id) {
        const url = `${this.url}agendamentoColetivo/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDeleteSemBody(url);
    }

}