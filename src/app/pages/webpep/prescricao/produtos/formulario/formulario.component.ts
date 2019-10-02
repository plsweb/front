import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { Sessao, Servidor, ProdutoService, MedicamentoService, ProdutoTussService } from '../../../../../services';

import { FormatosData } from '../../../../../theme/components';

import { ToastrService } from 'ngx-toastr';

import * as moment from 'moment';
moment.locale('pt-br');

@Component({
	selector: 'formulario',
	templateUrl: './formulario.html',
	styleUrls: ['./formulario.scss']
})
export class Formulario implements OnInit {
    idProduto;
    formatosDeDatas;
    novoProduto:any;
    objProdutoPadrao:any = new Object();

    constructor(
        private toastr: ToastrService, 
        private router: Router, 
        private route: ActivatedRoute,
        private serviceProduto: ProdutoService,
        private serviceProdutoTuss: ProdutoTussService,
        private serviceMedicamento: MedicamentoService,
    ) {
        this.serviceProdutoTuss
        
        this.route.params.subscribe(params => {
            if( (params["idproduto"] != 'novo') ){
                this.idProduto = params["idproduto"];
                this.objProdutoPadrao = {
                    produto: {
                        id: this.idProduto
                    }
                }
            }
        });
    }

    ngOnInit() {
        this.formatosDeDatas = new FormatosData();

        if( this.idProduto ){
            this.setProduto();
        }else{
            this.novoProduto = new Object();
        }
    }

    setProduto(){
        this.serviceProduto.get( { id : this.idProduto } ).subscribe(
            (tipo) => {
                this.novoProduto = this.validaProduto( ( tipo.dados && tipo.dados.length ) ? tipo.dados[0] : tipo[0]);
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        )
    }

    validaProduto(obj){

        if( obj.medicamento ){
            this.valorMedicamentoSelecionado = obj.medicamento.nome + ' - ' + obj.medicamento.descricao;
        }

        if( obj.mestre ){
            this.valorProdutoMestreSelecionado = obj.mestre.nome;
        }

        return obj;
    }

    salvarProduto(){

        this.novoProduto = this.validaNovaProduto(this.novoProduto);

        this.novoProduto['medicamento'] ? this.novoProduto['medicamento'] = { id: this.novoProduto['medicamento'].id } : null;

        if(!this.idProduto){
            this.serviceProduto.salvar(this.novoProduto).subscribe(
                retorno => {
                    this.idProduto = retorno;
                    this.router.navigate([`/${Sessao.getModulo()}/produto/${retorno}`]);
                    this.toastr.success("Produto "+this.novoProduto['nome']+" adicionado com sucesso");
                    this.setProduto();
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                },
            ) 
        }else{
            this.serviceProduto.atualizar( this.idProduto, this.novoProduto).subscribe(
                () => {
                    this.toastr.success("Produto "+this.novoProduto['nome']+" atualizado com sucesso");
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                },
            ) 
        }
    }

    validaNovaProduto(obj){

        if( obj['principal'] ){
            delete obj['mestre'];
        }

        return obj;
    }

    // PARAMS MEDICAMENTO
    valorMedicamentoSelecionado;
    setObjParamMedicamento(evento){
        if( evento ){
            this.novoProduto['medicamento'] = { 
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

    // PARAMS MEDICAMENTO
    valorProdutoMestreSelecionado;
    setObjParamProdutoMestre(evento){
        if( evento ){
            this.novoProduto['mestre'] = { 
                id : evento.id,
            };

            this.valorProdutoMestreSelecionado = evento.nome + ( (evento.descricao) ? ' - ' + evento.descricao : '');
        }        
    }

    objProdutoMestre;  
   fnCfgProdutoMestreRemote(term) {
        this.serviceProduto.get({ like : term, principal : true }).subscribe(
            (retorno) => {
                this.objProdutoMestre = retorno.dados || retorno;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        );
    }

    voltar(){
        this.router.navigate([`/${Sessao.getModulo()}/produto`]);
    }

    validaErro(erro){
        if( erro._body && erro.status == 412 ){
            try{
                let response = JSON.parse(erro._body);
                this.toastr.error(response.message);
                return;
            }catch(e){
                console.error("Erro ao exibir mensagem");
            }
        }
    }
}