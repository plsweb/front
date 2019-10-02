import { Pipe, PipeTransform } from '@angular/core';
@Pipe({name: 'replace'})
export class ReplaceLineBreaks implements PipeTransform {

/*
* MODELO REPLACE
*<span> {{ 'teste 1' | replace: {'teste':''} }} </span> 
*/

  transform(value: string, args): string {
      if( !(typeof args === 'object') ){
        console.error("replace errado. parametros deve ser objeto");
        return;
      }

      let key = Object.keys(args)[0]
      let antigo = key;
      let novo = args[key];

      let expressao = new RegExp( antigo, 'g' );
      if( value )
        return value.toString().replace(expressao, novo);
      else  
        return ''
  }
}