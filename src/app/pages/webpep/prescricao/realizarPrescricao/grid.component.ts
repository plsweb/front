import {Component, Input, ViewChild, TemplateRef, QueryList, ViewContainerRef, } from '@angular/core';

import { Servidor } from '../../../../services/servidor';
import { Sessao } from '../../../../services/sessao';

import { PrescricaoItemService, ProdutoService, PacientePrescricaoService, EspecialidadeService, PrescricaoItemEspecialidadeService, Login, ProdutoItemService, PacientePrescricaoProdutoService, PacientePrescricaoItemService, UtilService } from '../../../../services';

import { ToastrService } from 'ngx-toastr';
import { FormatosData } from '../../../../theme/components/agenda/agenda';

import * as $ from 'jquery';
import * as moment from 'moment';
import { ActivatedRoute, Router } from '@angular/router';


@Component({
    selector: 'grid',
    templateUrl: './grid.component.html',
    styleUrls: ['./grid.component.scss']
})
export class GridPrescricoes {
  
    idPaciente;
    usuarioGuid;
    atendimento;
    prescricoes = [];
    expandido = false;
    
    requestBODY = new Object();

    modoDetalhado = false;
    visualizaHistoricoRealizacao = true;
    constructor(
        private serviceProduto: ProdutoService,
        private serviceItemProduto: ProdutoItemService,
        private servicePacientePrescricao: PacientePrescricaoService,
        private serviceItemPrescricao: PrescricaoItemService,
        private serviceItemEspecialidade: PrescricaoItemEspecialidadeService,
        private toastr: ToastrService,
        private serviceUtil: UtilService,
        private route: ActivatedRoute,
        private router: Router,
        private servicePacienteProduto: PacientePrescricaoProdutoService,
        private servicePacienteItem: PacientePrescricaoItemService,
    ) {
        this.route.params.subscribe(params => {

            if( params['idpaciente'] ){
                this.idPaciente = params['idpaciente'];
                this.requestBODY['paciente'] = {
                    id: this.idPaciente
                }

            }else{
                if( !Sessao.validaPapelUsuario('WEBPEP:ADMINISTRADOR') ){
                    this.usuarioGuid = Sessao.getUsuario()['guid'];
                    this.requestBODY['usuario'] = {
                        'guid': this.usuarioGuid
                    }
                }
            }

            if( !Sessao.validaPapelUsuario('WEBPEP:ADMINISTRADOR') ){
                this.requestBODY['unidadeAtendimento'] = {
                    id : localStorage.getItem('idUnidade')
                }
            }
            
        });
    }

    formatosDeDatas;
    ngOnInit() {

        this.formatosDeDatas = new FormatosData();

        // this.buscarPrescricoes();
    }

    totalPrescricoes;
    qtdItensTotal;
    paginaAtual = 1;
    itensPorPagina = 20;
    buscarPrescricoes(evento = null){

        let request = {
            pagina : evento ? evento.paginaAtual : this.paginaAtual,
            quantidade: this.itensPorPagina,
            // TODO
            validaEspecialidade: false //!Sessao.validaPapelUsuario("WEBPEP:ADMINISTRADOR")
        }

        Object.assign(this.requestBODY, request);

        this.servicePacientePrescricao.postPrescricaoPacienteFiltro( this.requestBODY, request ).subscribe(
            (prescricoesPaciente) => {
                let retorno = prescricoesPaciente.dados || prescricoesPaciente;

                this.prescricoes = (request['paginaAtual'] == 1) ? retorno : this.prescricoes.concat([], retorno);
                this.totalPrescricoes = prescricoesPaciente.qtdItensTotal;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        )
    }

    idAbaPrescricao;
    abrirAbaPrescricao(idAba) {
        if (this.idAbaPrescricao == idAba) {
            this.idAbaPrescricao = "";
        } else {
            this.idAbaPrescricao = idAba;
        }
    }

    validaClasse(pos){
        return ( pos % 2 == 0 );
    }

    abrirAnexo(ev, id) {
        ev.stopPropagation();
        ev.preventDefault();

        window.open(this.serviceUtil.getArquivo(id, true), '_blank');
    }
}