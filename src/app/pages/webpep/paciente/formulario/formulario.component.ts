import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute, Router } from '@angular/router';

import { Sessao, Servidor, PacienteService, AtendimentoService, FormularioService, ExameService, GuiaService, PainelSenhaService, UsuarioService } from 'app/services';

import { Saida, FormatosData } from 'app/theme/components';

import { ToastrService } from 'ngx-toastr';
import * as sha1 from 'js-sha1';
import * as moment from 'moment';
moment.locale('pt-br');

@Component({
    selector: 'formulario',
    templateUrl: './formulario.html',
    styleUrls: ['./formulario.scss']
})
export class Formulario implements OnInit {

    alertaDescricao: Saida;
    alertas = [];
    atual = "basico";
    paciente;
    rda;
    cids;
    codigo;
    consultorio: string = localStorage.getItem('consultorio');
    descricao: Saida;
    descricaoValor;
    evolucaoId: Saida;
    usuarioAtendimento;
    evolucaoIdValor;
    evolucoes;
    exames;
    examesFiltrados;
    guias;
    guiasFiltrados;
    formularios;
    idAbaAberta = "";
    tipo: Saida;

    qtdItensTotal;
    paginaAtual = 1;
    itensPorPagina = 10;

    tipoValor;
    unidade: string = localStorage.getItem('unidade');

    filtro = "";
    filtroGuias = "";
    formatosDeDatas;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private toastr: ToastrService,
        private atendimentoService: AtendimentoService,
        private usuarioService: UsuarioService,
        private exameService: ExameService,
    ) {
        this.route.params.subscribe(params => {
            this.codigo = params['codigo'];
        });
    }

    ngOnInit() {
        this.formatosDeDatas = new FormatosData();
    }

    buscaGuiasPaginado(evento){

        this.paginaAtual = evento ? evento.paginaAtual : this.paginaAtual;

        // this.guiaService.getGuiasPorPacienteCodigoPaginado(this.paginaAtual, this.itensPorPagina, this.paciente.codigo)
        //     .subscribe((guias) => {
        //         this.guiasFiltrados = guias.dados;
        //         this.guias = guias.dados;
        //         this.qtdItensTotal  = guias.qtdItensTotal;
        //     },
        //     (erro) => {Servidor.verificaErro(erro, this.toastr);}
        // );

    }

    atualizar() {

    }

    validar() {

    }

    abrirAbaExame(idAba) {
        if (this.idAbaAberta == idAba) {
            this.idAbaAberta = "";
        } else {
            this.idAbaAberta = idAba;
        }
    }

    getFiltro(evento) {
        this.filtro = evento.valor;

        if (evento.valido) {
            if (evento.valor.trim() != "") {
                this.examesFiltrados = this.exames.filter(function (tmp) {
                    let filter = '.*' + evento.valor.toUpperCase() + '.*';
                    let retorno:Boolean = false;

                    tmp.exames.forEach(
                        function(val) {
                            if (!retorno) {
                                retorno = val.descricao.match(filter);
                            }
                        }
                    );

                    return retorno;
                });
            } else {
                this.examesFiltrados = this.exames;
            }
        } else {
            this.examesFiltrados = this.exames;
        }
    }

    getFiltroGuias(evento){
        this.filtroGuias = evento.valor;

        if (evento.valido) {
            if (evento.valor.trim() != "") {
                this.guiasFiltrados = this.guias.filter(function (tmp) {
                    let filter = '.*' + evento.valor.toUpperCase() + '.*';
                    let retorno:Boolean = false;

                    tmp.itens.forEach(
                        function(val) {
                            
                            if (!retorno) {
                                retorno = val.procedimento.descricao.match(filter);
                            }
                        }
                    );

                    return retorno;
                });
            } else {
                this.guiasFiltrados = this.guias;
            }
        } else {
            this.guiasFiltrados = this.guias;
        }
    }

    getDescricao(evento) {
        this.descricao = evento;
        this.validar();
    }

    getAlertaDescricao(evento) {
        this.alertaDescricao = evento;
        this.validar();
    }

    getTipo(evento) {
        this.tipo = evento;
        this.validar();
    }

    navegar(destino) {
        this.atual = destino;
    }

    getEvolucao(evento) {
        this.evolucaoId = evento;
        this.evolucaoIdValor = evento.valor;
        this.validar();
    }

    submit() {
        let pergunta = {
            "descricao": this.descricao.valor,
            "tipo": this.tipo.valor
        };

        if (!this.codigo) {
            this.atendimentoService.inserir(pergunta).subscribe(
                (status) => {
                    if (status) {
                        this.router.navigate([`/${Sessao.getModulo()}/pergunta`]);
                    }
                }
            );
        } else {
            this.atendimentoService.atualizar(this.codigo, pergunta).subscribe(
                (status) => {
                    if (status) {
                        this.router.navigate([`/${Sessao.getModulo()}/pergunta`]);
                    }
                }
            );
        }
    }

    novaEvolucao() {
        let novoFormulario = {
            paciente: { id: this.paciente.id },
            formulario: { id: this.evolucaoId.valor },
            data: moment().format(this.formatosDeDatas.dataHoraSegundoFormato)
        };

        // this.pacienteDocumentoService.inserir(novoFormulario).subscribe(
        //     (id) => {
        //         if (id) {
        //             this.router.navigate([`/${Sessao.getModulo()}/evolucao/formulario/${id}`]);
        //         }
        //     }, (erro) => {
        //         if (erro.status == 412) {
        //             alert("Usuário não pode inserir este formulário.");
        //         }
        //     }
        // );
    }

    abrirResultado(id, chave) {
        if (chave) {
            this.exameService.getLink(id)
                .subscribe((link) => {
                    let tmplink = link.text();
                    if (tmplink.match('http')) {
                        window.open(tmplink, "_blank");
                    }
                },
                (erro) => {Servidor.verificaErro(erro, this.toastr);}
            );
        }
    }

    abrirFormulario(id) {
        this.router.navigate([`/${Sessao.getModulo()}/evolucao/formulario/${id}`]);
    }

    inserirAlerta() {
        // let alerta = {
        //     paciente: { id: this.paciente.id },
        //     data: moment().format(this.formatosDeDatas.dataHoraSegundoFormato),
        //     usuario: this.atendimento.usuario,
        //     descricao: this.alertaDescricao.valor
        // };

        // this.pacienteDocumentoService.inserirAlerta(alerta)
        //     .subscribe((status) => {
        //         this.alertaDescricao = new Saida();
        //         this.alertas.push(alerta);
        //     });
    }

    iniciar() {
        // let atendimento = Object.assign({}, this.atendimento);

        // atendimento.inicio = moment().format(this.formatosDeDatas.dataHoraSegundoFormato);
        // atendimento.status = 'EMATENDIMENTO';
        // this.atendimento.status = 'EMATENDIMENTO';
        // delete atendimento.paciente;
        // delete atendimento.prestador;
        // delete atendimento.local;
        // delete atendimento.usuario;

        // this.atendimentoService.atualizar(this.codigo, atendimento)
        //     .subscribe((retorno) => {
        //     });


    }

    adicionarExame(){

        let local = '028';     //MUDAR O LOCAL
    
        this.usuarioService.usuarioSessao().subscribe(
            (usuario) => {
                if( usuario["redeAtendimento"] ){         

                    this.rda = usuario["redeAtendimento"]["codigo"];
                    let tid = sha1(this.codigo + this.rda + local + 'unimed21#paz')       
                    
                    let dentro =  `http://portal.unimeduberaba.com.br:81/microsiga/u_pepg002wp.apw?cartao=${this.codigo}&rda=${this.rda}&local=${local}&${Sessao.getModulo()}=sim&tid=${tid}`
                    
                    window.open(
                        dentro,
                        '_blank'
                    );
                    
                }else{
                    alert("Usuario sem RDA");
                }
            }
        );
    }

    finalizar() {
        // let atendimento = Object.assign({}, this.atendimento);

        // atendimento.fim = moment().format(this.formatosDeDatas.dataHoraSegundoFormato);
        // atendimento.status = "ATENDIDO";
        // delete atendimento.paciente;
        // delete atendimento.prestador;
        // delete atendimento.local;
        // delete atendimento.usuario;

        // this.atendimentoService.atualizar(this.codigo, atendimento).subscribe(
        //     (retorno) => {
        //         this.serviceSenha.finalizarAtendimento(this.unidade, this.consultorio).subscribe(
        //             (retorno) => {
        //             },
        //             erro => (
        //                 console.error("ERRO AO FINALIZAR ATENDIMENTO")
        //             )
        //         );

        //         this.router.navigate([`/${Sessao.getModulo()}/atendimento`]);
        //     }
        // );
    }
}
