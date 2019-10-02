import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef, Renderer, TemplateRef, QueryList, ViewContainerRef } from '@angular/core';
import { Servidor } from '../../../../services/servidor';
import { Sessao } from '../../../../services/sessao';
import { TratamentoService } from '../../../../services';

import { ActivatedRoute, Router } from '@angular/router';
import { GlobalState } from '../../../../global.state';
import { Notificacao, Aguardar, TopoPagina, FormatosData } from '../../../../theme/components';
import { NgbdModalContent } from '../../../../theme/components/modal/modal.component';

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
    static ultimaAtualizacao: Date;
    
    variaveisDeAmbiente = {};

    constructor(
        private toastr: ToastrService, 
        private renderer:Renderer,
        private router: Router, 
        private modalService: NgbModal, 
        private cdr: ChangeDetectorRef, 
        private _state: GlobalState, 
        private route: ActivatedRoute,

        private serviceTratamento: TratamentoService,
    ) {

        this.variaveisDeAmbiente['colunasTabela'] = [
            {'titulo': '', 'chave': 'ativo', 'ocultaLabel' : true, 'ordem': 'ativo', 'classe': 'status-tabela'},
            {'titulo': 'PACIENTE', 'chave': 'paciente.nome'},
            {'titulo': 'TRATAMENTO', 'chave': 'tratamento.descricao'},
            {'titulo': 'UNIDADE', 'chave': 'unidadeAtendimento.nome'},
            {'titulo': 'INICIO', 'chave': 'inicio'},
            {'titulo': 'FIM', 'chave': 'fim'},
        ];

    }

    ngOnInit() {
    	this._state.notifyDataChanged('menu.isCollapsed', true);

        this.variaveisDeAmbiente['tabela'] = {};
        this.variaveisDeAmbiente['tratamentos'] = [];

        // this.iniciaTabela();
    }

    //  #############################################
    //               Tabela
    //  #############################################
    tratamentos = [];

    iniciaTabela(objParams = {}) {
        
        let param = {
            pagina : objParams['paginaAtual'] || 1,
            quantidade : 30,
            like : objParams['like']
        }

    	this.serviceTratamento.get(param)
    		.subscribe((resposta) => {
                // this.variaveisDeAmbiente['tratamentos'] = (objParams['paginaAtual'] == 1) ? resposta.dados : this.variaveisDeAmbiente['tratamentos'].concat([],resposta.dados);

                // this.variaveisDeAmbiente['tabela'] = {
                //     total: resposta.qtdItensTotal
                // };

                

            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);

                let respostaInicial = [
                    { 
                        ativo: true,
                        id:1,
                        paciente:{
                            id: 13432,
                            nome:'João Lucas Rodrigues Beirigo'
                        },
                        tratamento:{
                            id : 1,
                            descricao : 'Psicológico-Terapeutico'
                        },
                        unidadeAtendimento:{
                            id:1,
                            nome: 'Clínica UNIMED'
                        },
                        inicio: '10/01/2018',
                        fim: ''
                     },{ 
                         id:1,
                        paciente:{
                            id: 13432,
                            nome:'Weslley Wellington da Silva'
                        },
                        tratamento:{
                            id : 1,
                            descricao : 'Alérgico'
                        },
                        unidadeAtendimento:{
                            id:1,
                            nome: 'Matriz'
                        },
                        inicio: '01/01/2018',
                        fim: ''
                     },{ 
                         id:1,
                        paciente:{
                            id: 432,
                            nome:'Cassiano Prado de Melo'
                        },
                        tratamento:{
                            id : 1,
                            descricao : 'Psicológico-Terapeutico'
                        },
                        unidadeAtendimento:{
                            id:1,
                            nome: 'Clínica UNIMED'
                        },
                        inicio: '10/01/2018',
                        fim: ''
                     },{ 
                         id:1,
                        paciente:{
                            id: 32342,
                            nome:'Samuel Goncalves Miranda'
                        },
                        tratamento:{
                            id : 1,
                            descricao : 'Psicológico-Terapeutico'
                        },
                        unidadeAtendimento:{
                            id:1,
                            nome: 'Clínica UNIMED'
                        },
                        inicio: '01/01/2018',
                        fim: ''
                     },{ 
                         id:1,
                        paciente:{
                            id: 3555,
                            nome:'Edmar Wantuil da Silva'
                        },
                        tratamento:{
                            id : 1,
                            descricao : 'Psicológico-Terapeutico'
                        },
                        unidadeAtendimento:{
                            id:1,
                            nome: 'Clínica UNIMED'
                        },
                        inicio: '15/01/2018',
                        fim: '20/01/2018'
                     },{ 
                         id:1,
                        paciente:{
                            id: 13432,
                            nome:'João Lucas Rodrigues Beirigo'
                        },
                        tratamento:{
                            id : 1,
                            descricao : 'Psicológico-Terapeutico'
                        },
                        unidadeAtendimento:{
                            id:1,
                            nome: 'Clínica UNIMED'
                        },
                        inicio: '10/01/2018',
                        fim: ''
                     },{ 
                        ativo: true,
                        id:1,
                        paciente:{
                            id: 13432,
                            nome:'Weslley Wellington da Silva'
                        },
                        tratamento:{
                            id : 1,
                            descricao : 'Alérgico'
                        },
                        unidadeAtendimento:{
                            id:1,
                            nome: 'Matriz'
                        },
                        inicio: '01/01/2018',
                        fim: ''
                     },{ 
                         id:1,
                        paciente:{
                            id: 432,
                            nome:'Cassiano Prado de Melo'
                        },
                        tratamento:{
                            id : 1,
                            descricao : 'Psicológico-Terapeutico'
                        },
                        unidadeAtendimento:{
                            id:1,
                            nome: 'Clínica UNIMED'
                        },
                        inicio: '10/01/2018',
                        fim: ''
                     },{ 
                        ativo: true,
                        id:1,
                        paciente:{
                            id: 32342,
                            nome:'Samuel Goncalves Miranda'
                        },
                        tratamento:{
                            id : 1,
                            descricao : 'Psicológico-Terapeutico'
                        },
                        unidadeAtendimento:{
                            id:1,
                            nome: 'Clínica UNIMED'
                        },
                        inicio: '01/01/2018',
                        fim: ''
                     },{ 
                         id:1,
                        paciente:{
                            id: 3555,
                            nome:'Edmar Wantuil da Silva'
                        },
                        tratamento:{
                            id : 1,
                            descricao : 'Psicológico-Terapeutico'
                        },
                        unidadeAtendimento:{
                            id:1,
                            nome: 'Clínica UNIMED'
                        },
                        inicio: '15/01/2018',
                        fim: '20/01/2018'
                     },{ 
                         id:1,
                        paciente:{
                            id: 13432,
                            nome:'João Lucas Rodrigues Beirigo'
                        },
                        tratamento:{
                            id : 1,
                            descricao : 'Psicológico-Terapeutico'
                        },
                        unidadeAtendimento:{
                            id:1,
                            nome: 'Clínica UNIMED'
                        },
                        inicio: '10/01/2018',
                        fim: ''
                     },{ 
                         id:1,
                        paciente:{
                            id: 13432,
                            nome:'Weslley Wellington da Silva'
                        },
                        tratamento:{
                            id : 1,
                            descricao : 'Alérgico'
                        },
                        unidadeAtendimento:{
                            id:1,
                            nome: 'Matriz'
                        },
                        inicio: '01/01/2018',
                        fim: ''
                     },{ 
                         id:1,
                        paciente:{
                            id: 432,
                            nome:'Cassiano Prado de Melo'
                        },
                        tratamento:{
                            id : 1,
                            descricao : 'Psicológico-Terapeutico'
                        },
                        unidadeAtendimento:{
                            id:1,
                            nome: 'Clínica UNIMED'
                        },
                        inicio: '10/01/2018',
                        fim: ''
                     },{ 
                         id:1,
                        paciente:{
                            id: 32342,
                            nome:'Samuel Goncalves Miranda'
                        },
                        tratamento:{
                            id : 1,
                            descricao : 'Psicológico-Terapeutico'
                        },
                        unidadeAtendimento:{
                            id:1,
                            nome: 'Clínica UNIMED'
                        },
                        inicio: '01/01/2018',
                        fim: ''
                     },{ 
                        ativo: true,
                        id:1,
                        paciente:{
                            id: 3555,
                            nome:'Edmar Wantuil da Silva'
                        },
                        tratamento:{
                            id : 1,
                            descricao : 'Psicológico-Terapeutico'
                        },
                        unidadeAtendimento:{
                            id:1,
                            nome: 'Clínica UNIMED'
                        },
                        inicio: '15/01/2018',
                        fim: '20/01/2018'
                     },{ 
                        ativo: true,
                        id:1,
                        paciente:{
                            id: 13432,
                            nome:'João Lucas Rodrigues Beirigo'
                        },
                        tratamento:{
                            id : 1,
                            descricao : 'Psicológico-Terapeutico'
                        },
                        unidadeAtendimento:{
                            id:1,
                            nome: 'Clínica UNIMED'
                        },
                        inicio: '10/01/2018',
                        fim: ''
                     },{ 
                         id:1,
                        paciente:{
                            id: 13432,
                            nome:'Weslley Wellington da Silva'
                        },
                        tratamento:{
                            id : 1,
                            descricao : 'Alérgico'
                        },
                        unidadeAtendimento:{
                            id:1,
                            nome: 'Matriz'
                        },
                        inicio: '01/01/2018',
                        fim: ''
                     },{ 
                        ativo: true,
                        id:1,
                        paciente:{
                            id: 432,
                            nome:'Cassiano Prado de Melo'
                        },
                        tratamento:{
                            id : 1,
                            descricao : 'Psicológico-Terapeutico'
                        },
                        unidadeAtendimento:{
                            id:1,
                            nome: 'Clínica UNIMED'
                        },
                        inicio: '10/01/2018',
                        fim: ''
                     },{ 
                        ativo: true,
                        id:1,
                        paciente:{
                            id: 32342,
                            nome:'Samuel Goncalves Miranda'
                        },
                        tratamento:{
                            id : 1,
                            descricao : 'Psicológico-Terapeutico'
                        },
                        unidadeAtendimento:{
                            id:1,
                            nome: 'Clínica UNIMED'
                        },
                        inicio: '01/01/2018',
                        fim: ''
                     },{ 
                        ativo: true,
                        id:1,
                        paciente:{
                            id: 3555,
                            nome:'Edmar Wantuil da Silva'
                        },
                        tratamento:{
                            id : 1,
                            descricao : 'Psicológico-Terapeutico'
                        },
                        unidadeAtendimento:{
                            id:1,
                            nome: 'Clínica UNIMED'
                        },
                        inicio: '15/01/2018',
                        fim: '20/01/2018'
                     },{ 
                        ativo: true,
                        id:1,
                        paciente:{
                            id: 13432,
                            nome:'João Lucas Rodrigues Beirigo'
                        },
                        tratamento:{
                            id : 1,
                            descricao : 'Psicológico-Terapeutico'
                        },
                        unidadeAtendimento:{
                            id:1,
                            nome: 'Clínica UNIMED'
                        },
                        inicio: '10/01/2018',
                        fim: ''
                     },{ 
                        ativo: true,
                        id:1,
                        paciente:{
                            id: 13432,
                            nome:'Weslley Wellington da Silva'
                        },
                        tratamento:{
                            id : 1,
                            descricao : 'Alérgico'
                        },
                        unidadeAtendimento:{
                            id:1,
                            nome: 'Matriz'
                        },
                        inicio: '01/01/2018',
                        fim: ''
                     },{ 
                        ativo: true,
                        id:1,
                        paciente:{
                            id: 432,
                            nome:'Cassiano Prado de Melo'
                        },
                        tratamento:{
                            id : 1,
                            descricao : 'Psicológico-Terapeutico'
                        },
                        unidadeAtendimento:{
                            id:1,
                            nome: 'Clínica UNIMED'
                        },
                        inicio: '10/01/2018',
                        fim: ''
                     },{ 
                        ativo: true,
                        id:1,
                        paciente:{
                            id: 32342,
                            nome:'Samuel Goncalves Miranda'
                        },
                        tratamento:{
                            id : 1,
                            descricao : 'Psicológico-Terapeutico'
                        },
                        unidadeAtendimento:{
                            id:1,
                            nome: 'Clínica UNIMED'
                        },
                        inicio: '01/01/2018',
                        fim: ''
                     },{ 
                         id:1,
                        paciente:{
                            id: 3555,
                            nome:'Edmar Wantuil da Silva'
                        },
                        tratamento:{
                            id : 1,
                            descricao : 'Psicológico-Terapeutico'
                        },
                        unidadeAtendimento:{
                            id:1,
                            nome: 'Clínica UNIMED'
                        },
                        inicio: '15/01/2018',
                        fim: '20/01/2018'
                     },{ 
                         id:1,
                        paciente:{
                            id: 13432,
                            nome:'João Lucas Rodrigues Beirigo'
                        },
                        tratamento:{
                            id : 1,
                            descricao : 'Psicológico-Terapeutico'
                        },
                        unidadeAtendimento:{
                            id:1,
                            nome: 'Clínica UNIMED'
                        },
                        inicio: '10/01/2018',
                        fim: ''
                     },{ 
                         id:1,
                        paciente:{
                            id: 13432,
                            nome:'Weslley Wellington da Silva'
                        },
                        tratamento:{
                            id : 1,
                            descricao : 'Alérgico'
                        },
                        unidadeAtendimento:{
                            id:1,
                            nome: 'Matriz'
                        },
                        inicio: '01/01/2018',
                        fim: ''
                     },{ 
                         id:1,
                        paciente:{
                            id: 432,
                            nome:'Cassiano Prado de Melo'
                        },
                        tratamento:{
                            id : 1,
                            descricao : 'Psicológico-Terapeutico'
                        },
                        unidadeAtendimento:{
                            id:1,
                            nome: 'Clínica UNIMED'
                        },
                        inicio: '10/01/2018',
                        fim: ''
                     },{ 
                         id:1,
                        paciente:{
                            id: 32342,
                            nome:'Samuel Goncalves Miranda'
                        },
                        tratamento:{
                            id : 1,
                            descricao : 'Psicológico-Terapeutico'
                        },
                        unidadeAtendimento:{
                            id:1,
                            nome: 'Clínica UNIMED'
                        },
                        inicio: '01/01/2018',
                        fim: ''
                     },{ 
                         id:1,
                        paciente:{
                            id: 3555,
                            nome:'Edmar Wantuil da Silva'
                        },
                        tratamento:{
                            id : 1,
                            descricao : 'Psicológico-Terapeutico'
                        },
                        unidadeAtendimento:{
                            id:1,
                            nome: 'Clínica UNIMED'
                        },
                        inicio: '15/01/2018',
                        fim: '20/01/2018'
                     }
                ]

                let respostaPush = [
                    { 
                        ativo: true,
                        id:1,
                        paciente:{
                            id: 13432,
                            nome:'Zé'
                        },
                        tratamento:{
                            id : 1,
                            descricao : 'Psicológico-Terapeutico'
                        },
                        unidadeAtendimento:{
                            id:1,
                            nome: 'Viver Bem'
                        },
                        inicio: '30/01/2018',
                        fim: ''
                     },{ 
                        ativo: true,
                        id:1,
                        paciente:{
                            id: 13432,
                            nome:'Fábio'
                        },
                        tratamento:{
                            id : 1,
                            descricao : 'Alérgico'
                        },
                        unidadeAtendimento:{
                            id:1,
                            nome: 'Matriz'
                        },
                        inicio: '23/01/2018',
                        fim: ''
                     },{ 
                        ativo: true,
                        id:1,
                        paciente:{
                            id: 432,
                            nome:'Rômulo'
                        },
                        tratamento:{
                            id : 1,
                            descricao : 'Psicológico-Terapeutico'
                        },
                        unidadeAtendimento:{
                            id:1,
                            nome: 'Matriz'
                        },
                        inicio: '24/01/2018',
                        fim: ''
                     },{ 
                        ativo: true,
                        id:1,
                        paciente:{
                            id: 32342,
                            nome:'Alfredo'
                        },
                        tratamento:{
                            id : 1,
                            descricao : 'Psicológico-Terapeutico'
                        },
                        unidadeAtendimento:{
                            id:1,
                            nome: 'Clínica UNIMED'
                        },
                        inicio: '03/01/2018',
                        fim: ''
                     },{ 
                         id:1,
                        paciente:{
                            id: 3555,
                            nome:'Ângela'
                        },
                        tratamento:{
                            id : 1,
                            descricao : 'Psicológico-Terapeutico'
                        },
                        unidadeAtendimento:{
                            id:1,
                            nome: 'Clínica UNIMED'
                        },
                        inicio: '15/01/2018',
                        fim: '02/01/2018'
                     }
                ]

                this.variaveisDeAmbiente['tratamentos'] = (objParams['paginaAtual'] == 1) ? respostaInicial : this.variaveisDeAmbiente['tratamentos'].concat([],respostaPush);

                this.variaveisDeAmbiente['tabela'] = {
                    total: this.variaveisDeAmbiente['tratamentos'].length
                };

            });
    }

    limparFiltros(bAtualizaDados = true) {
        
    }

    abreTratamento(tratamento){
        this.router.navigate([`/${Sessao.getModulo()}/tratamento/${tratamento.id}`]);
    }

    adicionarTratamento(){
        this.router.navigate([`/${Sessao.getModulo()}/tratamento/novo`]);
    }

}