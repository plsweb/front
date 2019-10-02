import { Injectable } from '@angular/core'
import { Http } from '@angular/http';
import { Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class MaterialService {
    url: string = 'web/opme';
    private servidor: Servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    get(processo, id) {
        const url = `${this.url}/materiaisValidacao/${Sessao.getToken()}/${processo}?idMaterial=${id}`;

        return this.servidor.realizarGet(url);
    }

    put(id, objParams) {
        const url = `${this.url}/materiaisValidacao/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, objParams);
    }
}