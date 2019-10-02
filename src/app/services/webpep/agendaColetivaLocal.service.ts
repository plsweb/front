import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class AgendamentoColetivoLocalService {
    url: string = 'web/pep/';
    private servidor: Servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }
    
    postAgendamentoColetivoLocal(objParams) {
        const url = `${this.url}agendamentoColetivoLocal/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, objParams);
    }

    getAgendamentoColetivoLocal(param = null) {
        const url = `${this.url}agendamentoColetivoLocal/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, param);
    }

    putAgendamentoColetivoLocal(id, objParams) {
        const url = `${this.url}agendamentoColetivoLocal/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, objParams);
    }

    deleteAgendamentoColetivoLocal(id) {
        const url = `${this.url}agendamentoColetivoLocal/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDeleteSemBody(url);
    }

}