import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class CidService {
    url: string = 'web/erp/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    get() {
        const url = `${this.url}cid/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }

    getCidPaginado(pagina, quantidade){
        const url = `${this.url}cidPaginado/${Sessao.getToken()}/${pagina}/${quantidade}`;
        
        return this.servidor.realizarGet(url);
    }

    getCidLike(filtro) {
        const url = `${this.url}cidLike/${Sessao.getToken()}/${filtro}`;

        return this.servidor.realizarGet(url);
    }

    getCidLikePaginado(filtro, pagina:number, quantidade:number) {
        const url = `${this.url}cidLikePaginado/${Sessao.getToken()}/${filtro}/${pagina}/${quantidade}`;

        return this.servidor.realizarGet(url);
    }
}