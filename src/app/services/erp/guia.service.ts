import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class GuiaService {
    url: string = 'web/erp/';
    urlPep: string = 'web/pep/';
    urlAuditoria: string = 'web/auditoria/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    getGuiaPorImpresso(guiaImpresso) {
        const url = `${this.url}guiaPorImpresso/${Sessao.getToken()}/${guiaImpresso}`;

        return this.servidor.realizarGet(url);
    }

    getGuiaPorId(guiaPorId) {
        const url = `${this.url}guiaPorId/${Sessao.getToken()}/${guiaPorId}`;

        return this.servidor.realizarGet(url);
    }

    getConselho() {
        const url = `${this.url}conselho/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }

    finalizaGuia(id, itens){
        const url = `${this.urlAuditoria}finalizaGuia/${Sessao.getToken()}/${id}`;
        
        return this.servidor.realizarPost(url, itens);
    }

    getGuiasPorBeneficiarioCodigoPaginado(pagina:number, quantidade:number, codigo, requestFiltro = {}){
        const url = `${this.url}guiaPorBeneficiarioCodigoPaginado/${Sessao.getToken()}/${codigo}/${pagina}/${quantidade}`;
        return this.servidor.realizarGetParam(url, requestFiltro);
    }

    getGuiasPorPacienteCodigoPaginado(objParam){
        const url = `${this.urlPep}pacienteGuia/${Sessao.getToken()}`;
        return this.servidor.realizarGetParam(url, objParam);
    }
}