import { Component, OnInit, TemplateRef, ViewContainerRef, ViewChild } from '@angular/core';
import { AtendimentoService, LocalAtendimentoService, TipoBloqueioService, AgendamentoColetivoService, ProcedimentoService, UsuarioService, PrestadorAtendimentoService, ConfiguraHorarioTussService, PacienteOperadoraService, TipoAtendimentoService } from '../../../services';

import { Servidor } from '../../../services/servidor';
import { Sessao } from '../../../services/sessao';

import { ActivatedRoute, Router } from '@angular/router';
import { GlobalState } from '../../../global.state';
import { Notificacao, Aguardar, TopoPagina, Agenda } from '../../../theme/components';
import { FormatosData } from '../../../theme/components/agenda/agenda';
import { NgbdModalContent } from '../../../theme/components/modal/modal.component';
import { TreeviewItem, TreeviewConfig } from 'ngx-treeview';

import { ToastrService } from 'ngx-toastr';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';

moment.locale('pt-br');

@Component({
    selector: 'configurarAgenda',
    templateUrl: './configurarAgenda.html',
    styleUrls: ['./configurarAgenda.scss'],
    providers: [Agenda, PrestadorAtendimentoService, LocalAtendimentoService, TipoAtendimentoService, TipoBloqueioService]
})
export class ConfigurarAgenda implements OnInit {

    unidadesAtendimento;

    cfgBloco;

    datasSelecionadas;
    instanciaAgenda;
    recorrenciaInstancia;
    instanciaBtnSearch;
    instanciaBtnAgendamentoColetivo;

    activeModal;
    modalAgendaColetiva;
    modalConfirmar;
    modalConfigurarAgenda;
    agendamentoPromiseResolve;

    formatosDeDatas;

    tiposConsulta;
    tiposBloqueio;
    tiposAgendaColetiva;

    acaoAgendamento;

    tipoConfiguracao;
    novoHorario;
    cfgAtual;
    unidadeAtendimento;
    guichesAtendimento;
    blocoAtual;
    objParams = new Object();

    temAgendamento;

    usuarioEspecialidade = [];
    instanciaTreeview;

    prestadorSelecionado;
    prestadorAgendaEspecialidade;

    colorPicker;

    prestador;
    prestadores;
    agendaAtual;
    recorrencia = new Object();
    todasConfiguracoes;
    calendarioOpt = { visao: "week" };

    novoAtendimento = new NovoAtendimento(null);
    novoBloqueio = new NovoBloqueio(null);
    novoAgendamentoColetivo = new NovoAgendamentoColetivo(null);
    tiposAtendimento;
    //  = [{ id: 'DISPONIVEL', descricao: 'DISPONÍVEL' },
    //     { id: 'BLOQUEADO',  descricao: 'BLOQUEADO' }
    // ];

    // /////////////////////////MODALS/////////////////////////////////
    @ViewChild("bodyModalAdicionaTipoAtendimento", { read: TemplateRef }) bodyModalAdicionaTipoAtendimento: TemplateRef<any>;
    @ViewChild("modalAdicionaTipoAtendimentoBotoes", { read: TemplateRef }) modalAdicionaTipoAtendimentoBotoes: TemplateRef<any>;
    @ViewChild("bodyModalAdicionaBloqueio", { read: TemplateRef }) bodyModalAdicionaBloqueio: TemplateRef<any>;
    @ViewChild("modalAdicionaBloqueioBotoes", { read: TemplateRef }) modalAdicionaBloqueioBotoes: TemplateRef<any>;

    @ViewChild("bodyModalAdicionaTipoAgendamentoColetivo", { read: TemplateRef }) bodyModalAdicionaTipoAgendamentoColetivo: TemplateRef<any>;
    @ViewChild("modalAdicionaTipoAgendamentoColetivoBotoes", { read: TemplateRef }) modalAdicionaTipoAgendamentoColetivoBotoes: TemplateRef<any>;

    @ViewChild("configurarAgenda", { read: TemplateRef }) agendamentoModal: TemplateRef<any>;
    @ViewChild("botoesModalConfiguracao", { read: TemplateRef }) botoesModalAgendamento: TemplateRef<any>;

    constructor(
        private _state: GlobalState,
        private route: ActivatedRoute,
        private modalService: NgbModal,
        private serviceUsuario: UsuarioService,
        private servicePrestador: PrestadorAtendimentoService,
        private serviceAtendimento: AtendimentoService,
        private localAtendimentoService: LocalAtendimentoService,
        private serviceTipoAtendimento: TipoAtendimentoService,
        private serviceAgendaColetiva: AgendamentoColetivoService,
        private serviceOperadora: PacienteOperadoraService,
        private serviceProcedimento: ProcedimentoService,
        private serviceTipoBloqueio: TipoBloqueioService,
        private serviceConfiguraHorarioTuss: ConfiguraHorarioTussService,
        private toastr: ToastrService,
        private vcr: ViewContainerRef,
    ) {
        
        let possuiUnidade = Sessao.getVariaveisAmbiente().unidadeAtendimentoUsuario.filter(
            (unidade) => {
                return Sessao.getPreferenciasUsuario()['localAtendimentoCfg'] == unidade.id;
            }
        );

        if (possuiUnidade) {
            this.unidadeAtendimento = Sessao.getPreferenciasUsuario()['localAtendimentoCfg'];
        } else {
            this.unidadeAtendimento = Sessao.getIdUnidade();
        }

        if (this.unidadeAtendimento != '0') {
            this.objParams["codigoDto"] = this.unidadeAtendimento
            this.prestador = Sessao.getPreferenciasUsuario()['prestadorAgenda'];
            this.prestadorAgendaEspecialidade = Sessao.getPreferenciasUsuario()['prestadorAgendaEspecialidade'];
            // MUDAR AQUI
            this.prestadorSelecionado = this.prestador ? (this.prestador.descricao || this.prestador.nome) : '';
        }
    }

    ngOnInit() {

        this._state.notifyDataChanged('menu.isCollapsed', true);

        this.formatosDeDatas = new FormatosData();

        this.serviceUsuario.usuarioSessao().subscribe(
            (usuario) => {
                this.serviceUsuario.getUsuarioUnidadeAtendimento({ usuarioGuid: usuario.guid }).subscribe(
                    (unidades) => {
                        this.unidadesAtendimento = (unidades.dados || unidades).map(
                            (unidade) => {
                                return {
                                    id: unidade.unidadeAtendimento.id,
                                    descricao: unidade.unidadeAtendimento.descricao,
                                    cidade: unidade.unidadeAtendimento.cidade
                                }
                            }
                        );
                    }, (error) => {
                        Servidor.verificaErro(error, this.toastr);
                    }
                );
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );

        this.refreshTiposAtendimento();
        this.refreshTiposAgendaColetiva();
        this.refreshTiposConsulta();
        this.refreshOperadoras();
        this.refreshTiposBloqueio();
    }


    setObjColorPicker(colorPicker) {
        this['colorPicker'] = colorPicker;
        this.novoAtendimento.item["cor"] = colorPicker.corSelecionada;
    }


    trocaCor(valor) {
        if (valor.colorPicker) {
            this['colorPicker'] = valor['colorPicker'];
        }
    }

    refreshTiposConsulta() {
        this.serviceTipoAtendimento.atendimentoTipo({}).subscribe((tiposConsulta) => {
            let retorno = tiposConsulta.dados || tiposConsulta;
            this.tiposConsulta = retorno;
        }, (error) => {
            Servidor.verificaErro(error, this.toastr);
        });
    }

    operadoras = [];
    refreshOperadoras() {
        this.serviceOperadora.getOperadoraPaginado().subscribe(
            (operadora) => {
                this.operadoras = operadora.dados;
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    refreshTiposAgendaColetiva() {
        this.serviceAgendaColetiva.getAgendamentoColetivo({ simples: true }).subscribe((tiposAgendaColetiva) => {
            this.tiposAgendaColetiva = tiposAgendaColetiva.dados;
        }, (error) => {
            Servidor.verificaErro(error, this.toastr);
        });
    }

    refreshTiposAtendimento() {
        // this.serviceTipoAtendimento.getTiposConfiguracao().subscribe(
        //     (tiposAtendimento) => {
        //         this.tiposAtendimento = tiposAtendimento;
        //     }, (error) => {
        //         Servidor.verificaErro(error, this.toastr);
        //     }
        // );
        this.tiposAtendimento = [
            { id: 'BLOQUEADO', descricao: 'BLOQUEADO' },
            { id: 'DISPONIVEL', descricao: 'DISPONÍVEL' }
        ];
    }


    refreshTiposBloqueio() {
        this.serviceTipoBloqueio.atendimentoBloqueio({ativos: true}).subscribe((tiposBloqueio) => {
            let retorno = tiposBloqueio.dados || tiposBloqueio;
            this.tiposBloqueio = retorno;
        }, (error) => {
            Servidor.verificaErro(error, this.toastr);
        });
    }

    getUnidadeAtendimento(evento) {
        this.unidadeAtendimento = evento.valor;
        if ((this.unidadeAtendimento != undefined) && (this.unidadeAtendimento != "0")) {
            this.objParams["codigoDto"] = evento.valor;
            this.buscaPrestador(true);
            this.buscaGuiches(evento.valor);

            Sessao.setPreferenciasUsuario('localAtendimentoCfg', this.unidadeAtendimento);
        } else {
            this.usuarioEspecialidade = []
        }

        (this.instanciaAgenda) ? this.instanciaAgenda.rebuild(false) : null;
    }

    buscaGuiches(unidadeId) {
        this.localAtendimentoService.getGuichesAtendimento(unidadeId).subscribe(
            (guiches) => {
                this.guichesAtendimento = guiches;
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    buscaPrestador(setPreferencia) {
        this.servicePrestador.getUsuarioPorEspecialidade(this.objParams).subscribe(
            (prestadores) => {
                this.prestadores = prestadores;
                this.inicializa_treeview(setPreferencia);
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    getPrestador(item, childItem) {

        this.prestador = childItem;

        if (this.prestador) {
            Sessao.setPreferenciasUsuario('prestadorAgenda', this.prestador);
            Sessao.setPreferenciasUsuario('prestadorAgendaEspecialidade', item);
            this.prestadorAgendaEspecialidade = item;
            this.prestadorSelecionado = childItem;
            this.fnInicializaBlocos(true);
            this.instanciaAgenda.rebuild(false);
        }
    }


    inicializa_treeview(setPreferencia) {
        this.usuarioEspecialidade = [];

        if (this.prestadores.length == 0) {
            this.usuarioEspecialidade = [];
        } else {
            this.prestadores.forEach(
                (posicao) => {

                    let usuarios = [];
                    posicao.usuarios.forEach(usuario => usuarios.push({ text: usuario.nome, value: usuario.guid }));
                    posicao.usuarios = posicao.usuarios.map((usuario) => {
                        usuario.descricao = usuario.nome;
                        return usuario;
                    });

                    let usuario = posicao.usuarios.filter(function (e, i) {
                        return posicao.usuarios.indexOf(e) === i;
                    })

                    this.usuarioEspecialidade.push({
                        filhos: posicao.usuarios,
                        item: posicao.especialidade,
                        unico: (usuario.length > 1 ? false : true)
                    });
                }
            )
        }

        let unico = true;
        this.usuarioEspecialidade.forEach(
            (posicao) => {
                if (posicao.unico == false) {
                    unico = false;
                }
            }
        );

        if (unico) {
            Sessao.setPreferenciasUsuario("prestadorAgenda", this.usuarioEspecialidade[0].filhos[0]);
            this.prestador = Sessao.getPreferenciasUsuario()['prestadorAgenda'];
        }

        if (setPreferencia) {
            Sessao.getPreferenciasUsuario()['prestadorAgenda'] && Sessao.getPreferenciasUsuario()['prestadorAgenda']['guid'] ? this.prestadorSelecionado = Sessao.getPreferenciasUsuario()['prestadorAgenda'] : null;
            let prestadorCache = Sessao.getPreferenciasUsuario()['prestadorAgenda'];
            let prestadorEspecialidadeCache = Sessao.getPreferenciasUsuario()['prestadorAgendaEspecialidade'];

            //this.instanciaTreeview.selecionaItem(prestadorEspecialidadeCache, prestadorCache);
        }
    }

    getTipo(evento) {
        if (evento.valor)
            this.novoHorario.tipo = evento.valor;
    }

    getTiposConsulta(itemId) {
        this.novoAtendimento.item["id"] = itemId;
    }

    getTiposBloqueio(itemId) {
        this.novoBloqueio.item["id"] = itemId;
    }

    getTiposAgendamentoColetivo(itemId) {
        this.novoAgendamentoColetivo.item["id"] = itemId;
    }

    getTipoAtendimento(evento) {
        this.novoHorario.tipoAtendimento = evento.id
    }

    setObjRecorrencia(recorrencia) {
        this['recorrencia'] = recorrencia;
    }

    buscaIntervalo = false;
    setDatasSelecionadas(datas) {
        if (datas && datas.length > 1) {
            this.buscaIntervalo = true;
        } else if (datas && datas.length == 1) {
            this.buscaIntervalo = false;
        }

        this.datasSelecionadas = datas;
        (this.instanciaAgenda) ? this.instanciaAgenda.rebuild(false) : null;
    }

    onDatePickerChange(datas) {
        this.instanciaAgenda.setOpt('visao', 'day');
        (this.instanciaAgenda) ? this.instanciaAgenda.rebuild(false) : null;
    }

    getInstanciaAgenda(instancia) {
        this.instanciaAgenda = instancia;
    }

    getInstanciaRecorrencia(instancia) {
        this['recorrenciaInstancia'] = instancia
    }

    getInstanciaTreeview(instancia) {
        this.instanciaTreeview = instancia;
    }

    fnOnDiaTodoChange(valor) {
        if (valor.diaTodo) {
            this.novoHorario.horaFim = valor.horaFim;
            this.novoHorario.horaInicio = valor.horaInicio;
        }
    }

    fnDropBloco(configuracaoModal, botoesModalConfiguracao, target, novaData, bloco) {
        this.novoHorario = bloco.dado;

        let cloned = JSON.parse(JSON.stringify(bloco))
        this.cfgAtual = cloned;

        this.novoHorario.dataInicio = novaData.format(this.formatosDeDatas.dataFormato);
        this.novoHorario.dataFim = novaData.format(this.formatosDeDatas.dataFormato);

        let duration = moment.duration(moment(`${this.novoHorario.dataFim} ${this.novoHorario.horaFim}`, this.formatosDeDatas.dataHoraFormato).diff(moment(`${this.novoHorario.dataInicio} ${this.novoHorario.horaInicio}`, this.formatosDeDatas.dataHoraFormato)));
        let minutosDiff = duration.asMinutes();

        this.novoHorario.horaInicio = novaData.format(this.formatosDeDatas.horaFormato);
        this.novoHorario.horaFim = novaData.add(minutosDiff, 'minute').format(this.formatosDeDatas.horaFormato);

        let promiseUpdate = new Promise((resolve, reject) => {

            this.agendamentoPromiseResolve = resolve;

            this.modalConfigurarAgenda = this.modalService.open(NgbdModalContent, { size: 'lg' });
            this.modalConfigurarAgenda.componentInstance.modalHeader = 'Mover Configuração';

            this.modalConfigurarAgenda.componentInstance.templateRefBody = configuracaoModal;
            this.modalConfigurarAgenda.componentInstance.templateBotoes = botoesModalConfiguracao;

            this.modalConfigurarAgenda.result.then((data) => {
                this.instanciaAgenda.rebuild();
            }, (reason) => {
                this.instanciaAgenda.rebuild();
            });
        });

        return promiseUpdate;
    }

    fnInicializaBlocos(rebuild = false) {
        let resolveConfiguracoes;
        let rejectConfiguracoes;
        let promiseConfiguracoes = new Promise((resolve, reject) => {
            resolveConfiguracoes = resolve;
            rejectConfiguracoes = reject;
        });
        if (!this.prestador) {
            return promiseConfiguracoes;
        }

        let min = this.datasSelecionadas.reduce(function (a, b) { return a < b ? a : b; });
        let max = this.datasSelecionadas.reduce(function (a, b) { return a > b ? a : b; });
        let request = {
            "inicio": min.format(this.formatosDeDatas.dataFormato) + ' 00:00:00',
            "fim": max.format(this.formatosDeDatas.dataFormato) + ' 23:59:59',
            "unidadeAtendimento": {
                "id": this.objParams["codigoDto"]
            }
        };

        if (this.prestador['userName'] == 'AgendamentoColetivo') {
            request["agendamentoColetivo"] = {
                "id": this.prestador['guid']
            };
        } else {
            request["usuarioPrestador"] = {
                guid: this.prestador["guid"]
            };
        }

        this.servicePrestador.getConfiguracaoHorarioFiltro(request).subscribe(
            (configuracoes) => {
                this.todasConfiguracoes = configuracoes;

                let blocosNormais = configuracoes.filter((cfg) => {
                    return (cfg.tipo == 'DISPONIVEL' || cfg.tipo == 'COLETIVA') && !cfg.repetir;
                });

                blocosNormais = blocosNormais.map((configuracao) => {
                    return {
                        dado: configuracao,
                        id: configuracao.id,
                        draggable: false,
                        grupo: true,

                        dataInicio: moment(moment(`${configuracao.dataInicio} ${configuracao.horaInicio}`, 'DD/MM/YYYY HH:mm').toDate()),
                        dataFim: moment(moment(`${configuracao.dataInicio} ${configuracao.horaInicio}`, 'DD/MM/YYYY HH:mm').toDate()),

                        inicio: moment(moment(`${configuracao.dataInicio} ${configuracao.horaInicio}`, 'DD/MM/YYYY HH:mm').toDate()),
                        fim: moment(moment(`${configuracao.dataFim} ${configuracao.horaFim}`, 'DD/MM/YYYY HH:mm').toDate()),

                        recorrencia: []
                    }
                });

                let blocosRecorrentes = this.instanciaAgenda.geraAgendaRecorrente(configuracoes, this.datasSelecionadas, 'DISPONIVEL');
                let blocosRecorrentesColetiva = this.instanciaAgenda.geraAgendaRecorrente(configuracoes, this.datasSelecionadas, 'COLETIVA');

                let blocos = blocosNormais.concat(blocosRecorrentes).concat(blocosRecorrentesColetiva);

                if (rebuild) {
                    this.instanciaAgenda.rebuild();
                }

                resolveConfiguracoes(blocos);
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );

        return promiseConfiguracoes;
    }

    fnInicializaAgendas() {
        let resolveAgendas;
        let promiseAgendas = new Promise((resolve, reject) => {
            resolveAgendas = resolve;
        });

        let resolveConfiguracoes;
        let rejectConfiguracoes;
        let promiseConfiguracoes = new Promise((resolve, reject) => {
            resolveConfiguracoes = resolve;
            rejectConfiguracoes = reject;
        });
        if (!this.prestador) {
            return promiseConfiguracoes;
        }

        let min = this.datasSelecionadas.reduce(function (a, b) { return a < b ? a : b; });
        let max = this.datasSelecionadas.reduce(function (a, b) { return a > b ? a : b; });
        let request = {
            "inicio": min.format(this.formatosDeDatas.dataFormato) + ' 00:00:00',
            "fim": max.format(this.formatosDeDatas.dataFormato) + ' 23:59:59',
            "unidadeAtendimento": {
                "id": this.objParams["codigoDto"]
            }
        };

        if (this.prestador['userName'] == 'AgendamentoColetivo') {
            request["agendamentoColetivo"] = {
                "id": this.prestador['guid']
            };
        } else {
            request["usuarioPrestador"] = {
                guid: this.prestador["guid"]
            };
        }

        this.servicePrestador.getConfiguracaoHorarioFiltro(request).subscribe(
            (retorno) => {
                this.todasConfiguracoes = retorno;
                let configuracoes = this.todasConfiguracoes.filter((cfg) => { return cfg.tipo == 'BLOQUEADO' });
                let bloqueiosNormais = configuracoes.filter((cfg) => {
                    return cfg.dataInicio == cfg.dataFim;
                }).map((bloqueio) => {
                    bloqueio.bloqueado = true;
                    return bloqueio;
                });

                let bloqueiosMultiDiasTemp = configuracoes.filter((cfg) => {
                    return cfg.dataInicio != cfg.dataFim && cfg.diaTodo;
                });

                let bloqueiosMultiDias = [];
                var min = this.datasSelecionadas.reduce(function (a, b) { return a < b ? a : b; });
                var max = this.datasSelecionadas.reduce(function (a, b) { return a > b ? a : b; });

                bloqueiosMultiDiasTemp.forEach((bloqueio) => {
                    var inicio = moment(`${bloqueio.dataInicio} ${bloqueio.horaInicio}`, this.formatosDeDatas.dataHoraFormato);
                    var fim = moment(`${bloqueio.dataFim} ${bloqueio.horaFim}`, this.formatosDeDatas.dataHoraFormato);

                    var atualInicio = moment(`${bloqueio.dataInicio} ${bloqueio.horaInicio}`, this.formatosDeDatas.dataHoraFormato);
                    var atualFim = moment(`${bloqueio.dataFim} ${bloqueio.horaFim}`, this.formatosDeDatas.dataHoraFormato);


                    while (inicio.isSameOrBefore(atualFim)) {
                        let oCfg = Object.assign({}, bloqueio);

                        oCfg['dataInicio'] = inicio.format(this.formatosDeDatas.dataFormato);
                        oCfg['dataFim'] = fim.format(this.formatosDeDatas.dataFormato);
                        oCfg['horaInicio'] = '00:00';
                        oCfg['horaFim'] = '23:59';

                        bloqueiosMultiDias.push(oCfg);

                        inicio.add(1, 'day');
                        fim.add(1, 'day');
                    }
                });


                let blocosRecorrentesBloqueados = this.instanciaAgenda.geraBloqueioRecorrente(configuracoes, this.datasSelecionadas, 'BLOQUEADO');

                blocosRecorrentesBloqueados.map((bloq) => {
                    bloq.bloqueado = true;
                    return bloq;
                });


                let bloqueios = bloqueiosNormais.concat(bloqueiosMultiDias).concat(blocosRecorrentesBloqueados);
                //  Adiciona campo status pra forçar a classe PENDENTE no bloco
                bloqueios = bloqueios.map((bloqueio) => {
                    bloqueio['status'] = 'PENDENTE';
                    return bloqueio;
                });

                if (this.buscaIntervalo) {
                    this.buscaIntervalo = false;
                    setTimeout(() => {
                        this.instanciaAgenda.rebuild();
                    }, 500);
                }
                resolveAgendas(bloqueios);
            },
            (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );

        return promiseAgendas;
    }

    fnPegaHoraInicial(agenda) {
        return moment(`${agenda.dataInicio} ${agenda.horaInicio}`, this.formatosDeDatas.dataHoraFormato);
    }

    fnPegaHoraFinal(agenda) {
        return moment(`${agenda.dataFim} ${agenda.horaFim}`, this.formatosDeDatas.dataHoraFormato);
    }

    abreModalExcluir(configuracaoModal, botoesModalConfiguracao) {
        // this.modalConfigurarAgenda.close();
        this.modalConfigurarAgenda.dismiss();

        this.modalConfirmar = this.modalService.open(NgbdModalContent, { size: 'lg' });
        this.modalConfirmar.componentInstance.modalHeader = 'Excluir Configuração';

        this.temAgendamento = false;
        if (this.blocoAtual && this.blocoAtual.dado && this.blocoAtual.dado.dado && this.blocoAtual.dado.dado.tipo == 'DISPONIVEL' && this.blocoAtual.dado.dado.id) {
            this.serviceAtendimento.filtrar({
                "configuraHorario": { "id": this.blocoAtual.dado.dado.id }
            }).subscribe(
                (res) => {
                    this.temAgendamento = res.dados.length > 0;
                }, (error) => {
                    Servidor.verificaErro(error, this.toastr);
                }
            );
        }

        this.modalConfirmar.componentInstance.templateRefBody = configuracaoModal;
        this.modalConfirmar.componentInstance.templateBotoes = botoesModalConfiguracao;
        this.modalConfirmar.result.then((data) => {
            //this.fnOnUpdateBloco(this.agendamentoModal, this.botoesModalAgendamento, this.blocoAtual);
        }, (reason) => {
            this.fnOnUpdateBloco(this.agendamentoModal, this.botoesModalAgendamento, this.blocoAtual);
        });
    }

    fnOnCreateAgenda(agendamentoModal, botoesModalAgendamento, bloco) {
        this.tipoConfiguracao = 'BLOQUEADO';
        return this.abreModalCriarConfiguracao(agendamentoModal, botoesModalAgendamento, bloco, 'Novo Bloqueio');
    }

    fnOnUpdateAgenda(agendamentoModal, botoesModalAgendamento, bloco) {
        this.tipoConfiguracao = 'BLOQUEADO';
        return this.abreModalEditarBloqueio(agendamentoModal, botoesModalAgendamento, bloco, 'Editar Bloqueio');
    }

    fnOnCreateBloco(agendamentoModal, botoesModalAgendamento, bloco) {
        if (this.prestador && this.prestador.guid && this.objParams && this.objParams["codigoDto"]) {

            if (this.prestador['userName'] == 'AgendamentoColetivo') {
                this.tipoConfiguracao = "COLETIVA";
            } else {
                this.tipoConfiguracao = 'DISPONIVEL';
            }

            if (bloco && bloco.novoInicio && bloco.novoInicio.weekday() == 0) {
                this.toastr.info("Periodo selecionado ocorre durante um \"Domingo\".");
            }

            return this.abreModalCriarConfiguracao(agendamentoModal, botoesModalAgendamento, bloco, 'Nova Configuração');
        }

        return new Promise((resolve, reject) => {
            this.instanciaAgenda.removeBlocoId(bloco.id);
            reject();
        });
    }

    fnOnUpdateBloco(agendamentoModal, botoesModalAgendamento, bloco) {

        if ((this.prestador['userName'] == 'AgendamentoColetivo')) {
            this.tipoConfiguracao = 'COLETIVA';
        } else {
            this.tipoConfiguracao = 'DISPONIVEL';
        }

        return this.abreModalCriarConfiguracao(agendamentoModal, botoesModalAgendamento, bloco, 'Editar Configuração');
    }

    removeBlocoDesenhado(bloco) {
        if (this.prestador) {
            this.instanciaAgenda.removeBlocoId(bloco.id);
            return;
        };
    }

    objConfiguraHorarioTussPadrao = new Object();
    abreModalCriarConfiguracao(agendamentoModal, botoesModalAgendamento, bloco, titulo) {
        if (!this.prestador) {
            this.instanciaAgenda.removeBlocoId(bloco.id);
            return;
        };

        this.blocoAtual = bloco;
        console.log(this.blocoAtual);

        let dataInicio = bloco.dado && bloco.dado.dado ? moment(bloco.dado.dado.dataInicio, this.formatosDeDatas.dataFormato).format(this.formatosDeDatas.htmlDataFormato) : bloco.novoInicio.format(this.formatosDeDatas.htmlDataFormato);
        let dataFim = bloco.dado && bloco.dado.dado ? (bloco.dado.dado.dataFim ? moment(bloco.dado.dado.dataFim, this.formatosDeDatas.dataFormato).format(this.formatosDeDatas.htmlDataFormato) : null) : bloco.novoFim.format(this.formatosDeDatas.htmlDataFormato);
        // TODO Criar bloqueio ocupando o bloco inteiro
        let horaInicio = '00:00';
        let horaFim = '00:00';
        if (!!bloco.cfg) {
            horaInicio = bloco.dado && bloco.dado.dado ? bloco.dado.dado.horaInicio : bloco.cfg.horaInicio;
            horaFim = bloco.dado && bloco.dado.dado ? bloco.dado.dado.horaFim : bloco.cfg.horaFim;
        } else {
            horaInicio = bloco.dado && bloco.dado.dado ? bloco.dado.dado.horaInicio : bloco.novoInicio.format(this.formatosDeDatas.horaFormato);
            horaFim = bloco.dado && bloco.dado.dado ? bloco.dado.dado.horaFim : bloco.novoFim.format(this.formatosDeDatas.horaFormato);
        }

        this.novoHorario = new Object({
            id: bloco.dado ? bloco.dado.dado.id : null,

            recorrencia: bloco.dado ? bloco.dado.dado.recorrencia : null,

            usuarioPrestador: {},
            guiche: bloco.dado && bloco.dado.dado.guiche && bloco.dado.dado.guiche.id ? bloco.dado.dado.guiche.id : null,
            dataInicio: dataInicio,
            horaInicio: horaInicio,

            maxConcorrente: bloco.dado && bloco.dado.dado.maxConcorrente,
            configuraHorarioTuss: (this.tipoConfiguracao != 'BLOQUEADO') ? (bloco.dado ? bloco.dado.dado.configuraHorarioTuss : []) : false,
            dataFim: dataFim,
            horaFim: horaFim,
            repetir: bloco.dado ? bloco.dado.dado.repetir : false,
            tipo: this.tipoConfiguracao,
            observacao: bloco.dado && bloco.dado.dado.observacao
        });

        if (bloco.dado && bloco.dado.dado && bloco.dado.dado.id) {
            this.objConfiguraHorarioTussPadrao = {
                unidadeAtendimento: {
                    id: this.unidadeAtendimento
                },
                configuraHorario: {
                    id: bloco.dado.dado.id
                }
            }

            // CASO TENHA QUE VOLTAR COM CONFIGURAHORARIOTUSS, DESCOMENTAR
            // this.refreshProcedimentos();
        }

        this.recorrencia['repetir'] = (bloco.dado && bloco.dado.dado.repetir ? bloco.dado.dado.repetir : false);
        this.recorrencia['diaTodo'] = (bloco.dado && bloco.dado.dado.diaTodo ? bloco.dado.dado.diaTodo : false);
        this.recorrencia['frequencia'] = (bloco.dado && bloco.dado.dado.recorrencia ? bloco.dado.dado.recorrencia.split(',').map(r => parseInt(r)) : []);

        if( this.tipoConfiguracao == "BLOQUEADO" && ( this.blocoAtual && this.blocoAtual.cfg && this.blocoAtual.cfg['recorrencia'] )){
            this.validaRecorrencias(this.recorrencia, this.blocoAtual.cfg['recorrencia']);
        }

        if( this.tipoConfiguracao == "BLOQUEADO" && ( this.blocoAtual && this.blocoAtual.cfg && this.blocoAtual.cfg['recorrencia'] )){
            this.validaRecorrencias(this.recorrencia, this.blocoAtual.cfg['recorrencia']);
        }

        let objbloco;
        if (bloco.cfg)
            objbloco = bloco.cfg;
        else if (bloco.dado)
            objbloco = bloco.dado.dado;

        this.validaTipoBloco(objbloco);

        let esse = this;
        let agendamentoPromise = new Promise((resolve, reject) => {

            this.agendamentoPromiseResolve = resolve;

            // CFG GLOBAL
            let cfgGlobal: any = Object.assign(NgbdModalContent.getCfgGlobal(), { size: 'lg' });

            this.modalConfigurarAgenda = this.modalService.open(NgbdModalContent, cfgGlobal);
            this.modalConfigurarAgenda.componentInstance.modalHeader = titulo;

            this.modalConfigurarAgenda.componentInstance.templateRefBody = agendamentoModal;
            this.modalConfigurarAgenda.componentInstance.templateBotoes = botoesModalAgendamento;
            this.modalConfigurarAgenda.componentInstance.custom_lg_modal = true;

            this.modalConfigurarAgenda.result.then((data) => {
                esse.acaoAgendamento = null;
                this.novoHorario.configuraHorarioTuss = undefined;
                this.removeBlocoDesenhado(bloco);
            }, (reason) => {
                esse.acaoAgendamento = null;
                this.novoHorario.configuraHorarioTuss = undefined;
                this.removeBlocoDesenhado(bloco);
            });
        });

        return agendamentoPromise;
    }

    abreModalEditarBloqueio(agendamentoModal, botoesModalAgendamento, bloco, titulo) {
        if (!this.prestador) {
            this.instanciaAgenda.removeBlocoId(bloco.id);
            return;
        };

        this.cfgBloco = bloco;
        console.log();

        var max = this.datasSelecionadas.reduce(function (a, b) { return a > b ? a : b; });
        let novoInicio = bloco.bloqueioOriginal ? bloco.bloqueioOriginal.dataInicio : bloco.dataInicio;
        let novoFim = bloco.bloqueioOriginal ? (bloco.bloqueioOriginal.dataFim ? bloco.bloqueioOriginal.dataFim : null) : bloco.dataFim;

        this.recorrencia['repetir'] = (bloco.repetir ? bloco.repetir : false);
        this.recorrencia['diaTodo'] = (bloco.diaTodo ? bloco.diaTodo : false);
        this.recorrencia['frequencia'] = (bloco.recorrencia ? bloco.recorrencia.split(',').map(r => parseInt(r)) : []);

        if( this.tipoConfiguracao == "BLOQUEADO" && ( this.cfgBloco && this.cfgBloco['recorrenciaModeloConfiguracao'] )){
            this.validaRecorrencias(this.recorrencia, this.cfgBloco['recorrenciaModeloConfiguracao']);
        }

        this.novoHorario = new Object({
            id: bloco.id,

            recorrencia: this.recorrencia['frequencia'],

            usuarioPrestador: {},

            dataInicio: moment(novoInicio, this.formatosDeDatas.dataFormato).format(this.formatosDeDatas.htmlDataFormato),
            horaInicio: bloco.horaInicio,//.format(this.formatosDeDatas.horaFormato),

            dataFim: (bloco.bloqueioOriginal && bloco.bloqueioOriginal.dataFim) || !bloco.repetir ? moment(novoFim, this.formatosDeDatas.dataFormato).format(this.formatosDeDatas.htmlDataFormato) : null,
            horaFim: bloco.horaFim,//.format(this.formatosDeDatas.horaFormato),
            repetir: bloco.repetir,
            observacao: bloco.observacao,
            tipo: this.tipoConfiguracao
        });

        this.validaTipoBloco(bloco);

        let agendamentoPromise = new Promise((resolve, reject) => {

            this.agendamentoPromiseResolve = resolve;

            this.modalConfigurarAgenda = this.modalService.open(NgbdModalContent, { size: 'lg' });
            this.modalConfigurarAgenda.componentInstance.modalHeader = titulo;

            this.modalConfigurarAgenda.componentInstance.templateRefBody = agendamentoModal;
            this.modalConfigurarAgenda.componentInstance.templateBotoes = botoesModalAgendamento;

            this.modalConfigurarAgenda.result.then(
                () => {
                    this.acaoAgendamento = null; console.log("1")
                    //this.instanciaAgenda.rebuild();
                    this.instanciaAgenda.rebuild();
                }, () => {
                    this.acaoAgendamento = null; console.log("2")
                    //this.instanciaAgenda.rebuild();
                }
            );
        });

        return agendamentoPromise;
    }

    excluirBloqueio(bloqueio) {
        // Bloqueio unico
        if (this.cfgBloco.dataInicio == this.cfgBloco.dataFim) {
            this.servicePrestador.deleteConfiguraHorario(this.novoHorario.id).subscribe(
                () => {
                    //  Fecha modal
                    this.modalConfirmar.close();
                    // this.modalConfigurarAgenda.close();
                    this.modalConfigurarAgenda.dismiss();
                    this.instanciaAgenda.rebuild();
                }, (error) => {
                    Servidor.verificaErro(error, this.toastr);
                }
            );

        } else {
            //  atualiza dataFim com data de agora
            let id = this.cfgBloco.id;
            let dataFim = moment(this.cfgBloco.dataInicio, this.formatosDeDatas.dataFormato).subtract(1, 'day').format(this.formatosDeDatas.dataFormato);
            let atualizaCfg = {
                dataFim: dataFim
            }

            this.servicePrestador.updateConfiguraHorario(id, atualizaCfg).subscribe(
                () => {

                    if (this.cfgBloco.bloqueioOriginal) {

                        //  cria novo bloqueio com data inicio agora mais 1 dia
                        let novoInicio = moment(this.cfgBloco.dataInicio, this.formatosDeDatas.dataFormato).add(1, 'day').format(this.formatosDeDatas.dataFormato);
                        let configuracaoNova = {
                            id: undefined,
                            dataInicio: novoInicio,
                            dataFim: this.cfgBloco && this.cfgBloco.bloqueioOriginal && this.cfgBloco.bloqueioOriginal.dataFim ? moment(this.cfgBloco.bloqueioOriginal.dataFim, this.formatosDeDatas.dataFormato).format(this.formatosDeDatas.dataFormato) : null,
                            recorrencia: this.cfgBloco.bloqueioOriginal.recorrencia,
                            repetir: this.cfgBloco.bloqueioOriginal.repetir,
                            tipo: this.cfgBloco.bloqueioOriginal.tipo,
                            usuarioPrestador: { guid: this.prestador.guid },

                            horaInicio: this.cfgBloco.bloqueioOriginal.horaInicio,
                            horaFim: this.cfgBloco.bloqueioOriginal.horaFim,

                            bloqueio: { id: 6 }, // um tipo de bloqueio de recorrencia nao remunerado

                            unidadeAtendimento: {
                                id: parseInt(this.unidadeAtendimento)
                            },

                            observacao: "Era uma recorrencia. Bloqueio nao remunerado"
                        };

                        this.servicePrestador.configuraHorario(configuracaoNova).subscribe(
                            () => {
                                //  Fecha modal
                                this.modalConfirmar.close();
                                // this.modalConfigurarAgenda.close();
                                this.modalConfigurarAgenda.dismiss();

                                this.instanciaAgenda.rebuild();
                            }, (error) => {
                                Servidor.verificaErro(error, this.toastr);
                            }
                        );
                    } else {
                        this.modalConfirmar.close();
                        // this.modalConfigurarAgenda.close();
                        this.modalConfigurarAgenda.dismiss();

                        this.instanciaAgenda.rebuild();
                    }

                }, (error) => {
                    Servidor.verificaErro(error, this.toastr);
                }
            );
        }

        (this.instanciaAgenda) ? this.instanciaAgenda.rebuild(false) : null;
    }

    excluirApartirDesta() {
        let novoHorario = {
            dataFim: moment(this.blocoAtual.dado.novaDataFim, this.formatosDeDatas.dataFormato).subtract(1, 'day').format(this.formatosDeDatas.dataFormato)
        }

        if (moment(novoHorario.dataFim, this.formatosDeDatas.dataFormato).diff(moment(this.blocoAtual.novoInicio, this.formatosDeDatas.dataFormato), "days") < 0) {

            this.servicePrestador.deleteConfiguraHorario(this.novoHorario.id).subscribe(
                () => {
                    //  Fecha modal
                    this.modalConfirmar.close();
                    // this.modalConfigurarAgenda.close();
                    this.modalConfigurarAgenda.dismiss();
                    this.instanciaAgenda.rebuild();
                }, (error) => {
                    Servidor.verificaErro(error, this.toastr);
                }
            );

        } else {
            this.servicePrestador.updateConfiguraHorario(this.novoHorario.id, novoHorario).subscribe(
                () => {
                    this.modalConfirmar.close();
                    // this.modalConfigurarAgenda.close();
                    this.modalConfigurarAgenda.dismiss();
                    this.instanciaAgenda.rebuild();
                }, (error) => {
                    Servidor.verificaErro(error, this.toastr);
                }
            );
        }

        (this.instanciaAgenda) ? this.instanciaAgenda.rebuild(false) : null;
    }

    excluirConfiguracao(bExcluirTodas) {

        if (bExcluirTodas || !this.novoHorario.repetir) {
            this.servicePrestador.deleteConfiguraHorario(this.novoHorario.id).subscribe(
                () => {
                    //  Fecha modal
                    this.modalConfirmar.close();
                    // this.modalConfigurarAgenda.close();
                    this.modalConfigurarAgenda.dismiss();
                    this.instanciaAgenda.rebuild();
                }, (error) => {
                    Servidor.verificaErro(error, this.toastr);
                }
            );
        } else {
            let blocoAtual = this.blocoAtual.dado.dado;


            // TODO
            //  melhorar a modal, permitir um bloqueio com repetição e permitir o usuario selecionar um tipo de bloqueio

            // let bRepetir = this['recorrencia'] && this['recorrencia']['repetir'] ? JSON.parse(this['recorrencia']['repetir']) : false;
            // let recorrencia = this['recorrencia'] && Array.isArray(this['recorrencia']['frequencia']) ? this['recorrencia']['frequencia'].join(',') : null;
            // let bDiaTodo = this['recorrencia'] && this['recorrencia']['diaTodo'] ? JSON.parse(this['recorrencia']['diaTodo']) : false;

            //  Cria Objeto
            let configuracao = {
                id: undefined,
                tipo: "BLOQUEADO",
                dataInicio: moment(this.blocoAtual.dado.ev.id.substring(2), this.formatosDeDatas.htmlDataFormato).format(this.formatosDeDatas.dataFormato),
                dataFim: moment(this.blocoAtual.dado.ev.id.substring(2), this.formatosDeDatas.htmlDataFormato).format(this.formatosDeDatas.dataFormato),

                horaInicio: blocoAtual.horaInicio,
                horaFim: blocoAtual.horaFim,

                // repetir: false,
                // diaTodo: false,

                // recorrencia: null,

                bloqueio: { id: 6 }, // um tipo de bloqueio de recorrencia nao remunerado

                usuarioPrestador: {
                    guid: this.prestador.guid
                },

                unidadeAtendimento: {
                    id: parseInt(this.unidadeAtendimento)
                },

                observacao: "Era uma recorrencia. Bloqueio nao remunerado"
            };

            this.servicePrestador.configuraHorario(configuracao).subscribe(
                () => {
                    //  Fecha modal
                    this.modalConfirmar.close();
                    // this.modalConfigurarAgenda.close();
                    this.modalConfigurarAgenda.dismiss();

                    this.instanciaAgenda.rebuild();
                }, (error) => {
                    Servidor.verificaErro(error, this.toastr);
                }
            );
        }

        (this.instanciaAgenda) ? this.instanciaAgenda.rebuild(false) : null;

    }

    moverDataConfiguracao(bMoverTodas) {

        if (bMoverTodas) {
            //atualiza recorrencia atual colocando um fim na data de agora
            let novoHorario = {
                dataFim: moment(this.novoHorario.dataInicio, this.formatosDeDatas.dataFormato).subtract(1, 'day').format(this.formatosDeDatas.dataFormato)
            }

            if (moment(novoHorario['dataFim']).format(this.formatosDeDatas.dataFormato) < moment(this.novoHorario.dataInicio).format(this.formatosDeDatas.dataFormato)) {
                novoHorario['dataFim'] = this.novoHorario.dataInicio;
            }

            this.servicePrestador.updateConfiguraHorario(this.novoHorario.id, novoHorario).subscribe(
                () => {

                }, (error) => {
                    Servidor.verificaErro(error, this.toastr);
                }
            );


            //cria outra configuracao igual com o horario diferente comecando agora e terminando na data que terminava o antigo
            let configuracao = Object.assign({}, this.cfgAtual.dado);
            let atendimentoTipo = configuracao.atendimentoTipo ? configuracao.atendimentoTipo.id : null;
            let usuarioPrestador = configuracao.usuarioPrestador.guid;

            delete configuracao.usuarioPrestador;
            delete configuracao.atendimentoTipo;

            configuracao.dataInicio = this.novoHorario.dataInicio;
            configuracao.dataFim = this.cfgAtual.dado.dataFim;
            configuracao.horaInicio = this.novoHorario.horaInicio;
            configuracao.horaFim = this.novoHorario.horaFim;
            configuracao.usuarioPrestador = { guid: usuarioPrestador };
            configuracao.unidadeAtendimento = { id: configuracao.unidadeAtendimento.id };
            configuracao.atendimentoTipo = atendimentoTipo ? { id: atendimentoTipo } : null;
            configuracao.guiche = configuracao.guiche && configuracao.guiche.id ? { id: configuracao.guiche.id } : null;


            delete configuracao.id;
            delete configuracao.usuarioCadastro;
            delete configuracao.local;


            this.servicePrestador.configuraHorario(configuracao).subscribe(
                () => {
                    //  Fecha modal
                    if (this.modalConfigurarAgenda) {
                        // this.modalConfigurarAgenda.close();
                        this.modalConfigurarAgenda.dismiss();
                    }
                    this.instanciaAgenda.rebuild();
                }, (error) => {
                    Servidor.verificaErro(error, this.toastr);
                }
            );

            return;
        }

        if (this.novoHorario.repetir) {
            //cria bloqueio no horario atual
            let bloqueio = {
                id: undefined,
                tipo: "BLOQUEADO",
                dataInicio: moment(this.novoHorario.dataInicio, this.formatosDeDatas.dataFormato).format(this.formatosDeDatas.dataFormato),
                dataFim: moment(this.novoHorario.dataInicio, this.formatosDeDatas.dataFormato).format(this.formatosDeDatas.dataFormato),
                horaInicio: this.cfgAtual.dado.horaInicio,
                horaFim: this.cfgAtual.dado.horaFim,

                bloqueio: { id: 6 }, // um tipo de bloqueio de recorrencia nao remunerado

                usuarioPrestador: {
                    guid: this.prestador.guid
                },

                unidadeAtendimento: {
                    id: parseInt(this.unidadeAtendimento)
                },

                observacao: "Era uma recorrencia. Bloqueio nao remunerado"
            };
            this.servicePrestador.configuraHorario(bloqueio).subscribe(
                () => {
                }, (error) => {
                    Servidor.verificaErro(error, this.toastr);
                }
            );

            //cria configuracao no novo horario
            let configuracao = Object.assign({}, this.cfgAtual.dado);

            configuracao.dataInicio = this.novoHorario.dataInicio;
            configuracao.dataFim = this.novoHorario.dataInicio;
            configuracao.horaInicio = this.novoHorario.horaInicio;
            configuracao.horaFim = this.novoHorario.horaFim;
            configuracao.unidadeAtendimento = { id: configuracao.unidadeAtendimento.id };
            configuracao.usuarioPrestador = { guid: configuracao.usuarioPrestador.guid };

            configuracao.guiche = configuracao.guiche && configuracao.guiche.id ? { id: configuracao.guiche.id } : null;

            delete configuracao.id;
            delete configuracao.usuarioCadastro;
            delete configuracao.local;
            delete configuracao.repetir;
            delete configuracao.recorrencia;


            this.servicePrestador.configuraHorario(configuracao).subscribe(
                () => {
                    //  Fecha modal
                    if (this.modalConfigurarAgenda) {
                        // this.modalConfigurarAgenda.close();
                        this.modalConfigurarAgenda.dismiss();
                    }
                    this.instanciaAgenda.rebuild();
                }, (error) => {
                    Servidor.verificaErro(error, this.toastr);
                }
            );

            return;
        }

        //    atualiza configuracao setando novo inicio e novo fim
        let novoHorario = {
            dataInicio: this.novoHorario.dataInicio,
            dataFim: this.novoHorario.dataFim,
            horaInicio: this.novoHorario.horaInicio,
            horaFim: this.novoHorario.horaFim,
        }
        this.servicePrestador.updateConfiguraHorario(this.novoHorario.id, novoHorario).subscribe(
            () => {

                //  Fecha modal
                if (this.modalConfigurarAgenda) {
                    // this.modalConfigurarAgenda.close();
                    this.modalConfigurarAgenda.dismiss();
                    // this.modalConfigurarAgenda.close();
                    this.modalConfigurarAgenda.dismiss();
                }
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );

    }

    loadingConfiguracao = false;
    salvaConfiguracao() {

        if (this.loadingConfiguracao) {
            return;
        }

        let id;
        let esse = this;

        let objValidado = this.validaConfiguracao();
        if (!objValidado) {
            return;
        }

        this.loadingConfiguracao = true;

        //  Cria Objeto
        let configuracao = {
            id: id,
            tipo: this.novoHorario.tipo,
            dataInicio: moment(this.novoHorario.dataInicio, this.formatosDeDatas.htmlDataFormato).format(this.formatosDeDatas.dataFormato),
            dataFim: this.novoHorario.dataFim ? moment(this.novoHorario.dataFim, this.formatosDeDatas.htmlDataFormato).format(this.formatosDeDatas.dataFormato) : undefined,

            horaInicio: this.novoHorario.horaInicio,
            horaFim: this.novoHorario.horaFim,

            maxConcorrente: this.novoHorario.maxConcorrente,

            repetir: objValidado.bRepetir,
            diaTodo: objValidado.bDiaTodo,

            recorrencia: objValidado.recorrencia,

            unidadeAtendimento: {
                id: parseInt(this.unidadeAtendimento)
            },

            observacao: this.novoHorario.observacao
        };

        (!objValidado.bRepetir) ? configuracao["dataFim"] = configuracao["dataInicio"] : null;

        if (this.prestador['userName'] == 'AgendamentoColetivo') {
            configuracao["agendamentoColetivo"] = {
                "id": this.prestador['guid']
            };
        } else {
            configuracao["usuarioPrestador"] = {
                guid: this.prestador["guid"]
            };
        }

        if (configuracao.tipo == "DISPONIVEL" || configuracao.tipo == "COLETIVA") {
            if (this.novoAtendimento['item']['id'] != "semtipo") {
                (this.novoAtendimento['item']['id']) ? configuracao["atendimentoTipo"] = { id: this.novoAtendimento['item']['id'] } : null;
            }
            (this.novoHorario.guiche && parseInt(this.novoHorario.guiche) && (this.novoHorario.guiche != '0')) ? configuracao["guiche"] = { id: parseInt(this.novoHorario.guiche) } : null;

        } else if (configuracao.tipo == "BLOQUEADO") {
            if (this.novoBloqueio['item']['id'] != "semtipo") {
                (this.novoBloqueio['item']['id']) ? configuracao["bloqueio"] = { id: this.novoBloqueio['item']['id'] } : null;
            }
        }

        this.servicePrestador.configuraHorario(configuracao).subscribe(
            (idNovaConf) => {

                this.fnInicializaBlocos().then(
                    (inicializou) => {
                        console.log(inicializou);

                        if (this.modalConfigurarAgenda) {
                            this.modalConfigurarAgenda.dismiss();
                            this.loadingConfiguracao = false;
                        }
                        if (configuracao.tipo == "BLOQUEADO") {
                            let novaConf = configuracao
                            novaConf.id = idNovaConf;
                            let blocSelecionado = this.tiposBloqueio.filter(
                                (bloqueio) => {
                                    return bloqueio.id == novaConf['bloqueio']['id']
                                }
                            )

                            if (blocSelecionado && blocSelecionado.length) {
                                novaConf['bloqueio'] = blocSelecionado[0];
                            }

                            this.todasConfiguracoes.push(novaConf);
                        }
                        esse.instanciaAgenda.rebuild();
                    }
                );
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
                this.loadingConfiguracao = false;
            }
        );
    }

    atualizaConfiguracao(novoHorario) {
        let id;
        let objValidado = this.validaConfiguracao();
        if (!objValidado) {
            return;
        }
        
        if (
            (!(
                this.prestador &&
                this.novoHorario.tipo &&
                (this.unidadeAtendimento && this.unidadeAtendimento != '0') &&

                this.novoHorario.dataInicio &&

                this.novoHorario.horaInicio &&
                this.novoHorario.horaFim
            )) ||
            (
                (!this.novoHorario.dataFim || this.novoHorario.dataFim == '') &&
                objValidado.bRepetir == false
            ) ||
            (
                (!this.novoHorario.dataFim || this.novoHorario.dataFim == '') &&
                objValidado.bRepetir == true &&
                (!objValidado.recorrencia || objValidado.recorrencia == '')
            )
        ) {
            return;
        }

        //  Cria Objeto
        let configuracao = {
            id: novoHorario.id,
            tipo: novoHorario.tipo,
            dataInicio: moment(novoHorario.dataInicio, this.formatosDeDatas.htmlDataFormato).format(this.formatosDeDatas.dataFormato),
            dataFim: novoHorario.dataFim ? moment(novoHorario.dataFim, this.formatosDeDatas.htmlDataFormato).format(this.formatosDeDatas.dataFormato) : undefined,

            horaInicio: novoHorario.horaInicio,
            horaFim: novoHorario.horaFim,

            maxConcorrente: novoHorario.maxConcorrente,

            repetir: objValidado.bRepetir,
            diaTodo: objValidado.bDiaTodo,

            recorrencia: objValidado.recorrencia,

            usuarioPrestador: {
                guid: this.prestador.guid
            },

            unidadeAtendimento: {
                id: parseInt(this.unidadeAtendimento)
            },

            observacao: novoHorario.observacao
        };

        if (this.prestador.userName == "AgendamentoColetivo") {
            delete configuracao.usuarioPrestador;
            configuracao["agendamentoColetivo"] = { id: this.prestador.guid };
        }

        (!objValidado.bRepetir) ? configuracao["dataFim"] = configuracao["dataInicio"] : null;

        if (configuracao.tipo == "DISPONIVEL" || configuracao.tipo == "COLETIVA") {
            delete configuracao.tipo;

            if (this.novoAtendimento['item']['id'] != "semtipo") {
                (this.novoAtendimento['item']['id']) ? configuracao["atendimentoTipo"] = { id: this.novoAtendimento['item']['id'] } : null;
            } else {
                // configuracao["atendimentoTipo"] = {};
                //VALIDAR NO BACK COMO DEVE MANDAR
            }
            (this.novoHorario.guiche && parseInt(this.novoHorario.guiche) && (this.novoHorario.guiche != '0')) ? configuracao["guiche"] = { id: parseInt(this.novoHorario.guiche) } : null;

        } else if (configuracao.tipo == "BLOQUEADO") {
            if (this.novoBloqueio['item']['id'] != "semtipo") {
                (this.novoBloqueio['item']['id']) ? configuracao["bloqueio"] = { id: this.novoBloqueio['item']['id'] } : null;
            }
        }

        this.servicePrestador.updateConfiguraHorario(novoHorario.id, configuracao).subscribe(
            () => {
                if (this.modalConfigurarAgenda) {
                    this.modalConfigurarAgenda.dismiss();
                }
                this.instanciaAgenda.rebuild();
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        )
    }

    validaConfiguracao() {

        let bRepetir = this['recorrencia'] && this['recorrencia']['repetir'] ? JSON.parse(this['recorrencia']['repetir']) : false;
        let recorrencia = this['recorrencia'] && Array.isArray(this['recorrencia']['frequencia']) ? this['recorrencia']['frequencia'].join(',') : null;
        let bDiaTodo = this['recorrencia'] && this['recorrencia']['diaTodo'] ? JSON.parse(this['recorrencia']['diaTodo']) : false;

        if (this.novoHorario.horaInicio == '' || this.novoHorario.horaFim == '') {
            this.toastr.warning("Hora Inicial e Final devem ser informada");
            return false;
        }
        if (!this.validaDatasHoras('dataInicio', 'dataFim') && bRepetir) {
            this.toastr.warning("Encerramento menor que Data de Inicio");
            return false;
        }
        if (!this.validaDatasHoras('horaInicio', 'horaFim')) {
            this.toastr.warning("Hora de Término menor ou igual a Hora de Inicio");
            return false;
        }
        if (bRepetir && (!recorrencia || recorrencia == '')) {
            this.toastr.warning("Recorrência não selecionada");
            return false;
        }

        return {
            bRepetir: bRepetir,
            recorrencia: recorrencia,
            bDiaTodo: bDiaTodo
        }

    }

    fnAbreModalAlteraStatus(agendamentoModal, botoesModalAgendamento, acaoAgendamento, bloco) {
        this.acaoAgendamento = acaoAgendamento;
        this.agendaAtual = bloco;

        let esse = this;

        this.modalConfigurarAgenda = this.modalService.open(NgbdModalContent, { size: 'lg' });
        this.modalConfigurarAgenda.componentInstance.modalHeader = 'Cancelar Agendamento';

        this.modalConfigurarAgenda.componentInstance.templateRefBody = agendamentoModal;
        this.modalConfigurarAgenda.componentInstance.templateBotoes = botoesModalAgendamento;

        this.modalConfigurarAgenda.result.then((data) => {
            esse.acaoAgendamento = null;
            this.removeBlocoDesenhado(bloco);
        }, (reason) => {
            esse.acaoAgendamento = null;
            this.removeBlocoDesenhado(bloco);
        });
    }

    alterarStatusAgendamento() {
        let esse = this;
        let atendimentoRequest = {
            "status": this.acaoAgendamento
        };

        this.serviceAtendimento.atualizar(this.agendaAtual.id, atendimentoRequest).subscribe(
            (atendimento) => {
                if (atendimento) {
                    // esse.modalConfigurarAgenda.close();
                    esse.modalConfigurarAgenda.dismiss();
                    esse.instanciaAgenda.rebuild();
                }
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    validaTipoBloco(bloco) {
        if (bloco && bloco["tipo"] == "DISPONIVEL")
            this.novoAtendimento = new NovoAtendimento(bloco.atendimentoTipo)
        else if (bloco && bloco["tipo"] == "BLOQUEADO")
            this.novoBloqueio = new NovoBloqueio(bloco.bloqueio)
        else if (bloco && bloco["tipo"] == "COLETIVA") {
            this.novoAtendimento = new NovoAtendimento(bloco.atendimentoTipo)
            this.novoAgendamentoColetivo = new NovoAgendamentoColetivo(bloco.agendamentoColetivo)
        } else {
            this.novoAtendimento = new NovoAtendimento(null);
            this.novoBloqueio = new NovoBloqueio(null);
            this.novoAgendamentoColetivo = new NovoAgendamentoColetivo(null);
        }
    }

    validaRecorrencias(recorrenciaConfiguracao, recorrenciaModelo){
        setTimeout(() => {

            let arrayModeloRecorrenciaCfg = recorrenciaModelo.split(',');
            if( this.recorrenciaInstancia ){
                let recorrenciaDetalhada = this.recorrenciaInstancia.get('objRecorrenciaDetalhada');
                
                let arrayDias = Object.keys(recorrenciaDetalhada);
                arrayDias.forEach(
                    (dia) => {
                        if( arrayModeloRecorrenciaCfg.indexOf(dia) > -1 ){
                            recorrenciaDetalhada[dia]['desativado'] = true;
                        }
                    }
                )

                this.recorrenciaInstancia.set('objRecorrenciaDetalhada', recorrenciaDetalhada);
            }
        }, 600);
    }

    validaDatasHoras(tipoIni, tipoFim){
        let tipo = tipoIni.match("data") ? "data" : "hora";
        let inicio = this.novoHorario[tipoIni];
        let fim = this.novoHorario[tipoFim];
        let diferenca;

        if (tipo == "data") {
            diferenca = moment.duration(moment(fim).diff(moment(inicio))).days();
        } else {
            diferenca = moment.duration(moment(fim, this.formatosDeDatas.horaFormato).diff(moment(inicio, this.formatosDeDatas.horaFormato)));
        }

        return (diferenca < 0 || diferenca._milliseconds == 0) ? false : true;
    }

    salvarTipoAtendimento() {
        this.activeModal = this.modalService.open(NgbdModalContent, { size: 'lg' });
        this.activeModal.componentInstance.modalHeader = 'Salvar Tipo Atendimento';
        this.activeModal.componentInstance.templateRefBody = this.bodyModalAdicionaTipoAtendimento;
        this.activeModal.componentInstance.templateBotoes = this.modalAdicionaTipoAtendimentoBotoes;

        this.activeModal.result.then(
            (data) => this.instanciaBtnSearch.buscaTodos(),
            (reason) => this.instanciaBtnSearch.buscaTodos())

        this.novoAtendimento = new NovoAtendimento(null);
    }

    editarTipoAtendimento(item) {
        this.activeModal = this.modalService.open(NgbdModalContent, { size: 'lg' });
        this.activeModal.componentInstance.modalHeader = 'Editar Tipo Atendimento';
        this.activeModal.componentInstance.templateRefBody = this.bodyModalAdicionaTipoAtendimento;
        this.activeModal.componentInstance.templateBotoes = this.modalAdicionaTipoAtendimentoBotoes;

        this.activeModal.result.then(
            (data) => this.instanciaBtnSearch.buscaTodos(),
            (reason) => this.instanciaBtnSearch.buscaTodos())

        this.novoAtendimento = new NovoAtendimento(item);
    }

    salvarTipoBloqueio() {
        this.activeModal = this.modalService.open(NgbdModalContent, { size: 'lg' });
        this.activeModal.componentInstance.modalHeader = 'Salvar Tipo Atendimento';
        this.activeModal.componentInstance.templateRefBody = this.bodyModalAdicionaBloqueio;
        this.activeModal.componentInstance.templateBotoes = this.modalAdicionaBloqueioBotoes;

        this.activeModal.result.then(
            (data) => this.instanciaBtnSearch.buscaTodos(),
            (reason) => this.instanciaBtnSearch.buscaTodos())

        this.novoBloqueio = new NovoBloqueio(null);
    }

    editarTipoBloqueio(item) {
        this.activeModal = this.modalService.open(NgbdModalContent, { size: 'lg' });
        this.activeModal.componentInstance.modalHeader = 'Editar Tipo Bloqueio';
        this.activeModal.componentInstance.templateRefBody = this.bodyModalAdicionaBloqueio;
        this.activeModal.componentInstance.templateBotoes = this.modalAdicionaBloqueioBotoes;

        this.activeModal.result.then(
            (data) => this.instanciaBtnSearch.buscaTodos(),
            (reason) => this.instanciaBtnSearch.buscaTodos())

        this.novoBloqueio = new NovoBloqueio(item);
    }

    salvarTipoAgendaColetiva(item) {
        this.modalAgendaColetiva = this.modalService.open(NgbdModalContent, { size: 'lg' });
        this.modalAgendaColetiva.componentInstance.modalHeader = ((item) ? 'Editar' : 'Salvar Nova') + ' Agenda Coletiva';
        this.modalAgendaColetiva.componentInstance.templateRefBody = this.bodyModalAdicionaTipoAgendamentoColetivo;
        this.modalAgendaColetiva.componentInstance.templateBotoes = this.modalAdicionaTipoAgendamentoColetivoBotoes;

        this.modalAgendaColetiva.result.then(
            (data) => this.instanciaBtnAgendamentoColetivo.buscaTodos(),
            (reason) => this.instanciaBtnAgendamentoColetivo.buscaTodos())

        this.novoAgendamentoColetivo = new NovoAgendamentoColetivo(item);
    }

    objConfiguraHorarioTuss = new Object();
    valorProcedimentoSelecionado;
    fnSetProcedimento(procedimento, obj) {
        if (procedimento) {
            this.valorProcedimentoSelecionado = procedimento.descricao;
            obj['procedimento'] = {
                id: procedimento.id,
                descricao: procedimento.descricao,
                tabelatipo: {
                    id: procedimento.tabelatipo.id
                }
            };
        } else {
            obj['procedimento'] = undefined;
            this.valorProcedimentoSelecionado = '';
        }
    }

    setOperadora(evento, procedimento) {
        if (evento && evento.valor) {
            procedimento['operadora'] = this.operadoras.filter(
                (operadora) => {
                    return operadora.id == evento.valor;
                }
            )[0]
        }
    }

    objProcedimentos = [];
    fnCfgProcedimentoRemote(term) {
        if (term.match(/\D/g)) {
            this.serviceProcedimento.procedimentoPaginadoFiltro(1, 10, term).subscribe(
                (retorno) => {
                    this.objProcedimentos = retorno.dados || retorno;
                }, (error) => {
                    Servidor.verificaErro(error, this.toastr);
                }
            );
        } else {
            this.serviceProcedimento.getProcedimentosCodigo(term).subscribe(
                (retorno) => {
                    let procedimento = retorno.dados || retorno;
                    this.objProcedimentos = (procedimento) ? [procedimento] : [];
                }, (error) => {
                    Servidor.verificaErro(error, this.toastr);
                }
            )
        }
    }

    @ViewChild("modalEditaProcedimento", { read: TemplateRef }) modalEditaProcedimento: TemplateRef<any>;
    @ViewChild("modalEditaProcedimentoBotoes", { read: TemplateRef }) modalEditaProcedimentoBotoes: TemplateRef<any>;

    modalNovoProcedimento;
    abreModalProcedimento(item) {

        this.valorProcedimentoSelecionado = item.procedimento.descricao;

        let cfgGlobal: any = Object.assign(NgbdModalContent.getCfgGlobal(), { size: 'lg' });

        this.modalNovoProcedimento = this.modalService.open(NgbdModalContent, cfgGlobal);
        this.modalNovoProcedimento.componentInstance.modalHeader = 'Editar Procedimento';
        this.modalNovoProcedimento.componentInstance.templateRefBody = this.modalEditaProcedimento;
        this.modalNovoProcedimento.componentInstance.templateBotoes = this.modalEditaProcedimentoBotoes;
        this.modalNovoProcedimento.componentInstance.contextObject = {
            objProcedimento: item
        };

        this.modalNovoProcedimento.result.then(
            (data) => { },
            (reason) => { })

    }

    salvarProcedimento(configuraHorarioTuss, novo = false) {
        if (!this.validaNovoProcedimento(configuraHorarioTuss)) {
            return;
        }

        let novoProcedimento = Object.assign(configuraHorarioTuss, this.objConfiguraHorarioTussPadrao);

        if (novoProcedimento.procedimento) {
            delete novoProcedimento.procedimento.descricao;
            delete novoProcedimento.procedimento.classe;
            delete novoProcedimento.procedimento.altoCusto;
            delete novoProcedimento.procedimento.codigo;
        }

        if (this.objConfiguraHorarioTussPadrao['configuraHorario']) {

            if (!novoProcedimento.id) {

                this.serviceConfiguraHorarioTuss.post(novoProcedimento).subscribe(
                    (retorno) => {
                        this.toastr.success("Procedimento adicionado com sucesso");
                        this.refreshProcedimentos();
                        (this.modalNovoProcedimento) ? this.modalNovoProcedimento.dismiss() : null;
                    },
                    (error) => {
                        Servidor.verificaErro(error, this.toastr);
                    }
                )

            } else {

                this.serviceConfiguraHorarioTuss.put(novoProcedimento, novoProcedimento.id).subscribe(
                    () => {
                        this.refreshProcedimentos();
                        this.toastr.success("Procedimento editado com sucesso");
                        (this.modalNovoProcedimento) ? this.modalNovoProcedimento.dismiss() : null;
                    },
                    (error) => {
                        Servidor.verificaErro(error, this.toastr);
                    }
                )
            }
        } else {
            if (novo) {
                this.novoHorario.configuraHorarioTuss.push(novoProcedimento);
            } else {
                console.warn("Editando procedimento já existente");
            }
            (this.modalNovoProcedimento) ? this.modalNovoProcedimento.dismiss() : null;
        }
    }

    removeProcedimento(procedimento) {
        if (!confirm("Deseja mesmo remover esse procedimento?"))
            return

        this.serviceConfiguraHorarioTuss.delete(procedimento.id).subscribe(
            () => {
                this.refreshProcedimentos();
                this.toastr.success("Procedimento removido com sucesso");
            },
            (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        )
    }

    refreshProcedimentos() {

        let request = {
            configuraHorarioId: this.objConfiguraHorarioTussPadrao['configuraHorario']['id']
        }

        this.serviceConfiguraHorarioTuss.get(request).subscribe(
            (retorno) => {
                let procedimentoCH = retorno.dados || retorno;
                this.novoHorario.configuraHorarioTuss = procedimentoCH;
            },
            (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        )
    }

    validaNovoProcedimento(configuraHorarioTuss) {

        if (!configuraHorarioTuss['procedimento'] || (configuraHorarioTuss['procedimento'] && !configuraHorarioTuss['procedimento']['id'])) {
            this.toastr.warning("Informe um procedimento");
            return false;
        }

        if (!configuraHorarioTuss['operadora']) {
            this.toastr.warning("Informe uma Operadora");
            return false;
        }

        if (!configuraHorarioTuss['quantidade']) {
            this.toastr.warning("Informe uma Quantidade");
            return false;
        }

        return true;
    }
}

class NovoAtendimento {
    item = new Object();

    constructor(obj) {

        if (!obj) {
            return;
        }

        this.item["id"] = obj.id;
        this.item["tempo"] = obj.tempo;
        this.item["descricao"] = obj.descricao;
        this.item["obrigaTelefone"] = obj.obrigaTelefone;
        this.item["cor"] = obj.cor;

    }

    setItem(item) {
        this.item = item;
        this.fecharModal(false);
    }

    salvarAtendimento(obj, serviceTipoAtendimento) {
        let esse = this;
        if (this.item["id"]) {

            serviceTipoAtendimento.atualizar(this.item["id"], this.item).subscribe(
                () => {
                    this.fecharModal(serviceTipoAtendimento);
                }, (error) => {
                    Servidor.verificaErro(error);
                    console.error("Houve um erro ao salvar");
                }
            );
        } else {

            serviceTipoAtendimento.salvar(this.item).subscribe(
                (atendimentoId) => {
                    this.item["id"] = atendimentoId;
                    this.fecharModal(serviceTipoAtendimento)
                }, (error) => {
                    Servidor.verificaErro(error);
                    console.error("Houve um erro ao salvar")
                }
            )
        }
    }

    fecharModal(serviceTipoAtendimento) {
        let element: HTMLElement = document.querySelectorAll(".close")[document.querySelectorAll(".close").length - 1] as HTMLElement;
        element.click();
    }
}

class NovoBloqueio {
    item = new Object();

    constructor(obj) {

        if (!obj) {
            return;
        }

        this.item["id"] = obj.id;
        this.item["remunerado"] = obj.remunerado;
        this.item["descricao"] = obj.descricao;

    }

    setItem(item) {
        this.item = item;
        this.fecharModal();
    }

    salvarBloqueio(obj, serviceTipoBloqueio) {

        if (this.item["id"]) {

            serviceTipoBloqueio.atualizar(this.item["id"], this.item).subscribe(
                atendimento => this.fecharModal(),
                err => console.error("Houve um erro ao salvar", 'Alert!')
            )
        }
        else {

            serviceTipoBloqueio.salvar(this.item).subscribe(
                (bloqueioId) => {
                    this.item["id"] = bloqueioId;
                    this.fecharModal()
                },
                err => console.error("Houve um erro ao salvar", 'Alert!')
            )
        }
    }

    fecharModal() {
        let element: HTMLElement = document.querySelectorAll(".close")[document.querySelectorAll(".close").length - 1] as HTMLElement;
        element.click();
    }
}

class NovoAgendamentoColetivo {

    item = new Object();

    constructor(obj) {

        if (!obj) {
            return;
        }

        this.item["id"] = obj.id;
        this.item["remunerado"] = obj.remunerado;
        this.item["descricao"] = obj.descricao;

    }

    setItem(item) {
        this.item = item;
        this.fecharModal();
    }

    salvarBloqueio(obj, serviceAgendaColetiva) {

        if (this.item["id"]) {

            serviceAgendaColetiva.putAgendamentoColetivo(this.item["id"], this.item).subscribe(
                agendaColetiva => this.fecharModal(),
                err => console.error("Houve um erro ao salvar")
            )
        }
        else {

            serviceAgendaColetiva.postAgendamentoColetivo(this.item).subscribe(
                (agendaColetivaId) => {
                    this.item["id"] = agendaColetivaId;
                    this.fecharModal()
                },
                err => console.error("Houve um erro ao salvar")
            )
        }
    }

    fecharModal() {
        let element: HTMLElement = document.querySelectorAll(".close")[document.querySelectorAll(".close").length - 1] as HTMLElement;
        element.click();
    }
}