import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ToastrService } from 'ngx-toastr';

import { Servidor, PerguntaService } from 'app/services';
import { Saida } from '../../../../theme/components/entrada/entrada.component';

@Component({
    selector: 'formulario',
    templateUrl: './formulario.html',
    styleUrls: ['./formulario.scss']
})
export class Formulario implements OnInit {
    tipos = [
        { id: "DATA", descricao: "Data" },
        { id: "HORA", descricao: "Hora" },
        { id: "TEXTO", descricao: "Texto" },
        { id: "NUMERO", descricao: "Número" },
        { id: "RADIO", descricao: "Radio" },
        { id: "SELECAO", descricao: "Selecao" },
        { id: "BOOLEAN", descricao: "Sim ou não" },
        { id: "TITULO", descricao: "Título" },
        { id: "AREA", descricao: "Área" },
    ];
    id: number;
    plano: Saida;

    descricaoValor;
    tipoValor;
    mascaraValor;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private toastr: ToastrService,
        private service: PerguntaService,
    ) {
        this.route.params.subscribe(params => {

            this.id = params['id'];
        });
    }

    ngOnInit() {
        if (this.id) {
            this.service.getId(this.id)
                .subscribe((pergunta) => {
                    pergunta = pergunta.dados[0];
                    this.descricaoValor = pergunta.descricao;
                    this.tipoValor = pergunta.tipo;
                    this.mascaraValor = pergunta.mascara;
                },
                (erro) => {Servidor.verificaErro(erro, this.toastr);}
            );
        }
    }

    validar() {

    }

    getPlano(evento) {
        this.plano = evento;
        this.validar();
    }

    submit() {
        let t= new Notification('1');
        /*let pergunta = {
            "descricao": this.descricao.valor,
            "tipo": this.tipo.valor,
            "mascarar": this.mascara.valor
        };

        if (!this.id) {
            this.service.inserir(pergunta)
                .subscribe((status) => {
                    if (status) {
                        this.router.navigate([`/${Sessao.getModulo()}/pergunta`]);
                    }
                });
        }
        else {
            this.service.atualizar(this.id, pergunta)
                .subscribe((status) => {
                    if (status) {
                        this.router.navigate([`/${Sessao.getModulo()}/pergunta`]);
                    }
                });
        }*/
    }
}
