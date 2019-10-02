import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

import { ToastrService } from 'ngx-toastr';

import { Sessao, Servidor, TipoAtendimentoService, LocalAtendimentoService } from 'app/services';
import { Saida } from '../../../../../theme/components/entrada/entrada.component';

@Component({
    selector: 'grid',
    templateUrl: './grid.html',
    styleUrls: ['./grid.scss'],
    providers: [TipoAtendimentoService]
})
export class Grid implements OnInit {
    tiposConsulta = [];
    unidadesAtendimento = [];
    filtro:Saida;
    paginaAtual;
    qtdItensTotal;
    itensPorPagina;

    objFiltroAtendimentoTipos = new Object();

    constructor(
        private router: Router,
        private toastr: ToastrService,
        private service: TipoAtendimentoService,
        private localAtendimentoService: LocalAtendimentoService,
    ) {
    }

    ngOnInit() {
        this.paginaAtual = 1;
        this.itensPorPagina = 25;

        this.unidadesAtendimento = Sessao.getVariaveisAmbiente('unidadesAtendimento');

        this.buscaTiposConsultaPaginado(null);
    }

    buscaTiposConsultaPaginado(evento) {
        this.paginaAtual = evento ? evento.paginaAtual : this.paginaAtual;
        
        let request = { 
            pagina : this.paginaAtual, 
            quantidade: this.itensPorPagina 
        }

        if( this.objFiltroAtendimentoTipos && Object.keys(this.objFiltroAtendimentoTipos).length ){
            this.objFiltroAtendimentoTipos = this.validaFiltrosVazios(this.objFiltroAtendimentoTipos);
            Object.assign( request, this.objFiltroAtendimentoTipos );
        }else{
            Object.assign( request, { apenasAtivos : true } );
        }

        this.service.atendimentoTipo( request )
            .subscribe((tiposConsulta) => {
                let retorno = tiposConsulta.dados || tiposConsulta;
                this.tiposConsulta = (request.pagina == 1) ? retorno :  this.tiposConsulta.concat([], retorno);
                this.qtdItensTotal = tiposConsulta.qtdItensTotal;
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
        this.router.navigate([`/${Sessao.getModulo()}/tipoconsulta/novo`]);
    }

    pesquisar(texto) {
        if (texto) {
            this.service.atendimentoTipo( { like: texto, pagina:1, quantidade: 10 }  )
                .subscribe((tiposConsulta) => {
                    this.tiposConsulta = tiposConsulta.dados;
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                },
            );
        }else{
            this.buscaTiposConsultaPaginado( { paginaAtual : 1 } );
        }
    }

    atualizar(id){
        this.router.navigate([`/${Sessao.getModulo()}/tipoconsulta/${id}`]);
    }

    filtrarAtendimentoTipos(params){
        console.log("Filtra");
        console.log(params);
        this.buscaTiposConsultaPaginado({ paginaAtual : 1 });
    }

    limparFiltros(){
        this.objFiltroAtendimentoTipos = new Object();
        this.buscaTiposConsultaPaginado({ paginaAtual : 1 });
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
        this.objFiltroAtendimentoTipos['apenasAtivos'] = !evento
    }
}
