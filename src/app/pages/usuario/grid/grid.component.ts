import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

import { ToastrService } from 'ngx-toastr';

import { Sessao, Servidor, UsuarioService } from '../../../services';
import { Saida } from '../../../theme/components/entrada/entrada.component';

@Component({
    selector: 'grid',
    templateUrl: './grid.html',
    styleUrls: ['./grid.scss'],
})
export class Grid implements OnInit {
    usuarios = [];
    filtro:Saida;
    paginaAtual;
    qtdItensTotal;
    itensPorPagina;

    constructor(
        private router: Router,
        private toastr: ToastrService,
        private service: UsuarioService,
    ) {
    }

    ngOnInit() {
        this.paginaAtual = 1;
        this.itensPorPagina = 25;

        this.buscaUsuarioPaginado(null);
    }

    buscaUsuarioPaginado(evento) {
        this.paginaAtual = evento ? evento.paginaAtual : this.paginaAtual;

        this.service.usuarioPaginado(this.paginaAtual, this.itensPorPagina)
            .subscribe((usuarios) => {
                this.usuarios = this.usuarios.concat([], usuarios.dados);
                this.qtdItensTotal = usuarios.qtdItensTotal;
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
        this.router.navigate([`/${Sessao.getModulo()}/usuario/formulario`]);
    }

    pesquisar(texto) {
        if (texto) {
            this.service.usuarioPaginadoFiltro(1, 100, texto, false)
                .subscribe((usuarios) => {
                    this.usuarios = usuarios.dados;
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                },
            );
        }
    }

    atualizar(id){
        this.router.navigate([`/${Sessao.getModulo()}/usuario/formulario/${id}`]);
    }
}
