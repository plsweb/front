import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';

import { ToastrService } from 'ngx-toastr';
import { GlobalState } from 'app/global.state';

import { Sessao, Servidor, GuiaAdmissaoService, GuiaLogService, GuiaAuditoriaService, TipoMovimentoService, RemessaClassificacaoService } from 'app/services';

import { FormatosData } from 'app/theme/components';

import * as moment from 'moment';
moment.locale('pt-br');

@Component({
    selector: 'grid',
    templateUrl: './grid.html',
    styleUrls: ['./grid.scss'],
})
export class Grid implements OnInit {
    guias = [];
    colunasTabela;
    ordenacao;
    filtro = new Object();

    tiposMovimentos = [];
    guiasAdmissoes = [];
    classificacoes = [];
    opcoesStatus = [];
    icones = [];
    legendas = {};
    opcoesNivel = [];
    opcoesChatFiltro = [];
    
    localSelecionado;
    
    dataInicio;
    dataFim;
    dataInicioInstancia;
    dataFimInstancia;

    formatosDeDatas;

    constructor(
        private router: Router,
        private _state: GlobalState,
        private toastr: ToastrService,
        private guiaLogService: GuiaLogService,
        private guiaAdmissaoService: GuiaAdmissaoService,
        private tipoMovimentoService: TipoMovimentoService,
        private guiaAuditoriaService: GuiaAuditoriaService,
        private remessaClassificacaoService: RemessaClassificacaoService,
    ) {

        this.icones = [
            { id: 'online', icone: 'public' },
            { id: 'callcenter', icone: 'call' },
            { id: 'balcao', icone: 'person' },
            { id: 'casu', icone: 'store' },
            { id: 'familiar', icone: 'wc' }
        ];

        this.legendas = {
            online: 'Online',
            callcenter: 'Call Center',
            balcao: 'Balcão',
            casu: 'CASU',
            familiar: 'Familiar'
        };

        this.opcoesChatFiltro = [
            { id: true, descricao: 'Sim' },
            { id: false, descricao: 'Não' }
        ]

        this.ordenacao = {
            tipo: 'desc',
            ordem: 'prazo',
            paginaAtual: 1,
            qtdItensTotal: 0,
            itensPorPagina: 30,
        };

        this.colunasTabela = [
            { 'titulo': '', 'chave': '', 'headClasse': 'status', 'classe': 'status verde' },
            { 'titulo': '', 'icone': { 'icn': 'list', 'click': this.clickLog.bind(this), 'legenda': 'Histórico' } },
            { 'titulo': '', 'ordem': 'local', 'ordemFiltro': 'local', 'classe': '', 'filtroClasse': 'STRING', 'filtroTipo': 'IN', 'icone': { 'icn': 'online', 'fnIcn': this.fnIcone.bind(this), 'legenda': this.fnLegendaLocal.bind(this) } },
            { 'titulo': '', 'ordem': 'admissao', 'ordemFiltro': 'admissao', 'classe': '', 'filtroClasse': 'ENUM', 'enumNome': 'GuiaAdmissao', 'filtroTipo': 'IN', 'icone': { 'icn': 'warning', 'legenda': 'Urgência', 'seCondicao': this.fnMostraIcone } },
            { 'titulo': '', 'ordem': 'tipo', 'ordemFiltro': 'tipo', 'classe': '', 'filtroClasse': 'ENUM', 'enumNome': 'TipoMovimento', 'filtroTipo': 'IN', 'icone': { 'icn': 'hotel', 'fnIcn': this.fnInternacaoIcone.bind(this), 'legenda': 'Internação' } },
            { 'titulo': '', 'ordem': 'familiar', 'ordemFiltro': 'familiar', 'classe': '', 'filtroClasse': 'BOOLEAN', 'filtroTipo': 'IGUAL', 'icone': { 'icn': 'wc', 'legenda': 'Familiar', 'seCondicao': this.fnMostraFamiliar } },
            { 'titulo': '', 'ordemFiltro': 'reclamacao', 'ordem': 'reclamacao', 'icone': { 'icn': 'priority_high', 'legenda': 'Reclamação', 'seCondicao': this.fnMostraIconeReclamacao } },
            { 'titulo': '', 'ordemFiltro': 'plac', 'ordem': 'plac', 'icone': { 'icn': 'star', 'legenda': 'PLAC', 'seCondicao': this.fnMostraIconePlac } },
            { 'titulo': '', 'ordemFiltro': 'anexos', 'ordem': 'anexos', 'icone': { 'icn': 'attach_file', 'legenda': 'Anexo', 'click': this.abreAnexo.bind(this), 'classe': 'text-success', 'seCondicao': this.fnMostraIconeAnexo } },

            { 'titulo': 'Guia', 'chave': 'impresso', 'ordem': 'impresso', 'ordemFiltro': 'impresso', 'classe': '', 'filtroClasse': 'STRING', 'filtroTipo': 'LIKE' },

            { 'titulo': 'Solicitação', 'chave': 'digitacao', 'ordem': 'digitacao', 'ordemFiltro': 'digitacao', 'classe': '', 'filtroClasse': 'DATA', 'filtroTipo': 'MAIORIGUAL', range: true, 'fnValidaLabel': this.fnValidaData.bind(this, 'digitacao') },

            { 'titulo': 'Data', 'chave': 'data', 'ordem': 'data', 'ordemFiltro': 'dataInicio', 'classe': '', 'filtroClasse': 'DATA', 'filtroTipo': 'MAIORIGUAL', range: true, 'fnValidaLabel': this.fnValidaData.bind(this, 'data') },
            { 'titulo': 'Data', 'chave': 'data', 'ordem': 'data', 'ordemFiltro': 'dataFim', 'classe': '', 'filtroClasse': 'DATA', 'filtroTipo': 'MENORIGUAL', oculto: true, range: true },

            { 'titulo': 'Prazo', 'chave': 'prazo', 'ordem': 'prazo', 'ordemFiltro': 'prazoInicio', 'classe': '', 'filtroClasse': 'INTEGER', 'filtroTipo': 'MAIORIGUAL', range: true },
            { 'titulo': 'Prazo', 'chave': 'prazo', 'ordem': 'prazo', 'ordemFiltro': 'prazoFim', 'classe': '', 'filtroClasse': 'INTEGER', 'filtroTipo': 'MENORIGUAL', oculto: true, range: true },

            { 'titulo': 'Beneficiário', 'chave': 'nome', 'ordem': 'nome', 'ordemFiltro': 'nome', 'classe': '', 'filtroClasse': 'STRING', 'filtroTipo': 'LIKE' },
            { 'titulo': 'Solicitante', 'chave': 'solicitante', 'ordem': 'solicitante', 'ordemFiltro': 'solicitante', 'classe': '', 'filtroClasse': 'STRING', 'filtroTipo': 'LIKE' },
            /*{'titulo': 'Operador', 'chave': 'operador', 'ordem': 'operador', 'ordemFiltro': 'operador', 'classe': '', 'filtroClasse': 'STRING', 'filtroTipo': 'IGUAL'},*/
            { 'titulo': 'Classificação', 'chave': 'classificacao.descricao', 'ordem': 'classificacao.descricao', 'ordemFiltro': 'classificacao.descricao', 'classe': '', 'filtroClasse': 'STRING', 'filtroTipo': 'IN' },
            // {'titulo': 'Classificação', 'chave': 'classificacao.id', 'ordem': 'classificacao.id', 'ordemFiltro': 'classificacao.id', 'classe': '', 'filtroClasse': 'INTEGER', 'filtroTipo': 'IGUAL', oculto: true}

            { 'chave': 'nivelAuditoria', 'ordemFiltro': 'nivelAuditoria', 'classe': 'ENUM', 'filtroClasse': 'ENUM', 'enumNome': 'NivelAuditoria', 'tipo': 'IGUAL', 'filtroTipo': 'IN', oculto: true },
            { 'chave': 'chat', 'ordemFiltro': 'chat', 'classe': 'BOOLEAN', 'filtroClasse': 'BOOLEAN', 'tipo': 'IGUAL', 'filtroTipo': 'IGUAL', oculto: true },
            { 'chave': 'status', 'ordemFiltro': 'status.id', 'filtroClasse': 'INTEGER', 'filtroTipo': 'IN', oculto: true }
        ];

        let ordenacao = localStorage.getItem('ordenacao') || false;
        if (ordenacao) {
            this.ordenacao = JSON.parse(ordenacao);
            delete this.ordenacao.paginaAtual;
            delete this.ordenacao.qtdItensTotal;
        } else {
            localStorage.setItem('ordenacao', JSON.stringify(this.ordenacao));
        }

        let filtro = localStorage.getItem('filtrosAuditoria') || false;
        if (filtro) {
            this.filtro = JSON.parse(filtro);
            this.dataInicio = [moment(this.filtro['dataInicio'].valor, 'DD/MM/YYYY')];
            this.dataFim = [moment(this.filtro['dataFim'].valor, 'DD/MM/YYYY')];
        } else {
            this.limparFiltros();
            localStorage.setItem('filtrosAuditoria', JSON.stringify(this.filtro));
        }

        this.guiaAuditoriaService.getNivelAuditoria().subscribe(
            (niveis) => {
                this.opcoesNivel = niveis.dados || niveis;
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );

        this.tipoMovimentoService.get().subscribe(
            (tiposMovimento) => {
                this.tiposMovimentos = tiposMovimento;
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );

        this.guiaAdmissaoService.get().subscribe(
            (guiasAdmissoes) => {
                this.guiasAdmissoes = guiasAdmissoes;
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );

        this.remessaClassificacaoService.get().subscribe(
            (classificacoes) => {
                this.classificacoes = classificacoes.dados;
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );

        this.guiaLogService.getStatus({ pagina: 0, quantidade: 0 }).subscribe(
            (opcoesStatus) => {
                this.opcoesStatus = opcoesStatus.dados || opcoesStatus;
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    ngOnInit() {
        this.ordenacao.like = "";
        this.formatosDeDatas = new FormatosData();
        this._state.notifyDataChanged('menu.isCollapsed', true);
        this.ordenacao = {
            paginaAtual: 1,
            qtdItensTotal: 0,
            itensPorPagina: 30,
        }
    }

    iniciaOrdenacao() {
        this.ordenacao = {
            tipo: 'desc',
            ordem: 'prazo',
            paginaAtual: 1,
            qtdItensTotal: 0,
            itensPorPagina: 30,
        }
    }

    clickLog(ev, linha) {
        ev.stopPropagation();
        this.router.navigate([`/${Sessao.getModulo()}/previa/historico/${linha.id}`]);
    }

    fnIcone(dado = null) {
        return dado ? this.icones.filter((icone) => icone.id == dado.local)[0].icone : 'public';
    }
    
    fnLegendaLocal(dado) {
        return dado ? this.legendas[dado.local] : 'LOCAL';
    }
    
    fnMostraIcone(dado) {
        return dado.admissao !== 'ELETIVO';
    }

    fnInternacaoIcone(dado) {
        if (!dado || (dado && dado.tipo == 'INTERNACAO')) {
            return 'hotel';
        }
    }

    fnMostraFamiliar(dado) {
        return dado.familiar;
    }

    fnMostraIconeReclamacao(dado) {
        return dado.reclamacao;
    }

    fnMostraIconePlac(dado) {
        return dado.plac;
    }

    abreAnexo(ev, linha) {
        ev.stopPropagation();
    }

    fnMostraIconeAnexo(dado) {
        return dado.anexos > 0;
    }

    fnValidaData(chave, item) {
        return (item[chave]) ? moment(item[chave], this.formatosDeDatas.dataHoraSegundoFormato).format(this.formatosDeDatas.dataFormato) : '';
    }

    getDataInicioInstancia(instancia) {
        this.dataInicioInstancia = instancia;
    }

    getDataFimInstancia(instancia) {
        this.dataFimInstancia = instancia;
    }

    limparFiltros(bAtualizaDados = true) {
        this.guias = [];
        this.colunasTabela.filter((coluna) => {
            return coluna.filtroTipo;
        }).slice().forEach(
            (coluna) => {
                this.filtro[coluna.ordemFiltro] = {
                    valor: this.validaInicializacaoValores(coluna),
                    tipo: coluna.filtroTipo,
                    classe: coluna.filtroClasse,
                    enumNome: coluna.enumNome,
                    range: coluna.range
                }
            }
        );

        this.localSelecionado = null;
        this.dataInicio = [moment()];
        this.dataFim = [moment()];

        (this.dataInicioInstancia) ? this.dataInicioInstancia.setValor(this.dataInicio) : null;
        (this.dataFimInstancia) ? this.dataFimInstancia.setValor(this.dataFim) : null;

        this.ordenacao.paginaAtual = 1;
        this.ordenacao.qtdItensTotal = 0;

        if (bAtualizaDados) {
            this.atualizaDados();
        }
    }

    validaInicializacaoValores(coluna) {
        switch (coluna.ordemFiltro) {
            case 'nivelAuditoria':
                return ['MEDICO','ENFERMEIRO'];

            case 'chat':
                return true;

            case 'status.id':
                return [7];

            case 'admissao':
            case 'classificacao.descricao':
                return [];

            default:
                return undefined;
        }
    }

    getValor(evento, param) {
        let label = this.filtro[param] ? param : evento;
        if (!param || !this.filtro[label]) {
            return;
        }

        if (this.filtro[label].tipo == 'IN') {
            // this.filtro[label].valor = this.setId(evento);
            this.filtro[label].valor = evento.valor;
        } else if (this.filtro[evento] && this.filtro[evento].classe == 'DATA') {  // NO CASO DE DATAS OS PARAMETROS SAO INVERTIDOS
            this.filtro[label].valor = param[0].format('DD/MM/YYYY');
        } else {
            this.filtro[label].valor = evento.valor;
        }
    }

    setId(locais) {
        if (locais && locais.valor) {
            let ids = locais.valor.map(
                (local) => {
                    return local.id || local.codigo || local
                }
            )

            return ids;
        } else {
            return [];
        }
    }

    getData(param, evento) {
        if (!param || !this.filtro[param])
            return;

        this.filtro[param].valor = evento[0].format('DD/MM/YYYY');
    }

    atualizaDados(obj = { "like": "" }, bFiltro = false) {
        this.ordenacao.like = obj.like;

        if (bFiltro) {
            this.iniciaOrdenacao();
        }

        if (obj['filtro']) {
            // this.ordenacao.paginaAtual = 1;
            // this.ordenacao.qtdItensTotal = 0;
        } else {
            this.ordenacao = Object.assign(obj, this.ordenacao);
        }

        let arrItens = [];
        Object.keys(this.filtro).forEach((key) => {
            if (this.filtro[key] && this.filtro[key].valor && this.filtro[key].valor != '0') {
                let filt = {
                    "campo": key,
                    "classe": this.filtro[key].classe,
                    "tipo": this.filtro[key].tipo,
                    "valor": this.filtro[key].valor
                };

                if (filt['tipo'] == 'IN') {
                    // console.log("é IN", this.filtro[key]);
                    filt['valorIn'] = this.setId(this.filtro[key]);
                    delete filt.valor;
                }

                if (this.filtro[key].enumNome) {
                    filt['enumNome'] = this.filtro[key].enumNome;
                }

                if (this.filtro[key].range) {
                    filt['campo'] = key.replace(/Inicio|Fim/g, '');
                }
                arrItens.push(filt);
            }
        });

        if (this.localSelecionado) {
            arrItens.push({
                "campo": "local",
                "classe": "STRING",
                "tipo": "IGUAL",
                "valor": this.localSelecionado
            });
        }

        let request = {
            pagina: (obj['paginaAtual'] || this.ordenacao.paginaAtual),
            quantidade: this.ordenacao.itensPorPagina,
        };

        if (this.ordenacao && this.ordenacao.ordem && this.ordenacao.tipo) {
            request['ordem'] = `${this.ordenacao.ordem} ${this.ordenacao.tipo}`;
        }

        if (arrItens.length) {
            request['itens'] = arrItens;
        }

        if (this.ordenacao.like) {
            request['likeItens'] = ['impresso', 'nome', 'solicitante', 'operador', 'prestadorCodigo', 'carteira'];
            request['likeStr'] = this.ordenacao.like;
        }

        this.guiaAuditoriaService.guiasEmAuditoriaFiltro(request).subscribe(
            (guias) => {
                this.guias = (guias.paginaAtual == 1) ? (guias.dados || guias) : this.guias.concat([], guias.dados);
                this.ordenacao.qtdItensTotal = guias.qtdItensTotal;
                this.ordenacao.paginaAtual = guias.paginaAtual;

                localStorage.setItem('filtrosAuditoria', JSON.stringify(this.filtro));
                localStorage.setItem('ordenacao', JSON.stringify(this.ordenacao));
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    adicionar() {
        this.router.navigate([`/${Sessao.getModulo()}/formulario/formulario`]);
    }

    atualizar(dado) {
        this.router.navigate([`/${Sessao.getModulo()}/previa/formulario/${dado.id}`]);
    }
}