import { Http, Headers, RequestOptions, RequestOptionsArgs } from '@angular/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Sessao } from './sessao';

import { map } from 'rxjs/operators';

@Injectable()
export class Servidor {
    private headers;
    private url: string;

    getUrl(uri: string, params = {}): string {

        var url;

        switch (Sessao.getBase()) {
            case 'prd':
                url = `https://plsweb.unimeduberaba.com.br:6100/webresources/${uri}`;
                break;
            case 'rc':
                url = `https://plsweb.unimeduberaba.com.br:6200/webresources/${uri}`;
                break;
            case 'hml':
                url = `https://plsweb.unimeduberaba.com.br:6400/webresources/${uri}`;
                break;
            case 'dev':
                url = `https://plsweb.unimeduberaba.com.br:6500/webresources/${uri}`;
                break;
            case 'local':
                url = `http://localhost:8084/webresources/${uri}`;
                break;
        }

        url = new URL(url);
        Object.keys(params).forEach(key => url.searchParams.append(key, params[key]))
        return url.href;
    }

    constructor(private http: Http, private router: Router) {
        const header = new Headers();
        header.append('Content-Type', 'text/plain');
        this.headers = { headers: header };
    }

    static getHeders() {

    }

    static verificaErro(erro, object?): any {
        if (object) {
            let alerta = object;

            if (erro.status == 401) {
                alerta.warning('Desculpe, sua sessão expirou');
                Sessao.deleteToken();
                location.reload();

            } else if (erro.status == 403) {
                alerta.warning(`${JSON.parse(erro['_body']).message}`, 'Usuário sem permissão');

            } else if (erro.status == 412) {
                alerta.warning(`${JSON.parse(erro['_body']).message}`, 'Falha na Solicitação');

            } else if (erro.status == 406) {
                console.warn("Houve um erro ao buscar foto");

            } else if (erro.status == 500) {
                alerta.error('Ocorreu um erro interno na aplicação');

            } else {
                alerta.error('Ocorreu um erro inesperado na aplicação');
                // this.serviceUtil.postSlack(`${erro.status}: ${JSON.parse(erro['_body']).error} ${JSON.parse(erro['_body']).message}`);
            }
        } else {
            // let mensagem = `Chamada sem objeto de alerta para o usuario ${erro.status}: ${JSON.parse(erro['_body']).error} ${JSON.parse(erro['_body']).message}`;
            // this.serviceUtil.postSlack(mensagem);

            if (erro.status === 401) {
                Sessao.deleteToken();
                location.reload();
            }
        }
    }

    ajax(tipo = 'GET', sUrl = '', oParam = {}) {
        tipo = tipo.toLowerCase();

        if (tipo == 'get') {
            oParam = { search: oParam }
        } else {
            oParam = JSON.stringify(oParam);
        }

        sUrl = this.getUrl(sUrl);
        let fnAjax = this.http[tipo];

        return fnAjax(sUrl)
            .pipe(map((res) => {
                let JSONvalido = true;

                try {
                    JSON.parse(res["_body"]);
                } catch (e) {
                    JSONvalido = false;
                }

                return ( JSONvalido ) ? res["json"]() : res["_body"];
            }));
    }

    realizarGetParam(uri: string, param) {

        return this.http
            .get(this.getUrl(uri), { search: param })
            .pipe(map((res) => {
                let JSONvalido = true;

                try {
                    JSON.parse(res["_body"]);
                } catch (e) {
                    JSONvalido = false;
                }

                return ( JSONvalido ) ? res.json() : res["_body"];
            }));
    }

    realizarGet(uri: string) {

        return this.http
            .get(this.getUrl(uri))
            .pipe(map((res) => {
                let JSONvalido = true;

                try {
                    JSON.parse(res["_body"]);
                } catch (e) {
                    JSONvalido = false;
                }

                return ( JSONvalido ) ? res.json() : res["_body"];
            }));
    }

    realizarGetFull(uri: string) {
        return this.http
            .get(this.getUrl(uri))
            .pipe(map(res => res));
    }

    realizarDelete(uri: string, body) {

        let optionsBody = new RequestOptions({ body: body });

        return this.http
            .delete(this.getUrl(uri), optionsBody)
            .pipe(map(res => res));
    }

    realizarDeleteSemBody(uri: string) {
        return this.http
            .delete(this.getUrl(uri))
            .pipe(map(res => res));
    }

    realizarGetBody(uri: string) {
        return this.http
            .get(this.getUrl(uri))
            .pipe(map(res => res));
    }
    
    realizarPost(uri: string, body, param = {}) {

        let options:RequestOptionsArgs = {
            params: param
        } 
        return this.http
            .post(this.getUrl(uri), JSON.stringify(body), options)
            .pipe(map((res) => {
                let JSONvalido = true;

                try {
                    JSON.parse(res["_body"]);
                } catch (e) {
                    JSONvalido = false;
                }

                return ( JSONvalido ) ? res.json() : res["_body"];
            }));
    }

    realizarPut(uri: string, body) {
        return this.http
            .put(this.getUrl(uri), JSON.stringify(body))
            .pipe(map((res) => {
                let JSONvalido = true;

                try {
                    JSON.parse(res["_body"]);
                } catch (e) {
                    JSONvalido = false;
                }

                return ( JSONvalido ) ? res.json() : res["_body"];
            }));
    }

    realizarPutSemBody(uri: string, body = {}) {
        return this.http
            .put(this.getUrl(uri), body, this.headers)
            .pipe(map((res) => {
                let JSONvalido = true;

                try {
                    JSON.parse(res["_body"]);
                } catch (e) {
                    JSONvalido = false;
                }

                return ( JSONvalido ) ? res.json() : res["_body"];
            }));
    }
}