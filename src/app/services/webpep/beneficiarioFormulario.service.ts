import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class BeneficiarioFormularioService {
    url: string = 'web/pep/';
    urlAuditoria: string = 'web/auditoria/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    get() {
        const url = `${this.url}beneficiarioFormulario/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }

    getBeneficario(beneficiario) {
        const url = `${this.url}beneficiarioFormularioPorBeneficiario/${Sessao.getToken()}/${beneficiario}`;

        return this.servidor.realizarGet(url);
    }


    getBeneficarioToken(request) {
        const url = `${this.urlAuditoria}beneficiarioPacienteDocumentoPorToken/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, request);
    }

    getAlerta(beneficiario) {
        const url = `${this.url}beneficiarioAlertaPorBeneficiario/${Sessao.getToken()}/${beneficiario}`;

        return this.servidor.realizarGet(url);
    }

    inserirAlerta(alerta) {
        const url = `${this.url}beneficiarioAlerta/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }

    getId(id) {
        const url = `${this.url}beneficiarioFormulario/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarGet(url);
    }

    inserir(formulario) {
        const url = `${this.url}beneficiarioFormulario/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, formulario);
    }

    atualizar(id, formulario) {
        const url = `${this.url}beneficiarioFormulario/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, formulario);
    }

    getCid(id) {
        const url = `${this.url}beneficiarioCid/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarGet(url);
    }

    evolucaoPdf(idFormulario) {
        return `${this.servidor.getUrl(this.url)}evolucaoPdf/${Sessao.getToken()}?pacienteDocumento=${idFormulario}`;
    }
}