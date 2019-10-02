import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class AtendimentoEsperaService {
    url: string = 'web/pep/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    get() {
        const url = `${this.url}atendimentoTipo/${Sessao.getToken()}`;
        return this.servidor.realizarGet(url);
    }

    atendimentoEspera(param) {
        const url = `${this.url}atendimentoEspera/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, param);
    }

    atendimentoEsperaPaginado(pagina:number, quantidade:number, objParams) {
        let url =  `${this.url}atendimentoEsperaAtivosPaginado/${Sessao.getToken()}/${pagina}/${quantidade}`;
        
        return this.servidor.realizarGetParam(url, objParams);
    }

    atendimentoTipoLikePaginado(pagina:number, quantidade:number, valor) {
        const url = `${this.url}atendimentoTipoLikePaginado/${Sessao.getToken()}/${valor}/${pagina}/${quantidade}`;
        return this.servidor.realizarGet(url);
    }

    salvar(objTipo) {
        const url = `${this.url}atendimentoEspera/${Sessao.getToken()}`;

        ( objTipo["especialidade"] && objTipo["especialidade"]["id"]=="0" ) ? delete objTipo["especialidade"] : null;

        return this.servidor.realizarPost(url, objTipo);
    }

    atualizar(id, objTipo) {
        const url = `${this.url}atendimentoEspera/${Sessao.getToken()}/${id}`;
        return this.servidor.realizarPut(url, objTipo);
    }

    excluir(id) {
        const url = `${this.url}atendimentoEspera/${Sessao.getToken()}/${id}`;
        return this.servidor.realizarDelete(url);
    }

    getPrioridades(){
        const url = `${this.url}atendimentoEsperaPrioridade/${Sessao.getToken()}`;
        return this.servidor.realizarGet(url);
    }

    atendimentoEsperaStatus(){
        const url = `${this.url}atendimentoEsperaStatus/${Sessao.getToken()}`;
        return this.servidor.realizarGet(url);
    }

    atendimentoEsperaSaida(){
        const url = `${this.url}atendimentoEsperaSaida/${Sessao.getToken()}`;
        return this.servidor.realizarGet(url);
    }
}
