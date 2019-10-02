import { Component, Input } from '@angular/core';

@Component({
    selector: 'tabela',
    templateUrl: './tabela.html',
    providers: [],
    styleUrls: ['./tabela.scss']    
})
export class Tabela {
    @Input() titulo = '';
    @Input() colunas: Object[];
    @Input() linhas: Object[];
    @Input() ordenar = true;
    @Input() ordenacao;
    @Input() className;
    @Input() atualizaDados: Function;
    @Input() limparFiltros: Function;
    @Input() linhaClick: Function;
    @Input() registros;
    @Input() qtdItensTotal;
    @Input() itensPorPagina = 30;
    @Input() scrollPagination = true;
    @Input() elementoAcoesMoldura;
    @Input() elementoAcoesMolduraTitulo;
    @Input() labelRegistros;
    @Input() buscaAoIniciar = true;

    @Input() mostraPesquisar: boolean = true;
    @Input() mostraFiltrar: boolean = true;
    @Input() mostraInfo: boolean = false;
    
    paginaAtual = 1;
    tamanhoTela= 0;

    ngOnInit() {
    	let ord = {
    		paginaAtual: this.paginaAtual, 
    		itensPorPagina: this.itensPorPagina
    	};

        this.ordenacao = Object.assign(ord, this.ordenacao);
        if( this.buscaAoIniciar ){
            this.buscaDados();
        }
    }

    ordenaTable(col) {
    	if (!col.ordem)
    		return;

    	if (this.ordenacao.ordem == col.ordem) {
    		this.ordenacao.tipo = this.ordenacao.tipo != 'asc' ? 'asc' : 'desc';
    	}

    	this.ordenacao.ordem = col.ordem;
    	this.ordenacao.paginaAtual = 1;
    	this.linhas = [];

        console.log("Busca Dados");
    	this.buscaDados();
    }

    buscaDados(params = {}, bFiltro = undefined) {
        this.tamanhoTela = 35 * this.registros;
        
        if (bFiltro) {
            this.ordenacao.paginaAtual = 1;
        }

    	let obj = Object.assign(params, {
			paginaAtual: this.ordenacao.paginaAtual,
			itensPorPagina: this.ordenacao.itensPorPagina,
			ordem: this.ordenacao.ordem,
			tipo: this.ordenacao.tipo
        });

        if( !!obj['like']){
            obj['paginaAtual'] = 1; 
            this.ordenacao.paginaAtual = 1;
        }
        
    	if (this.atualizaDados) {
    		this.atualizaDados(obj, bFiltro);
    	}
    }

    proximaPagina(ev) {
        if( !this.scrollPagination ){
            this.ordenacao.paginaAtual = ev.paginaAtual;
        }else{
            this.ordenacao.paginaAtual++;
        }
        
        console.log("Proxima pagina");
        
    	this.buscaDados({like: this.ordenacao.like, filtro: true});
    }

    pesquisar(textoLike = undefined) {
        console.log("pesquisar");
    	this.buscaDados({like: textoLike}, false);
    }

    filtrar(textoLike = undefined) {
        console.log("filtrar");
        this.buscaDados({like: textoLike, filtro: true}, true);
    }

    clickLinha(event, linha) {
    	if (this.linhaClick) {
            event.preventDefault();
    		this.linhaClick(linha);
    	}
    }

    clickIcone(ev, fnClick, linha) {
        if (fnClick) {
            fnClick(ev, linha);
        }
    }

    clickBotao(ev, fnClick, linha) {
        if (fnClick) {
            fnClick(linha);
        }
    }

    validaEstado(ev, fnValida, linha){
        if (fnValida) {
            fnValida(ev, linha);
        }
    }

    trocaEstado(ev, click, linha){
        if (click) {
            click(ev, linha);
        }
    }

    formataTitulo(legenda, linha) {
        let sTitulo = '';
        if (typeof(legenda) == 'function') {
            sTitulo = legenda(linha);
        } else {
            sTitulo = legenda;
        }
        return sTitulo;
    }

    headClasse(col, itemLista) {
        if (col.headClasse) {
            return itemLista[col.headClasse];
        }
        return;
    }

    validaPosicaoObj(col, itemLista){
        let valor;
        let pos = col.chave;
        if( col.fnValidaLabel ){
            return col.fnValidaLabel(itemLista);
        }
        
        if ( pos && pos.indexOf(".") > 0 ) {
  
            //POSICAO
            let arrayPos = pos.split(".");

            let valorFinal = itemLista;
            arrayPos.forEach(
                (pos) => {
                    if( valorFinal ){
                        valorFinal = valorFinal[pos];
                    }
                }
            );

            valor = valorFinal;

        } else {
            if( (itemLista[pos] || typeof(itemLista[pos]) == 'number') ){
                if( typeof(itemLista[pos]) == 'boolean' ){
                    valor = (eval(itemLista[pos])) ? 'SIM' : 'NÃO';
                }else{
                    valor = itemLista[pos];
                }
            } else {
                // console.error("Erro nos parametros: " + pos);
                valor = "";
            }
        }

        return valor;
    }

    validaColunaOculta(col){
        if( !col.fnValidaOculta ){
            return true;
        }else{
            return col.fnValidaOculta();
        }
    }
}