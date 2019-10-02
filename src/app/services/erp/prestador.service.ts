import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class PrestadorService {
    url: string = 'web/prestador/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    getHospitais() {
        const url = `${this.url}hospitais/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }

    getLocaisPrestador(codigoPrestador) {
        const url = `${this.url}locaisPrestador/${Sessao.getToken()}/` + codigoPrestador;

        return this.servidor.realizarGet(url);
    }
}
