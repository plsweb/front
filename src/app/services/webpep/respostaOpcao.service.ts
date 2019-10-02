import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class RespostaOpcaoService {
    url: string = 'web/pep/';
    private servidor: Servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    deletarRespostaOpcao(idPacienteDocumento, idOpcao){
        const url = `${this.url}respostaOpcao/${Sessao.getToken()}/${idPacienteDocumento}/${idOpcao}`;
        return this.servidor.realizarDeleteSemBody(url);
    }

}