import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

import { ToastrService } from 'ngx-toastr';

import { Sessao, Servidor, ProgramaService } from 'app/services';
import { Saida } from '../../../../../theme/components/entrada/entrada.component';
import { FormatosData } from 'app/theme/components';

import * as moment from 'moment';
moment.locale('pt-br');

@Component({
    selector: 'grid',
    templateUrl: './grid.html',
    styleUrls: ['./grid.scss']
})
export class Grid implements OnInit {
    programas = [];
    unidadesAtendimento = [];
    filtro:Saida;
    paginaAtual;
    qtdItensTotal;
    itensPorPagina;

    objFiltroProgramas = new Object();

    formatosDeDatas;
    momentjs = moment;
    constructor(
        private router: Router,
        private toastr: ToastrService,
        private service: ProgramaService,
    ) {
    }

    ngOnInit() {

        this.formatosDeDatas = new FormatosData();
        this.paginaAtual = 1;
        this.itensPorPagina = 25;

        this.buscaProgramaPaginado(null);
    }

    buscaProgramaPaginado(evento) {
        this.paginaAtual = evento ? evento.paginaAtual : this.paginaAtual;
        
        let request = { 
            pagina : this.paginaAtual, 
            quantidade: this.itensPorPagina 
        }

        if( this.objFiltroProgramas && Object.keys(this.objFiltroProgramas).length ){
            this.objFiltroProgramas = this.validaFiltrosVazios(this.objFiltroProgramas);
            Object.assign( request, this.objFiltroProgramas );
        }
        // else{
        //     Object.assign( request, { apenasAtivos : true } );
        // }

        this.service.get( request )
            .subscribe((programa) => {                
                let retorno = programa.dados || programa;
                this.programas = (request.pagina == 1) ? retorno :  this.programas.concat([], retorno);
                this.qtdItensTotal = programa.qtdItensTotal;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        );
    }

    getFiltro(evento) {
        this.filtro = evento;
    }

    adicionar() {
        this.router.navigate([`/${Sessao.getModulo()}/programa/novo`]);
    }

    pesquisar(texto) {
        if (texto) {
            this.service.get( { like: texto, pagina:1, quantidade: 10 }  )
                .subscribe((programa) => {
                    this.programas = programa.dados;
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                },
            );
        }else{
            this.buscaProgramaPaginado( { paginaAtual : 1 } );
        }
    }

    atualizar(id){
        this.router.navigate([`/${Sessao.getModulo()}/programa/${id}`]);
    }

    filtrarProgramas(params){
        console.log("Filtra");
        console.log(params);
        this.buscaProgramaPaginado({ paginaAtual : 1 });
    }

    limparFiltros(){
        this.objFiltroProgramas = new Object();
        this.buscaProgramaPaginado({ paginaAtual : 1 });
    }

    validaFiltrosVazios(param){
        Object.keys(param).forEach(
            (chave) => {
                if( !( param[chave] && param[chave] != '0') ){
                    if( typeof(param[chave]) !== "boolean" ){
                        delete param[chave];
                    }
                }
            }
        )

        return param;
    }

    setFiltroInativos(evento){
        this.objFiltroProgramas['apenasAtivos'] = !evento
    }
}