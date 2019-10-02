import { Component, OnInit } from '@angular/core';
import { PrescricaoFrequenciaService} from '../../../../../services';
import { Servidor } from '../../../../../services/servidor';
import { Sessao } from '../../../../../services/sessao';

import { Router } from '@angular/router';
import { GlobalState } from '../../../../../global.state';

import { ToastrService } from 'ngx-toastr';

import * as moment from 'moment';

moment.locale('pt-br');

@Component({
	selector: 'grid',
	templateUrl: './grid.html',
	styleUrls: ['./grid.scss']
})
export class Grid implements OnInit {
    variaveisDeAmbiente = {};

    constructor(
        private toastr: ToastrService, 
        private router: Router, 
        private _state: GlobalState, 
        private serviceFrequencia: PrescricaoFrequenciaService,
    ) {
        this.variaveisDeAmbiente['colunasTabela'] = [
            {'titulo': 'NOME', 'chave': 'descricao'},
            {'titulo': 'MINUTOS', 'chave': 'minutos'}
        ];
    }

    ngOnInit() {
    	this._state.notifyDataChanged('menu.isCollapsed', true);

        this.variaveisDeAmbiente['tabela'] = {};
        this.variaveisDeAmbiente['frequencia'] = [];

        this.variaveisDeAmbiente['ordenacao'] = {
            paginaAtual: 1,
            qtdItensTotal: 0,
            itensPorPagina: 30,
        }
        // this.iniciaTabela();
    }

    respostas = {};

    getValor(id) {
        let resposta = this.respostas[`${id}`];
        return resposta ? resposta.valor : '';
    }

    getResposta(ev, nome) {
        this.respostas[`${nome}`] = {valor: (ev.valor || ev.valor == "" ? ev.valor : ev)};
        this.respostas = Object.assign({}, this.respostas);
    }

    //  #############################################
    //               Tabela
    //  #############################################
    iniciaTabela(objParams = {}) {

        let param = {
            pagina : objParams['paginaAtual'] || 1,
            quantidade : 30,
            like : objParams['like']
        }

    	this.serviceFrequencia.get(param).subscribe(
            (resposta) => {
                this.variaveisDeAmbiente['frequencia'] = (objParams['paginaAtual'] == 1) ? resposta.dados : this.variaveisDeAmbiente['frequencia'].concat([],resposta.dados);

                this.variaveisDeAmbiente['tabela'] = {
                    total: resposta.qtdItensTotal
                };

                this.variaveisDeAmbiente['ordenacao'] = {
                    paginaAtual: resposta.paginaAtual,
                    qtdItensTotal: resposta.qtdItensTotal,
                }

            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );
    }

    limparFiltros() {
        
    }

    abreFrequencia(frequencia){
        this.router.navigate([`/${Sessao.getModulo()}/frequencia/${frequencia.id}`]);
    }

    adicionaFrequencia(){
        this.router.navigate([`/${Sessao.getModulo()}/frequencia/novo`]);
    }
}