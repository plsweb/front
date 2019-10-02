import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef, Renderer, TemplateRef, QueryList, ViewContainerRef } from '@angular/core';
import { Servidor } from '../../../../../services/servidor';
import { Sessao } from '../../../../../services/sessao';
import { PrescricaoItemService, PrescricaoModeloService } from '../../../../../services';

import { ActivatedRoute, Router } from '@angular/router';
import { GlobalState } from '../../../../../global.state';
import { Notificacao, Aguardar, TopoPagina, FormatosData } from '../../../../../theme/components';
import { NgbdModalContent } from '../../../../../theme/components/modal/modal.component';

import { ToastrService } from 'ngx-toastr';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';

moment.locale('pt-br');

@Component({
	selector: 'grid',
	templateUrl: './grid.html',
	styleUrls: ['./grid.scss']
})
export class Grid implements OnInit {
    static ultimaAtualizacao: Date;
    
    variaveisDeAmbiente = {};

    constructor(
        private toastr: ToastrService, 
        private vcr: ViewContainerRef,
        private renderer:Renderer,
        private router: Router, 
        private modalService: NgbModal, 
        private cdr: ChangeDetectorRef, 
        private _state: GlobalState, 
        private route: ActivatedRoute,

        private serviceModelo: PrescricaoModeloService,
    ) {
        this.variaveisDeAmbiente['colunasTabela'] = [
            {'titulo': '', 'chave': 'ativo', 'ocultaLabel' : true, 'ordem': 'ativo', 'classe': 'status-tabela'},
            {'titulo': 'NOME', 'chave': 'nome'},
        ];
    }

    ngOnInit() {
    	this._state.notifyDataChanged('menu.isCollapsed', true);

        this.variaveisDeAmbiente['tabela'] = {};
        this.variaveisDeAmbiente['prescricoes'] = [];

        // this.iniciaTabela();
    }

    //  #############################################
    //               Tabela
    //  #############################################
    prescricoes = [];

    iniciaTabela(objParams = {}) {
        
        let param = {
            pagina : objParams['paginaAtual'] || 1,
            quantidade : 30,
            like : objParams['like']
        }

    	this.serviceModelo.get(param)
    		.subscribe((resposta) => {
                this.variaveisDeAmbiente['prescricoes'] = (objParams['paginaAtual'] == 1) ? resposta.dados : this.variaveisDeAmbiente['prescricoes'].concat([],resposta.dados);

                this.variaveisDeAmbiente['tabela'] = {
                    total: resposta.qtdItensTotal
                };

            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            });
    }

    limparFiltros(bAtualizaDados = true) {
        
    }

    defineMestre(ev, prescricao){
        console.log(ev);
        console.log(prescricao);
    }

    abrePrescricao(prescricao){
        this.router.navigate([`/${Sessao.getModulo()}/modelo/${prescricao.id}`]);
    }

    adicionarPrescricao(){
        this.router.navigate([`/${Sessao.getModulo()}/modelo/novo`]);
    }

}