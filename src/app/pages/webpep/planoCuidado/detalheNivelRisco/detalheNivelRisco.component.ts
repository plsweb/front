import { Component, OnInit, OnDestroy, TemplateRef, Renderer2, ViewContainerRef, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef, Renderer, QueryList } from '@angular/core';
import { Servidor } from '../../../../services/servidor';
import { Sessao } from '../../../../services/sessao';

import { ActivatedRoute, Router } from '@angular/router';
import { GlobalState } from '../../../../global.state';
import { Notificacao, Aguardar, TopoPagina, Agenda } from '../../../../theme/components';
import { NgbdModalContent } from '../../../../theme/components/modal/modal.component';

import { ToastrService } from 'ngx-toastr';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import * as jQuery from 'jquery';

moment.locale('pt-br');

@Component({
    selector: 'detalheNivelRisco',
    templateUrl: './detalheNivelRisco.html',
    styleUrls: ['./detalheNivelRisco.scss'],
    providers: []
})

export class DetalheNivelRisco implements OnInit, OnDestroy {

    riscoId;
    risco;
    
    constructor( 
        private _state: GlobalState, 
        public router: Router,
        private modalService: NgbModal,
        private renderer: Renderer2,
        private toastr: ToastrService, 
        private vcr: ViewContainerRef,
    ) { 
        this.risco = new Object();
    }
    
    ngOnInit() {
    }

    ngOnDestroy() {
    }

    ngAfterViewInit() {
        this.inicializaVariaveis();
    }

    setObjColorPicker(ev) {}

    //  #############################################
    //               Ações da tela
    //  #############################################
    inicializaVariaveis() {
        
    }

    getDescricao(ev){}

    salvar(){}
    trocaCor(){}

    //  #############################################
    //          Funcionalidades da tela
    //  #############################################
    voltar() {
        this.router.navigate([`/${Sessao.getModulo()}/risco`]);
    }   
}