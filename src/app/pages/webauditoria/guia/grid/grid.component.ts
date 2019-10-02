import { Component, OnInit } from '@angular/core';
import { GuiaService } from '../../../../services';

import { Servidor } from '../../../../services/servidor';
import { Sessao } from '../../../../services/sessao';

import { ActivatedRoute, Router } from '@angular/router';
import { Saida } from '../../../../theme/components/entrada/entrada.component';
import { ToastrService } from 'ngx-toastr';


@Component({
    selector: 'grid',
    templateUrl: './grid.html',
    styleUrls: ['./grid.scss'],
})
export class Grid implements OnInit {
    beneficiarios = [];
    filtro:Saida;
    paginaAtual;
    qtdItensTotal;
    numeroGuia;
    itensPorPagina;

    constructor(
        private service: GuiaService, 
        private router: Router,
        private toastr: ToastrService) {
    }

    ngOnInit() {
    }

    buscaGuiaPorImpressoOuId() {

        if( !this.numeroGuia ){
            this.toastr.warning("Informe um numero de guia válido");
            return;
        }

        this.service.getGuiaPorId(this.numeroGuia).subscribe(
            (guia) => {
                console.log(guia);
                if( guia && guia.length ){
                    this.router.navigate([`/${Sessao.getModulo()}/previa/formulario/${this.numeroGuia}`]);
                }
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);

                if( erro.status = 412 ){
                    // MELHORAR ESSE CODIGO, CASO HAJA UMA CONVENÇÃO DE MASCARA PARA IMPRESSO E/OU ID DE GUIA
                    this.service.getGuiaPorImpresso(this.numeroGuia)
                        .subscribe(
                            (guia) => {
                                if( guia && guia.id ){
                                    this.router.navigate([`/${Sessao.getModulo()}/previa/formulario/${guia.id}`]);
                                }
                            },
                            (erro) => {
                                Servidor.verificaErro(erro, this.toastr);

                                if( erro.status == 412 ){
                                    this.toastr.warning("Nao foi encontrada nenhuma guia")
                                }
                            }
                        )
                }
            }
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
            // this.service.getBeneficiarioLikePaginado(1, 100, texto)
            //     .subscribe((beneficiarios) => {
            //         this.beneficiarios = beneficiarios.dados;
            //     },
            //     (erro) => {
            //         Servidor.verificaErro(erro, this.toastr);
            //     },
            // );
        }
    }

    abrir(beneficiario) {
        this.router.navigate([`/${Sessao.getModulo()}/guia/formulario/${beneficiario.codigo}`]);
    }
}

