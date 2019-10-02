import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ToastrService } from 'ngx-toastr';

import { Sessao, Servidor, PrestadorService, LeitoService} from 'app/services';
import { Saida } from '../../../../theme/components/entrada/entrada.component';

@Component({
    selector: 'formulario',
    templateUrl: './formulario.html',
    styleUrls: ['./formulario.scss']
})
export class Formulario implements OnInit {
    indicacaoexames;
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
        private router: Router,
        private route: ActivatedRoute,
        private toastr: ToastrService,
        private prestadorService: PrestadorService,
        private indicacaoexamesService: LeitoService,
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
            this.indicacaoexamesService.getId(this.id)
                .subscribe((indicacaoexames) => {
                    this.prestadorValor = indicacaoexames.prestador.id;
                    this.descricaoValor = indicacaoexames.descricao;
                    this.tipoValor = indicacaoexames.tipo;
                    this.ativoValor = indicacaoexames.ativo;
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
        this.indicacaoexames = {
            "prestador": {
                "id": this.prestador.valor
            },
            "tipo": this.tipo.valor,
            "descricao": this.descricao.valor,
            "ativo": this.ativo.valor,
        };

        if (!this.id) {
            this.indicacaoexamesService.inserir(this.indicacaoexames)
                .subscribe((status) => {
                    if (status == true) {
                        this.router.navigate([`/${Sessao.getModulo()}/indicacaoexames`]);
                    }
                });
        }
        else{
            this.indicacaoexamesService.atualizar(this.id, this.indicacaoexames)
            .subscribe((status) => {
                if (status == true) {
                    this.router.navigate([`/${Sessao.getModulo()}/indicacaoexames`]);
                }
            });
        }
    }
}
