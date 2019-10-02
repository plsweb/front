import { Component, OnInit } from '@angular/core';
import { PerguntaService } from '../../../../services';

import { Servidor } from '../../../../services/servidor';
import { Sessao } from '../../../../services/sessao';

import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';


@Component({
    selector: 'grid',
    templateUrl: './grid.html',
    styleUrls: ['./grid.scss'],
})
export class Grid implements OnInit {
    perguntas;
    ordenacao;
    tipoPergunta;
    
    constructor(
        private router: Router,
        private toastr: ToastrService,
        private servicePergunta: PerguntaService,
    ) {
        this.ordenacao = {
            paginaAtual: 1,
            quantidade: 30
        }
    }

    ngOnInit() {
        this.getPergunta(this.ordenacao);
        this.getTipo();
    }

    adicionar() {
        this.router.navigate([`/${Sessao.getModulo()}/pergunta/formulario`]);
    }

    atualizar(id){
        this.router.navigate([`/${Sessao.getModulo()}/pergunta/formulario/${id}`]);
    }

    excluir(id) {
        if (confirm("Deseja mesmo remover essa pergunta?")) {
            this.servicePergunta.excluir(id).subscribe((pergunta) => {
                this.toastr.success("Pergunta excluida com sucesso.");
            });
        }
    }

    getTipo(){
        this.servicePergunta.getPerguntaTipo().subscribe(
            (tipos) => {
                this.tipoPergunta = tipos.dados || tipos;
                
                this.tipoPergunta.forEach(tipo => {
                    tipo.id = tipo.codigo;
                });

                console.log(this.tipoPergunta)
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        )
    }

    getPergunta(event){
        let request = {
            tipo: this.tipo,
            like: this.ordenacao.termo,
            pagina: event.paginaAtual || this.ordenacao.paginaAtual,
            quantidade: this.ordenacao.quantidade,
        }
    
        if (request.tipo == 0) 
            delete request.tipo;

        this.servicePergunta.pergunta(request)
            .subscribe((perguntas) => {
                this.ordenacao.paginaAtual = perguntas.paginaAtual,
                this.ordenacao.qtdItensTotal = perguntas.qtdItensTotal;
                this.ordenacao.qtdItensPagina = perguntas.qtdItensPagina;

                if (request.pagina == 1) {
                    this.perguntas = perguntas.dados;
                } else {
                    this.perguntas = this.perguntas.concat( [], perguntas.dados );
                }
            },
            (erro) => {Servidor.verificaErro(erro, this.toastr);}
        );
    }

    tipo;
    tipoSelecionado(event) {
        this.tipo = event.valor;
        this.filtrarPergunta(this.ordenacao.termo);
    }

    filtrarPergunta(term){
        this.ordenacao.termo = term;

        let request = {
            like: term,
            tipo: this.tipo,
            pagina: 1,
            quantidade: this.ordenacao.quantidade
        }

        if (request.tipo == 0) 
            delete request.tipo;

        this.servicePergunta.pergunta(request).subscribe(
            (perguntas) => {
                this.perguntas = perguntas.dados || perguntas;
                this.ordenacao.paginaAtual = perguntas.paginaAtual,
                this.ordenacao.qtdItensTotal = perguntas.qtdItensTotal;
                this.ordenacao.qtdItensPagina = perguntas.qtdItensPagina;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        )
    }
}