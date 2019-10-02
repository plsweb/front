import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Injectable } from '@angular/core';

import { ConfigService } from '../services';
import { Sessao } from '../services/sessao';

@Injectable()
export class Seguranca implements CanActivate {

    constructor(private router: Router, private configService: ConfigService) {
    }

    canActivate(router: ActivatedRouteSnapshot, state: RouterStateSnapshot): any
    // boolean 
    {
        if (state.url !== '/login' && !Sessao.getToken()) {
            this.router.navigate(['/login']);
            return false;
        }
        
        
        return true;

        /* CONTROLE DE ROTAS */


        /*
        let promise = new Promise( 
            (resolve, reject) => {
                // console.log(Sessao.getPermissoes());
                // console.log(this.router);
                // console.log(state);

                let arrayPermissoes = Sessao.getPermissoes()
                
                let arrayUrl = state.url.split('/');
                let nomePermissao;
                if( state && (state.url.indexOf('/') == 0) ){
                    nomePermissao = arrayUrl[1] + '/' + arrayUrl[2];
                }else{
                    nomePermissao = arrayUrl[0] + '/' + arrayUrl[1];
                }

                // console.log(nomePermissao);
                
                // return resolve( arrayPermissoes.indexOf( nomePermissao ) >= 0 );
                return resolve( true );
            }
        )

        promise.then(
            (retorno) => {
                // console.log("Pronto:  " + retorno);
            }
        )

        return promise;

        /*if (false) {
        	return true;
        } else {
	        return this.configService.getCfg().subscribe((dados) => {
	        	console.log(dados);
	        	return true;
	        });
	    }*/
    }
}
