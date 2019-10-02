import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef, Renderer, TemplateRef, QueryList, ViewContainerRef } from '@angular/core';

import { Servidor } from '../../../../../services/servidor';
import { Sessao } from '../../../../../services/sessao';
import { MedicamentoService, ComposicaoMedicamentoService } from '../../../../../services';

import { ActivatedRoute, Router } from '@angular/router';
import { GlobalState } from '../../../../../global.state';
import { Notificacao, Aguardar, TopoPagina, FormatosData } from '../../../../../theme/components';
import { NgbdModalContent } from '../../../../../theme/components/modal/modal.component';

import { ToastrService } from 'ngx-toastr';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';

moment.locale('pt-br');

@Component({
	selector: 'formulario',
	templateUrl: './formulario.html',
	styleUrls: ['./formulario.scss']
})
export class Formulario implements OnInit {
    idMedicamento;

    formatosDeDatas;

    novoMedicamento = new Object();

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
        private serviceMedicamentoComposicao: ComposicaoMedicamentoService,
        private serviceComposicao: ComposicaoMedicamentoService,
    ) {
        this.route.params.subscribe(params => {
            this.idMedicamento = (params["idmedicamento"] != 'novo') ? params["idmedicamento"] : undefined
        });
    }

    opcoesReceita = [];
    opcoesClassificacao = [];
    ngOnInit() {

        // this.iniciaTabela();

        this.formatosDeDatas = new FormatosData();

        if( this.idMedicamento ){
            this.setMedicamento();
        }

        this.opcoesReceita = Sessao.getEnum('TipoReceita').lista
        this.opcoesClassificacao = Sessao.getEnum('MedicamentoClassificacao').lista;

    }

    setMedicamento(){

        //MUDAR PARA GETATENDIMENTOTIPOPORID
        this.serviceMedicamento.get( { id : this.idMedicamento } ).subscribe(
            tipo => {
                this.novoMedicamento = this.validaMedicamento( ( tipo.dados && tipo.dados.length ) ? tipo.dados[0] : tipo[0]);
                console.log( this.novoMedicamento['composicoes'] );
                
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        )
    }

    validaMedicamento(obj){

        if( obj.medicamento ){
            this.valorMedicamentoSelecionado = obj.medicamento.nome + ' - ' + obj.medicamento.descricao;
        }

        return obj;
    }

    salvarMedicamento(){

        let novoObj = this.validaNovaMedicamento(this.novoMedicamento);

        if(!this.idMedicamento){
            this.serviceMedicamento.salvar(novoObj).subscribe(
                retorno => {
                    this.idMedicamento = retorno;
                    this.router.navigate([`/${Sessao.getModulo()}/medicamento/${retorno}`]);
                    this.toastr.success("Medicamento "+novoObj['nome']+" adicionado com sucesso");
                    this.setMedicamento();
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                },
            ) 
        }else{
            this.serviceMedicamento.atualizar( this.idMedicamento, novoObj).subscribe(
                retorno => {
                    this.toastr.success("Medicamento "+novoObj['nome']+" atualizado com sucesso");
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                },
            ) 
        }
    }

    salvarNovaComposicao(){

       let objComposicao = this.validaNovaComposicao(this.objParamAddComposicao);

        this.serviceMedicamentoComposicao.salvar( objComposicao ).subscribe(
            retorno => {
                this.toastr.success("Composição adicionada com sucesso");
                this.setMedicamento();
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        ) 

    }

    removerComposicao(composicao){
        if ( confirm("Deseja excluir essa composição?") ){

            this.serviceMedicamentoComposicao.excluir( composicao.id ).subscribe(
                (retorno) => {
                    this.toastr.success("Composição excluida com sucesso");
                    this.setMedicamento();
                }
            )

        }
    }

    validaNovaComposicao(obj){

        obj['medicamento'] = {
            id : this.idMedicamento
        }

        return obj;
    }

    validaNovaMedicamento(obj){
        let novoObj = Object.assign( {}, obj );

        delete novoObj['composicoes'];

        return novoObj;
    }

    // PARAMS MEDICAMENTO
    valorMedicamentoSelecionado;
    setObjParamMedicamento(evento){
        if( evento ){
            this.novoMedicamento['medicamento'] = { 
                id : evento.id,
            };

            this.valorMedicamentoSelecionado = evento.nome + ' - ' + evento.descricao;

        }        
    }

   objMedicamentos;  
   fnCfgMedicamentoRemote(term) {
        this.serviceMedicamento.get({ like : term }).subscribe(
            (retorno) => {
                this.objMedicamentos = retorno.dados || retorno;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        );
    }
    // /////////////////////////////////////////////////////////////////////




    objParamAddComposicao = new Object();
    // PARAMS MEDICAMENTO
    valorComposicaoSelecionado;
    setObjParamComposicao(evento){
        if( evento ){
            this.objParamAddComposicao['composicao'] = { 
                id : evento.id,
            };

            this.valorComposicaoSelecionado = evento.nome;

        }        
    }

    objMedicamentoMestre;  
    objComposicoes = []
    fnCfgComposicaoRemote(term) {
        this.serviceMedicamentoComposicao.getComposicao({ like : term, principal : true }).subscribe(
            (retorno) => {
                this.objComposicoes = retorno.dados || retorno;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        );
    }
    // /////////////////////////////////////////////////////////////////////

    voltar(){
        this.router.navigate([`/${Sessao.getModulo()}/medicamento`]);
    }

}