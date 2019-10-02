import { Router } from '@angular/router';
import { Component, OnInit, ViewChild, TemplateRef, QueryList } from '@angular/core';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { GlobalState } from 'app/global.state';

import { Sessao, Servidor, TabelaApi, EnumApi, RelatorioService, RelatorioFiltroService, EspecialidadeService, LocalAtendimentoService } from 'app/services';

import { Relatorios } from '../relatorios.component';
import { NgbdModalContent } from 'app/theme/components';
import { ExcelService } from 'app/theme/services';

import * as moment from 'moment';
moment.locale('pt-br');

@Component({
    selector: 'listaRelatorios',
    templateUrl: './listaRelatorios.html',
    styleUrls: ['./listaRelatorios.scss'],
    providers: [EspecialidadeService, Relatorios]
})
export class ListaRelatorios implements OnInit {
    static ultimaAtualizacao: Date;

    enums;
    atual;
    tabelaApiResposta;
    variaveisDeAmbiente = {};
    unidadesAtendimento = [];
    sessao = Sessao;

    constructor(
        private router: Router,
        private enumApi: EnumApi,
        private _state: GlobalState,
        private toastr: ToastrService,
        private relatorio: Relatorios,
        private modalService: NgbModal,
        private excelService: ExcelService,
        private serviceTabelaApi: TabelaApi,
        private relatorioService: RelatorioService,
        private serviceEspecialidade: EspecialidadeService,
        private relatorioFiltroService: RelatorioFiltroService,
        private localAtendimentoService: LocalAtendimentoService,
    ) {
        this.excelService = excelService;
    }

    ngOnInit() {
        this._state.notifyDataChanged('menu.isCollapsed', true);

        this.variaveisDeAmbiente['tabela'] = {
            qtdItensTotal: 0,
            itensPorPagina: 25,
            paginaAtual: 1
        };

        this.unidadesAtendimento = Sessao.getVariaveisAmbiente('unidadesAtendimento');

        this.enumApi.get().subscribe(
            (retornoEnums) => {
                let enums = retornoEnums.dados || retornoEnums;

                this.serviceTabelaApi.get().subscribe(
                    (retornoApis) => {
                        this.relatorio.iniciaTabelasDisponiveis(retornoApis, enums);
                    }, (error) => {
                        Servidor.verificaErro(error, this.toastr);
                    }
                );
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );

        // this.variaveisDeAmbiente['modoExtracao'] = (Sessao.getPreferenciasUsuario()['modoExtracao']) ? Sessao.getPreferenciasUsuario()['modoExtracao'] : false;
        this.variaveisDeAmbiente['modoExtracao'] = false;
    }


    //  #############################################
    //               Filtros Salvos
    //  #############################################
    modalInstancia;
    relatorioFiltros;
    @ViewChild("bodyModalExcluirFiltroSalvo", { read: TemplateRef }) bodyModalExcluirFiltroSalvo: QueryList<TemplateRef<any>>;
    @ViewChild("templateBotoesModalExcluirFiltroSalvo", { read: TemplateRef }) templateBotoesModalExcluirFiltroSalvo: QueryList<TemplateRef<any>>;
    @ViewChild("bodyModalSalvarFiltroSalvo", { read: TemplateRef }) bodyModalSalvarFiltroSalvo: QueryList<TemplateRef<any>>;
    @ViewChild("templateBotoesModalSalvarFiltroSalvo", { read: TemplateRef }) templateBotoesModalSalvarFiltroSalvo: QueryList<TemplateRef<any>>;

    inicializaRelatorioFiltros(evento = null, bIniciaPaginacao = false) {

        if (bIniciaPaginacao) {
            this.relatorioFiltros = [];
        }

        let request = {
            pagina: this.variaveisDeAmbiente['tabela'].paginaAtual,
            quantidade: this.variaveisDeAmbiente['tabela'].itensPorPagina
        };

        if (this.variaveisDeAmbiente['filtro']) {
            Object.assign(request, this.variaveisDeAmbiente['filtro']);
        }

        this.relatorioFiltroService.get(request).subscribe(
            (resposta) => {
                this.variaveisDeAmbiente['tabela'] = {
                    qtdItensTotal: resposta['qtdItensTotal'],
                    itensPorPagina: 25,
                    paginaAtual: (evento) ? evento.paginaAtual : 2
                };

                let relatorios = resposta.dados.map((dado) => {
                    dado.json = JSON.parse(dado.json);
                    return dado;
                });

                if (evento) {
                    this.relatorioFiltros = this.relatorioFiltros.concat([], relatorios);
                } else {
                    this.relatorioFiltros = relatorios;
                }
                // this.cdr.markForCheck();
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    pesquisar(texto) {
        this.objFiltroRelatorios['like'] = texto;
        this.filtrarRelatorios();
    }

    objFiltroRelatorios = new Object();
    filtrarRelatorios(params = {}) {

        this.variaveisDeAmbiente['tabela'].paginaAtual = 1
        this.variaveisDeAmbiente['tabela'].itensPorPagina = 25
        this.variaveisDeAmbiente['filtro'] = this.objFiltroRelatorios;

        this.objFiltroRelatorios = this.validaFiltrosVazios(this.objFiltroRelatorios);

        this.inicializaRelatorioFiltros();
    }

    limparFiltros() {
        this.variaveisDeAmbiente['tabela'].paginaAtual = 1
        this.variaveisDeAmbiente['tabela'].itensPorPagina = 25
        this.objFiltroRelatorios = new Object();
        this.variaveisDeAmbiente['filtro'] = undefined;
        this.especialidadeSelecionada = ''
        this.inicializaRelatorioFiltros();
    }

    aplicarRelatorioFiltroSalvo(relatorioFiltro = undefined) {
        if (this.variaveisDeAmbiente['modoExtracao']) {
            return;
        }

        let sId = relatorioFiltro ? relatorioFiltro.id : 'novo';
        this.router.navigate([`/${Sessao.getModulo()}/relatorios/${sId}`]);
    }

    modificaTabelaRelatorios() {
        Sessao.setPreferenciasUsuario('modoExtracao', !this.variaveisDeAmbiente['modoExtracao']);
        this.variaveisDeAmbiente['modoExtracao'] = !this.variaveisDeAmbiente['modoExtracao']
    }

    validaEstado(relatorioFiltro) {
        let objExtracao = Sessao.getPreferenciasUsuario()['objExtracao'];

        return (objExtracao) ? objExtracao[relatorioFiltro.id] : false;
    }

    setExtracaoRelatorio(extrair, relatorioFiltro) {
        let objExtracao = Sessao.getPreferenciasUsuario()['objExtracao'];

        if (objExtracao && Object.keys(objExtracao) && Object.keys(objExtracao).length) {

            if (extrair) {

                let obj = this.iniciaPosicaoRelatorio(relatorioFiltro)

                objExtracao = Object.assign(objExtracao, obj);

            } else {
                delete objExtracao[relatorioFiltro.id]
            }

            Sessao.setPreferenciasUsuario('objExtracao', objExtracao);

        } else {

            if (extrair) {
                let obj = this.iniciaPosicaoRelatorio(relatorioFiltro)

                Sessao.setPreferenciasUsuario('objExtracao', obj);
            }
        }

        // this.cdr.markForCheck();

    }

    validaEstadoFiltro(idRelatorio, filtro, pos = null) {
        let objExtracao = Sessao.getPreferenciasUsuario()['objExtracao'];

        return objExtracao && objExtracao[idRelatorio] && objExtracao[idRelatorio]['filtros'] && objExtracao[idRelatorio]['filtros'][pos];
    }

    setExtracaoRelatorioFiltro(selecionou, idRelatorio, filtro, pos = null) {
        let objExtracao = Sessao.getPreferenciasUsuario()['objExtracao'];

        if (objExtracao && objExtracao[idRelatorio]) {

            let objFiltroRelatorio = objExtracao[idRelatorio];

            if (selecionou) {

                if (objFiltroRelatorio && objFiltroRelatorio['filtros']) {

                    if (objFiltroRelatorio['filtros'][pos]) {
                        objFiltroRelatorio['filtros'][pos] = filtro;
                    } else {
                        objFiltroRelatorio['filtros'][pos] = new Object();
                        objFiltroRelatorio['filtros'][pos] = filtro;
                    }

                } else {
                    objFiltroRelatorio['filtros'] = new Object();
                    objFiltroRelatorio['filtros'][pos] = new Object()
                    objFiltroRelatorio['filtros'][pos] = filtro;
                }

            } else {

                if (objFiltroRelatorio && objFiltroRelatorio['filtros'] && objFiltroRelatorio['filtros'][pos]) {
                    delete objFiltroRelatorio['filtros'][pos]
                } else {

                }
            }

            objExtracao[idRelatorio] = objFiltroRelatorio;


        } else {
            console.warn("Caso nao tenha selecionado, seleciona automaticamente o relatorio para o usuario");

            // objExtracao[idRelatorio] = objFiltroRelatorio;
        }

        Sessao.setPreferenciasUsuario('objExtracao', objExtracao);
        // this.cdr.markForCheck();

    }

    valorTituloExtracao(idRelatorio, filtro, pos) {

        let objExtracao = Sessao.getPreferenciasUsuario()['objExtracao'];

        if (objExtracao && objExtracao[idRelatorio] && objExtracao[idRelatorio]['titulo']) {

            return objExtracao[idRelatorio]['titulo'];
        }
        // this.cdr.markForCheck();

    }

    getValorTituloExtracao(titulo, idRelatorio) {

        let objExtracao = Sessao.getPreferenciasUsuario()['objExtracao'];

        if (objExtracao && objExtracao[idRelatorio]) {

            let objFiltroRelatorio = objExtracao[idRelatorio];

            if (titulo && titulo.valor) {
                objFiltroRelatorio['titulo'] = titulo.valor
            }

            objExtracao[idRelatorio] = objFiltroRelatorio;


        } else {
            console.warn("Caso nao tenha selecionado, seleciona automaticamente o relatorio para o usuario");
        }

        Sessao.setPreferenciasUsuario('objExtracao', objExtracao);
    }

    modalConfirmar;
    extrair() {
        let objExtracao = Sessao.getPreferenciasUsuario()['objExtracao'];
        let somenteIndicadores;

        this.modalConfirmar = this.modalService.open(NgbdModalContent);
        this.modalConfirmar.componentInstance.modalHeader = `Extração Rápida`;
        this.modalConfirmar.componentInstance.modalMensagem = `Deseja extrair somente indicadores`;
        this.modalConfirmar.componentInstance.modalAlert = true;

        this.modalConfirmar.componentInstance.retorno.subscribe(
            (retorno) => {
                somenteIndicadores = retorno;
            }
        );


        let aPromises = [];
        Object.keys(objExtracao).forEach(
            (obj) => {
                aPromises.push(
                    new Promise((resolve, reject) => {
                        let request = objExtracao[obj].relatorio

                        if (!somenteIndicadores) {
                            delete request.pagina;
                            delete request.quantidade;
                        }

                        delete request.itens;

                        if (objExtracao[obj]['filtros']) {
                            request['itens'] = Object.keys(objExtracao[obj]['filtros']).map(
                                (pos) => {
                                    return objExtracao[obj]['filtros'][pos];
                                }
                            );
                        }

                        this.relatorioService.post(request).subscribe(
                            (resposta) => {
                                resposta.request = request;
                                resposta.titulo = objExtracao[obj]['titulo'] || 'Indicador sem Título';
                                resolve(resposta);
                            }, (error) => {
                                Servidor.verificaErro(error, this.toastr);
                                reject(error);
                            }
                        );
                    })
                );
            }
        );

        Promise.all(aPromises).then(
            (arrayRetorno) => {
                // this.cdr.markForCheck();
                let indicadores = [];
                let total = 0;
                arrayRetorno.forEach(
                    (relatorio) => {
                        console.log(relatorio)

                        if (somenteIndicadores) {
                            let obj = this.geraExcelIndicadores(relatorio)
                            total += obj[1];
                            indicadores.push(obj);
                        } else {
                            let colunasHeader = [];
                            relatorio.request.colunas.forEach((colunas, i) => {
                                colunasHeader.push(colunas.coluna);
                            });

                            relatorio.dados.forEach((dados, i) => {
                                Object.keys(colunasHeader).forEach(key => {
                                    let newKey = colunasHeader[key];
                                    dados[newKey] = dados[key];
                                    delete dados[key];
                                });
                            });

                            this.excelService.exportAsExcelFile(relatorio.dados, `Relatório_${moment().format('DD/MM/YYYY HH:mm')}`);
                            // this.relatorio.gerarExcel(relatorio, false);
                        }
                    }
                );

                if (indicadores.length) {
                    console.log(indicadores)
                    let colunasHeader = ["Indicador", "Quantidade"];
                    indicadores.push(['Total', total]);

                    indicadores.forEach((dados, i) => {
                        Object.keys(colunasHeader).forEach(key => {
                            let newKey = colunasHeader[key];
                            dados[newKey] = dados[key];
                            delete dados[key];
                        });
                    });

                    this.excelService.exportAsExcelFile(indicadores, `Indicador_${moment().format('DD/MM/YYYY HH:mm')}`);
                    // this.relatorio.gerarExcel(indicadores, false);
                }

                console.log("Excel gerado");
            },
            (erro) => {
                console.error(erro);
            }
        );
    }

    geraExcelIndicadores(relatorio) {
        console.log(relatorio);

        let colunas = this.geraColunasIndicadores(relatorio);

        console.log("Gera Exel: request");

        console.log(colunas);

        return colunas;
    }

    excluirRelatorioFiltro() {
        let id = this.variaveisDeAmbiente['relatorioFiltroAtual'].id;
        this.relatorioFiltroService.delete(id).subscribe((resposta) => {
            this.toastr.success("Excluido com sucesso");
            this.inicializaRelatorioFiltros();
            this.modalInstancia.close();
        });
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

    iniciaPosicaoRelatorio(relatorioFiltro) {
        let obj = new Object();

        obj[relatorioFiltro.id] = new Object();

        let objTemp = this.relatorio.trataObjetoRelatorio(relatorioFiltro, true);

        obj[relatorioFiltro.id]['relatorio'] = objTemp;

        return obj;
    }

    geraColunasIndicadores(relatorio) {
        return [
            relatorio.titulo,
            relatorio.qtdItensTotal
        ]
    }

    abreModalRelatorioFiltro(ev, tipo, relatorioFiltro = undefined) {
        ev.stopPropagation();

        this.variaveisDeAmbiente['relatorioFiltroAtual'] = relatorioFiltro;

        this.modalInstancia = this.modalService.open(NgbdModalContent, { size: 'lg' });
        this.modalInstancia.componentInstance.modalHeader = `${tipo} Filtro`;

        this.modalInstancia.componentInstance.templateRefBody = this[`bodyModal${tipo}FiltroSalvo`];
        this.modalInstancia.componentInstance.templateBotoes = this[`templateBotoesModal${tipo}FiltroSalvo`];

        let fnSuccess = (agendamentoGrupoResposta) => { console.log("Modal Fechada!"); };
        let fnError = (erro) => { console.log("Modal Fechada!"); };
        this.modalInstancia.result.then((data) => fnSuccess, fnError);
    }

    objEspecialidades
    fnCfgEspecialidadeRemote(term) {
        return this.serviceEspecialidade.getEspecialidadeLike(term, 0, 10).subscribe(
            (retorno) => {
                this.objEspecialidades = retorno.dados || retorno;
            }
        );
    }

    especialidadeSelecionada
    getEspecialidade(especialidade) {
        if (especialidade) {
            this.objFiltroRelatorios['idEspecialidade'] = especialidade.id;
            this.especialidadeSelecionada = especialidade.descricao
        }
    }
}