import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Http } from '@angular/http';
import { Sessao, Servidor } from 'app/services';

@Injectable()
export class GuiaAuditoriaService {
    url: string = 'web/auditoria/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    guiasEmAuditoria(pagina: number, quantidade: number) {
        const url = `${this.url}guiasEmAuditoria/${Sessao.getToken()}/${pagina}/${quantidade}`;
        
        return this.servidor.realizarGet(url);
    }

    getNivelAuditoria() {
        const url = `${this.url}nivelAuditoria/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }

    guiasEmAuditoriaFiltro(param) {
        const url = `${this.url}guiasEmAuditoriaFiltro/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, param);
    }

    quantidadeGuiasEmAuditoria() {
        const url = `${this.url}quantidadeGuiasEmAuditoria/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }

    getFiltroGuia(request){
        const url = `${this.url}procedimentosPorBeneficiario/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, request);
    }
}