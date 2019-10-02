import { Component, ViewChild, Input, TemplateRef, Output, ViewContainerRef, EventEmitter, ElementRef, Renderer, OnInit } from '@angular/core';
import { NgxUploaderModule } from 'ngx-uploader';
import { TabelaApi, Login} from '../../../../../services';

import { Servidor } from '../../../../../services/servidor';
import { Sessao } from '../../../../../services/sessao';

import { ActivatedRoute, Router } from '@angular/router';
import { Saida } from '../../../../../theme/components/entrada/entrada.component';

import { NgbdModalContent } from '../../../../../theme/components/modal/modal.component';
import { NgbModal, NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';

import { ToastrService } from 'ngx-toastr';

import * as moment from 'moment';
import * as jQuery from 'jquery';
import { FormatosData } from '../../../../../theme/components';
import { Util } from 'app/services/util';


@Component({
    selector: 'formulario',
    templateUrl: './formulario.html',
    styleUrls: ['./formulario.scss'],
})
export class Formulario implements OnInit {

    idTabelaApi

    tabelaApi = new Object();
    tiposColuna = [];
    tiposRest = [];

    formatosDeDatas;
    colorPicker;

    tamanhoMaximo = 120;

    @ViewChild("formularioRestBody", {read: TemplateRef}) formularioRestBody: TemplateRef<any>;
    @ViewChild("formularioRestBotoes", {read: TemplateRef}) formularioRestBotoes: TemplateRef<any>;

    @ViewChild("formularioColunaBody", {read: TemplateRef}) formularioColunaBody: TemplateRef<any>;
    @ViewChild("formularioColunaBotoes", {read: TemplateRef}) formularioColunaBotoes: TemplateRef<any>;

    constructor(
        
        private toastr: ToastrService, 
        private vcr: ViewContainerRef,
        private modalService: NgbModal,
        private route: ActivatedRoute,
        private service: TabelaApi,
        private router: Router) 
    {
        this.route.params.subscribe(params => {
            this.idTabelaApi = (params["idtabelaapi"] != 'novo') ? params["idtabelaapi"] : undefined
        });
    }


    ngOnInit() {
        
        this.formatosDeDatas = new FormatosData();

        this.service.getTiposColuna({}).subscribe(
            (tipos) => {
                this.tiposColuna = tipos.dados || tipos;
                console.log(this.tiposColuna);
                
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
                this.tiposColuna = Sessao.getEnum('FiltroClasse').lista;
            },
        )

        this.service.getTiposRest({}).subscribe(
            (tipos) => {
                this.tiposRest = tipos.dados || tipos;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
                this.tiposRest = Sessao.getEnum('ApiTipo').lista;
            }
        )

        if( this.idTabelaApi ){
            this.setTabelaApi();
        }

    }

    salvarTabelaApi(){

        this.tabelaApi = this.validaNovaTabela(this.tabelaApi);

        if(!this.idTabelaApi){
            this.service.salvar(this.tabelaApi).subscribe(
                retorno => {
                    this.idTabelaApi = retorno;
                    this.sincronizaTabelaApi();
                    this.router.navigate([`/${Sessao.getModulo()}/tabelaapi/${retorno}`]);
                    this.toastr.success("Tabela API "+this.tabelaApi['descricao']+" adicionada com sucesso");
                    this.setTabelaApi();
                }
            ) 
        }else{
            this.service.atualizar( this.idTabelaApi, this.tabelaApi).subscribe(
                retorno => {
                    this.sincronizaTabelaApi();
                    this.toastr.success("Tabela API "+this.tabelaApi['descricao']+" atualizada com sucesso");
                }
            ) 
        }
    }

    excluirTabelaApi(id){
        if( confirm("Deseja excluir essa coluna?") ){
            this.service.deletarColunas( id ).subscribe(
                (retorno) => {
                    this.toastr.success("Coluna Deletada");
                }
            )
        }
    }

    setTabelaApi(){
        this.service.get( { id : this.idTabelaApi } ).subscribe(
            tabela => {
                if( tabela.dados && tabela.dados.length ){
                    this.tabelaApi = this.validaTabela(tabela.dados[0]);
                }
            }
        )
    }

    validaNovaTabela(tabela){
        return tabela;
    }

    activeModal;
    objParamsRest = new Object();
    objParamsColuna = new Object();
    atualizar(obj, labelObj){

        this['objParams'+labelObj] = obj || new Object();

        // if( !obj ){
           this['objParams'+labelObj] = this.validaObjModal(this['objParams'+labelObj], labelObj);
        // }else{
        //     this.
        // }

        this.activeModal = this.modalService.open(NgbdModalContent, {size: 'lg'});
        this.activeModal.componentInstance.modalHeader  = ( (obj) ? 'Editar' : 'Salvar Novo' ) + labelObj;

        this.activeModal.componentInstance.templateRefBody = this['formulario'+labelObj+'Body'];
        this.activeModal.componentInstance.templateBotoes = this['formulario'+labelObj+'Botoes'];

        this.activeModal.result.then(
            (data) => {
                this['objParamsRest'] = new Object();
                this['objParamsColuna'] = new Object();
            },
            (reason) => {
                this['objParamsRest'] = new Object();
                this['objParamsColuna'] = new Object();
            }
        )


    }

    validaObjModal(obj, labelObj){
        if( labelObj == 'Rest' ){

        }else if(labelObj == 'Coluna'){
            this.tabelaSelecionada = '';
            if( obj['palavraChave'] && obj['palavraChave'] != '' ){
                obj['palavraChave'] = obj['palavraChave'].replace(/#/g, '').replace(/ /g, '_').toUpperCase();
            }

            if( obj['tabelaClasse'] ){
                console.log(obj['tabelaClasse']['descricao']);
                
                this.tabelaSelecionada = obj['tabelaClasse']['descricao'];
            }
        }

        return obj;
    }

    validaPalavraChave(palavra){
        return (( palavra && palavra != '' ) ? palavra.replace(/#/g, '').replace(/_/g, ' ') : '');
    }

    criarElemento(objParams, tipo, id){
        let metodo = ( (id) ? "atualizar" : "salvar" ) + tipo;

        if( tipo != '' ){
            objParams['tabela'] = { id : this.idTabelaApi };
        }

        objParams = this.validaObjPreSalvamento(objParams, tipo)

        this.service[metodo](id, objParams).subscribe(
            (retorno) => {
                this.toastr.success(tipo + " Salvo com sucesso");
                if( !tipo ){
                    this.idTabelaApi = retorno;
                }

                this.sincronizaTabelaApi();

                this.refreshMolduras(tipo, objParams);
                (this.activeModal) ? this.activeModal.close() : null;
            },
            (erro) => {
                this.toastr.error("Erro ao salvar " + tipo);
            }
        )

    }

    validaObjPreSalvamento(obj, tipo){
        obj.tabela = obj.tabela ? {id: obj.tabela.id} : undefined;

        if( tipo == "" ){
            delete obj.colunas
            delete obj.rests
        }else if( tipo == 'Colunas' ){
            if( obj.palavraChave && obj.palavraChave != ''){
                obj['palavraChave'] = ('#'+ obj['palavraChave'].replace(/#/g, '')).replace(/ /g, '_').trim().toUpperCase();
            }

            if( obj['tabelaClasse'] ){
                obj['tabelaClasse'] = {
                    id: obj['tabelaClasse']['id']
                }
            }
        }

        return obj
    }
    
    refreshMolduras(tipo, obj){
        this.setTabelaApi();
        
        if( tipo == "Rests" ){
            this['objParamsRest'] = new Object();
        }else if( tipo == "Colunas" ){
            this['objParamsColuna'] = new Object();

            if( obj['palavraChave'] ){
                console.warn("salva palavra chave");
            }

        }
    }


    objTabelas = [];
    fnCfgTabelaApiRemote(term){
        this.service.get({ like: term, pagina: 1, quantidade: 10 }).subscribe((tabelas)=> {
            this.objTabelas = tabelas.dados;
            console.log(this.objTabelas)
        },
        (erro) => {
            Servidor.verificaErro(erro, this.toastr);
        },);
    }

    tabelaSelecionada
    getTabelaApi(evento){
        if( evento ){
            console.log(evento);
            this.objParamsColuna['tabelaClasse'] = { id : evento.id }
            this.tabelaSelecionada = evento.descricao;
        }
    }

    setTipoColuna(evento){
        if(evento){
            this.objParamsColuna['tipo'] = evento.valor;
        }
    }

    validaTabela(tabela){
        return tabela;
    }

    voltar(){
        this.router.navigate([`/${Sessao.getModulo()}/tabelaapi`]);
    }

    sincronizaTabelaApi(){
        this.toastr.warning('Sincronizando tabelas...');
        // localStorage.setItem('tabelaApi', JSON.stringify([]));

        this.service.get().subscribe(
            (resposta) => {
              this.toastr.success("Tabelas Sincronizadas...");
              localStorage.setItem('tabelaApi', JSON.stringify(resposta));
            },
            (erro) => {
              this.toastr.error("Houve um erro ao sincronizar as tabelas");
              localStorage.setItem('tabelaApi', JSON.stringify([]));
          }
        )
    }

}