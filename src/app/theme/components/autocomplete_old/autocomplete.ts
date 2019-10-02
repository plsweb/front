import { Component, ViewChild, Input, Output, OnInit, EventEmitter, ElementRef, Renderer } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CompleterService, CompleterData, LocalData, CompleterItem, RemoteData } from 'ng2-completer';
import * as jQuery from 'jquery';

@Component({
  selector: 'autocompleteOLD',
  styleUrls: ['./autocomplete.scss'],
  templateUrl: './autocomplete.html',
})
export class AutocompleteOLD implements OnInit {

  @Input() searchData;
  @Input() requerido;
  @Input() idFiltro;
  @Input() placeholder;
  @Input() initialValue;
  @Input() disableInput;
  @Input() limitWidth;
  @Input() valor;
  @Input() minimo;
  @Input() titulo;
  @Input() custom_class;

  @Input() fnCfgRemote;
  @Input() dataField = "";

  @Output() fnOnSelected = new EventEmitter();
  @Output() searching = new EventEmitter();
  @Input() fnOnSearch;

  protected searchStr: string;
  protected searchStrTemp: string;
  protected dataService: LocalData;
  protected selecionei;
  private timeUp;

  public remoteData: RemoteData;

  constructor(private completerService: CompleterService) {
    ( !this.minimo ) ? this.minimo = 3 : null;
    // this.searching.emit(false);
  }

  ngOnInit(){
    this.setData();
  }

  ngAfterViewInit() {
    if (this.initialValue) {
        this.searchStr = this.initialValue[this.idFiltro[0]];
    }
    if( this.searchStr ){
      this.setRemoteData(false);
    }

  }

  teste($event){
    if( this.searchStr != 'null' )
    this.searchStrTemp = this.searchStr;
  }
  
  open(evento){
    this.setData();
  }

  openRemote(){
    this.setRemoteData(false);
  }

  onSearch(evento){    
      let dado = evento && evento.originalObject ? evento.originalObject : {};
      dado.searchStr = this.searchStr;
      
      this.setData();
  }

  setRemoteData(valida) {

    if (this.fnCfgRemote) {
      this.remoteData = this.completerService.remote( null, this.idFiltro[0], this.idFiltro[1] );
      this.remoteData.urlFormater(this.fnCfgRemote);
      this.remoteData.dataField(this.dataField);


      if( this.idFiltro.length > 2 )
        this.remoteData.descriptionField(this.idFiltro[2]);

      if( valida ){
        setTimeout(() => {
          if( this.selecionei ){
            
            this.searchStr = this.searchStrTemp;
            this.selecionei = false;
          }
        }, 500);
      }
    }
  }

  setData(){
    this.dataService = this.completerService.local(this.searchData, this.idFiltro[0], this.idFiltro[1] );  
    if( this.idFiltro.length > 2 )
      this.dataService.descriptionField(this.idFiltro[2]);
      
  }

  onSelected(evento) {
    this.selecionei = true;
    // this.searching.emit(false);
    this.fnOnSelected.emit(evento ? evento.originalObject : null);
  }

}