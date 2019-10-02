import { Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Component, Input, Output, ElementRef, EventEmitter, ViewChild, TemplateRef, Renderer2 } from '@angular/core';

import { ToastrService } from 'ngx-toastr';
import { debounceTime } from 'rxjs/operators';
import { Subject } from 'rxjs';

import { Sessao, Servidor, UtilService, PacienteService, UsuarioService, EstadoCivilService, PacienteParentescoService, PacienteOperadoraService, AtendimentoService } from 'app/services';
import { FormatosData, NgbdModalContent } from 'app/theme/components';

import * as moment from 'moment';
moment.locale('pt-br');

@Component({
    selector: 'paciente',
    templateUrl: './paciente.html',
    styleUrls: ['./paciente.scss'],
    providers: []
})

export class Paciente {
    @Input() novoPaciente = false;
    @Input() pacienteId: any = false;
    @Input() foto = false;
    @Input() salva = false;
    @Input() dados = false;
    @Input() plano = false;
    @Input() inativo = false;
    @Input() contato = false;
    @Input() endereco = false;
    @Input() responsavel = false;
    @Input() tapsAtual = 'basico';
    @Input() modalCadastro = true;
    @Input() navegacaoTaps = false;
    @Input() botoesAcoes = '';
    @Input() validaCadastroBasico;
    @Output() atualizaDados: EventEmitter<any> = new EventEmitter();

    carteira;

    objParamsPaciente = new Object();
    objParamsPlano = new Object();
    objParamsEndereco = new Object();
    objParamsContato = new Object();
    objParamsResponsavel = new Object();

    imagem;
    paciente;
    operadoras;
    parentescos;
    usuarioGuid;
    novoOperadora;
    novoParentesco;
    cadastroBasico;
    opcEstadoCivil;
    formatosDeDatas;
    usuarioAtendimento;
    usuarioAtendimentoClinica;

    contatosPaciente = [];
    opcSexo = [
        { 'id': 'M', 'descricao': 'Masculino' },
        { 'id': 'F', 'descricao': 'Feminino' }
    ];

    atendimentosPaciente: any = null;

    paginaAtualHist = 1;
    itensPorPaginaHist = 15;
    qtdItensTotalHist;

    setColorBackgroundStatus(status) {

        switch (status) {
            case "SALADEESPERA":
                return "#f5781e";

            case "PREATENDIMENTO":
                return "#ec0e63";

            case "EMATENDIMENTO":
                return "#ffc20f";

            case "ATENDIDO":
                return "#005128";

            case "DESMARCADO":
                return "#683c0f";

            default:
                return "#79787d";
        }
    }

    instanciaBtnSearchOperadora;
    instanciaBtnSearchParentesco;

    disabledIndicador = false;
    activeModal: any;

    momentjs = moment;

    @ViewChild("formularioPlanoBody", { read: TemplateRef }) formularioPlanoBody: TemplateRef<any>;
    @ViewChild("formularioPlanoBotoes", { read: TemplateRef }) formularioPlanoBotoes: TemplateRef<any>;

    @ViewChild("formularioContatoBody", { read: TemplateRef }) formularioContatoBody: TemplateRef<any>;
    @ViewChild("formularioContatoBotoes", { read: TemplateRef }) formularioContatoBotoes: TemplateRef<any>;

    @ViewChild("formularioEnderecoBody", { read: TemplateRef }) formularioEnderecoBody: TemplateRef<any>;
    @ViewChild("formularioEnderecoBotoes", { read: TemplateRef }) formularioEnderecoBotoes: TemplateRef<any>;

    @ViewChild("formularioResponsavelBody", { read: TemplateRef }) formularioResponsavelBody: TemplateRef<any>;
    @ViewChild("formularioResponsavelBotoes", { read: TemplateRef }) formularioResponsavelBotoes: TemplateRef<any>;

    @ViewChild("bodyModalAdicionaParentesco", { read: TemplateRef }) bodyModalAdicionaParentesco: TemplateRef<any>;
    @ViewChild("modalAdicionaParentescoBotoes", { read: TemplateRef }) modalAdicionaParentescoBotoes: TemplateRef<any>;

    @ViewChild("bodyModalAdicionaOperadora", { read: TemplateRef }) bodyModalAdicionaOperadora: TemplateRef<any>;
    @ViewChild("modalAdicionaOperadoraBotoes", { read: TemplateRef }) modalAdicionaOperadoraBotoes: TemplateRef<any>;

    @ViewChild("bodyModalLogAtendimento", { read: TemplateRef }) bodyModalLogAtendimento: TemplateRef<any>;
    @ViewChild("botoesModalLogAtendimento", { read: TemplateRef }) botoesModalLogAtendimento: TemplateRef<any>;

    @ViewChild("alteraStatusAgendamentoModal", { read: TemplateRef }) alteraStatusAgendamentoModal: TemplateRef<any>;
    @ViewChild("botoesModalAlteraStatusAgendamento", { read: TemplateRef }) botoesModalAlteraStatusAgendamento: TemplateRef<any>;

    @ViewChild("carteira") inputCarteira: ElementRef;

    debounce: Subject<any> = new Subject<any>();

    constructor(
        private toastr: ToastrService,
        private router: Router,
        private renderer: Renderer2,
        private modalService: NgbModal,
        private serviceLocal: UtilService,
        private service: AtendimentoService,
        private serviceUsuario: UsuarioService,
        private servicePaciente: PacienteService,
        private serviceEstadoCivil: EstadoCivilService,
        private serviceOperadora: PacienteOperadoraService,
        private serviceParentesco: PacienteParentescoService,
    ) {

    }

    ngOnDestroy() {
        this.debounce.unsubscribe();
    }

    ngOnInit() {
        if (this.pacienteId) {
            this.getPaciente(this.pacienteId);
        }

        this.formatosDeDatas = new FormatosData;
        this.novoParentesco = new NovoParentesco(null);
        this.novoOperadora = new NovoOperadora(null);

        this.serviceEstadoCivil.get().subscribe(
            (dados) => {
                this.opcEstadoCivil = dados;
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );

        if (this.validaCadastroBasico == undefined) {
            Sessao.getVariaveisAmbiente('unidadesAtendimento').forEach(unidade => {
                if (unidade.id == localStorage.getItem('idUnidade')) {
                    this.cadastroBasico = unidade.obrigaCadastroBasico;
                }
            });
        } else {
            this.cadastroBasico = this.validaCadastroBasico;
        }

        this.servicePaciente.getTiposContatoPaciente({}).subscribe(
            (tipos) => {
                this.contatosPaciente = tipos.dados || tipos;
            },
            (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        )

        this.serviceUsuario.usuarioSessao().subscribe(
            (usuario) => {
                this.usuarioGuid = usuario.guid;
                let usuarioAtendimentoClinica = [];
                let possuiAtendimento = usuario.papeis.filter(papel => {
                    if (papel.nome == "WEBPEP:ATENDIMENTO_CLINICAUNIMED") {
                        usuarioAtendimentoClinica.push(papel);
                    }
                    return papel.nome == "WEBPEP:ATENDIMENTO";
                })
                this.usuarioAtendimento = (possuiAtendimento.length > 0);
                this.usuarioAtendimentoClinica = (usuarioAtendimentoClinica.length > 0);
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );

        this.refreshParentescos(null, false);
        this.refreshOperadoras(null, false);

        this.debounce.pipe(debounceTime(1000)).subscribe(
            (value) => {
                console.log('Value changed to', value.target.value);
                this.planoDados(value.target.value)
            }
        );
    }

    navegar(destino) {
        this.tapsAtual = destino;
    }

    getPaciente(pacienteId) {
        this.servicePaciente.getPaciente({ id: pacienteId }).subscribe(
            (paciente) => {
                this.paciente = paciente.dados[0];
                this.usuarioPacienteSelecionado = this.paciente['usuario'] ? this.paciente['usuario']['nome'] : '';

                this.servicePaciente.getPacienteFoto(this.paciente['id'], false).subscribe(
                    (result) => {
                        if (!result.match(".*assets.*")) {
                            this.imagem = this.servicePaciente.getPacienteFoto(this.paciente['id'], true)
                        }
                    }, (error) => {
                        if (error.status == 406) {
                            // TODO Precisa validar por que retorna esse erro em alguns casos.
                            return
                        }
                        Servidor.verificaErro(error, this.toastr);
                    }
                );

                if (!!this.paciente.contatos[0]) this.atualiza(this.paciente.contatos[0], 'Contato');
                if (!!this.paciente.enderecos[0]) this.atualiza(this.paciente.enderecos[0], 'Endereco');
                if (!!this.paciente.responsaveis[0]) this.atualiza(this.paciente.responsaveis[0], 'Responsavel');

                let atualizaPlano = false;
                this.paciente.planos.forEach(plano => {
                    plano.vencido = moment().isAfter(moment(plano.validade, this.formatosDeDatas.dataFormato));
                    if (plano.ativo && plano.principal && !plano.vencido && !plano.bloqueio) {
                        this.atualiza(plano, 'Plano');
                        atualizaPlano = true;
                    }
                });

                if (!atualizaPlano) {
                    if (this.paciente.planos.length == 1) {
                        if (this.paciente.planos[0].ativo && !this.paciente.planos[0].bloqueio && this.paciente.planos[0].validade > moment().format(this.formatosDeDatas.dataFormato)) {
                            this.atualiza(this.paciente.planos[0], 'Plano')
                        }
                    } else {
                        this.paciente.planos.sort(function (a, b) {
                            if (a.principal < b.principal) return 1;
                            if (a.principal > b.principal) return -1;
                            return 0;
                        });

                        for (let i = 0; i < this.paciente.planos.length; i++) {
                            const plano = this.paciente.planos[i];
                            if (plano.ativo && !plano.bloqueio && (moment(plano.validade) > moment() || !plano.validade)) {
                                this.atualiza(plano, 'Plano');
                                break;
                            }
                        }
                    }
                }

                this.buscarProximasConsultasPaginado();
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    getImagemCompleta(objImagemBase64) {
        let objImagem = { "imagem": objImagemBase64["image"] }
        this.servicePaciente.salvarPacienteFoto(this.paciente['id'], objImagem).subscribe(
            () => {
                this.toastr.success("Imagem editada com sucesso.");
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );
    }

    salvarPaciente() {
        let metodo = ((this.pacienteId) ? "atualizar" : "salvar") + "Paciente";

        if (this.cadastroBasico) {
            if (!this.objParamsPaciente['nome']) {
                this.toastr.error("Nome do paciente é obrigatorio");
                return;
            } else if (!this.objParamsPaciente['nascimento']) {
                this.toastr.error("Data de nascimento é obrigatoria");
                return;
            } else if (!this.objParamsPaciente['mae']) {
                this.toastr.error("Nome da mae é obrigatorio");
                return;
            } else if (!this.objParamsPaciente['pai']) {
                this.toastr.error("Nome do pai é obrigatorio");
                return;
            } else if (this.objParamsPaciente['cpf'] && this.objParamsPaciente['cpf'].length != 11) {
                this.toastr.error("CPF informado invalido");
                return;
            }

            let objMomento = moment(this.objParamsPaciente['nascimento'], this.formatosDeDatas.dataHoraSegundoFormato);
            let anoAtual = moment().year();

            if (!this.objParamsPaciente['cpf'] && (anoAtual - objMomento.year()) >= 18) {
                this.toastr.error("Paciente com mais de 18 anos. Obrigatorio CPF");
                return
            }
        } else {
            if (!this.objParamsPaciente['nome']) {
                this.toastr.error("Nome do paciente é obrigatorio");
                return;
            }
        }

        (this.objParamsPaciente['estadoCivil'] == '0') ? delete this.objParamsPaciente['estadoCivil'] : null;
        (this.objParamsPaciente['sexo'] == '0') ? delete this.objParamsPaciente['sexo'] : null;
        (this.objParamsPaciente['nascimento'] == '') ? delete this.objParamsPaciente['nascimento'] : null;

        this.servicePaciente[metodo](this.pacienteId, this.objParamsPaciente).subscribe(
            (retorno) => {
                this.toastr.success("Paciente salvo com sucesso");

                this.pacienteId = retorno;
                this.plano, this.contato, this.endereco, this.responsavel = true;

                this.servicePaciente.getPaciente({ id: this.pacienteId }).subscribe(
                    (paciente) => {
                        this.paciente = paciente.dados[0];
                        this.pacienteId = this.paciente.id;
                        this.novoPaciente = false;
                        this.atualiza(this.paciente, 'Paciente');

                        if (!this.modalCadastro) {
                            this.router.navigate([`/${Sessao.getModulo()}/paciente/formulario/${this.pacienteId}`]);
                        }
                    }
                );
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        )
    }

    validaCpf(term) {
        if (!!term && term.length == 11) {
            this.servicePaciente.getPaciente({ cpf: term }).subscribe(
                (retorno) => {
                    if (retorno.qtdItensTotal > 0) {
                        this.paciente = retorno.dados[0] || retorno[0];
                        this.pacienteId = this.paciente.id;
                        this.foto = true;
                        this.salva = true;
                        this.dados = true;
                        this.plano = true;
                        this.contato = true;
                        this.endereco = true;
                        this.responsavel = true;
                        this.novoPaciente = false;

                        if (!this.modalCadastro) {
                            this.router.navigate([`/${Sessao.getModulo()}/paciente/formulario/${this.pacienteId}`]);
                        }
                    }
                }, (error) => {
                    Servidor.verificaErro(error, this.toastr);
                }
            );
        }
    }

    verificaCpf(novo, cpf) {
        if (novo) {
            return false;
        }

        if (!this.paciente.cpf) {
            return false
        }

        return true;
    }

    objProfissionais;
    novoProfissional = new Object();
    fnCfgprofissionalRemote(term) {
        this.serviceUsuario.usuarioPaginadoFiltro(1, 10, term).subscribe(
            (retorno) => {
                this.objProfissionais = retorno.dados || retorno;
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        )
    }

    usuarioPaciente
    usuarioPacienteSelecionado;
    getUsuarioPaciente(usuario) {
        if (usuario) {
            this.objParamsPaciente['usuario'] = { guid: usuario.guid }
            this.usuarioPacienteSelecionado = usuario['nome'];
        } else {
            this.objParamsPaciente['usuario'] = undefined;
        }
    }

    bParticular = false;
    setOperadora(idOperadora) {
        let operadoraSelecionada = this.operadoras.filter((operadora) => {
            return operadora.id == idOperadora;
        })[0];

        this.bParticular = (operadoraSelecionada.nome.toUpperCase() == 'PARTICULAR' || idOperadora == 391);

        this.objParamsPlano['operadora'] = { id: idOperadora }
        delete this.objParamsPlano['validade'];
    }

    buscaCep = false;
    getEndereco(cep) {
        if (cep.valor && cep.valor.length == 8) {
            this.serviceLocal.buscaPorCep(cep.valor).subscribe(
                (endereco) => {
                    this.objParamsEndereco['cep'] = cep.valor;

                    if (endereco) {
                        this.objParamsEndereco['logradouro'] = endereco.tipo.nome + ' ' + endereco.nome;
                        this.objParamsEndereco['bairro'] = endereco.bairro.nome;
                        this.objParamsEndereco['cidade'] = { id: endereco.cidade.id, nome: endereco.cidade.nome, estado: endereco.cidade.estado.sigla }
                    }

                    this.buscaCep = endereco.cep;
                }, (error) => {
                    this.buscaCep = undefined;
                    this.objParamsEndereco = new Object();
                    Servidor.verificaErro(error, this.toastr);
                }
            );
        } else {
            this.buscaCep = undefined
        }
    }

    objCidades;
    fnCfgCidadeRemote(term) {
        this.serviceLocal.getCidades({ like: term }).subscribe(
            (retorno) => {
                this.objCidades = retorno.dados || retorno;
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    cidadeSelecionada
    getCidadeSelect(evento) {
        if (evento) {
            this.cidadeSelecionada = evento.nome
            this.objParamsEndereco['cidade'] = { id: evento['id'], estado: evento['estado']['sigla'] }
        } else {
            this.objParamsEndereco['cidade'] = undefined
        }
    }

    tipoContato = "text"
    getTipoContato($event) {
        if ($event.valido) {
            this.objParamsContato['tipo'] = $event.valor;
            this.tipoContato = $event.valor;
        }
    }

    getDescricaoContato($event) {
        if ($event.valido) {
            this.objParamsContato['descricao'] = $event.valor;
        }
    }

    definePlanoPrincipal(status, plano) {
        this.validaPlanoPrincipal();

        if (this.validaData(plano.bloqueio)) {
            plano.principal = false;
            this.toastr.error("Plano Bloqueado!");

        } else if (this.validaData(plano.validade)) {
            plano.principal = false;
            this.toastr.error("Plano Vencido!");

        } else if (!plano.ativo) {
            plano.principal = false;
            this.toastr.error("Plano Inativo!");
        } else {
            plano.principal = true;
        }

        this.servicePaciente.atualizarPacientePlanos(plano.id, { principal: status }).subscribe(
            () => {
                this.toastr.success("Status atualizado com sucesso");
                this.atualiza(plano, "Plano");
                this.refreshMolduras("Planos");
                this.disabledIndicador = true;
                this.refreshPlanos();
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    validaStatus(data, bloqueio) {
        if (bloqueio) {
            return false;
        } else if (data) {
            return moment(data, this.formatosDeDatas.dataFormato) > moment(moment(), this.formatosDeDatas.dataFormato);
        }

        return true;
    }

    validaData(data) {
        if (data) {
            return moment(moment().format(this.formatosDeDatas.dataFormato)).isBefore(moment(data).format(this.formatosDeDatas.dataFormato));
        } else {
            return false;
        }
    }

    dataValidade;
    getValidadeInstancia(instancia) {
        this.dataValidade = instancia;
    }

    refreshPlanos() {
        this.servicePaciente.getPacientePlanos({ pacienteId: this.pacienteId }).subscribe(
            (planos) => {
                this.paciente['planos'] = planos.dados || planos
                this.disabledIndicador = false
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        )
    }

    refreshParentescos(item, setObj) {
        this.serviceParentesco.getParentescoPaginado().subscribe(
            (parentesco) => {
                this.parentescos = parentesco.dados;
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
        if (setObj) {
            this.objParamsResponsavel['parentesco'] = { id: item.id };
        }
    }

    refreshOperadoras(item, setObj) {
        this.serviceOperadora.getOperadoraPaginado().subscribe(
            (operadora) => {
                this.operadoras = operadora.dados;
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
        if (setObj) {
            this.objParamsPlano['operadora'] = { id: item.id };
        }
    }

    modalElemPaciente;
    salvarParentesco(item) {
        this.modalElemPaciente = this.modalService.open(NgbdModalContent, { size: 'lg' });
        this.modalElemPaciente.componentInstance.modalHeader = ((item) ? 'Editar' : 'Salvar Novo') + ' Parentesco';
        this.modalElemPaciente.componentInstance.templateRefBody = this.bodyModalAdicionaParentesco;
        this.modalElemPaciente.componentInstance.templateBotoes = this.modalAdicionaParentescoBotoes;

        this.modalElemPaciente.result.then(
            (data) => this.instanciaBtnSearchParentesco.buscaTodos(),
            (reason) => this.instanciaBtnSearchParentesco.buscaTodos())

        this.novoParentesco = new NovoParentesco(item);
    }

    salvarOperadora(item) {
        this.modalElemPaciente = this.modalService.open(NgbdModalContent, { size: 'lg' });
        this.modalElemPaciente.componentInstance.modalHeader = ((item) ? 'Editar' : 'Salvar Nova') + ' Operadora';
        this.modalElemPaciente.componentInstance.templateRefBody = this.bodyModalAdicionaOperadora;
        this.modalElemPaciente.componentInstance.templateBotoes = this.modalAdicionaOperadoraBotoes;

        this.modalElemPaciente.result.then(
            (data) => this.instanciaBtnSearchOperadora.buscaTodos(),
            (reason) => this.instanciaBtnSearchOperadora.buscaTodos())

        this.novoOperadora = new NovoOperadora(item);
    }

    validaPlanoPrincipal() {
        let principal = this.paciente['planos'].filter((plano) => { return plano.principal });

        principal.forEach((plano) => {
            this.servicePaciente.atualizarPacientePlanos(plano.id, { principal: false }).subscribe(
                (planos) => {
                    console.log(planos)
                }, (error) => {
                    Servidor.verificaErro(error, this.toastr);
                }
            );
        });

        return principal && principal.length;
    }

    modalConfirmar;
    removerElementoPaciente(evento, tipo, id) {
        evento.stopPropagation();
        let metodo = "deletarPaciente" + tipo;

        this.modalConfirmar = this.modalService.open(NgbdModalContent);
        this.modalConfirmar.componentInstance.modalHeader = `${tipo}`;
        this.modalConfirmar.componentInstance.modalMensagem = `Tem certeza que deseja excluir esse registro`;
        this.modalConfirmar.componentInstance.modalAlert = true;

        this.modalConfirmar.componentInstance.retorno.subscribe(
            (retorno) => {
                if (retorno) {
                    this.servicePaciente[metodo](id).subscribe(
                        () => {
                            this.toastr.success(tipo + " excluidos com sucesso");
                            this.refreshMolduras(tipo);
                        }, (error) => {
                            Servidor.verificaErro(error, this.toastr);
                        }
                    );
                }
            }
        );
    }

    refreshMolduras(tipo) {
        let metodo = "getPaciente" + tipo;
        this.servicePaciente[metodo]({ pacienteId: this.paciente['id'] }).subscribe(
            (retorno) => {
                this.paciente[tipo.toLowerCase()] = retorno.dados;
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        )
    }

    abreModal(obj, labelObj) {
        this['objParams' + labelObj] = obj || new Object();
        this.buscaCep = true;

        if (!obj) {
            this['objParams' + labelObj] = this.validaObjModal(this['objParams' + labelObj], labelObj);
        }

        let cfgGlobal: any = Object.assign(NgbdModalContent.getCfgGlobal(), { size: 'lg' });

        this.activeModal = this.modalService.open(NgbdModalContent, cfgGlobal);
        this.activeModal.componentInstance.modalHeader = ((obj) ? 'Editar ' : 'Salvar Novo ') + labelObj;

        this.activeModal.componentInstance.templateRefBody = this['formulario' + labelObj + 'Body'];
        this.activeModal.componentInstance.templateBotoes = this['formulario' + labelObj + 'Botoes'];

        if (labelObj == 'Plano') {
            setTimeout(() => { this.renderer.selectRootElement('#CódigoCarteira').focus() }, 500);
        }
    }

    atualiza(objeto, tipo) {
        this.atualizaDados.emit({
            dados: objeto,
            retorno: tipo,
            paciente: this.paciente.nome,
        });
    }

    validaObjModal(obj, labelObj) {
        if (labelObj == 'Plano') {
            obj['operadora'] = new Object();
            obj['operadora']['id'] = 1;
        } else if (labelObj == 'Responsavel') {
            obj['parentesco'] = new Object();
        } else if (labelObj == 'Endereco') {
            obj['cidade'] = new Object();
        }

        return obj;
    }

    criarElementoPaciente(objParams, tipo, id) {
        let metodo = ((id) ? "atualizar" : "salvar") + "Paciente" + tipo;
        objParams['paciente'] = { id: this.paciente['id'] };
        objParams = this.validaObjPreSalvamento(objParams, tipo);

        if (!objParams) {
            return;
        }

        this.servicePaciente[metodo](id, objParams).subscribe(
            (retorno) => {
                this.toastr.success(tipo + " salvos com sucesso");
                this.validaAposSalvamento(tipo, retorno, objParams);
                if (tipo == 'Planos' && objParams.principal && objParams.ativo) {
                    this.definePlanoPrincipal(true, objParams);
                }
                this.refreshMolduras(tipo);
                this.activeModal.dismiss();
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        )
    }

    validaObjPreSalvamento(obj, tipo) {
        delete obj.beneficiario;
        delete obj.excluido;

        if (tipo == "Enderecos") {
            obj['estado'] = obj.cidade.estado
            delete obj.cidade.estado
        } else if (tipo == "Planos") {

            if (!obj.codigo && obj.operadora.id != 2 && obj.operadora.id != 391) {
                this.toastr.error("Obrigatório informar codigo da carteirinha");
                return false;
            }

            if (obj.validade) {
                obj.validade = moment(obj.validade, this.formatosDeDatas.dataHoraSegundoFormato).format(this.formatosDeDatas.dataFormato);
            }

            if (obj.bloqueio) {
                obj.bloqueio = moment(obj.bloqueio, this.formatosDeDatas.dataHoraSegundoFormato).format(this.formatosDeDatas.dataFormato);
            }

            let pacientePlanos

            this.servicePaciente.getPaciente({ id: obj.paciente.id }, false).subscribe(
                (planos) => {
                    pacientePlanos = planos.dados[0].planos;

                    if (pacientePlanos.length == 1) {
                        obj.principal = true;
                        this.definePlanoPrincipal(true, obj);
                    } else {
                        let definiPrincipal = true;

                        pacientePlanos.forEach(plano => {
                            if (plano.principal) {
                                definiPrincipal = false;
                            }
                        });

                        if (definiPrincipal) {
                            obj.principal = true;
                            this.definePlanoPrincipal(true, obj);
                        }
                    }
                }, (error) => {
                    Servidor.verificaErro(error, this.toastr);
                }
            );
        } else if (tipo == "Operadoras") {

        }

        return obj;
    }

    validaAposSalvamento(tipo, id, objParams) {
        if (tipo == "Planos") {
            let objemit = objParams;
            objemit['id'] = id;
            this.bParticular = false;
        }
    }

    stopPropagation(evento) {
        evento.stopPropagation();
    }

    planoDados(dados) {
        dados = dados.split(':');
        dados = (dados.length > 0) ? dados[1] : dados[0];
        dados = dados.split('ç');
        dados = dados[1].slice(0, 38).split('=');

        this.objParamsPlano['codigo'] = dados[0];
        this.objParamsPlano['operadora']['id'] = (dados[0].slice(0, 4) == '0021') ? 1 : 0;
        this.objParamsPlano['validade'] = moment(dados[1].slice(2, 6), "YYMM").endOf('month').format(this.formatosDeDatas.dataFormato);
    }

    instanciaLogAtendimento;
    getRefreshLogAtendimento(instancia) {
        this.instanciaLogAtendimento = instancia;
    }

    buscarProximasConsultasPaginado(evento = null) {
        this.paginaAtualHist = evento ? evento.paginaAtual : this.paginaAtualHist;
        this.itensPorPaginaHist = evento ? evento.itensPorPagina : this.itensPorPaginaHist;

        let objParamPaginacao = {
            pagina: this.paginaAtualHist,
            quantidade: this.itensPorPaginaHist
        }

        let request = {
            "paciente": {
                "id": this.paciente['id']
            },
            "ordernacao": "agendamento DESC, usuario.nome ASC",
            "ignoraRda": Sessao.validaPapelUsuario('WEBPEP:ADMINISTRATIVO VIVER BEM')
        }

        this.service.filtrar(request, objParamPaginacao).subscribe(
            (agendas) => {
                this.atendimentosPaciente = agendas.dados;
                this.qtdItensTotalHist = agendas.qtdItensTotal;
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    alterarStatusAgendamento() {

        if (this.acaoAgendamento == 'DESMARCADO' && (!this.motivoCancelamento && this.motivoCancelamento.trim() == '')) {
            this.toastr.warning('Informe um motivo para cancelar o agendamento');
            return;
        }

        let esse = this;
        let atendimentoRequest = {
            "status": this.acaoAgendamento,
            "observacao": this.motivoCancelamento
        };

        this.service.atualizar(this.agendamentoSelecionado.id, atendimentoRequest).subscribe(
            () => {
                this.modalAgendamento.close();
                this.toastr.success("Agendamento cancelado com sucesso");
                this.agendamentoSelecionado = undefined;
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    atendimentoSelecionado;
    abreLogAtendimento(atendimento) {

        this.atendimentoSelecionado = atendimento.id;

        setTimeout(() => {
            this.instanciaLogAtendimento.carregaMensagens();
        }, 1000);

        this.activeModal = this.modalService.open(NgbdModalContent, { size: 'lg' });
        this.activeModal.componentInstance.modalHeader = `Histórico Atendimento - ${(atendimento.paciente) ? atendimento.paciente.nome : ''} - ${atendimento.agendamento}`;

        this.activeModal.componentInstance.templateRefBody = this.bodyModalLogAtendimento;
        this.activeModal.componentInstance.templateBotoes = this.botoesModalLogAtendimento;
    }

    validaStatusDesmarcar(atendimento) {
        return (atendimento.status != 'ATENDIDO' && atendimento.status != 'DESMARCADO');
    }

    cancelarAtendimento(ev, agenda, acaoAgendamento = 'DESMARCADO') {
        ev.preventDefault();

        this.agendamentoSelecionado = agenda;
        this.acaoAgendamento = acaoAgendamento;
        this.fnAbreModalAlteraStatus(acaoAgendamento);

        ev.stopPropagation();
    }

    acaoAgendamento;
    motivoCancelamento;
    modalAgendamento;
    agendamentoSelecionado;
    fnAbreModalAlteraStatus(acaoAgendamento) {
        let esse = this;

        this.motivoCancelamento = '';

        this.modalAgendamento = this.modalService.open(NgbdModalContent, { size: 'lg' });
        this.modalAgendamento.componentInstance.modalHeader = 'Cancelar Agendamento';

        this.modalAgendamento.componentInstance.templateRefBody = this.alteraStatusAgendamentoModal;
        this.modalAgendamento.componentInstance.templateBotoes = this.botoesModalAlteraStatusAgendamento;

        this.modalAgendamento.result.then((data) => {
            esse.acaoAgendamento = null;
            this.buscarProximasConsultasPaginado({ paginaAtual: 1, itensPorPagina: 10 });
        }, (reason) => {
            esse.acaoAgendamento = null;
            this.buscarProximasConsultasPaginado({ paginaAtual: 1, itensPorPagina: 10 });
        });
    }

    toString(string) {
        return string.toString();
    }

    print(): void {
        let printContents, popupWin;
        printContents = document.getElementById('print-qrcode').innerHTML;
        popupWin = window.open('', '_blank');
        popupWin.document.open();
        popupWin.document.write(`
            <html>
                <style type="text/css" media="print">
                    @page {
                        font-size:8px !important;
                        size:landscape !important;
                        margin:0mm !important;
                        background-color: rgba(255,255,255,.5) !important;
                    }
                    div {
                        display:block !important;
                        background-color: rgba(255,255,255,.1) !important;
                    }
                </style>
                <body onload="window.print();window.close()">${printContents}</body>
            </html>
        `);
        popupWin.document.close();
    }
}

class NovoParentesco {
    item = new Object();

    constructor(obj) {
        if (!obj) {
            return;
        }

        this.item["id"] = obj.id;
        this.item["nome"] = obj.nome;
    }

    setItem(item) {
        this.item = item;
        this.fecharModal(false);
    }

    salvarParentesco(obj, serviceParentesco) {
        if (this.item["id"]) {
            serviceParentesco.put(this.item["id"], this.item).subscribe(
                parentesco => this.fecharModal(serviceParentesco),
                err => console.error("Houve um erro ao salvar")
            );
        } else {
            serviceParentesco.post(this.item).subscribe(
                (id) => {
                    this.item["id"] = id;
                    this.fecharModal(serviceParentesco)
                },
                err => console.error("Houve um erro ao salvar")
            );
        }
    }

    fecharModal(serviceParentesco) {
        let element: HTMLElement = document.querySelectorAll(".close")[document.querySelectorAll(".close").length - 1] as HTMLElement;
        element.click();
    }
}

class NovoOperadora {
    item = new Object();

    constructor(obj) {
        if (!obj) {
            return;
        }

        this.item["id"] = obj.id;
        this.item["nome"] = obj.nome;
        this.item["codigoAns"] = obj.codigoAns;
    }

    setItem(item) {
        this.item = item;
        this.fecharModal(false);
    }

    salvarOperadora(obj, serviceOperadora) {
        let esse = this;
        if (this.item["id"]) {
            serviceOperadora.put(this.item["id"], this.item).subscribe(
                operadora => this.fecharModal(serviceOperadora),
                err => console.error("Houve um erro ao salvar")
            )
        } else {
            serviceOperadora.post(this.item).subscribe(
                (id) => {
                    this.item["id"] = id;
                    this.fecharModal(serviceOperadora)
                },
                err => console.error("Houve um erro ao salvar")
            )
        }
    }

    fecharModal(serviceOperadora) {
        let element: HTMLElement = document.querySelectorAll(".close")[document.querySelectorAll(".close").length - 1] as HTMLElement;
        element.click();
    }
}