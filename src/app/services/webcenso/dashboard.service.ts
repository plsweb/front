import { Injectable } from '@angular/core';
import { Http, Headers, Response } from '@angular/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Servidor } from '../servidor';
import { Sessao } from '../sessao';

@Injectable()
export class DashboardService {
    url: string = 'web/censo/';
    private servidor;

    constructor(http: Http, router: Router) {
        this.servidor = new Servidor(http, router);
    }

    // TODO método unificado, recebendo o caminho da api
    getDashboard(path: ​string​) {
        ​const​ url = ​`​${this.url}${path}​/​${Sessao.getToken()}​`
        ​return​ ​this​.servidor.realizarGet(url)
    }

    getDashboard1() {
        const url = `${this.url}dashboardCenso1/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }

    getDashboard2() {
        const url = `${this.url}dashboardCenso2/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }

    getDashboard3() {
        const url = `${this.url}dashboardCenso3/${Sessao.getToken()}`;

        return this.servidor.realizarGet(url);
    }
}
