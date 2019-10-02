import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class EspecialidadeService {
    url: string = 'web/erp/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    get() {
        const url = `${this.url}especialidade/${Sessao.getToken()}`;
        return this.servidor.realizarGet(url);
    }

    getEspecialidadeLike(like, pagina, quantidade, geturl = false) {
    	const url = `${this.url}especialidadeLikePaginado/${Sessao.getToken()}/${like}/${pagina}/${quantidade}`;

        if (geturl){
            return this.servidor.getUrl(url);
        }

        return this.servidor.realizarGet(url);
    }
}