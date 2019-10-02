import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class ExameService {
    url: string = 'web/pep/';
    private servidor: Servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    get(paciente) {
        const url = `${this.url}pacienteExame/${Sessao.getToken()}/${paciente}`;
        return this.servidor.realizarGet(url);
    }

    getGrupoBeneficiario(paciente) {
        const url = `${this.url}beneficiarioExameGrupo/${Sessao.getToken()}/${paciente}`;
        return this.servidor.realizarGet(url);
    }

    getGrupo(paciente) {
        const url = `${this.url}pacienteExameGrupo/${Sessao.getToken()}/${paciente}`;
        return this.servidor.realizarGet(url);
    }

    getGrupoFiltro(request) {
        const url = `${this.url}pacienteExameGrupoFiltro/${Sessao.getToken()}`;
        return this.servidor.realizarGetParam(url, request);
    }

    getUrlPacs(impresso){
        const url = `${this.url}exameUrlPacs/${Sessao.getToken()}/${impresso}`;
        return this.servidor.realizarGet(url);
    }

    getPorGuia(guia) {
        const url = `${this.url}pacienteExamePorGuia/${Sessao.getToken()}/${guia}`;
        return this.servidor.realizarGet(url);
    }

    getLink(id, getUrl = false):any {
        const url = `${this.url}linkExame/${Sessao.getToken()}/${id}`;

        if( getUrl ){
            return this.servidor.getUrl(url);
        }
        return this.servidor.realizarGetBody(url);
    }
}