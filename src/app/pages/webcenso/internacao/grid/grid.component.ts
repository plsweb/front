import { Component, OnInit } from '@angular/core';
import { InternacaoService } from '../../../../services';
import { Servidor } from '../../../../services/servidor';
import { Sessao } from '../../../../services/sessao';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';


@Component({
    selector: 'grid',
    templateUrl: './grid.html',
    styleUrls: ['./grid.scss'],
})
export class Grid implements OnInit {
    internacoes;

    constructor(
        private toastr: ToastrService,
        private router: Router,
        private service: InternacaoService,
    ) {
    }

    ngOnInit() {
        this.service.get()
            .subscribe((internacoes) => {
                this.internacoes = internacoes;
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );
    }

    adicionar() {
        this.router.navigate([`/${Sessao.getModulo()}/internacao/formulario`]);
    }

    atualizar(id){
        this.router.navigate([`/${Sessao.getModulo()}/internacao/formulario/${id}`]);
    }
}
