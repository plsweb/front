import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class CiapService {
    url: string = 'web/erp/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    get(objParams) {
        let url = `${this.url}ciap/${Sessao.getToken()}?`;

        ( objParams["id"] && objParams["id"] != "")                 ?  url += `id=${objParams["id"]}&`                : null;
        ( objParams["like"] && objParams["like"] != "")             ?  url += `like=${objParams["like"]}&`            : null;
        ( objParams["pagina"] && objParams["pagina"] != "")         ?  url += `pagina=${objParams["pagina"]}&`        : null;
        ( objParams["quantidade"] && objParams["quantidade"] != "") ?  url += `quantidade=${objParams["quantidade"]}` : null;

        return this.servidor.realizarGet(url);
    }
}