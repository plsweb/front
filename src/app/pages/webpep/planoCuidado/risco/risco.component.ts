import { Component, OnInit, OnDestroy, TemplateRef, Renderer2, ViewContainerRef, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef, Renderer, QueryList } from '@angular/core';
import { Servidor } from '../../../../services/servidor';
import { Sessao } from '../../../../services/sessao';

import { ActivatedRoute, Router } from '@angular/router';
import { GlobalState } from '../../../../global.state';
import { Notificacao, Aguardar, TopoPagina, Agenda } from '../../../../theme/components';
import { FormatosData } from '../../../../theme/components/agenda/agenda';
import { NgbdModalContent } from '../../../../theme/components/modal/modal.component';
import { RiscoService } from '../../../../services';
import { TreeviewItem } from 'ngx-treeview';

import { ToastrService } from 'ngx-toastr';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import * as jQuery from 'jquery';

moment.locale('pt-br');

@Component({
    selector: 'risco',
    templateUrl: './risco.html',
    styleUrls: ['./risco.scss'],
    providers: [RiscoService]
})

export class Risco implements OnInit, OnDestroy {

    qtdItensTotal;
    paginaAtual;
    itensPorPagina;
    riscosSaude = [];

    constructor( 
        private _state: GlobalState, 
        public router: Router,
        private modalService: NgbModal,
        private renderer: Renderer2,
        private toastr: ToastrService, 
        private vcr: ViewContainerRef,
        private riscoService: RiscoService
    ) { }
    
    ngOnInit() {
        this.buscarRiscosSaudePaginado();
        /*

        this.formatosDeDatas = new FormatosData();

        this.usuarioService.usuarioSessao().subscribe(
            (usuario) => { this.usuario = usuario }
        );

        this.serviceCallContatoStatus.get().subscribe(
            (contatoStatus) => { this.contatoStatus = contatoStatus }
        );*/
    }

    ngOnDestroy() {
    }

    ngAfterViewInit() {
        this.inicializaVariaveisAba();
    }

    //  #############################################
    //               Ações da tela
    //  #############################################
    abrir(risco) {
        let sId = risco ? risco.id : 'novo';
        this.router.navigate([`/${Sessao.getModulo()}/risco/${sId}`]);
    }

    inicializaVariaveisAba() {
        this.qtdItensTotal = 0;
        this.paginaAtual = 1;
        this.itensPorPagina = 15;
    }

    pesquisarRiscosSaude(texto) {
        this.buscarRiscosSaudePaginado({ paginaAtual: 1 }, texto);
    }

    adicionarRiscoSaude(risco = null) {
        let sId = '';
        sId = risco ? risco['id'] : 'novo';
        this.router.navigate([`/${Sessao.getModulo()}/risco/${sId}`]);
    }

    //  #############################################
    //          Funcionalidades da tela
    //  #############################################
    buscarRiscosSaudePaginado(evento = null, like = undefined, naoConcat = true) {
        this.paginaAtual = evento ? evento.paginaAtual : this.paginaAtual;

        let request = {
            pagina: this.paginaAtual, 
            quantidade: this.itensPorPagina,
            simples: true,
            like: like
        };


        this.riscoService.get(request).subscribe(
            (riscosSaude) => {
                this.riscosSaude = (naoConcat) ? riscosSaude.dados : this.riscosSaude.concat([],riscosSaude.dados);
                this.qtdItensTotal = riscosSaude.qtdItensTotal;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
                this.toastr.warning(erro);
            }
        );
    }
}