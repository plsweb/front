import { Component, OnInit } from '@angular/core';
import { GuiaService } from '../../../../services';

import { Servidor } from '../../../../services/servidor';
import { Sessao } from '../../../../services/sessao';

import { ActivatedRoute, Router } from '@angular/router';
import { Saida } from '../../../../theme/components/entrada/entrada.component';


@Component({
    selector: 'grid',
    templateUrl: './grid.html',
    styleUrls: ['./grid.scss'],
})
export class Grid implements OnInit {
    guias = [];
    filtro:Saida;
    paginaAtual;
    qtdItensTotal;
    itensPorPagina;
    qtdAudit;
    qtdReal;

    constructor(
        private service: GuiaService, 
        private router: Router) {
    }

    ngOnInit() {
        this.paginaAtual = 1;
        this.itensPorPagina = 10;

        this.filtroGuiaPorProcedimento(null);
    }

    filtroGuiaPorProcedimento(evento = null) {
        this.paginaAtual = evento ? evento.paginaAtual : this.paginaAtual;

        let request = {
            pagina: this.paginaAtual,
            quantidade: this.itensPorPagina
        };

        if( this.filtro ){
            Object.assign(request, this.filtro);
        }

        // this.service.getFiltroGuia(request)
        //     .subscribe((guias) => {
        //         let retorno = guias.dados || guias;
        //         this.guias = (evento.paginaAtual == 1) ? this.guias = retorno : this.guias.concat(
        //             this.guiasTemp, 
        //             retorno) ;

        //         this.validaQtdAuditReal();
        //         this.qtdItensTotal = guias.qtdItensTotal;
        //     },
        //     (erro) => {
        //         console.log(erro);
                
        //         this.validaQtdAuditReal();
        //         // this.setGuia();
        //         this.guias = this.guias.concat([], this.guiasTemp) ;
        //         Servidor.verificaErro(erro, this.toastr);
        //     },
        // );
    }

    setGuia(){
        this.guias = [
            {
                id: 32323,
                procedimento: {
                    codigo: 123,
                    descricao: 'DKFREKMFKLSMF'
                },
                auditoria: true,
                realizado: false,
                data: '02/03/2018'
            },{
                id: 15987,
                procedimento: {
                    codigo: 666,
                    descricao: 'DSF AREG SDG'
                },
                auditoria: false,
                realizado: false,
                data: '02/04/2017'
            },{
                id: 112233,
                procedimento: {
                    codigo: 111,
                    descricao: 'SLHFLDKJGLDFK'
                },
                auditoria: true,
                realizado: true,
                data: '02/05/2017'
            },{
                id: 32323,
                procedimento: {
                    codigo: 123,
                    descricao: 'DKFREKMFKLSMF'
                },
                auditoria: true,
                realizado: false,
                data: '02/03/2018'
            },{
                id: 15987,
                procedimento: {
                    codigo: 666,
                    descricao: 'DSF AREG SDG'
                },
                auditoria: false,
                realizado: false,
                data: '02/04/2017'
            },{
                id: 112233,
                procedimento: {
                    codigo: 111,
                    descricao: 'SLHFLDKJGLDFK'
                },
                auditoria: true,
                realizado: true,
                data: '02/05/2017'
            },{
                id: 32323,
                procedimento: {
                    codigo: 123,
                    descricao: 'DKFREKMFKLSMF'
                },
                auditoria: true,
                realizado: false,
                data: '02/03/2018'
            },{
                id: 15987,
                procedimento: {
                    codigo: 666,
                    descricao: 'DSF AREG SDG'
                },
                auditoria: false,
                realizado: false,
                data: '02/04/2017'
            },{
                id: 112233,
                procedimento: {
                    codigo: 111,
                    descricao: 'SLHFLDKJGLDFK'
                },
                auditoria: true,
                realizado: true,
                data: '02/05/2017'
            },{
                id: 32323,
                procedimento: {
                    codigo: 123,
                    descricao: 'DKFREKMFKLSMF'
                },
                auditoria: true,
                realizado: false,
                data: '02/03/2018'
            },{
                id: 15987,
                procedimento: {
                    codigo: 666,
                    descricao: 'DSF AREG SDG'
                },
                auditoria: false,
                realizado: false,
                data: '02/04/2017'
            },{
                id: 112233,
                procedimento: {
                    codigo: 111,
                    descricao: 'SLHFLDKJGLDFK'
                },
                auditoria: true,
                realizado: true,
                data: '02/05/2017'
            },{
                id: 32323,
                procedimento: {
                    codigo: 123,
                    descricao: 'DKFREKMFKLSMF'
                },
                auditoria: true,
                realizado: false,
                data: '02/03/2018'
            },{
                id: 15987,
                procedimento: {
                    codigo: 666,
                    descricao: 'DSF AREG SDG'
                },
                auditoria: false,
                realizado: false,
                data: '02/04/2017'
            },{
                id: 112233,
                procedimento: {
                    codigo: 111,
                    descricao: 'SLHFLDKJGLDFK'
                },
                auditoria: true,
                realizado: true,
                data: '02/05/2017'
            },{
                id: 32323,
                procedimento: {
                    codigo: 123,
                    descricao: 'DKFREKMFKLSMF'
                },
                auditoria: true,
                realizado: false,
                data: '02/03/2018'
            },{
                id: 15987,
                procedimento: {
                    codigo: 666,
                    descricao: 'DSF AREG SDG'
                },
                auditoria: false,
                realizado: false,
                data: '02/04/2017'
            },{
                id: 112233,
                procedimento: {
                    codigo: 111,
                    descricao: 'SLHFLDKJGLDFK'
                },
                auditoria: true,
                realizado: true,
                data: '02/05/2017'
            },{
                id: 32323,
                procedimento: {
                    codigo: 123,
                    descricao: 'DKFREKMFKLSMF'
                },
                auditoria: true,
                realizado: false,
                data: '02/03/2018'
            },{
                id: 15987,
                procedimento: {
                    codigo: 666,
                    descricao: 'DSF AREG SDG'
                },
                auditoria: false,
                realizado: false,
                data: '02/04/2017'
            },{
                id: 112233,
                procedimento: {
                    codigo: 111,
                    descricao: 'SLHFLDKJGLDFK'
                },
                auditoria: true,
                realizado: true,
                data: '02/05/2017'
            },{
                id: 32323,
                procedimento: {
                    codigo: 123,
                    descricao: 'DKFREKMFKLSMF'
                },
                auditoria: true,
                realizado: false,
                data: '02/03/2018'
            },{
                id: 15987,
                procedimento: {
                    codigo: 666,
                    descricao: 'DSF AREG SDG'
                },
                auditoria: false,
                realizado: false,
                data: '02/04/2017'
            },{
                id: 112233,
                procedimento: {
                    codigo: 111,
                    descricao: 'SLHFLDKJGLDFK'
                },
                auditoria: true,
                realizado: true,
                data: '02/05/2017'
            }
        ]
    }

    getFiltro(evento) {
        this.filtro = evento;
    }

    adicionar() {
        this.router.navigate([`/${Sessao.getModulo()}/usuario/formulario`]);
    }

    objFiltroGuias = new Object();
    objFiltro = new Object();
    filtrarGuias(params){
        
        this.paginaAtual = 1
        this.itensPorPagina = 25
        this.objFiltro = this.objFiltroGuias;

        this.objFiltroGuias = this.validaFiltrosVazios(this.objFiltroGuias);

        this.filtroGuiaPorProcedimento(null);
    }

    validaQtdAuditReal(){
        this.qtdAudit = 2;
        this.qtdReal = 3;
    }

    validaFiltrosVazios(param){
        Object.keys(param).forEach(
            (chave) => {
                if( !(param[chave] && param[chave] != '0') ){
                    delete param[chave];
                }
            }
        )

        return param;
    }

    limparFiltros(){
        this.paginaAtual = 1
        this.itensPorPagina = 25
        this.objFiltroGuias = new Object();
        this.filtro = undefined;

        this.filtroGuiaPorProcedimento();
    }

    pesquisar(texto) {
        if (texto) {
            // this.service.getBeneficiarioLikePaginado(1, 100, texto)
            //     .subscribe((guias) => {
            //         this.guias = guias.dados;
            //     },
            //     (erro) => {
            //         Servidor.verificaErro(erro, this.toastr);
            //     },
            // );
        }
    }

    abrir(beneficiario) {
        this.router.navigate([`/${Sessao.getModulo()}/beneficiario/formulario/${beneficiario.codigo}`]);
    }

    guiasTemp = [
        {
            id: 32323,
            procedimento: {
                codigo: 123,
                descricao: 'DKFREKMFKLSMF'
            },
            auditoria: true,
            realizado: false,
            data: '02/03/2018'
        },{
            id: 15987,
            procedimento: {
                codigo: 666,
                descricao: 'DSF AREG SDG'
            },
            auditoria: false,
            realizado: false,
            data: '02/04/2017'
        },{
            id: 112233,
            procedimento: {
                codigo: 111,
                descricao: 'SLHFLDKJGLDFK'
            },
            auditoria: true,
            realizado: true,
            data: '02/05/2017'
        },{
            id: 32323,
            procedimento: {
                codigo: 123,
                descricao: 'DKFREKMFKLSMF'
            },
            auditoria: true,
            realizado: false,
            data: '02/03/2018'
        },{
            id: 15987,
            procedimento: {
                codigo: 666,
                descricao: 'DSF AREG SDG'
            },
            auditoria: false,
            realizado: false,
            data: '02/04/2017'
        },{
            id: 112233,
            procedimento: {
                codigo: 111,
                descricao: 'SLHFLDKJGLDFK'
            },
            auditoria: true,
            realizado: true,
            data: '02/05/2017'
        },{
            id: 32323,
            procedimento: {
                codigo: 123,
                descricao: 'DKFREKMFKLSMF'
            },
            auditoria: true,
            realizado: false,
            data: '02/03/2018'
        },{
            id: 15987,
            procedimento: {
                codigo: 666,
                descricao: 'DSF AREG SDG'
            },
            auditoria: false,
            realizado: false,
            data: '02/04/2017'
        },{
            id: 112233,
            procedimento: {
                codigo: 111,
                descricao: 'SLHFLDKJGLDFK'
            },
            auditoria: true,
            realizado: true,
            data: '02/05/2017'
        },{
            id: 32323,
            procedimento: {
                codigo: 123,
                descricao: 'DKFREKMFKLSMF'
            },
            auditoria: true,
            realizado: false,
            data: '02/03/2018'
        },{
            id: 15987,
            procedimento: {
                codigo: 666,
                descricao: 'DSF AREG SDG'
            },
            auditoria: false,
            realizado: false,
            data: '02/04/2017'
        },{
            id: 112233,
            procedimento: {
                codigo: 111,
                descricao: 'SLHFLDKJGLDFK'
            },
            auditoria: true,
            realizado: true,
            data: '02/05/2017'
        },{
            id: 32323,
            procedimento: {
                codigo: 123,
                descricao: 'DKFREKMFKLSMF'
            },
            auditoria: true,
            realizado: false,
            data: '02/03/2018'
        },{
            id: 15987,
            procedimento: {
                codigo: 666,
                descricao: 'DSF AREG SDG'
            },
            auditoria: false,
            realizado: false,
            data: '02/04/2017'
        },{
            id: 112233,
            procedimento: {
                codigo: 111,
                descricao: 'SLHFLDKJGLDFK'
            },
            auditoria: true,
            realizado: true,
            data: '02/05/2017'
        },{
            id: 32323,
            procedimento: {
                codigo: 123,
                descricao: 'DKFREKMFKLSMF'
            },
            auditoria: true,
            realizado: false,
            data: '02/03/2018'
        },{
            id: 15987,
            procedimento: {
                codigo: 666,
                descricao: 'DSF AREG SDG'
            },
            auditoria: false,
            realizado: false,
            data: '02/04/2017'
        },{
            id: 112233,
            procedimento: {
                codigo: 111,
                descricao: 'SLHFLDKJGLDFK'
            },
            auditoria: true,
            realizado: true,
            data: '02/05/2017'
        },{
            id: 32323,
            procedimento: {
                codigo: 123,
                descricao: 'DKFREKMFKLSMF'
            },
            auditoria: true,
            realizado: false,
            data: '02/03/2018'
        },{
            id: 15987,
            procedimento: {
                codigo: 666,
                descricao: 'DSF AREG SDG'
            },
            auditoria: false,
            realizado: false,
            data: '02/04/2017'
        },{
            id: 112233,
            procedimento: {
                codigo: 111,
                descricao: 'SLHFLDKJGLDFK'
            },
            auditoria: true,
            realizado: true,
            data: '02/05/2017'
        },{
            id: 32323,
            procedimento: {
                codigo: 123,
                descricao: 'DKFREKMFKLSMF'
            },
            auditoria: true,
            realizado: false,
            data: '02/03/2018'
        },{
            id: 15987,
            procedimento: {
                codigo: 666,
                descricao: 'DSF AREG SDG'
            },
            auditoria: false,
            realizado: false,
            data: '02/04/2017'
        },{
            id: 112233,
            procedimento: {
                codigo: 111,
                descricao: 'SLHFLDKJGLDFK'
            },
            auditoria: true,
            realizado: true,
            data: '02/05/2017'
        }
    ]

}
