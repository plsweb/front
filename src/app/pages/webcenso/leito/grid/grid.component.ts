import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

import { ToastrService } from 'ngx-toastr';

import { Sessao, Servidor, LeitoService } from 'app/services';

@Component({
    selector: 'grid',
    templateUrl: './grid.html',
    styleUrls: ['./grid.scss'],
})
export class Grid implements OnInit {
    leitos;

    constructor(
        private toastr: ToastrService,
        private service: LeitoService,
        private router: Router
    ) {
    }

    ngOnInit() {
        this.service.get()
            .subscribe((leitos) => {
                this.leitos = leitos;
            },
            (erro) => {Servidor.verificaErro(erro, this.toastr);}
        );
    }

    adicionar() {
        this.router.navigate([`/${Sessao.getModulo()}/leito/formulario`]);
    }

    atualizar(id){
        this.router.navigate([`/${Sessao.getModulo()}/leito/formulario/${id}`]);
    }
}
