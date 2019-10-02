import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class PacienteService {
    url: string = 'web/pep/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }


    getPacientePorCodigo(codigo, geturl = false) {
        const url = `${this.url}pacientePorCodigo/${Sessao.getToken()}/${codigo}`;

        if (geturl){
            return this.servidor.getUrl(url);
        }

        return this.servidor.realizarGet(url);
    }

    getListaPacientePorCodigo(codigo, geturl = false) {
        const url = `${this.url}pacienteListaPorCodigo/${Sessao.getToken()}/${codigo}`;

        if (geturl){
            return this.servidor.getUrl(url);
        }

        return this.servidor.realizarGet(url);
    }
    

    getPacienteLike(objParam, geturl = false, planos = false) {
        const url = `${this.url}paciente/${Sessao.getToken()}`;

        if( objParam['like'] && !planos){
            objParam['simples'] = true;
        }

        if (geturl){
            return this.servidor.getUrl(url, objParam);
        }

        return this.servidor.realizarGetParam(url, objParam);
    }

    // getPacienteLikePaginado(pagina:number, quantidade:number, fitro) {
    //     const url = `${this.url}pacienteLikePaginado/${Sessao.getToken()}/${fitro}/${pagina}/${quantidade}`;

    //     return this.servidor.realizarGet(url);
    // }

    getPaciente(objParam, geturl = false) {
        const url = `${this.url}paciente/${Sessao.getToken()}`;

        if( objParam['like'] ){
            objParam['simples'] = true;
        }

        if (geturl){
            return this.servidor.getUrl(url, objParam);
        }

        return this.servidor.realizarGetParam(url, objParam);
    }

    salvarPaciente(id = false, objParam){
        const url = `${this.url}paciente/${Sessao.getToken()}`;
        return this.servidor.realizarPost(url, objParam);
    }

    atualizarPaciente(id, objParam){
        const url = `${this.url}paciente/${Sessao.getToken()}/${id}`;
        return this.servidor.realizarPut(url, objParam);
    }

    deletarPaciente(id, objParam){
        const url = `${this.url}paciente/${Sessao.getToken()}/${id}`;
        return this.servidor.realizarDelete(url, objParam);
    }

    getPacientePlanos(objParam) {
        const url = `${this.url}pacientePlano/${Sessao.getToken()}`;
        return this.servidor.realizarGetParam(url, objParam);
    }

    salvarPacientePlanos(id = false, objParam ){
        const url = `${this.url}pacientePlano/${Sessao.getToken()}`;
        return this.servidor.realizarPost(url, objParam);
    }

    atualizarPacientePlanos(id, objParam){
        const url = `${this.url}pacientePlano/${Sessao.getToken()}/${id}`;
        return this.servidor.realizarPut(url, objParam);
    }

    deletarPacientePlanos(id, objParam){
        const url = `${this.url}pacientePlano/${Sessao.getToken()}/${id}`;
        return this.servidor.realizarDelete(url, objParam);
    }

    getPacienteEnderecos(objParam) {
        const url = `${this.url}pacienteEndereco/${Sessao.getToken()}`;
        return this.servidor.realizarGetParam(url, objParam);
    }

    salvarPacienteEnderecos(id = false, objParam ){
        const url = `${this.url}pacienteEndereco/${Sessao.getToken()}`;
        return this.servidor.realizarPost(url, objParam);
    }

    atualizarPacienteEnderecos(id, objParam){
        const url = `${this.url}pacienteEndereco/${Sessao.getToken()}/${id}`;
        return this.servidor.realizarPut(url, objParam);
    }

    deletarPacienteEnderecos(id, objParam){
        const url = `${this.url}pacienteEndereco/${Sessao.getToken()}/${id}`;
        return this.servidor.realizarDelete(url, objParam);
    }

    getPacienteContatos(objParam) {
        const url = `${this.url}pacienteContato/${Sessao.getToken()}`;
        return this.servidor.realizarGetParam(url, objParam);
    }

    salvarPacienteContatos(id = false, objParam ){
        const url = `${this.url}pacienteContato/${Sessao.getToken()}`;
        return this.servidor.realizarPost(url, objParam);
    }

    atualizarPacienteContatos(id, objParam){
        const url = `${this.url}pacienteContato/${Sessao.getToken()}/${id}`;
        return this.servidor.realizarPut(url, objParam);
    }

    deletarPacienteContatos(id, objParam){
        const url = `${this.url}pacienteContato/${Sessao.getToken()}/${id}`;
        return this.servidor.realizarDelete(url, objParam);
    }


    getPacienteResponsaveis(objParam) {
        const url = `${this.url}pacienteResponsavel/${Sessao.getToken()}`;
        return this.servidor.realizarGetParam(url, objParam);
    }

    salvarPacienteResponsaveis(id = false, objParam ){
        const url = `${this.url}pacienteResponsavel/${Sessao.getToken()}`;
        return this.servidor.realizarPost(url, objParam);
    }

    atualizarPacienteResponsaveis(id, objParam){
        const url = `${this.url}pacienteResponsavel/${Sessao.getToken()}/${id}`;
        return this.servidor.realizarPut(url, objParam);
    }

    deletarPacienteResponsaveis(id, objParam){
        const url = `${this.url}pacienteResponsavel/${Sessao.getToken()}/${id}`;
        return this.servidor.realizarDelete(url, objParam);
    }


    getPacienteFoto(id, geturl) {
        const url = `${this.url}pacienteFoto/${Sessao.getToken()}/${id}`;

        if( geturl ){
            return this.servidor.getUrl(url);
        }
        return this.servidor.realizarGet(url);
    }

    salvarPacienteFoto(id, objParam){
        const url = `${this.url}pacienteFoto/${Sessao.getToken()}/${id}`;
        return this.servidor.realizarPost(url, objParam);
    }

    atualizarPacienteFoto(id, objParam){
        const url = `${this.url}pacienteFoto/${Sessao.getToken()}/${id}`;
        return this.servidor.realizarPut(url, objParam);
    }

    deletarPacienteFoto(id, objParam){
        const url = `${this.url}pacienteFoto/${Sessao.getToken()}/${id}`;
        return this.servidor.realizarDelete(url, objParam);
    }

    getTiposContatoPaciente(objParam){
        const url = `${this.url}tipoContato/${Sessao.getToken()}`;
        return this.servidor.realizarGet(url, objParam);
    }

}