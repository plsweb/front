import { Component, OnInit, OnChanges, Input, Output, EventEmitter } from '@angular/core';

@Component({
    selector: 'multiselect',
    templateUrl: './multiselect.html',
    styleUrls: ['./multiselect.scss']
})
export class Multiselect implements OnInit {

    @Input() itemList = [];
    @Input() selectedItems = [];
    @Input() noLabels = false;
    @Input() settings;
    @Input() posicaoIconeObjeto;

    /*
    EXEMPLO:

    itemList = [];
	selectedItems = [];
	settings = {
		text: "Select Countries",
		selectAllText: 'Select All',
        unSelectAllText: 'UnSelect All',
        enableSearchFilter: true,
		classes: "myclass custom-class"
    };
    

    SELECTED ITENS
    this.selectedItems = [
            { "id": 1, "itemName": "India" },
            { "id": 2, "itemName": "Singapore" },
            { "id": 3, "itemName": "Australia" },
            { "id": 4, "itemName": "Canada" }];


    this.serviceConsult.getConsultoriosPorUnidadeId(6)
        .subscribe((consultorios) => {
            this.itemList = consultorios;
            console.log(this.itemList);
        },
        (erro) => {Servidor.verificaErro(erro, this.toastr);}
    ); CAMPO objMultiselect

    */

    @Output() emitOnItemSelect = new EventEmitter();
    @Output() emitOnItemDeSelect = new EventEmitter();
    @Output() emitOnSelectAll = new EventEmitter();
    @Output() emitOnDeSelectAll = new EventEmitter();
    @Output() setInstancia: EventEmitter<any> = new EventEmitter();
    
    constructor() {}

    ngOnInit() {
        this.settings.searchPlaceholderText = " Buscar";

        if (this.setInstancia) {
            this.setInstancia.emit({
            });
        }
    }

    onItemSelect(item: any) {
        this.emitOnItemSelect.emit(this.selectedItems);
    }
    OnItemDeSelect(item: any) {
        this.emitOnItemSelect.emit(this.selectedItems);
    }
    onSelectAll(items: any) {
        this.emitOnItemSelect.emit(items);
    }
    onDeSelectAll(items: any) {
        this.emitOnItemSelect.emit([]);
    }
}