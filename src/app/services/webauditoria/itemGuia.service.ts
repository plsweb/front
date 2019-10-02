
import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class ItemGuiaService {
    url: string = 'web/auditoria/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    getGuiaItem(request = {}){
        const url = `${this.url}guiaItem/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, request);
    }

    deleteGuiaItem(id){
        const url = `${this.url}guiaItem/${Sessao.getToken()}/${id}`;
        return this.servidor.realizarDelete(url);
    }

    postGuiaItem(obj){
        const url = `${this.url}guiaItem/${Sessao.getToken()}`;
        return this.servidor.realizarPost(url, obj);
    }

    putGuiaItem(id, request){
        const url = `${this.url}guiaItem/${Sessao.getToken()}/${id}`;
        return this.servidor.realizarPut(url, request);
    }
}

