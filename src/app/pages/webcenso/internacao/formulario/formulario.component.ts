import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ToastrService } from 'ngx-toastr';

import { Sessao, Servidor, PrestadorService, LeitoService, DicionarioTissService, InternacaoService } from 'app/services';
import { Saida } from '../../../../theme/components/entrada/entrada.component';

@Component({
    selector: 'formulario',
    templateUrl: './formulario.html',
    styleUrls: ['./formulario.scss']
})
export class Formulario implements OnInit {
    internacao;
    hospitais;
    tipoInternacoes;
    tipoCarateres;
    tipoEncerramento;
    id;
    formularioValido;
    leitoDisponivel;
    leito: Saida;
    prestador: Saida;
    paciente: Saida;
    entrada: Saida;
    tipoInternacao: Saida;
    carater: Saida;
    justificativa: Saida;
    encerramento: Saida;
    saida: Saida;

    prestadorValor;
    pacienteValor;
    entradaValor;
    tipoInternacaoValor;
    caraterValor;
    justificativaValor;
    encerramentoValor;
    saidaValor;
    leitoValor;

    constructor(
        private toastr: ToastrService,
        private prestadorService: PrestadorService,
        private leitoService: LeitoService,
        private dicionarioService: DicionarioTissService,
        private internacaoService: InternacaoService,
        private route: ActivatedRoute,
        private router: Router) {
        this.route.params.subscribe(params => {

            this.id = params['id'];

        });
    }

    ngOnInit() {

        this.prestadorService.getHospitais().subscribe(
            (hospitais) => {
                this.hospitais = hospitais;
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );


        this.dicionarioService.getTipoInternacao()
            .subscribe((tipoInternacoes) => {
                this.tipoInternacoes = tipoInternacoes
            });

        this.dicionarioService.getCaraterAtendimento()
            .subscribe((tipoCarateres) => {
                this.tipoCarateres = tipoCarateres
            });

        this.dicionarioService.getTipoEncerramento()
            .subscribe((tipoEncerramento) => {
                this.tipoEncerramento = tipoEncerramento
            });

        this.leitoService.getDisponiveis()
            .subscribe((leitoDisponivel) => {
                this.leitoDisponivel = leitoDisponivel
            });

        if (this.id) {
            this.internacaoService.getId(this.id)
                .subscribe((internacao) => {
                    this.leitoDisponivel.push(internacao.leitoAtual);

                    if (internacao.prestador) {
                        this.prestadorValor = internacao.prestador.id;
                    }

                    if (internacao.paciente) {
                        this.pacienteValor = internacao.paciente.codigo;
                    }

                    if (internacao.tipoInternacao) {
                        this.tipoInternacaoValor = internacao.tipoInternacao.id;
                    }

                    if (internacao.carater) {
                        this.caraterValor = internacao.carater.id;
                    }

                    if (internacao.tipoEncerramento) {
                        this.encerramentoValor = internacao.tipoEncerramento.id;
                    }

                    if (internacao.leitoAtual) {
                        this.leitoValor = internacao.leitoAtual.id;
                    }

                    this.entradaValor = internacao.entrada;
                    this.justificativaValor = internacao.justificativa;
                    this.saidaValor = internacao.saida;
                }, (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                }
            );
        }
    }

    validar() {
        /*if (!this.prestador.valido) {
            this.formularioValido = false;
            return;
        }
        if (!this.prestador.valido) {
            this.formularioValido = false;
            return;
        }
        if (this.paciente.valido === false) {
            this.formularioValido = false;
            return;
        }
        if (this.entrada.valido === false) {
            this.formularioValido = false;
            return;
        }
        if (this.tipoInternacao.valido === false) {
            this.formularioValido = false;
            return;
        }
        if (this.carater.valido === false) {
            this.formularioValido = false;
            return;
        }
        if (this.justificativa.valido === false) {
            this.formularioValido = false;
            return;
        }
        this.formularioValido = true;*/
    }

    getPrestador(evento) {
        this.prestador = evento;
        this.validar();
    }

    getPaciente(evento) {
        this.paciente = evento;
        this.validar();
    }

    getEntrada(evento) {
        this.entrada = evento;
        this.validar();
    }

    getTipoInternacao(evento) {
        this.tipoInternacao = evento;
        this.validar();
    }

    getCarater(evento) {
        this.carater = evento;
        this.validar();
    }

    getJustificativa(evento) {
        this.justificativa = evento;
        this.validar();
    }

    getLeito(evento) {
        this.leito = evento;
        this.validar();
    }

    getSaida(evento) {
        this.saida = evento;
        this.validar();
    }

    getEncerramento(evento) {
        this.encerramento = evento;
        this.validar();
    }

    submit() {
        this.internacao = {
            "prestador": { "id": this.prestador.valor },
            "paciente": { "codigo": this.paciente.valor },
            "entrada": this.entrada.valor,
            "saida": this.entrada.valor,
            "tipoInternacao": { "id": this.tipoInternacao.valor },
            "tipoEncerramento": { "id": this.encerramento.valor },
            "carater": { "id": this.carater.valor },
            "justificativa": this.justificativa.valor,
            "leitoAtual": { "id": this.leito.valor }
        };

        if (!this.id) {
            this.internacaoService.inserir(this.internacao)
                .subscribe((status) => {
                    if (status == true) {
                        this.router.navigate([`/${Sessao.getModulo()}/internacao`]);
                    }
                });
        }
        else {
            this.internacaoService.atualizar(this.id, this.internacao)
                .subscribe((status) => {
                    if (status == true) {
                        this.router.navigate([`/${Sessao.getModulo()}/internacao`]);
                    }
                });
        }
    }
}
