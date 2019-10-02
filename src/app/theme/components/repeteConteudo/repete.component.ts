import {Component, ElementRef, HostListener, Input} from '@angular/core';
import {GlobalState} from '../../../global.state';
import {layoutSizes} from '../../../theme';
import * as jQuery from 'jquery';

@Component({
  selector: 'repeteConteudo',
  templateUrl: './repete.html',
  styleUrls: ['./repete.scss']
})
export class RepeteConteudo {
  
  @Input() fnNovoElemento: Function;
  @Input() fnValidaDesabilitar: Function;
  @Input() array = [];
  @Input() nomeBotao = "Novo"

  constructor(private _elementRef:ElementRef, private _state:GlobalState) {}

  public ngOnInit():void {
    console.log("Iniciou");
  }

  novoElemento(){
    console.log("Novo Elemento");

    if( this.fnNovoElemento ){
      this.fnNovoElemento();
    }else{
      console.error("Nao tem funcao de novo elemento ");
    }

  }

  validaDesabilitar(elemento){

    if( this.fnValidaDesabilitar ){
      this.fnValidaDesabilitar(elemento);
    }else{
      console.error("Nao tem funcao desabilitar ");
    }

  }

}
