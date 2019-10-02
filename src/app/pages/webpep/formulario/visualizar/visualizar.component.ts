import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ToastrService } from 'ngx-toastr';

import { Sessao, Servidor, FormularioService } from 'app/services';

@Component({
    selector: 'visualizar',
    templateUrl: './visualizar.html',
    styleUrls: ['./visualizar.scss']
})
export class Visualizar implements OnInit {
    id;
    formulario;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private toastr: ToastrService,
        private service: FormularioService,
    ) {
        this.route.params.subscribe(params => {
            this.id = params['id'];
        });
    }

    ngOnInit() {

        if (this.id) {
            this.service.getId(this.id).subscribe(
                (formulario) => {
                    this.formulario = formulario.dados[0];
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                    console.error("erro");
                }
            );
        }
    }

    respostas;
    getResposta(evento, grupoPergunta) {
        // if (this.temFuncao) {
        //     // this.execucaoFormulas();
            
        //     this.respostas = { valor: evento.valor };
        // }

        if (grupoPergunta.tipo == "ESTRELA") {
            if (evento) {
                this.respostas = { valor: evento };   
            }
        }

        if (grupoPergunta.tipo == "UPLOAD" || grupoPergunta.tipo == "DESENHO") {
            console.log("------")

        } else if (grupoPergunta.tipo != "SELECAO") {
            if (evento.valor) {
                this.respostas = { valor: evento.valor };   
            }

        } else {
            if (evento.valor) {
                this.respostas = { valor: evento.valor };
            }
        }

        this.respostas = Object.assign({}, this.respostas);

        this.formulario.formularioGrupo.forEach(grupo => {
            grupo.grupoPergunta.forEach(grupo => {
                if (grupo.pergunta.id == grupoPergunta.pergunta.id) {
                    grupo.pergunta['valor'] = this.respostas.valor;
                }
            })
        });
    }

    voltar() {
        this.router.navigate([`/${Sessao.getModulo()}/formulario/formulario/${this.id}`]);
    }
}
