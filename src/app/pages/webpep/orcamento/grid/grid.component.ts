import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { GlobalState } from 'app/global.state';

import { Sessao, Servidor, OrcamentoService } from 'app/services';

import { FormatosData } from 'app/theme/components';
import * as moment from 'moment';

@Component({
    selector: 'grid',
    templateUrl: './grid.html',
    styleUrls: ['./grid.scss']
})
export class Grid implements OnInit {
    orcamento;
    orcamentoId;

    formatosDeDatas = new FormatosData();
    momentjs = moment;

    constructor(
        private router: Router,
        private _state: GlobalState,
        private route: ActivatedRoute,
        private serviceOrcamento: OrcamentoService,
    ) {
        this.route.params.subscribe(
            (params) => {
                this.orcamentoId = parseInt(params['id']);
            }
        );
    }

    ngOnInit() {
        this.formatosDeDatas = new FormatosData();

        // this.serviceOrcamento.getOrcamento({id: this.orcamentoId}).subscribe(
        //     (orcamento) => {
        //         this.orcamento = orcamento.dados[0] || orcamento;
        //     }, (erro) => {
        //         Servidor.verificaErro(erro);
        //     }
        // );
    }

    salvarItem(item) {
        // this.serviceOrcamento.getOrcamento({id: this.orcamentoId}).subscribe(
        //     (orcamento) => {
        //         this.orcamento = orcamento.dados[0] || orcamento;
        //     }, (erro) => {
        //         Servidor.verificaErro(erro);
        //     }
        // );
    }
}