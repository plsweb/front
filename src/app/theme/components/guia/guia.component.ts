import { ActivatedRoute, Router } from '@angular/router';
import { Component, ViewChild, TemplateRef, OnInit, QueryList, Input } from '@angular/core';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';

import { Servidor, Sessao, GuiaService, ItemGuiaService, DicionarioTissService, GuiaLogService, PreExistenciaService, ProcedimentoService, GuiaAuditoriaService, PacienteService, PacienteDocumentoService } from 'app/services';

import { NgbdModalContent, FormatosData } from 'app/theme/components';

import * as moment from 'moment';
moment.locale('pt-br');

@Component({
    selector: 'guia',
    templateUrl: './guia.component.html',
    styleUrls: ['./guia.component.scss']
})

export class GuiaComponent implements OnInit {

    @Input() paramId;
    @Input() botoes = true;
    @Input() editar = true;
    @Input() historico = true;
    @Input() chat = true;

    id;
    guia;
    objParamsItemGuia = new Object();

    mensagensTISS;
    guiaAuditoria;

    mensagem = {};
    mensagens = [];
    qtdItensTotal;
    colunasTabela;

    preexistencias;
    preexistenciasFiltrados;
    paginaAtualPreExistencia = 1;
    itensPorPagina = 10;

    documento;
    paciente;

    arquivo;
    chatMsg;
    chatMsgHistorico;
    arquivoAnexado = '';
    nomeArquivo = '';

    modalInstancia;
    guiaLogStatusSelecionado;
    guiaLogStatus = [];
    mediarObs = '';
    formatosDeDatas = new FormatosData();

    momentjs = moment;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private toastr: ToastrService,
        private modalService: NgbModal,
        private guiaService: GuiaService,
        private guiaLogService: GuiaLogService,
        private serviceItemGuia: ItemGuiaService,
        private servicePaciente: PacienteService,
        private serviceTISS: DicionarioTissService,
        private serviceProcedimento: ProcedimentoService,
        private guiaAuditoriaService: GuiaAuditoriaService,
        private preExistenciaService: PreExistenciaService,
        private pacienteDocumentoService: PacienteDocumentoService,
    ) {
        this.colunasTabela = [
            { 'titulo': 'Data', 'chave': 'data' },
            { 'titulo': 'Mensagem', 'chave': 'mensagem' },
            { 'titulo': 'Usuário', 'chave': 'usuario' }
        ];

        this.guiaLogService.getStatus({ pagina: 1, quantidade: 30 }).subscribe(
            (retorno) => {
                this.guiaLogStatus = retorno.dados;
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    ngOnInit() {
        this.refreshItens(true);
    }

    atualizaDados(obj = {}) {
        // this.mensagens = [
        //     { usuario: "", data: "10/10/2017", mensagem: "" }
        // ]
    }

    uploadArquivo(arquivos) {

        var reader: any = new FileReader();
        reader.readAsBinaryString(arquivos[0]);
        this.nomeArquivo = arquivos[0].name;

        reader.onload = () => {
            this.arquivo = btoa(reader.result);
        };
        reader.onerror = () => {
            console.log('Erro ao carregar arquivo');
        };
    }

    valorProcedimentoSelecionado;
    idProcedimento;
    setNovoProcedimento(evento) {
        if (evento) {
            this.valorProcedimentoSelecionado = evento.descricao;
            this.objParamsItemGuia['procedimento'] = { id: evento.id };
            this.idProcedimento = evento.id;
        } else {
            this.objParamsItemGuia['procedimento'] = undefined;
            this.idProcedimento = '';
            this.valorProcedimentoSelecionado = '';
        }
    }

    objProcedimentos = [];
    fnCfgProcedimentoRemote(term) {
        this.serviceProcedimento.procedimentoPaginadoFiltro(1, 10, term).subscribe(
            (retorno) => {
                this.objProcedimentos = retorno.dados || retorno;
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    buscaProcedimentoId(id) {
        this.serviceProcedimento.getProcedimentosCodigo(id).subscribe(
            (retorno) => {
                if (retorno) {
                    this.valorProcedimentoSelecionado = retorno.descricao;
                    this.objParamsItemGuia['procedimento'] = { id: retorno.id };
                    this.idProcedimento = retorno.id;
                } else {
                    this.objParamsItemGuia['procedimento'] = undefined;
                    this.idProcedimento = '';
                    this.valorProcedimentoSelecionado = '';
                }
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    buscaPreExistenciasPaginado(evento) {

        this.paginaAtualPreExistencia = evento ? evento.paginaAtual : this.paginaAtualPreExistencia;
        let request = {
            pagina: this.paginaAtualPreExistencia,
            quantidade: this.itensPorPagina,
            beneficiarioId: this.guia.beneficiario.id
        };

        this.preExistenciaService.get(request).subscribe(
            (preexistencias) => {
                this.preexistenciasFiltrados = preexistencias.dados;
                this.preexistencias = preexistencias.dados;
                this.qtdItensTotal = preexistencias.qtdItensTotal;
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    valorMensagemSelecionado

    objMensagemTISS = [];
    fnCfgMensagemRemote(term) {
        this.serviceTISS.getMensagemTISS({ pagina: 1, quantidade: 10, like: term }).subscribe(
            (mensagens) => {
                this.objMensagemTISS = mensagens.dados;
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }
    setMensagem(evento, item, pos) {
        if (evento.descricao) {
            if (item) {
                this.guia.itens[pos].mensagem = evento.descricao;
            } else {
                this.valorMensagemSelecionado = evento.descricao
            }
        }
    }

    setMsgTiss(pos) {
        return (this.guia.itens[pos].mensagem) ? this.guia.itens[pos].mensagem : ''
    }

    getValor(evento, item, pos) {
        this.guia.itens[pos].mensagem = evento;
        console.log(item);

        if (this.itensAlterados[item.id]) {
            this.itensAlterados[item.id] = item;
        } else {
            this.itensAlterados[item.id] = new Object();
            this.itensAlterados[item.id] = item;
        }

    }

    formataDataInclusao(guia, bReduzNome = false) {

        if (!guia.beneficiario || !guia.beneficiario.inclusao) {
            return '';
        }

        let valor = guia.beneficiario.tempoContrato || '';

        let sValor = `${guia.beneficiario.inclusao}, ${valor}`;

        if (bReduzNome && sValor.length > 28) {
            sValor = `${sValor.substr(0, 28)}...`;
        }

        return sValor;
    }

    formataBeneficiario(guia) {
        return `${guia.beneficiario.codigo} - ${guia.beneficiario.nome}, ${guia.beneficiario.nascimento} (${guia.beneficiario.idade})`;
    }

    formataPrestador(guia) {
        return `${guia.prestador.codigo} - ${guia.prestador.nome}`;
    }

    formataGuia(guia) {
        if (guia && guia.ano && guia.mes && guia.numero) {
            return `${guia.ano}.${guia.mes}.${guia.numero}`;
        }

        return '';
    }

    formataStatus(guia) {
        return guia ? guia.status : '';
    }

    criarItem(item) {
        if (!item) {
            this.objParamsItemGuia['auditoria'] = this.guiaAuditoria;
            this.objParamsItemGuia['guia'] = { id: this.guia.id };
            this.objParamsItemGuia['sequencia'] = "025";

            this.serviceItemGuia.postGuiaItem(this.objParamsItemGuia).subscribe(
                () => {
                    this.toastr.success("Item da Guia criado com sucesso");
                    this.refreshItens(true);
                }, (error) => {
                    Servidor.verificaErro(error, this.toastr);
                    this.refreshItens(false);
                }
            )

        } else {
            this.objParamsItemGuia = item;

            delete this.objParamsItemGuia['status'];
            delete this.objParamsItemGuia['procedimento'];

            this.objParamsItemGuia['guia'] = { id: this.guia.id };
            this.objParamsItemGuia['sequencia'] = "025";

            this.serviceItemGuia.putGuiaItem(item.id, this.objParamsItemGuia).subscribe(
                () => {
                    this.toastr.success("Item da Guia editado com sucesso");
                    this.refreshItens(true);
                }, (error) => {
                    Servidor.verificaErro(error, this.toastr);
                    this.refreshItens(false);
                }
            )
        }
    }

    itensAlterados = new Object();
    atualizaGlosa(evento, item, pos) {

        if (!evento) {
            if (this.itensAlterados[item.id]) {
                this.itensAlterados[item.id] = new Object();
            } else {
                this.itensAlterados[item.id] = item;
                this.itensAlterados[item.id]['qtdMax'] = item['quantidadeSolicitada']
                this.guia.itens[pos]['quantidadeAutorizada'] = 0;
                this.itensAlterados[item.id]['quantidadeAutorizada'] = 0;
                this.guia.itens[pos]['naoAprovada'] = false;
            }

            this.guia.itens[pos]['naoAprovada'] = false;
        } else {
            if (this.itensAlterados[item.id]) {
                delete this.itensAlterados[item.id];
                this.guia.itens[pos]['naoAprovada'] = undefined;
            }

            this.refreshItens(true);
        }

        // if( !evento ){
        //     let objGlosa = { "quantidadeAutorizada" : 0 };
        //     this.serviceItemGuia.putGuiaItem( item.id, objGlosa ).subscribe(
        //         () => {
        //             this.toastr.success("Item da Guia editado com sucesso");
        //             item['glosa'] = true;
        //             this.refreshItens(true);
        //         }, (error) => {
        //             Servidor.verificaErro(error, this.toastr);
        //             this.refreshItens(false);
        //         }
        //     );
        // }
    }

    refreshItens(ok) {
        this.objParamsItemGuia = new Object();
        if (ok) {
            // this.guiaService.getGuiaPorId(this.id).subscribe(
            //     (guia) => {
            //         this.guia = guia[0];
            //         this.setObjItensGuia();
            //         this.buscaPreExistenciasPaginado(null);
            //     }, (error) => {
            //         Servidor.verificaErro(error, this.toastr);
            //     }
            // );

            this.guiaService.getGuiaPorId(this.paramId).subscribe(
                (guia) => {
                    if (guia && guia.length) {
                        this.guia = guia[0];
                        this.id = parseInt(guia[0].id);
                        this.refreshMensagens();
                        this.setObjItensGuia();
                        this.buscaPreExistenciasPaginado(null);
                    }
                }, (erro) => {
                    Servidor.verificaErro(erro, this.toastr);

                    if (erro.status = 412) {
                        // MELHORAR ESSE CODIGO, CASO HAJA UMA CONVENÇÃO DE MASCARA PARA IMPRESSO E/OU ID DE GUIA
                        this.guiaService.getGuiaPorImpresso(this.paramId).subscribe(
                            (guia) => {
                                if (guia && guia.id) {
                                    this.guia = guia;
                                    this.id = guia.id;
                                    this.refreshMensagens();
                                    this.setObjItensGuia();
                                    this.buscaPreExistenciasPaginado(null);
                                }
                            },
                            (erro) => {
                                Servidor.verificaErro(erro, this.toastr);
                            }
                        );
                    }
                }
            );
        }
    }

    classesItens = [];
    setObjItensGuia() {
        this.guia.itens.forEach(
            (item) => {
                if (this.classesItens.indexOf(item.procedimento.classe.descricao) < 0) {
                    this.classesItens.push(item.procedimento.classe.descricao);
                }
            }
        )

    }

    retornaItensGuiaClasse(classe) {

        let retornoArray = [];
        if (this.guia.itens && this.guia.itens.length) {
            this.guia.itens.forEach(
                (item, index) => {
                    if (item.procedimento.classe && item.procedimento.classe.descricao == classe) {
                        item['posicao'] = index;
                        retornoArray.push(item);
                    }
                }
            )

            return retornoArray
        }

        return retornoArray;
    }

    bloqueiaMsg(id) {
        return !(this.itensAlterados[id]);
    }

    formataPlano(guia) {
        if (guia && guia.beneficiario && guia.beneficiario.plano && guia.beneficiario.plano.length > 15) {
            return guia && guia.beneficiario ? (`${guia.beneficiario.plano.substr(0, 15)}...`) : '';
        }
        return guia && guia.beneficiario ? guia.beneficiario.plano.substr(0, 15) : '';
    }


    setQuantidadeSolicitada(evento, idItem, pos, item) {
        if (evento.valor) {
            if (this.itensAlterados[idItem]) {

                if (evento.valor <= this.itensAlterados[idItem]['qtdMax']) {
                    this.itensAlterados[idItem]['quantidadeAutorizada'] = evento.valor;
                } else {
                    this.guia.itens[pos]['quantidadeAutorizada'] = this.itensAlterados[idItem]['qtdMax'];
                    this.toastr.error("Quantidade nao permitida");
                }
            } else {
                this.itensAlterados[idItem] = new Object();
                this.itensAlterados[idItem] = item;
                this.itensAlterados[idItem]['qtdMax'] = item['quantidadeSolicitada']
                this.itensAlterados[idItem]['quantidadeAutorizada'] = evento.valor;
                this.guia.itens[pos]['quantidadeAutorizada'] = evento.valor;
            }
        }
    }

    refresh;
    getRefresh(instancia) {
        this.refresh = instancia;
    }

    refreshHistorico;
    getRefreshHistorico(instancia) {
        this.refreshHistorico = instancia;
    }

    enviaMensagem(chat) {
        let request = {
            "descricaoStr": (this.chatMsg || this.chatMsgHistorico) + ((this.arquivo) ? ` FINALIZAÇÃO DE ANEXO: ${this.nomeArquivo}` : ''),
            "guia": {
                "id": this.guia.id
            },
            "chat": chat,
            "tipo": 'OPERADORA',
            "nome": ((this.arquivo) ? this.nomeArquivo.trim() : undefined),
            "arquivo": ((this.arquivo) ? this.arquivo : undefined)
        };

        this.guiaLogService.upload(request).subscribe(
            () => {
                this.toastr.success('Mensagem enviada com sucesso');
                if (chat) {
                    this.refresh.carregaMensagens();
                } else {
                    this.refreshHistorico.carregaMensagens();
                }
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );


        this.nomeArquivo = "";
        this.arquivo = undefined;
        this.chatMsg = undefined;
        this.chatMsgHistorico = undefined;

        //  Chama api para mandar msg
    }

    refreshMensagens() {
        setTimeout(() => {
            this.refresh.carregaMensagens();
            this.refreshHistorico.carregaMensagens();
        }, 500);
    }

    mostraDesc(ev, item, tipo) {
        if (item.procedimento[tipo]) {

            $(ev.target).find('.desc-item').show();
            $(ev.target).find('.desc-item').css({
                "top": ev.clientY + 20,
                "left": ev.clientX - 200,
                "max-width": 200,
                "display": "block"
            });

        }
    }

    escondeContextMenu() {
        $('.desc-item').hide();
    }

    submit() {

        let arrayItens = [];

        let validamsg = false;
        Object.keys(this.itensAlterados).forEach(
            (idItem) => {
                let obj = {
                    'id': idItem,
                    'quantidadeAutorizada': parseInt(this.itensAlterados[idItem]['quantidadeAutorizada']),
                    'mensagem': this.itensAlterados[idItem]['mensagem']
                };

                if (!obj.mensagem) {
                    validamsg = true;
                }
                arrayItens.push(obj);
            }
        )

        if (validamsg) {
            this.toastr.error("Item nao aprovado sem mensagem TISS");
            return
        }

        console.log({ itens: arrayItens });

        if (arrayItens && !arrayItens.length) {
            this.abreModalAuditarTodosItens();
            return;
        }

        let request = { itens: arrayItens };
        this.finalizaGuia(request);
    }


    abreModalAuditarTodosItens() {
        this.modalInstancia = this.modalService.open(NgbdModalContent, { size: 'lg' });
        // this.modalInstancia.componentInstance.modalHeader = 'Auditar Todos Itens';
        this.modalInstancia.componentInstance.templateRefBody = this.bodyAuditarTodosItens;
        this.modalInstancia.componentInstance.templateBotoes = this.botoesAuditarTodosItens;
    }

    mensagemUnica = '';
    auditaTodos() {
        let arrayItens = []
        this.guia.itens.forEach(
            (item, index) => {
                if (this.validaClasseCheckbox(item) == 'auditoria') {
                    let obj = {
                        'id': item.id,
                        'quantidadeAutorizada': item.quantidadeAutorizada,
                        'mensagem': this.mensagemUnica
                    };
                    arrayItens.push(obj);
                }
            }
        )

        let request = { itens: arrayItens };
        this.finalizaGuia(request);
    }

    finalizaGuia(request) {
        let nulos = request.itens.filter((item) => {
            return item.quantidadeAutorizada == null || item.quantidadeAutorizada == undefined;
        });

        if (nulos.length) {
            this.toastr.warning(`Houve um erro com a quantidade do item ${nulos[0].id}`);
            return;
        }

        this.guiaService.finalizaGuia(this.guia.id, request).subscribe(
            () => {
                this.toastr.success("Guia Finalizada");

                (this.modalInstancia) ? this.modalInstancia.close() : null;

                setTimeout(() => {
                    this.router.navigate([`/${Sessao.getModulo()}/previa`]);
                }, 1000);

            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
                this.refreshItens(true);
                this.itensAlterados = new Object();
            }
        );
    }

    idAbaAberta;
    abrirAbaItem(idAba) {
        if (this.idAbaAberta == idAba) {
            this.idAbaAberta = "";
        } else {
            this.idAbaAberta = idAba;
        }
    }

    @ViewChild("bodyModalMediar", { read: TemplateRef }) bodyModalMediar: QueryList<TemplateRef<any>>;
    @ViewChild("templateBotoesMediar", { read: TemplateRef }) templateBotoesMediar: QueryList<TemplateRef<any>>;

    @ViewChild("bodyModalParecer", { read: TemplateRef }) bodyModalParecer: QueryList<TemplateRef<any>>;
    @ViewChild("templateBotoesParecer", { read: TemplateRef }) templateBotoesParecer: QueryList<TemplateRef<any>>;

    @ViewChild("bodyAuditarTodosItens", { read: TemplateRef }) bodyAuditarTodosItens: QueryList<TemplateRef<any>>;
    @ViewChild("botoesAuditarTodosItens", { read: TemplateRef }) botoesAuditarTodosItens: QueryList<TemplateRef<any>>;

    @ViewChild("bodyHistoricoExames", { read: TemplateRef }) bodyHistoricoExames: QueryList<TemplateRef<any>>;

    mediar() {
        this.guiaLogStatusSelecionado = undefined;
        this.mediarObs = '';

        this.modalInstancia = this.modalService.open(NgbdModalContent, { size: 'lg' });
        this.modalInstancia.componentInstance.modalHeader = 'Delegar';
        this.modalInstancia.componentInstance.templateRefBody = this.bodyModalMediar;
        this.modalInstancia.componentInstance.templateBotoes = this.templateBotoesMediar;
    }

    parecer() {
        this.servicePaciente.getPaciente({ carteirinha: this.guia.beneficiario.codigo }).subscribe(
            (paciente) => {
                this.paciente = paciente.dados[0];

                let agora = new Date();
                let novoFormulario = {
                    paciente: { id: this.paciente['id'] },
                    formulario: { id: 202 },//TODO Valor Fixo, alterar depois
                    data: moment().format(this.formatosDeDatas.dataHoraSegundoFormato)
                };

                this.pacienteDocumentoService.inserir(novoFormulario).subscribe(
                    (id) => {
                        if (id) {
                            this.pacienteDocumentoService.getId({ 'id': id }).subscribe(
                                (documento) => {
                                    this.documento = documento.dados[0];
                                }, (error) => {
                                    Servidor.verificaErro(error, this.toastr);
                                }
                            );
                        }
                    }, (error) => {
                        Servidor.verificaErro(error, this.toastr);
                    }
                );
            }
        );

        this.guiaLogStatusSelecionado = undefined;
        this.mediarObs = '';

        this.modalInstancia = this.modalService.open(NgbdModalContent, { size: 'lg' });
        this.modalInstancia.componentInstance.modalHeader = 'Parecer';
        this.modalInstancia.componentInstance.templateRefBody = this.bodyModalParecer;
        this.modalInstancia.componentInstance.templateBotoes = this.templateBotoesParecer;
    }

    editando;
    alteraModelo(modelo, textoModelo) {
        this.pacienteDocumentoService.atualizar(modelo.id, { modelo: textoModelo }).subscribe(
            () => {
                this.documento.modelo = textoModelo;
                this.toastr.success("Modelo foi atualizado com sucesso");
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    imprimirDocumento(id) {
        window.open(this.pacienteDocumentoService.modeloPdf(id), "_blank");
    }

    validaMediar() {
        if (!this.mediarObs || this.mediarObs == '') {
            this.toastr.warning('Favor informe uma observação');
            return false;
        }

        if (!this.guiaLogStatusSelecionado) {
            this.toastr.warning('Favor informe um Status');
            return false;
        }

        return true;
    }

    salvarHistorico() {
        if (!this.validaMediar()) {
            return;
        }

        let request = {
            "chat": false,
            "guia": { id: this.guia.id },
            "descricaoStr": this.mediarObs,
            "status": { id: this.guiaLogStatusSelecionado }
        };

        this.guiaLogService.upload(request).subscribe(
            () => {
                this.toastr.success('Delegado com sucesso');
                this.refreshHistorico.carregaMensagens();

                this.modalInstancia.close();
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    validaRacDut(item) {
        if (item) {
            if (item.procedimento.altoCusto || item.procedimento.rac || item.procedimento.dut) {
                return true;
            }
        }

        return false;
    }

    validaItemCritica(critica) {
        let criticastr = critica.descricao;
        let retorno = false;

        if (criticastr) {
            let regex = /CARENCIA|CARÊNCIA/i;
            retorno = ((critica.descricao.match(regex)) && (critica.descricao.match(regex)).length);
        }

        return retorno;
    }

    paginaAtualGuiaHistorico = 1;
    qtdItensTotalGuiaHistorico = 0;
    objFiltroGuias = new Object();
    guiaHistorico = [];
    visualizarHistorico(evento, idProcedimento) {
        let request = {
            pagina: (evento ? evento.paginaAtual : this.paginaAtualGuiaHistorico),
            quantidade: this.itensPorPagina,
            procedimentoCodigo: idProcedimento,
            carteirinha: this.guia.beneficiario.codigo
        };

        this.guiaAuditoriaService.getFiltroGuia(request).subscribe(
            (retorno) => {
                this.guiaHistorico = (request['pagina'] == 1) ? retorno.dados : this.guiaHistorico.concat([], retorno.dados);
                this.guiaHistorico = this.validaItensHistorico(this.guiaHistorico);
                this.paginaAtualGuiaHistorico = retorno.paginaAtual;
                this.qtdItensTotalGuiaHistorico = retorno.qtdItensTotal;

                if (!this.guiaHistorico.length) {
                    this.toastr.warning("Procedimento sem histórico");
                    return;
                }

                this.modalInstancia = this.modalService.open(NgbdModalContent, { size: 'lg' });
                this.modalInstancia.componentInstance.modalHeader = 'Histórico do Procedimento';
                this.modalInstancia.componentInstance.templateRefBody = this.bodyHistoricoExames;
                this.modalInstancia.componentInstance.custom_lg_modal = true;
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    validaItensHistorico(guias) {
        return guias.filter(
            (guia) => {
                return guia.impresso != this.guia.impresso;
            }
        )
    }

    idGuiaAberto;
    abrirFormulario(id) {
        if (this.idGuiaAberto == id) {
            this.idGuiaAberto = undefined;
            return;
        }

        this.idGuiaAberto = id;
    }

    validaItemOrigem(origem) {
        return (origem && origem.indexOf("BQV") >= 0);
    }

    validaClasse(status) {
        switch (status) {
            case 'Autorizada Parcialmente':
                return 'amarelo';
            case 'Não Autorizada':
                return 'cinza';
            case 'Autorizada':
                return 'verde';
            case 'Aguardando finalização de atendimento':
                return 'amarelo';
            case 'Aguardando Liq. Titulo a Receber':
                return 'amarelo';
            case 'Deletado':
                return 'cinza';
            default:
                return 'cinza';
        }
    }

    validaClasseCheckbox(item) {
        let classe;
        if (!item.auditoria) {
            if (item.status == "1") {
                classe = "aprovado";
            } else {
                classe = "negado";
            }
        } else {
            classe = "auditoria";
        }

        return classe;
    }

    direcionaBeneficiario(guia) {
        this.router.navigate([`/${Sessao.getModulo()}/beneficiario/formulario/${guia.beneficiario.codigo}`]);
    }

    voltar() {
        // this.router.navigate([`/${Sessao.getModulo()}/previa`]);
        window.history.go(-1);
    }
}