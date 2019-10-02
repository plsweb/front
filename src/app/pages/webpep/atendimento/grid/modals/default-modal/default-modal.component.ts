import { Component, OnInit } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import * as jQuery from 'jquery';

@Component({
    selector: 'add-service-modal',
    styleUrls: ['./default-modal.component.scss'],
    templateUrl: './default-modal.component.html'
})

export class DefaultModal implements OnInit {

    modalHeader: string;
    modalHtml:string;

    constructor(private activeModal: NgbActiveModal) {
    }

    ngOnInit() {
        let modalHtml = this.modalHtml;

        let body = jQuery('#modalBody');
        body.append(modalHtml);
    }

    closeModal() {
        this.activeModal.close();
    }
}