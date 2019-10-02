import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Http } from '@angular/http';

import { Sessao, Servidor } from 'app/services';

@Injectable()
export class UsuarioService {
    url: string = 'web/usuario/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    logar(usuario: string, senha: string) {
        const url = `${this.url}logar/${usuario}/${senha}`;

        Sessao.deletePreferenciasUsuario();

        return this.servidor.realizarPut(url);
    }

    alterarSenha(senha: string) {
        const url = `${this.url}alterarSenha/${Sessao.getToken()}/${senha}`;

        return this.servidor.realizarPut(url);
    }

    foto(tipo): string {
        return this.servidor.getUrl(`${this.url}imagem/${Sessao.getToken()}/${tipo}`);
    }

    fotoPorGuid(tipo, guid, topo) {
        var objRetorno = {};
        var urlImagem = `${this.url}imagem/${Sessao.getToken()}/${tipo}/${guid}`;

        if( topo ){
            return this.servidor.realizarGet(urlImagem);
        }else{
            return this.servidor.getUrl(urlImagem);
        }

    }

    setImagem(objImagem, tipo) {
        const url = `${this.url}imagem/${Sessao.getToken()}/${tipo}`;
        return this.servidor.realizarPut(url, objImagem);
    }

    setImagemPorGuid(objImagem, tipo, guid) {
        const url = `${this.url}imagem/${Sessao.getToken()}/${tipo}/${guid}`;
        return this.servidor.realizarPut(url, objImagem);
    }

    usuario() {
        const url = `${this.url}usuario/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }

    getId(guid) {
        const url = `${this.url}usuarioPorGuid/${Sessao.getToken()}/${guid}`;

        return this.servidor.realizarGet(url);
    }

    usuarioPorNome(username) {
        const url = `${this.url}usuarioFiltro/${Sessao.getToken()}/${username}`;

        return this.servidor.realizarGet(url);
    }

    usuarioLike(objParam) {
        const url = `${this.url}usuariolike/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, objParam);
    }

    atualizar(guid, usuario) {
        const url = `${this.url}usuario/${Sessao.getToken()}/${guid}`;
        return this.servidor.realizarPut(url, usuario);
    }

    inserir(usuario) {
        const url = `${this.url}usuario/${Sessao.getToken()}`;
        return this.servidor.realizarPost(url, usuario);
    }

    usuarioLista() {
        const url = `${this.url}usuarioLista/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }

    getPapeisLike(){}

    papel(param = null, geturl = false) {
        const url = `${this.url}papel/${Sessao.getToken()}`;

        if (geturl){
            return this.servidor.getUrl(url, param);
        }

        return this.servidor.realizarGetParam(url, param);
    }

    usuarioPapel(usuario) {
        const url = `${this.url}usuarioPapel/${Sessao.getToken()}`;
        return this.servidor.realizarPost(url, usuario);
    }

    getUsuariosPorPapel(papel){
        const url = `${this.url}usuarioPapelPorPapel/${Sessao.getToken()}/${papel}`;
        return this.servidor.realizarGet(url);
    }

    deletarPapel(objPapel){
        const url = `${this.url}usuarioPapel/${Sessao.getToken()}`;
        return this.servidor.realizarDelete(url, objPapel);
    }

    usuarioPaginado(pagina:number, quantidade:number) {
        const url = `${this.url}usuarioPaginado/${Sessao.getToken()}/${pagina}/${quantidade}`;

        return this.servidor.realizarGet(url);
    }

    usuarioFiltro(fitro) {
        const url = `${this.url}usuarioFiltro/${Sessao.getToken()}/${fitro}`;

        return this.servidor.realizarGet(url);
    }

    usuarioPaginadoFiltro(pagina:number, quantidade:number, fitro, apenasAtivos = true) {
        const url = `${this.url}usuarioFiltroPaginado/${Sessao.getToken()}/${pagina}/${quantidade}/${fitro}?apenasAtivos=${apenasAtivos}`;

        return this.servidor.realizarGet(url);
    }

    usuarioSessao() {
        const url = `${this.url}usuarioSessao/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }

    setUsuarioEspecialidade(obj){
        const url = `${this.url}usuarioEspecialidades/${Sessao.getToken()}`;
        return this.servidor.realizarPost(url, obj);
    }

    excluirUsuarioEspecialidade(obj){
        const url = `${this.url}usuarioEspecialidades/${Sessao.getToken()}`;
        return this.servidor.realizarDelete(url, obj);
    }

    getUsuarioUnidadeAtendimento(obj){
        const url = `${this.url}usuarioUnidadeAtendimento/${Sessao.getToken()}`;
        return this.servidor.realizarGetParam(url, obj);
    }

    setUsuarioUnidadeAtendimento(obj){
        const url = `${this.url}usuarioUnidadeAtendimento/${Sessao.getToken()}`;
        return this.servidor.realizarPost(url, obj);
    }

    atualizarUsuarioUnidadeAtendimento(id, obj){
        const url = `${this.url}usuarioUnidadeAtendimento/${Sessao.getToken()}/${id}`;
        return this.servidor.realizarPut(url, obj);
    }

    excluirUsuarioUnidadeAtendimento(id){
        const url = `${this.url}usuarioUnidadeAtendimento/${Sessao.getToken()}/${id}`;
        return this.servidor.realizarDelete(url);
    }

    sair() {
        const url = `${this.url}sair/${Sessao.getToken()}`;
        this.servidor.realizarPutSemBody(url)
            .subscribe(res => {
            },
            (erro) => {Servidor.verificaErro(erro);}
        );

        Sessao.deleteToken();
    }

    getOrdemFilaAtendimento() {
        const url = `${this.url}ordemFilaAtendimento/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }

    deleteUsuarioTitular(guid){
        const url = `${this.url}usuarioTitular/${Sessao.getToken()}/${guid}`;

        return this.servidor.realizarDelete(url);
    }
}

export class Login {
    alterarSenha: boolean;
    autorizado: boolean;
    bloqueado: boolean;
    mensagem: string;
    token: string;
}