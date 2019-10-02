import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

import { Sessao, Servidor, ExameGrupoService } from 'app/services';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'grid',
    templateUrl: './grid.html',
    styleUrls: ['./grid.scss'],
})
export class Grid implements OnInit {
    grupoExames;
    itensPorPagina;
    paginaAtual;
    qtdItensTotal;

    constructor(
        private router: Router,
        private toastr: ToastrService,
        private service: ExameGrupoService,
    ) {
    }

    ngOnInit() {
        this.paginaAtual = 1;
        this.itensPorPagina = 25;

        this.buscarPaginado(null);
    }

    buscarPaginado(evento) {
        this.paginaAtual = evento ? evento.paginaAtual : this.paginaAtual;

        this.service.exameGrupoPaginado(this.paginaAtual, this.itensPorPagina)
            .subscribe((grupoExames) => {
                this.grupoExames = grupoExames.dados;
                this.qtdItensTotal = grupoExames.qtdItensTotal;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        );
    }

    adicionar() {
        this.router.navigate([`/${Sessao.getModulo()}/grupoexame/formulario`]);
    }

    atualizar(id){
        this.router.navigate([`/${Sessao.getModulo()}/grupoexame/formulario/${id}`]);
    }
}
