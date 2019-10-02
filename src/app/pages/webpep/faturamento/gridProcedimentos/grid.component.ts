import {Component, Input, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';


import { PrescricaoItemService, ProdutoService, ProdutoItemService, PacientePrescricaoProdutoService, PacientePrescricaoItemService, PrescricaoPacienteExecucaoService, PrescricaoModeloService, DicionarioTissService } from '../../../../services';

import { ToastrService } from 'ngx-toastr';
import { FormatosData } from '../../../../theme/components/agenda/agenda';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';


@Component({
    selector: 'gridProcedimentos',
    templateUrl: './grid.component.html',
    styleUrls: ['./grid.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridProcedimentos {
  
    @Input() codigo;
    @Input() service;
    @Input() labelIdAdd;
    @Input() labelIdList;
    @Input() modoSelecao = false;
    @Input() filtroProcedimento = {};

    novosProcedimentos = [];

    constructor(
        public router: Router,
        private cdr: ChangeDetectorRef,
    ) {}

    formatosDeDatas;
    ngOnInit() {
        this.formatosDeDatas = new FormatosData();
    }

    ngOnDestroy() {
        this.cdr.detach();
    }

    retornoPrescricao(novosProcedimento){
        this.novosProcedimentos = this.novosProcedimentos.concat( [], [novosProcedimento.id] );
    }

}