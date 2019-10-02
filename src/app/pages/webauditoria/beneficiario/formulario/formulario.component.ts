import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ToastrService } from 'ngx-toastr';

import { Sessao, Servidor, BeneficiarioService, AtendimentoService, FormularioService, BeneficiarioFormularioService, ExameService, GuiaService, PainelSenhaService, UsuarioService, PreExistenciaService, ProcedimentoService, PacienteDocumentoService, GuiaAuditoriaService } from '../../../../services';

import { Saida, FormatosData } from 'app/theme/components';

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
    beneficiario;
    rda;
    cids;
    codigo;
    consultorio: string = localStorage.getItem('consultorio');
    descricao: Saida;
    descricaoValor;
    evolucaoId: Saida;
    evolucaoIdValor;
    evolucoes;
    exames = [];
    examesFiltrados;
    formularios;
    idAbaAberta = "";
    tipo: Saida;

    itensPorPagina = 10;

    tipoValor;
    unidade: string = localStorage.getItem('unidade');

    filtro = "";

    momentjs = moment;
    formatosDeDatas = new FormatosData();

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private toastr: ToastrService,
        private serviceGuia: GuiaService,
        private serviceExame: ExameService,
        private serviceFormulario: FormularioService,
        private serviceAtendimento: AtendimentoService,
        private serviceBeneficiario: BeneficiarioService,
        private serviceProcedimento: ProcedimentoService,
        private servicePreExistencia: PreExistenciaService,
        private serviceGuiaAuditoria: GuiaAuditoriaService,
        private servicePacienteDocumento: PacienteDocumentoService,
        private serviceBeneficiarioFormulario: BeneficiarioFormularioService,
    ) {
        this.route.params.subscribe(
            (params) => {
                this.codigo = params['codigo'];
            }
        );
    }

    navegar(destino) {
        this.atual = destino;
    }

    validaClasse(pos) {
        return (pos % 2 == 0);
    }

    ngOnInit() {
        this.serviceFormulario.getFormularioPorTokenAtivoTipo("CRIAR", { tipo: 'EVOLUCAO' }).subscribe(
            (formularios) => {
                this.formularios = formularios;
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );

        if (this.codigo) {
            this.serviceBeneficiario.getBeneficiarioPorCodigo(this.codigo).subscribe(
                (beneficiario) => {
                    this.beneficiario = beneficiario;

                    let request = {
                        idBeneficiario: this.beneficiario.id,
                        simples: true,
                        tipo: 'EVOLUCAO'
                    }
                    this.serviceBeneficiarioFormulario.getBeneficarioToken(request).subscribe(
                        (evolucoes) => {
                            this.evolucoes = evolucoes.dados || evolucoes;
                        }, (error) => {
                            Servidor.verificaErro(error, this.toastr);
                        }
                    );

                    this.serviceBeneficiarioFormulario.getCid(this.beneficiario.id).subscribe(
                        (cids) => {
                            this.cids = cids;
                        }, (error) => {
                            Servidor.verificaErro(error, this.toastr);
                        }
                    );

                    this.serviceExame.getGrupoBeneficiario(this.beneficiario.id).subscribe(
                        (exames) => {
                            this.exames = exames;
                            this.examesFiltrados = exames;
                        }, (error) => {
                            Servidor.verificaErro(error, this.toastr);
                        }
                    );

                    this.buscaGuiasPaginado(null);
                    this.buscaCarenciaPaginado(null);
                    this.buscaPreExistenciasPaginado(null);

                }, (error) => {
                    Servidor.verificaErro(error, this.toastr);
                }
            );
        }
    }

    guias = [];
    paginaAtualGuia = 1;
    qtdItensTotalGuia = 0;
    buscaGuiasPaginado(evento) {
        console.log(evento)
        let request = {
            pagina: (evento ? evento.paginaAtual : this.paginaAtualGuia),
            quantidade: this.itensPorPagina,
        };

        if (this.objFiltroGuias && Object.keys(this.objFiltroGuias)) {
            Object.assign(request, this.objFiltroGuias);
        }

        this.serviceGuia.getGuiasPorBeneficiarioCodigoPaginado((evento ? evento.paginaAtual : this.paginaAtualGuia), this.itensPorPagina, this.codigo, this.objFiltroGuias).subscribe(
            (retorno) => {
                this.guias = (retorno.paginaAtual == 1) ? retorno.dados : this.guias.concat([], retorno.dados);
                this.paginaAtualGuia = retorno.paginaAtual;
                this.qtdItensTotalGuia = retorno.qtdItensTotal;
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    preexistencias = [];
    paginaAtualPreex = 1;
    qtdItensTotalPreex = 0;
    buscaPreExistenciasPaginado(evento) {
        let request = {
            pagina: (evento ? evento.paginaAtual : this.paginaAtualPreex),
            quantidade: this.itensPorPagina,
            beneficiarioId: this.beneficiario.id,
        };
        
        this.servicePreExistencia.get(request).subscribe(
            (retorno) => {
                this.preexistencias = (retorno.paginaAtual == 1) ? retorno.dados : this.preexistencias.concat([], retorno.dados);
                this.paginaAtualPreex = retorno.paginaAtual;
                this.qtdItensTotalPreex = retorno.qtdItensTotal;
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    carencias = [];
    paginaAtualCarencia = 1;
    qtdItensTotalCarencia = 0;
    buscaCarenciaPaginado(evento) {
        let request = {
            pagina: (evento ? evento.paginaAtual : this.paginaAtualCarencia),
            quantidade: this.itensPorPagina,
            beneficiarioId: this.beneficiario.id,
        };
        
        this.serviceBeneficiario.getCarenciaPaginado(request).subscribe(
            (retorno) => {
                this.carencias = (retorno.paginaAtual == 1) ? retorno.dados : this.carencias.concat([], retorno.dados);
                this.paginaAtualCarencia = retorno.paginaAtual;
                this.qtdItensTotalCarencia = retorno.qtdItensTotal;
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    abrirAbaExame(idAba) {
        if (this.idAbaAberta == idAba) {
            this.idAbaAberta = "";
        } else {
            this.idAbaAberta = idAba;
        }
    }

    objFiltroGuias = new Object();
    objFiltro = new Object();
    filtrarGuias(params) {
        // this.paginaAtual = 1
        this.itensPorPagina = 25
        this.objFiltro = this.objFiltroGuias;

        this.objFiltroGuias = this.validaFiltrosVazios(this.objFiltroGuias);

        this.buscaProcedimentoPorBeneficiario({ paginaAtual: 1 });
    }

    paginaAtualFiltroGuia = 1;
    itensPorPaginaFiltroGuia = 15;
    qtdItensTotalFiltroGuia;
    guiaFiltro = [];
    guiaFiltroFiltradas = [];
    guiasVisaoFiltro = false;
    buscaProcedimentoPorBeneficiario(evento) {
        this.paginaAtualFiltroGuia = evento ? evento.paginaAtual : this.paginaAtualFiltroGuia;

        let request = {
            pagina: 0,
            quantidade: 0
        };

        if (this.objFiltroGuias && Object.keys(this.objFiltroGuias)) {
            Object.assign(request, this.objFiltroGuias);
            console.log(request);
        }

        // request['carteirinha'] = this.codigo;
        this.serviceGuiaAuditoria.getFiltroGuia(request).subscribe(
            (retorno) => {
                let objretorno = retorno.dados || retorno;
                this.guiaFiltro = (request['pagina'] == 1) ? objretorno : this.guiaFiltro.concat([], objretorno);
                this.guiaFiltroFiltradas = this.guiaFiltro;

                this.validaQtdFiltroGuias();
                console.log(this.guiaFiltroFiltradas);

                this.guiasVisaoFiltro = true;
            }
        )
    }

    qtdAudit = 0;
    qtdReal = 0;
    validaQtdFiltroGuias() {
        this.qtdAudit = 0;
        this.qtdReal = 0;

        this.guiaFiltroFiltradas.forEach(
            (guia) => {
                console.log(guia);
                // quantidadeRealizada //REALIZADA
                // quantidadeSolicitada // AUDITADA
                this.qtdAudit += guia.quantidadeSolicitada
                this.qtdReal += guia.quantidadeRealizada

            }
        )
    }

    validaFiltrosVazios(param) {
        Object.keys(param).forEach(
            (chave) => {
                if (!(param[chave] && param[chave] != '0')) {
                    delete param[chave];
                }
            }
        )

        return param;
    }

    limparFiltros() {
        // this.paginaAtual = 1
        this.itensPorPagina = 25
        this.objFiltroGuias = new Object();
        this.valorProcedimentoSelecionado = ''
        this.guiasVisaoFiltro = false;
        this.guiaFiltroFiltradas = [];
        this.buscaGuiasPaginado({ paginaAtual: 1 });
    }

    idFormAberto;
    abrirFormulario(id) {
        console.log("---")
        if (this.idFormAberto == id) {
            this.idFormAberto = undefined;
            return;
        }

        this.idFormAberto = id;
    }

    getFiltro(evento) {
        this.filtro = evento.valor;

        if (evento.valor) {
            if (evento.valor.trim() != "") {
                this.examesFiltrados = this.exames.filter(function (tmp) {
                    let filter = '.*' + evento.valor.toUpperCase() + '.*';
                    let retorno: Boolean = false;

                    tmp.exames.forEach(
                        function (val) {
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

    filtroGuias = [];
    getFiltroGuias(evento) {
        this.filtroGuias = evento.valor;

        if (evento.valido) {
            if (evento.valor.trim() != "") {
                this.guias = this.guias.filter(function (tmp) {
                    let filter = '.*' + evento.valor.toUpperCase() + '.*';
                    let retorno: Boolean = false;

                    tmp.itens.forEach(
                        function (val) {

                            if (!retorno) {
                                retorno = val.procedimento.descricao.match(filter);
                            }
                        }
                    );

                    return retorno;
                });
            } else {
                this.guias = this.guias;
            }
        } else {
            this.guias = this.guias;
        }
    }

    getDescricao(evento) {
        this.descricao = evento;
    }

    getAlertaDescricao(evento) {
        this.alertaDescricao = evento;
    }

    getTipo(evento) {
        this.tipo = evento;
    }

    getEvolucao(evento) {
        this.evolucaoId = evento;
        this.evolucaoIdValor = evento.valor;
    }

    submit() {
        let pergunta = {
            "descricao": this.descricao.valor,
            "tipo": this.tipo.valor
        };

        if (!this.codigo) {
            this.serviceAtendimento.inserir(pergunta).subscribe(
                (status) => {
                    if (status) {
                        this.router.navigate([`/${Sessao.getModulo()}/pergunta`]);
                    }
                }
            );
        } else {
            this.serviceAtendimento.atualizar(this.codigo, pergunta).subscribe(
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
            beneficiario: { id: this.beneficiario.id },
            formulario: { id: this.evolucaoId.valor },
            data: moment().format(this.formatosDeDatas.dataHoraSegundoFormato)
        };

        this.serviceBeneficiarioFormulario.inserir(novoFormulario).subscribe(
            (id) => {
                if (id) {
                    this.router.navigate([`/${Sessao.getModulo()}/evolucao/formulario/${id}`]);
                }
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    valorProcedimentoSelecionado
    objProcedimento = [];
    fnCfgProcedimentoRemote(term) {
        if (term.match(/\D/g)) {
            this.serviceProcedimento.procedimentoPaginadoFiltro(1, 10, term).subscribe(
                (mensagens) => {
                    this.objProcedimento = mensagens.dados || mensagens;
                }
            )
        } else {
            this.serviceProcedimento.getProcedimentosCodigo(term).subscribe(
                (mensagens) => {
                    let retorno = mensagens.dados || mensagens;
                    this.objProcedimento = (retorno) ? [retorno] : [];
                }
            )
        }
    }
    setProcedimento(evento) {
        if (evento.descricao) {
            this.objFiltroGuias['procedimentoCodigo'] = evento.codigo;
            this.valorProcedimentoSelecionado = evento.descricao;
        }
    }

    dataInicioInstancia;
    dataFimInstancia;
    getDataInicioInstancia(instancia) {
        this.dataInicioInstancia = instancia;
    }

    getDataFimInstancia(instancia) {
        this.dataFimInstancia = instancia;
    }

    getData(param, evento) {
        if (!param && (evento && evento.length))
            return;

        this.objFiltroGuias[param] = evento[0].format('DD/MM/YYYY');
    }

    abrirResultado(id, chave) {
        if (chave) {
            this.serviceExame.getLink(id, false).subscribe(
                (link) => {
                    let tmplink = link.text();
                    if (tmplink.match('http')) {
                        window.open(tmplink, "_blank");
                    }
                }, (error) => {
                    Servidor.verificaErro(error, this.toastr);
                },
            );
        }
    }

    imprimir(id) {
        window.open(this.servicePacienteDocumento.evolucaoPdf(id), "_blank");
    }

    voltar() {
        window.history.go(-1);
    }

    inserirAlerta() {
        // let alerta = {
        //     beneficiario: { id: this.beneficiario.id },
        //     data: moment().format(this.formatosDeDatas.dataHoraSegundoFormato),
        //     usuario: this.atendimento.usuario,
        //     descricao: this.alertaDescricao.valor
        // };

        // this.serviceBeneficiarioFormulario.inserirAlerta(alerta)
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
        // delete atendimento.beneficiario;
        // delete atendimento.prestador;
        // delete atendimento.local;
        // delete atendimento.usuario;

        // this.serviceAtendimento.atualizar(this.codigo, atendimento)
        //     .subscribe((retorno) => {
        //     });
    }

    adicionarExame() {

        // let local = '028';     //MUDAR O LOCAL

        // this.usuarioService.usuarioSessao().subscribe(
        //     (usuario) => {
        //         if( usuario["redeAtendimento"] ){         

        //             this.rda = usuario["redeAtendimento"]["codigo"];
        //             let tid = sha1(this.codigo + this.rda + local + 'unimed21#paz')       

        //             let dentro =  `http://portal.unimeduberaba.com.br:81/microsiga/u_pepg002wp.apw?cartao=${this.codigo}&rda=${this.rda}&local=${local}&${Sessao.getModulo()}=sim&tid=${tid}`

        //             window.open(
        //                 dentro,
        //                 '_blank'
        //             );

        //         }else{
        //             alert("Usuario sem RDA");
        //         }
        //     }
        // );
    }

    finalizar() {
        // let atendimento = Object.assign({}, this.atendimento);

        // atendimento.fim = moment().format(this.formatosDeDatas.dataHoraSegundoFormato);
        // atendimento.status = "ATENDIDO";
        // delete atendimento.beneficiario;
        // delete atendimento.prestador;
        // delete atendimento.local;
        // delete atendimento.usuario;

        // this.serviceAtendimento.atualizar(this.codigo, atendimento).subscribe(
        //     (retorno) => {
        //         this.serviceSenha.finalizarAtendimento(this.unidade, this.consultorio).subscribe(
        //             (retorno) => {
        //             },
        //             error => (
        //                 console.error("ERRO AO FINALIZAR ATENDIMENTO")
        //             )
        //         );

        //         this.router.navigate([`/${Sessao.getModulo()}/atendimento`]);
        //     }
        // );
    }
}