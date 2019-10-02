import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class AgendamentoGrupoService {
    url: string = 'web/pep/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    salvarGrupo(agendamentoGrupo) {
        const url = `${this.url}grupo/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, agendamentoGrupo);
    }

    deletarGrupo(id) {
        const url = `${this.url}grupo/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDelete(url);
    }

    atualizarGrupo(agendamentoGrupo, id) {
        const url = `${this.url}grupo/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, agendamentoGrupo);
    }

    get(objParams, geturl = false) {
        const url = `${this.url}grupo/${Sessao.getToken()}`;

        if (geturl){
            return this.servidor.getUrl(url, objParams);
        }

        return this.servidor.realizarGetParam(url, objParams);
    }

    postFiltro(objParams, simples = true) {
        const url = `${this.url}grupoFiltro/${Sessao.getToken()}/?simples=${simples}`;

        return this.servidor.realizarPost(url, objParams);
    }

    getGrupoLike(grupo) {
        const url = `${this.url}grupo/${Sessao.getToken()}/${grupo}`;

        return this.servidor.realizarGet(url);
    }

    getTipoFalta(){
        const url = `${this.url}tipoFalta/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }

    grupoSessao(objParams) {
        const url = `${this.url}grupoSessao/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, objParams);
    }

    iniciarSessao(objParams, sessaoAtual = true){
        let url = `${this.url}montarSessao/${Sessao.getToken()}?sessaoAtual=${sessaoAtual}`;

        return this.servidor.realizarPost(url, objParams);
    }

    salvarGrupoSessao(objParams){
        const url = `${this.url}grupoSessao/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, objParams);
    }

    atualizarGrupoSessao(objParams, id){
        const url = `${this.url}grupoSessao/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, objParams);
    }

    buscarPacientes(objParams){
        const url = `${this.url}grupoPaciente/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, objParams);
    }

    salvarRecorrenciaPaciente(objParams){
        const url = `${this.url}grupoPacienteRecorrencia/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, objParams);
    }

    getRecorrenciaPaciente(objParams){
        const url = `${this.url}grupoPacienteRecorrencia/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, objParams);
    }

    atualizarRecorrenciaPaciente(id, objParams){
        const url = `${this.url}grupoPacienteRecorrencia/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, objParams);
    }

    deletarRecorrenciaPaciente(id){
        const url = `${this.url}grupoPacienteRecorrencia/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDelete(url);
    }

    salvarPacientes(objParams){
        const url = `${this.url}grupoPaciente/${Sessao.getToken()}`;
        
        return this.servidor.realizarPost(url, objParams);
    }

    atualizarPacientes(id, objParams){
        const url = `${this.url}grupoPaciente/${Sessao.getToken()}/${id}`;
        
        return this.servidor.realizarPut(url, objParams);
    }

    deleteGrupoPaciente(id, observacao, tipoEncerr, data){
        const url = `${this.url}grupoPaciente/${Sessao.getToken()}/${id}`;
        
        let objParam = {
            "removido" : true,
            "observacao" : observacao,
            "saida" : data,
            "tipoEncerramento" : {
                "id" : tipoEncerr
            }
        }

        return this.servidor.realizarPut(url, objParam);
    }

    excluirGrupoPaciente(id){
        const url = `${this.url}grupoPaciente/${Sessao.getToken()}/${id}`;
        return this.servidor.realizarDelete(url);
    }

    getGrupoPorTema(objParams){
        const url = `${this.url}grupoTema/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, objParams);
    }

    getPacienteSessaoFormulario(objParams){
        const url = `${this.url}pacienteDocumento/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, objParams);
    }

    salvarGrupoSessaoPaciente(objParams){
        const url = `${this.url}grupoSessaoPaciente/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, objParams);
    }

    deletarGrupoSessaoPaciente(id){
        const url = `${this.url}grupoSessaoPaciente/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDelete(url);
    }

    atualizarGrupoSessaoPaciente(objParams, id){
        const url = `${this.url}grupoSessaoPaciente/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, objParams);
    }

    salvarPacienteFormulario(objParams){
        const url = `${this.url}pacienteDocumento/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, objParams);
    }

    grupoSessaoPacientePorId(objParams){
        const url = `${this.url}grupoSessaoPaciente/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, objParams);
    }

    deleteGrupoSessaoPaciente(id){
        const url = `${this.url}grupoSessaoPaciente/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDelete(url);
    }

    getGrupoResponsavel(objParams){
        const url = `${this.url}grupoResponsavel/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, objParams);
    }

    excluirGrupoResponsavel(id, observacao){
        const url = `${this.url}grupoResponsavel/${Sessao.getToken()}/${id}`;

        let objParam = {
            "removido" : true,
            "observacao" : observacao
        }

        return this.servidor.realizarPut(url, objParam);
    }

    salvarGrupoResponsavel(objParams){
        const url = `${this.url}grupoResponsavel/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, objParams);
    }

    atualizarGrupoResponsavel(objParams, id){
        const url = `${this.url}grupoResponsavel/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, objParams);
    }

    
}