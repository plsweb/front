import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

import { ToastrService } from 'ngx-toastr';

import { Sessao, Servidor, FormularioService } from 'app/services';

@Component({
    selector: 'grid',
    templateUrl: './grid.html',
    styleUrls: ['./grid.scss'],
})
export class Grid implements OnInit {
    formularios;
    preloader;
    formularioSelecionado;
    objFiltroFormulario = ['titulo', 'titulo'];
    ativo: ' ';
    paginaAtual;
    qtdItensTotal;
    itensPorPagina;

    constructor(
        private router: Router,
        private toastr: ToastrService,
        private serviceFormulario: FormularioService,
    ) {
    }

    ngOnInit() {
        this.paginaAtual = 1;
        this.itensPorPagina = 25;

        this.buscaFormularioPaginado(null);
    }

    abrirCarregar() {
        let esse = this;

        esse.preloader = jQuery("#preloader");

        esse.preloader.fadeIn(10);
    }

    fecharCarregar() {
        let esse = this;

        esse.preloader = jQuery("#preloader");

        esse.preloader.fadeOut(10);
    }    

    buscaFormularioPaginado(evento) {
        this.paginaAtual = evento ? evento.paginaAtual : this.paginaAtual;

        this.serviceFormulario.formularioPaginado({ pagina : this.paginaAtual, quantidade: this.itensPorPagina, ativo: this.ativo, simples: true})
            .subscribe((formularios) => {
                this.formularios = formularios.dados;
                this.qtdItensTotal = formularios.qtdItensTotal;

                this.fecharCarregar();
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        );
    }

    filtrarFormulario(nomeForm){
        
        if( nomeForm ){
            
            this.serviceFormulario.formularioPaginado( { like : nomeForm, ativo: this.ativo, simples: true } ).subscribe(
                (grupos) => {
                    this.formularios = grupos.dados;
                    this.qtdItensTotal = grupos.qtdItensTotal;
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                },
            )
        }
    }

    fnCfgFormularioRemote(term){
        return this.serviceFormulario.formularioPaginadoLike( { like : term, ativo: this.ativo, simples: true, quantidade : 10 } );
    }

    adicionar() {
        this.router.navigate([`/${Sessao.getModulo()}/formulario/formulario`]);
    }

    atualizar(id){
        this.router.navigate([`/${Sessao.getModulo()}/formulario/formulario/${id}`]);
    }

    situacao($event) {
        this.ativo = $event.valor;
        this.buscaFormularioPaginado(null);
    }
}