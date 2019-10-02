import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Http } from '@angular/http';

import { Sessao, Servidor } from '../../services';

@Injectable()
export class ProcedimentoService {
    url: string = 'web/erp/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    getProcedimentos() {
        const url = `${this.url}procedimento/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }

    getProcedimentosPaginado(inicio, fim) {
        const url = `${this.url}procedimentoPaginado/${Sessao.getToken()}/${inicio}/${fim}`;

        return this.servidor.realizarGet(url);
    }

    getProcedimentosCodigo(codigo) {
        const url = `${this.url}procedimentoCodigo/${Sessao.getToken()}/${codigo}`;

        return this.servidor.realizarGet(url);
    }

    getProcedimentosLike(nome) {
        const url = `${this.url}procedimentoLike/${Sessao.getToken()}/${nome}`;

        return this.servidor.realizarGet(url);
    }

    procedimentoPaginado(pagina:number, quantidade:number){
        const url = `${this.url}procedimentoPaginado/${Sessao.getToken()}/${pagina}/${quantidade}`;

        return this.servidor.realizarGet(url);
    }

    procedimentoPaginadoFiltro(pagina:number, quantidade:number, fitro){
        const url = `${this.url}procedimentoLikePaginado/${Sessao.getToken()}/${fitro}/${pagina}/${quantidade}`;

        return this.servidor.realizarGet(url);
    }

}