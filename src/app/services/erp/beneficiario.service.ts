import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class BeneficiarioService {
    url: string = 'web/erp/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    getBeneficiarioPorCodigo(codigo) {
        const url = `${this.url}beneficiarioPorCodigo/${Sessao.getToken()}/${codigo}`;

        return this.servidor.realizarGet(url);
    }

    getBeneficiarioLike(nome) {
        const url = `${this.url}beneficiarioLike/${Sessao.getToken()}/${nome}`;

        return this.servidor.realizarGet(url);
    }

    getBeneficiarioLikePaginado(pagina:number, quantidade:number, fitro) {
        const url = `${this.url}beneficiarioLikePaginado/${Sessao.getToken()}/${fitro}/${pagina}/${quantidade}`;

        return this.servidor.realizarGet(url);
    }

    getBeneficiarioPaginado(pagina, quantidade){
        const url = `${this.url}beneficiarioPaginado/${Sessao.getToken()}/${pagina}/${quantidade}`;

        return this.servidor.realizarGet(url);
    }

    getCarenciaPaginado(objParam) {
        const url = `${this.url}carencia/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, objParam);
    }
}