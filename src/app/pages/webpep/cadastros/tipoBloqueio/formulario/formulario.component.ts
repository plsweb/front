import { Component, ViewChild, Input, Output, ViewContainerRef, EventEmitter, ElementRef, Renderer, OnInit } from '@angular/core';
import { NgxUploaderModule } from 'ngx-uploader';
import { TipoBloqueioService} from '../../../../../services';

import { Servidor } from '../../../../../services/servidor';
import { Sessao } from '../../../../../services/sessao';

import { ActivatedRoute, Router } from '@angular/router';
import { Saida } from '../../../../../theme/components/entrada/entrada.component';

import { NgbdModalContent } from '../../../../../theme/components/modal/modal.component';
import { NgbModal, NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';

import { ToastrService } from 'ngx-toastr';

import * as moment from 'moment';
import * as jQuery from 'jquery';
import { FormatosData } from '../../../../../theme/components';


@Component({
    selector: 'formulario',
    templateUrl: './formulario.html',
    styleUrls: ['./formulario.scss'],
    providers: [TipoBloqueioService]
})
export class Formulario implements OnInit {

    idTipoBloqueio

    novoBloqueio = new Object();

    formatosDeDatas;

    constructor(    
        private toastr: ToastrService, 
        private vcr: ViewContainerRef,
        private modalService: NgbModal,
        private route: ActivatedRoute,
        private service: TipoBloqueioService,
        private router: Router) 
    {
        this.route.params.subscribe(params => {
            this.idTipoBloqueio = (params["idtipobloqueio"] != 'novo') ? params["idtipobloqueio"] : undefined
        });
    }

    ngOnInit() {
        
        this.formatosDeDatas = new FormatosData();

        if( this.idTipoBloqueio ){
            this.setTipoBloqueio();
        }else{
            this.novoBloqueio['ativo'] = true;
        }

    }

    salvarTipo(){

        if(!this.idTipoBloqueio){
            this.service.salvar(this.novoBloqueio).subscribe(
                retorno => {
                    this.idTipoBloqueio = retorno;
                    this.router.navigate([`/${Sessao.getModulo()}/tipobloqueio/${retorno}`]);
                    this.toastr.success("Bloqueio "+this.novoBloqueio['descricao']+" adicionado com sucesso");
                    this.setTipoBloqueio();
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                },
            ) 
        }else{
            this.service.atualizar( this.idTipoBloqueio, this.novoBloqueio).subscribe(
                retorno => {
                    this.toastr.success("Bloqueio "+this.novoBloqueio['descricao']+" atualizado com sucesso");
                }
            ) 
        }
    }

    setTipoBloqueio(){

        //MUDAR PARA GETATENDIMENTOBLOQUEIOPORID
        this.service.atendimentoBloqueio( { id : this.idTipoBloqueio } ).subscribe(
            tipo => {
                this.novoBloqueio = this.validaTipo( ( tipo.dados && tipo.dados.length ) ? tipo.dados[0] : tipo[0]);
            }
        )
    }

    validaTipo(tipo){
        return tipo;
    }

    voltar(){
        this.router.navigate([`/${Sessao.getModulo()}/tipobloqueio`]);
    }

}