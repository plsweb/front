import {Component, Input, Output, EventEmitter } from '@angular/core';
import {NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';
import * as $ from 'jquery';

@Component({
    selector: 'ngbd-modal-content',
    templateUrl: './modal.component.html',
    styleUrls: ['./modal.component.scss']    
})

// //**Modal**//
// this.modalConfirmar = this.modalService.open(NgbdModalContent);
// this.modalConfirmar.componentInstance.modalHeader = `Titulo`;
// this.modalConfirmar.componentInstance.modalMensagem = `Mensagem`;
// this.modalConfirmar.componentInstance.templateRefBody = this.bodyModalConfirm;
// this.modalConfirmar.componentInstance.modalAlert = true;

// //**Pegar o retorno**//
// this.modalConfirmar.componentInstance.retorno.subscribe(
//     (retorno) => {
//         if (retorno) {
//             Confirmar => true
//         } else {
//             Cancelar => false
//         }
//     }
// );

export class NgbdModalContent {
    @Input() modalHeader;
    @Input() modalMensagem;
    @Input() custom_lg_modal;
    @Input() modalAdicionar;
    @Input() contextObject; // Variaveis de contexto
    @Input() templateRefBody;
    @Input() templateBotoes;
    @Input() modalAlert = false;

    @Output() retorno: EventEmitter<any> = new EventEmitter();
    
    static cfgGlobal = {
        beforeDismiss: (data) => {
            setTimeout(() => {
                if (document.querySelector('body .modal')) {
                    document.body.classList.add('modal-open');
                }
            }, 500);
        }
    }

    constructor(
        public activeModal: NgbActiveModal,
        public modalService: NgbModal
    ) {}

    ngAfterViewInit(){
        if( this.custom_lg_modal ){
            let ngbmodal = document.querySelectorAll('ngb-modal-window');
            let ultimo:any = ngbmodal[ ngbmodal.length - 1 ];

            ultimo = ultimo.querySelector('div');
            $(ultimo).attr("modal-lg-custom", "true");
        }
    }

    static getCfgGlobal(){
        return this.cfgGlobal
    }

    voltar() {
        this.retorno.emit(false);
        this.activeModal.dismiss();
        if (document.querySelector('body .modal')) {
            document.body.classList.add('modal-open');
        }    
    }

    confirm(evento) {
        this.retorno.emit(evento);
        this.activeModal.dismiss();
    }

    cancel(evento) {
        this.retorno.emit(evento);
        this.activeModal.dismiss();
    }
}