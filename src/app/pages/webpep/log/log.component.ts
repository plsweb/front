import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Component, OnInit, Renderer } from '@angular/core';

import { ToastrService } from 'ngx-toastr';

import { Servidor, SegurancaService } from 'app/services';

import * as moment from 'moment';

moment.locale('pt-br');

@Component({
	selector: 'log',
	templateUrl: './log.html',
	styleUrls: ['./log.scss']
})
export class Log implements OnInit {
    
    objParamsLog = new Object();
    paginaAtual;
    itensPorPagina;
    qtdItensTotal;
    logs;

    constructor(
        private router: Router,
        private renderer:Renderer,
        private toastr: ToastrService,
        private serviceSeguranca: SegurancaService,
        private modalService: NgbModal, 
        private route: ActivatedRoute
    ) {
        
    }

    ngOnInit() {
        this.paginaAtual = 1;
        this.itensPorPagina = 25;
    }

    buscaLogPaginado(evento){
        this.paginaAtual = evento ? evento.paginaAtual : this.paginaAtual;

        this.serviceSeguranca.getLogPaginado(this.paginaAtual, this.itensPorPagina, this.objParamsLog)
            .subscribe((logs) => {
                this.logs = logs.dados;
                this.qtdItensTotal = logs.qtdItensTotal;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        );
    }
    

}