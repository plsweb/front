import {Component, Input, ViewChild, TemplateRef, QueryList, } from '@angular/core';

import {NgbModal, NgbActiveModal} from '@ng-bootstrap/ng-bootstrap';


@Component({
  selector: 'modalConfirm',
  templateUrl: './modalConfirm.component.html',
  styleUrls: ['./modalConfirm.component.scss']
})
export class ModalConfirm {
  
  @Input() modalHeader;
  @Input() abrir;
  @Input() modalBody;
  @Input() tipo;

  constructor(public activeModal: NgbActiveModal) {}

  ngOnInit(){
    switch (this.tipo) {
      case "alert":
        
        break;
    
      default:
        break;
    }
  }

  emitConfirm(result){

  }

  voltar() {
    this.activeModal.close();
  }

}
