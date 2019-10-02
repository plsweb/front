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


    getPacienteToken(objParams = {}) {
        const url = `${this.url}pacienteDocumentoPorToken/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, objParams);
    }

    getAlerta(paciente) {
        const url = `${this.url}pacienteAlertaPorPaciente/${Sessao.getToken()}/${paciente}`;

        return this.servidor.realizarGet(url);
    }

    inserirAlerta(alerta) {
        const url = `${this.url}pacienteAlerta/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }

    getId(objParam) {
        const url = `${this.url}pacienteDocumento/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, objParam);
    }

    inserir(formulario) {
        const url = `${this.url}pacienteDocumento/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, formulario);
    }

    delete(id) {
        const url = `${this.url}pacienteDocumento/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDeleteSemBody(url);
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
        // RETORNAR ESSA LINHA
        return `${this.servidor.getUrl(this.url)}evolucaoPdf/${Sessao.getToken()}?pacienteDocumento=${idFormulario}`;

        // return `https://plsweb.unimeduberaba.com.br/webresources/web/pep/evolucaoPdf/${Sessao.getToken()}?pacienteDocumento=${idFormulario}`;
    }

    modeloPdf(idModelo) {
        // RETORNAR ESSA LINHA
        return `${this.servidor.getUrl(this.url)}evolucaoPdf/${Sessao.getToken()}?formularioModelo=${idModelo}`;

        // return `https://plsweb.unimeduberaba.com.br/webresources/web/pep/evolucaoPdf/${Sessao.getToken()}?formularioModelo=${idModelo}`;
    }

    evolucaoGrupoPdf(idSessao) {
        // RETORNAR ESSA LINHA
        return `${this.servidor.getUrl(this.url)}getEvolucaoGrupoPdf/${Sessao.getToken()}/${idSessao}`;

        // return `https://plsweb.unimeduberaba.com.br/webresources/web/pep/getEvolucaoGrupoPdf/${Sessao.getToken()}/${idSessao}`;
    }

    getRespostas(objParams) {
        const url = `${this.url}formularioResposta/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, objParams);
    }

    getFormularioRespostaOrdenado(objParams){
        const url = `${this.url}formularioRespostaPorPacienteDocumento/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, objParams);
    }
    
    formulariosComPerguntasObrigatoriasPorGrupoSessao(idSessao) {
        const url = `${this.url}buscarFormulariosComPerguntasObrigatoriasNaoRepondidasPorGrupoSessao/${Sessao.getToken()}/${idSessao}`;

        return this.servidor.realizarGet(url);
    }
}