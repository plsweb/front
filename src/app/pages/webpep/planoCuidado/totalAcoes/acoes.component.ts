import { Component, OnInit, Renderer2, Input, Output } from '@angular/core';

import { PacienteCoacherService, PacienteService, EspecialidadeService, ProfissionalPacienteService, CuidadoService} from '../../../../services';


import { ActivatedRoute, Router } from '@angular/router';
import { GlobalState } from '../../../../global.state';

import { ToastrService } from 'ngx-toastr';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import { EventEmitter } from '@angular/core';
import { Servidor } from 'app/services/servidor';

moment.locale('pt-br');

@Component({
    selector: 'totalAcoes',
    templateUrl: './acoes.html',
    styleUrls: ['./acoes.scss'],
})

export class Acoes implements OnInit {
    
    @Input() tipo;
    @Input() usuarioGuid;
    @Input() unidadeAtendimentoId;

    servico;
    avencer;
    vencidas;
    realizadas;
    total;
    carregando = true;

    @Output() qtdVencidas = new EventEmitter();
    @Output() qtdRealizadas = new EventEmitter();
    @Output() qtdTotal = new EventEmitter();

    constructor(
        public router: Router,
        private toastr: ToastrService,
        public pacienteEspecialidadeService: ProfissionalPacienteService,
        public pacienteCoacherService: PacienteCoacherService,
    ) { }
    
    ngOnInit() {

        let requestPadrao = new Object();
        if( this.tipo == 'coacher' ){
            this.servico = 'pacienteCoacherService';
            requestPadrao['coacherGuid']= this.usuarioGuid;
        }else{
            this.servico = 'pacienteEspecialidadeService';
            requestPadrao['profissionalGuid']= this.usuarioGuid;
        }

        let request = {
            unidadeAtendimentoId: this.unidadeAtendimentoId
        }

        request = Object.assign(request, requestPadrao);

        this[this.servico]['getAcoes']( request ).subscribe(
            (retorno) => {

                let acoesTotal = retorno.dados || retorno

                this.vencidas = acoesTotal.reduce(
                (total,obj) => {
                    return total+obj.vencidas;
                }, 0);

                this.avencer = acoesTotal.reduce(
                (total,obj) => {
                    return total+obj.avencer;
                }, 0);

                this.realizadas = acoesTotal.reduce(
                    (total,obj) => {
                        return total+obj.realizadas;
                    }, 0);
                    
                this.total = this.vencidas + this.avencer;
                
                this.qtdVencidas.emit( this.vencidas )
                
                //ARRUMAR ESSE CODIGO QUANDO A VIEW RETORNAR AÇÕES REALIZADAS
                this.qtdRealizadas.emit( this.realizadas || 20 ); 

                this.qtdTotal.emit( this.total )

                this.carregando = false
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
                this.carregando = false;
            }
        )
    }

    
}