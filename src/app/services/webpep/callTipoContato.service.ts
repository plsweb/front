import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class CallTipoContatoService {
    url: string = 'web/call/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    get(objParams) {
        const url = `${this.url}callTipoContato/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, objParams);
    }

    salvar(objTipo) {
        const url = `${this.url}callTipoContato/${Sessao.getToken()}`;
        
        return this.servidor.realizarPost(url, objTipo);
    }

    atualizar(id, objTipo) {
        const url = `${this.url}callTipoContato/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, objTipo);
    }

    excluir(id) {
        const url = `${this.url}callTipoContato/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarDelete(url);
    }

}
