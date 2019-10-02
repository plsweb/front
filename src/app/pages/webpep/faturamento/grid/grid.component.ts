import { Component, OnInit } from '@angular/core';
import { GlobalState } from '../../../../global.state';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';

import { FormatosData } from '../../../../theme/components/agenda/agenda';
import { CobrancaService } from '../../../../services';

import { Servidor } from '../../../../services/servidor';
import { Sessao } from '../../../../services/sessao';

import * as moment from 'moment';
moment.locale('pt-br');

@Component({
    selector: 'grid',
    templateUrl: './grid.html',
    styleUrls: ['./grid.scss'],
})
export class Grid implements OnInit {
    faturamentos = [];
    qtdItensTotal;
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
    corSelecionada = '';

    inicio;
    fim;
    hideLocal = true;

    dataInicioInstancia;
    dataFimInstancia;
    localSelecionado;
    formatosDeDatas;

    constructor(
        private _state: GlobalState, 
        private toastr: ToastrService, 
        private cobrancaService: CobrancaService,
        private router: Router
    ) {
        
        this.icones = [
            {
                id: 'online',
                icone: 'public'
            },
            {
                id: 'callcenter',
                icone: 'call'
            },
            {
                id: 'balcao',
                icone: 'person'
            },
            {
                id: 'casu',
                icone: 'store'
            },
            {
                id: 'familiar',
                icone: 'wc'
            }
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
            ordem: 'fimFim',
            paginaAtual: 1,
            itensPorPagina: 30
        };

        this.colunasTabela = [
            {'titulo': '', 'chave': '', 'headClasse': 'cobrancaStatus', 'classe': `status ${this.fnValidaStatus(this)}`},
            
            {'titulo': 'Guia', 'chave': 'guia.impresso', 'ordem': 'guia.impresso', 'ordemFiltro': 'guia.impresso', 'classe': '', 'filtroClasse': 'STRING', 'filtroTipo': 'LIKE', 'fnValidaLabel' : this.fnValidaGuia.bind(this)},

            {'titulo': 'Inicio', 'chave': 'inicio', 'ordem': 'inicio', 'ordemFiltro': 'inicioInicio', 'classe': '', 'filtroClasse': 'DATA', 'filtroTipo': 'MAIORIGUAL', range: true, 'fnValidaLabel' : this.fnValidaData.bind(this)},

            {'titulo': 'Fim', 'chave': 'fim', 'ordem': 'fim', 'ordemFiltro': 'fimFim', 'classe': '', 'filtroClasse': 'DATA', 'filtroTipo': 'MENORIGUAL', range: true, 'fnValidaLabel' : this.fnValidaData.bind(this)},
            
            {'titulo': 'Paciente', 'chave': 'paciente.nome', 'ordem': 'nome', 'ordemFiltro': 'nome', 'classe': '', 'filtroClasse': 'STRING', 'filtroTipo': 'LIKE'},
        ];
        
        let filtro = localStorage.getItem('filtrosFaturamento');
        if (filtro) {
            this.filtro = JSON.parse(filtro);
            
            let ordenacao = localStorage.getItem('ordenacaoFaturamento');
            
            if (ordenacao) {
                this.ordenacao = Object.assign(JSON.parse(ordenacao), this.ordenacao);
                this.ordenacao.paginaAtual = 1;
            }

            this.inicio = [moment(this.filtro['inicioInicio'].valor, 'DD/MM/YYYY')];
            this.fim = [moment(this.filtro['fimFim'].valor, 'DD/MM/YYYY')];
        } else {
            this.limparFiltros();
        } 
    }

    iniciaOrdenacao() {
        this.ordenacao = {
            tipo: 'desc',
            ordem: 'fimFim',
            paginaAtual: 1,
            itensPorPagina: 30
        }
    }

    unidadesAtendimento = [];
    ngOnInit() {
        this.ordenacao.like = "";
        this.formatosDeDatas = new FormatosData();
        this._state.notifyDataChanged('menu.isCollapsed', true);

        this.unidadesAtendimento = Sessao.getVariaveisAmbiente('unidadesAtendimento');
        this.atualizaDados();
    }

    fnLegendaLocal(dado) {
        if (!dado) {
            return 'LOCAL';
        }
        return this.legendas[dado.local];
    }

    resetaOrdenacao() {
        if (this.ordenacao) {
            this.ordenacao.paginaAtual = 1
        } 
    }

    getDataInicioInstancia(instancia) {
        this.dataInicioInstancia = instancia;
    }
    
    getDataFimInstancia(instancia) {
        this.dataFimInstancia = instancia;
    }
   
    clickLog(ev, linha) {
        ev.stopPropagation();
        this.router.navigate([`/${Sessao.getModulo()}/faturamento/historico/${linha.id}`]);
    }

    limparFiltros(bAtualizaDados = true) {
        this.colunasTabela.filter((coluna) => {
            return coluna.filtroTipo;
        }).slice().forEach((coluna) => {
            this.filtro[coluna.ordemFiltro] = {
                valor: this.validaInicializacaoValores(coluna),
                tipo: coluna.filtroTipo,
                classe: coluna.filtroClasse,
                enumNome: coluna.enumNome,
                range: coluna.range
            }
        });
        this.localSelecionado = null;
        this.inicio = [moment()];
        this.fim = [moment()];

        (this.dataInicioInstancia) ? this.dataInicioInstancia.setValor(this.inicio) : null;
        (this.dataFimInstancia) ? this.dataFimInstancia.setValor(this.fim) : null;

        this.ordenacao.paginaAtual = 1;

        this.ordenacao.paginaAtual = 1;

        if(bAtualizaDados){
            this.atualizaDados();
        }
    }

    validaInicializacaoValores(coluna){

        switch (coluna.ordemFiltro) {
            // case 'unidadeAtendimento.id':
            //     return [1, 3];

            default:
                return undefined;
        }
    }

    fnMostraIcone(dado) {
        return dado.admissao !== 'ELETIVO';
    }

    fnInternacaoIcone(dado) {
        if (!dado || (dado && dado.tipo == 'INTERNACAO')) {
            return 'hotel';
        }
    }

    fnIcone(dado = null) {
        if (dado) {
            let icone = this.icones.filter((icone) => icone.id == dado.local)[0];
            return icone.icone;
        }

        return 'public';
    }

    fnMostraFamiliar(dado) {
        return dado.familiar;
    }

    abreAnexo(ev){
        ev.stopPropagation();
    }

    fnMostraIconePlac(dado) {
        return dado.plac;
    }

    fnMostraIconeReclamacao(dado) {
        return dado.reclamacao;
    }

    fnMostraIconeAnexo(dado) {
        return dado.anexos > 0;
    }

    getValor(evento, param) {
        let label = this.filtro[param] ? param : evento;
        if (!param || !this.filtro[label]) {
            return;
        }

        if( this.filtro[label].tipo == 'IN' ){
            // this.filtro[label].valor = this.setId(evento);
            this.filtro[label].valor = evento.valor;
        }else if( this.filtro[evento] && this.filtro[evento].classe == 'DATA' ){  // NO CASO DE DATAS OS PARAMETROS SAO INVERTIDOS
            this.filtro[label].valor = param[0].format('DD/MM/YYYY');
        }else{
            this.filtro[label].valor = evento.valor;
        }
    }

    setId(locais){
        if( locais && locais.valor ){
            let ids = locais.valor.map(
                (local) => {
                    return local.id || local.codigo || local
                }
            )
            
            return ids;
        }else{
            return [];
        }
    }

    getData(param, evento) {
        if (!param || !this.filtro[param]) 
            return;

        this.filtro[param].valor = evento[0].format('DD/MM/YYYY');
    }

    fnValidaStatus(item){
        console.log(item['cobrancaStatus'])
        return item['cobrancaStatus'] ? item['cobrancaStatus'] : '';
    }

    fnValidaData(item){
        return item['inicio'] ? moment(item['inicio'], this.formatosDeDatas.dataHoraSegundoFormato).format(this.formatosDeDatas.dataHoraSegundoFormato) : '';//dataFormato
    }

    fnValidaGuia(item){
        if( item.guia && item.guia.impresso ){
            return item.guia.impresso;
        }else{
            return item.guiaImpresso;
        }
    }

    atualizaDados(obj:any = {"like":""}, bFiltro = false) {        
        this.ordenacao.like = obj.like;

        if (bFiltro) {
            this.iniciaOrdenacao();
        }

        if (obj['filtro']) {
            // this.resetaOrdenacao();
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

                if( filt['tipo'] == 'IN'){
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

        let requestBODY = {
            pagina: obj.paginaAtual || this.ordenacao.paginaAtual,
            quantidade: this.ordenacao.itensPorPagina,
            ordem: `${this.ordenacao.ordem} ${this.ordenacao.tipo}`,
        };

        if (arrItens.length) {
            requestBODY['itens'] = arrItens;
        }

        if (this.ordenacao.like) {
            requestBODY['likeItens'] = ['id','nome'];
            requestBODY['likeStr'] = this.ordenacao.like;
        }

        let requestURL = {
            pagina: obj.paginaAtual || this.ordenacao.paginaAtual,
            quantidade: this.ordenacao.itensPorPagina
        }

        this.cobrancaService.postFaturamentoFiltro(requestBODY, requestURL).subscribe(
            (faturamentos) => {
                if (this.ordenacao.paginaAtual == 1) {
                    this.faturamentos = [];
                }

                this.faturamentos = ( requestURL['paginaAtual'] == 1 ) ? (faturamentos.dados || faturamentos) : this.faturamentos.concat([], (faturamentos.dados || faturamentos));
                this.qtdItensTotal = faturamentos.qtdItensTotal;

                localStorage.setItem('filtrosFaturamento', JSON.stringify(this.filtro));
                localStorage.setItem('ordenacaoFaturamento', JSON.stringify(this.ordenacao));
            },
            (erro) => {
                if( erro.status == 0 ){
                    this.toastr.error("Houve uma falha na conexão. Tente novamente.");
                }
                localStorage.setItem('filtrosFaturamento', JSON.stringify(this.filtro));
                Servidor.verificaErro(erro, this.toastr);
            },
        );
    }

    atualizar(dado) {
        this.router.navigate([`/${Sessao.getModulo()}/faturamento/formulario/${dado.id}`]);
    }
}