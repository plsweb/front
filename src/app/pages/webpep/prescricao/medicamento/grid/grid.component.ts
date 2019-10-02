import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef, Renderer, TemplateRef, QueryList, ViewContainerRef } from '@angular/core';
import { MedicamentoService} from '../../../../../services';
import { Servidor } from '../../../../../services/servidor';
import { Sessao } from '../../../../../services/sessao';

import { ActivatedRoute, Router } from '@angular/router';
import { GlobalState } from '../../../../../global.state';
import { Notificacao, Aguardar, TopoPagina, FormatosData } from '../../../../../theme/components';
import { NgbdModalContent } from '../../../../../theme/components/modal/modal.component';

import { ToastrService } from 'ngx-toastr';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
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
        private vcr: ViewContainerRef,
        private renderer:Renderer,
        private router: Router, 
        private modalService: NgbModal, 
        private cdr: ChangeDetectorRef, 
        private _state: GlobalState, 
        private route: ActivatedRoute,

        private serviceMedicamento: MedicamentoService,
    ) {
        this.variaveisDeAmbiente['colunasTabela'] = [
            {'titulo': 'NOME', 'chave': 'nome'},
            {'titulo': 'DESCRIÇÃO', 'chave': 'descricao'},
            {'titulo': 'CODIGO ABCFARMA', 'chave': 'codigoAbcFarma'},
        ];
    }

    ngOnInit() {
    	this._state.notifyDataChanged('menu.isCollapsed', true);

        this.variaveisDeAmbiente['tabela'] = {};
        this.variaveisDeAmbiente['medicamentos'] = [];

        // this.iniciaTabela();
    }


    //  #############################################
    //               Ações da tela
    //  #############################################


    //  #############################################
    //               Filtros
    //  #############################################
    respostas = {};

    getValor(id) {
        let resposta = this.respostas[`${id}`];
        return resposta ? resposta.valor : '';
    }

    getResposta(ev, nome) {
        this.respostas[`${nome}`] = {valor: (ev.valor || ev.valor == "" ? ev.valor : ev)};
        this.respostas = Object.assign({}, this.respostas);
    }

    fnCfgRemote(service, metodo = 'get', term) {

        let objParam = Object.assign(this.getAutoCompleteParams(service, term), {
        	quantidade: 10,
        	pagina: 1
        });

        this[`${service}`][`${metodo}`](objParam).subscribe(
            (retorno) => {
                this.variaveisDeAmbiente[service] = retorno.dados || retorno;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        );
    }

    getAutoCompleteParams(service, term) {
    	let objParam;

    	switch(service) {
            case 'servicePaciente':

		        if( term.length == 11 ) {
		            objParam = { cpf : term };
		        } else if ( (term.length > 11) && !term.match(/\D/g) ) {
		            objParam = { carteirinha : term };
		        }else{
		            objParam = { like : term };
		        }
		        break;

            case 'serviceGrupo':
                objParam = { like : term };
                break;

            default:
                objParam = {};
                break;
        }

        return objParam;
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

    	this.serviceMedicamento.get(param)
    		.subscribe((resposta) => {
                this.variaveisDeAmbiente['medicamentos'] = (objParams['paginaAtual'] == 1) ? resposta.dados : this.variaveisDeAmbiente['medicamentos'].concat([],resposta.dados);

                this.variaveisDeAmbiente['tabela'] = {
                    total: resposta.qtdItensTotal
                };

            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            });
    }

    limparFiltros(bAtualizaDados = true) {
        
    }

    defineMestre(ev, medicamento){
        console.log(ev);
        console.log(medicamento);
    }

    validaEstado(ev, medicamento){
        console.log(ev);
        console.log(medicamento);
    }

    abreMedicamento(medicamento){
        this.router.navigate([`/${Sessao.getModulo()}/medicamento/${medicamento.id}`]);
    }

    adicionaMedicamento(medicamento){
        this.router.navigate([`/${Sessao.getModulo()}/medicamento/novo`]);
    }

    fnValidaMedicamento(item){
        if( item['medicamento'] ){
            return item['medicamento']['nome'] + ' - ' + item['medicamento']['descricao'];
        }else{
            return '';
        }
    }

    fnValidaPrincipal(item){
        return item['principal'] ? 'SIM' : 'NÃO';
    }

}