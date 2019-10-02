import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class TemaGrupoService {
    url: string = 'web/pep/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    post(temaAgendamentoGrupo) {
        const url = `${this.url}grupoTema/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, temaAgendamentoGrupo);
    }

    put(temaAgendamentoGrupo, id) {
        const url = `${this.url}grupoTema/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, temaAgendamentoGrupo);
    }

    delete(id) {
        const url = `${this.url}grupoTema/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDelete(url);
    }

    get(param, geturl = false) {
        const url = `${this.url}grupoTema/${Sessao.getToken()}`;

        if (geturl){
            return this.servidor.getUrl(url, param);
        }

        return this.servidor.realizarGetParam(url, param);
    }

    getGrupoTemaCompleto(param) {
        const url = `${this.url}grupoTemaCompleto/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, param);
    }

    getEspecialidadeTemaGrupo(param) {
        const url = `${this.url}especialidadeTemaGrupo/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, param);
    }

    getPaginado(pagina:number, quantidade:number) {
        const url = `${this.url}temaAgendamentoGrupoPaginado/${Sessao.getToken()}/${pagina}/${quantidade}`;

        return this.servidor.realizarGet(url);
    }

    getGrupoPorCodigo(temaId) {
        const url = `${this.url}temaAgendamentoGrupo/${Sessao.getToken()}/${temaId}`;

        return this.servidor.realizarGet(url);
    }

    getGrupoLike(tema) {
        const url = `${this.url}temaAgendamentoGrupo/${Sessao.getToken()}/${tema}`;

        return this.servidor.realizarGet(url);
    }
}