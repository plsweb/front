import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class PacienteDocumentoService {
    url: string = 'web/pep/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    get() {
        const url = `${this.url}pacienteDocumento/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }

    getBeneficario(paciente) {
        const url = `${this.url}pacienteDocumentoPorPaciente/${Sessao.getToken()}/${paciente}`;

        return this.servidor.realizarGet(url);
    }


    getBeneficarioToken(paciente) {
        const url = `${this.url}pacienteDocumentoPorPacientePorToken/${Sessao.getToken()}/${paciente}`;

        return this.servidor.realizarGet(url);
    }

    getAlerta(paciente) {
        const url = `${this.url}pacienteAlertaPorPaciente/${Sessao.getToken()}/${paciente}`;

        return this.servidor.realizarGet(url);
    }

    inserirAlerta(alerta) {
        const url = `${this.url}pacienteAlerta/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }

    getId(id) {
        const url = `${this.url}pacienteDocumento/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarGet(url);
    }

    inserir(formulario) {
        const url = `${this.url}pacienteDocumento/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, formulario);
    }

    atualizar(id, formulario) {
        const url = `${this.url}pacienteDocumento/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, formulario);
    }

    getCid(id) {
        const url = `${this.url}pacienteCid/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarGet(url);
    }

    evolucaoPdf(idFormulario) {
        return `${this.servidor.getUrl(this.url)}evolucaoPdf/${Sessao.getToken()}?pacienteDocumento=${idFormulario}`;
    }
}