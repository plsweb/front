import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class PrestadorAtendimentoService {
    url: string = 'web/erp/';
    urlPep: string = 'web/pep/';
    urlUsuario: string = 'web/usuario/';
    private servidor;

    constructor(http: Http, router: Router,
    ) {
        this.servidor = new Servidor(http, router);
    }

    getPrestadorAtendimento( objParams, retornaComGuid ) {
        let url;
        if( retornaComGuid ){
            url =  `${this.url}usuarioPrestadorAtendimento/${Sessao.getToken()}?`;
        }else{
            url =  `${this.url}prestadorAtendimento/${Sessao.getToken()}?`;
        }
        
        ( objParams["codigoDto"] != "0" && objParams["codigoDto"] )        ?  url += `unidadeAtendimentoId=${objParams["codigoDto"]}`         : null;
        ( objParams["especialidadeId"] != "0" && objParams["especialidadeId"] )  ?  url += `&especialidadeId=${objParams["especialidadeId"]}`  : null;
        
        return this.servidor.realizarGet(url);
    }


    getUsuarioPorEspecialidade( objParams ) {

        let url =  `${this.url}usuariosEspecialidade/${Sessao.getToken()}?`;
        ( objParams["codigoDto"] != "0" && objParams["codigoDto"] )        ?  url += `unidadeAtendimentoId=${objParams["codigoDto"]}&`         : null;
        ( objParams["especialidadeId"] != "0" && objParams["especialidadeId"] )  ?  url += `especialidadeId=${objParams["especialidadeId"]}`  : null;
        
        return this.servidor.realizarGet(url);
    }

    getPrestadorAtendimentoPaginado( pagina:number, quantidade:number, objParams ) {

        let url =  `${this.url}usuarioPrestadorAtendimentoPaginado/${Sessao.getToken()}/${pagina}/${quantidade}?`;
        ( objParams["codigoDto"] != 0 )        ?  url += `codigoDto=${objParams["codigoDto"]}&`         : null;
        ( objParams["especialidadeId"] != 0 )  ?  url += `especialidadeId=${objParams["especialidadeId"]}`  : null;
        
        return this.servidor.realizarGet(url);
    }

    getPrestadorAtendimentoPorId( guid ) {
        const url = `${this.urlUsuario}usuarioPorGuid/${Sessao.getToken()}/${guid}`;

        return this.servidor.realizarGet(url);
    }

    getPrestadorAtendimentoLike(param) {
        const url = `${this.url}prestadorAtendimento/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, param);
    }

    usuarioPrestadorPorNome(username) {
        const url = `${this.url}usuarioPrestadorAtendimentoPorGuidOuUsername/${Sessao.getToken()}/${username}`;

        return this.servidor.realizarGet(url);
    }

    BKPusuarioPrestadorPorNome(username) {
        const url = `${this.urlUsuario}usuarioFiltro/${Sessao.getToken()}/${username}`;

        return this.servidor.realizarGet(url);
    }

    configuraHorarioPorUsuarioPrestador( guid ) {
        const url = `${this.urlPep}configuraHorarioPorUsuarioPrestador/${Sessao.getToken()}/${guid}`;
        
        return this.servidor.realizarGet(url);
    }

    configuraHorario(novoHorario) {
        const url = `${this.urlPep}configuraHorario/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, novoHorario);
    }

    getConfiguracaoHorarioFiltro(parametros) {
        const url = `${this.urlPep}configuraHorarioFiltro/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, parametros);
    }

    getCapacidadeAgendaColetiva( params ){
        const url = `${this.urlPep}capacidadeAgendaColetiva/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, params);
    }

    updateConfiguraHorario(id, novoHorario) {
        const url = `${this.urlPep}configuraHorario/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, novoHorario);
    }

    deleteConfiguraHorario(id) {
        const url = `${this.urlPep}configuraHorario/${Sessao.getToken()}/${id}`;
        
        return this.servidor.realizarDelete(url);
    }
}
