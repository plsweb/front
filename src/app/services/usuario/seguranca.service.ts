import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class SegurancaService {
    url: string = 'web/seguranca/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor= new Servidor(http, router);
    }

    getLogPaginado(pagina:number, quantidade:number, objParams) {

        let url =  `${this.url}logPaginado/${Sessao.getToken()}`;

        if( pagina ){
            url += `/${pagina}/${quantidade}?`
        }else{
            url += `?`;
        }

        ( objParams["tabela"] != "0" && objParams["tabela"] )   ?  url += `tabela=${objParams["tabela"]}&`  : url += `tabela=&`;
        ( objParams["chave"]  != "0" && objParams["chave"]  )   ?  url += `chave=${objParams["chave"]}&`    : url += `chave=&`;
        ( objParams["campo"]  != "0" && objParams["campo"]  )   ?  url += `campo=${objParams["campo"]}`     : url += `campo=`;
        
        return this.servidor.realizarGet(url);
    }


    // getLogPaginado(){
    //     const url = `${this.url}logPaginado/${Sessao.getToken()}`;

    //     return this.servidor.realizarGet(url);
    // }

    getAlertaPanico(params = {}){
        const url = `${this.url}panico/${Sessao.getToken()}`;

        return this.servidor.realizarGetParam(url, params);
    }

    putAlertaPanico(id, request){
        const url = `${this.url}panico/${Sessao.getToken()}/${id}`;

        return this.servidor.realizarPut(url, request);
    }

    postAlertaPanico(request){
        const url = `${this.url}panico/${Sessao.getToken()}`;

        return this.servidor.realizarPost(url, request);
    }
}