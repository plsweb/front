import { Component, OnInit, ViewContainerRef } from '@angular/core';
import { PalavraChaveService, TabelaApi } from '../../../../../services';

import { Servidor } from '../../../../../services/servidor';
import { Sessao } from '../../../../../services/sessao';

import { ActivatedRoute, Router } from '@angular/router';
import { Saida } from '../../../../../theme/components/entrada/entrada.component';

import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'grid',
    templateUrl: './grid.html',
    styleUrls: ['./grid.scss']
})
export class Grid implements OnInit {
    contatos;

    novaPalavrasChave = new Object();
    palavrasChave = [];
    filtro:Saida;
    paginaAtual;
    qtdItensTotal;
    itensPorPagina;

    constructor(
        private servicePalavraChave: PalavraChaveService,
        private serviceColunas: TabelaApi,
        private toastr: ToastrService, 
        private vcr: ViewContainerRef,
        private router: Router) 
    { }

    ngOnInit() {
        this.paginaAtual = 1;
        this.itensPorPagina = 15;

        this.buscaPalavrasChave(null);
    }

    pesquisarPalavrasChave(texto){
        this.buscaPalavrasChave( { paginaAtual : 1 }, texto);
    }

    adicionarPalavrasChave(){

        let obj = this.validaPalavraChave();

        if( !obj ){
            return;
        }

        obj['palavrasChave'] = '#'+ obj['palavrasChave'].replace(/#/g, '');

        this.servicePalavraChave.post( this.novaPalavrasChave ).subscribe(
            (retorno) => { 
                this.toastr.success("Palavra Chave salva com sucesso") 
                this.buscaPalavrasChave();
            },
            (erro) => { this.toastr.error("Erro ao salvar Palavra Chave") },
        )
    }
    validaPalavraChave(){
        let obj = this.novaPalavrasChave;

        if( !obj['coluna'] ){
            this.toastr.error("Necessario selecionar Coluna");
            obj = false;
        }else if( !obj['palavrasChave'] ){
            this.toastr.error("Necessario informar uma palavra chave");
            obj = false;
        }

        return obj;
    }
    

    buscaPalavrasChave(evento = null, desc = null){
        this.paginaAtual = evento ? evento.paginaAtual : this.paginaAtual;
        this.servicePalavraChave.get( { like : (desc || ''), pagina: this.paginaAtual, quantidade: this.itensPorPagina } ).subscribe( palavras => {
            this.palavrasChave = palavras.dados
            this.qtdItensTotal = palavras.qtdItensTotal;
        },
        (erro) => {
            Servidor.verificaErro(erro, this.toastr);
        });
    }

    removePalavrasChave(id){
        if( confirm("Deseja realmente excluir essa Palavra Chave") ){
            this.servicePalavraChave.delete( id ).subscribe(
                (retorno) => {
                    this.buscaPalavrasChave();
                    this.toastr.success("Palavra Chave foi excluida sucesso");
                },(erro) => { this.toastr.error("Erro ao excluir Palavra Chave") }
            )
        }
    }

    editarTipo(descricao, id, pos, requisicaoSalvar){
        let element = jQuery(`tr[data-index='${pos}']`);

        this.editar(true, element);
        
        if( requisicaoSalvar ){
            this.servicePalavraChave.put( id, { palavrasChave : descricao } ).subscribe(
                (retorno) => {
                    this.editar(false, element)                    
                    this.toastr.success("Palavra Chave editada com sucesso") 
                },
                (erro) => { this.toastr.error("Erro ao editar Palavra Chave") }
            )
        }
        
    }

    editar(estado, element){
        if( estado ){
            jQuery(`tr[data-index] #edit-desc:not(.hide)`).addClass('hide')
            jQuery(`tr[data-index] p`).show();
            element.find('p').hide();
            element.find('#edit-desc').removeClass('hide');
        }else{
            element.find('p').show();
            element.find('#edit-desc').addClass('hide');
        }
    }

    colunaSelecionada;
    paciente;
    objPaciente;
    pacienteSelecionado;
    getColuna(coluna) {
        if( coluna ){
            this.colunaSelecionada = coluna.nome;
            this.novaPalavrasChave['coluna'] = { id : coluna.id };
        }else{
            this.colunaSelecionada = '';
            this.novaPalavrasChave['coluna'] = undefined;
        }
    }

    objColuna = [];
    fnCfgColunasRemote(term) {
        let request = {
            pagina: 1, 
            quantidade: 10, 
            like: term
        };
        this.serviceColunas.getColunas( request ).subscribe(
            (retorno) => {
                this.objColuna = retorno.dados || retorno;
            }
        )
    }
}
