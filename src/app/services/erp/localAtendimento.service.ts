import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class LocalAtendimentoService {
    url: string = 'web/erp/';
    urlPep: string = 'web/pep/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    get() {
        const url = `${this.url}localAtendimento/${Sessao.getToken()}`;
        return this.servidor.realizarGet(url);
    }

    // BUSCA AS UNIDADES DE ATENDIMENTO
    getUnidades(){
        const url = `${this.urlPep}unidadeAtendimento/${Sessao.getToken()}`;
        return this.servidor.realizarGet(url);
    }

    getLocalPorUnidadeId(id){
        const url = `${this.url}localPorUnidadeAtendimento/${Sessao.getToken()}/${id}`;
        return this.servidor.realizarGet(url);
    }

    // BUSCA OS GUICHÊS (CONSULTORIOS) DE ATENDIMENTO
    getGuichesAtendimento(unidadeId) {
        const url = `${this.urlPep}guicheAtendimentoPorUnidadeAtendimento/${Sessao.getToken()}/${unidadeId}`;
        return this.servidor.realizarGet(url);
    }
}
