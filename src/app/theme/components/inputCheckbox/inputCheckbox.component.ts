import { Component, Input, Output, ElementRef, EventEmitter } from '@angular/core';

@Component({
    selector: 'input-checkbox',
    templateUrl: './inputCheckbox.html',
    styleUrls: ['./inputCheckbox.scss'],
    providers: []
})
export class InputCheckbox {
    @Input() legenda: string;
    @Input() classe: string;
    @Input() estado: boolean;
    @Input() grupo;
    @Input() id;
    @Input() circular = false;
    @Input() disabled: boolean;
    @Output() trocaEstado: EventEmitter<any> = new EventEmitter();
    @Input() fnHabilitaCheckbox: Function;

    trocaEstadoCheckbox() {
		this.estado = !this.estado;
		this.trocaEstado.emit(this.estado);

        if (this.fnHabilitaCheckbox){
            this.disabled = this.fnHabilitaCheckbox(this.estado);
        }
    }
    
    trocaEstadoRadio(){
        this.trocaEstado.emit(this.id);
    }
}