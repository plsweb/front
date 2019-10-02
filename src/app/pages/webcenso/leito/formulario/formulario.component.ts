import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ToastrService } from 'ngx-toastr';

import { Sessao, Servidor, PrestadorService, LeitoService } from 'app/services';
import { Saida } from '../../../../theme/components/entrada/entrada.component';

@Component({
    selector: 'formulario',
    templateUrl: './formulario.html',
    styleUrls: ['./formulario.scss']
})
export class Formulario implements OnInit {
    leito;
    hospitais;
    tipoLeito = [{ id: 'APARTAMENTO', nome: 'Apartamento' },
    { id: 'ENFERMARIA', nome: 'Enfermaria' },
    { id: 'ISOLAMENTO', nome: 'Isolamento' },
    { id: 'PRIVATIVO', nome: 'Privativo' },
    { id: 'UTI', nome: 'UTI' }];
    id;
    formularioValido;
    prestador: Saida;
    tipo: Saida;
    descricao: Saida;
    ativo: Saida;

    prestadorValor;
    descricaoValor;
    tipoValor;
    ativoValor;

    constructor(
        private toastr: ToastrService,
        private prestadorService: PrestadorService,
        private leitoService: LeitoService,
        private route: ActivatedRoute,
        private router: Router
    ) {
        this.route.params.subscribe(params => {

            this.id = params['id'];

        });
    }

    ngOnInit() {

        this.prestadorService.getHospitais()
            .subscribe((hospitais) => {
                this.hospitais = hospitais;
            },
            (erro) => {Servidor.verificaErro(erro, this.toastr);}
        );

        if (this.id) {
            this.leitoService.getId(this.id)
                .subscribe((leito) => {
                    this.prestadorValor = leito.prestador.id;
                    this.descricaoValor = leito.descricao;
                    this.tipoValor = leito.tipo;
                    this.ativoValor = leito.ativo;
                },
                (erro) => {Servidor.verificaErro(erro, this.toastr);}
            );
        }
    }

    validar() {
        if (!this.prestador.valido) {
            this.formularioValido = false;
            return;
        }
        if (this.tipo.valido === false) {
            this.formularioValido = false;
            return;
        }
        if (this.descricao.valido === false) {
            this.formularioValido = false;
            return;
        }
        if (this.ativo.valido === false) {
            this.formularioValido = false;
            return;
        }
        this.formularioValido = true;
    }

    getPrestador(evento) {
        this.prestador = evento;
        this.validar();
    }

    getTipo(evento) {
        this.tipo = evento;
        this.validar();
    }

    getDescricao(evento) {
        this.descricao = evento;
        this.validar();
    }

    getAtivo(evento) {
        this.ativo = evento;
        this.validar();
    }

    submit() {
        this.leito = {
            "prestador": {
                "id": this.prestador.valor
            },
            "tipo": this.tipo.valor,
            "descricao": this.descricao.valor,
            "ativo": this.ativo.valor,
        };

        if (!this.id) {
            this.leitoService.inserir(this.leito)
                .subscribe((status) => {
                    if (status == true) {
                        this.router.navigate([`/${Sessao.getModulo()}/leito`]);
                    }
                });
        }
        else{
            this.leitoService.atualizar(this.id, this.leito)
            .subscribe((status) => {
                if (status == true) {
                    this.router.navigate([`/${Sessao.getModulo()}/leito`]);
                }
            });
        }
    }
}
