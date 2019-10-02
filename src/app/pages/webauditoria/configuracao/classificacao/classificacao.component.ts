import { Component, OnInit, OnDestroy, TemplateRef, Renderer2, ViewContainerRef, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef, Renderer, QueryList } from '@angular/core';
import { BrowserHelpers, GuiaClassificacaoService} from '../../../../services';

import { Servidor} from '../../../../services/servidor';
import { Sessao} from '../../../../services/sessao';

import { ActivatedRoute, Router } from '@angular/router';
import { GlobalState } from '../../../../global.state';
import { Notificacao, Aguardar, TopoPagina } from '../../../../theme/components';
import { NgbdModalContent } from '../../../../theme/components/modal/modal.component';

import { ToastrService } from 'ngx-toastr';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as jQuery from 'jquery';

@Component({
    selector: 'classificacao',
    templateUrl: './classificacao.html',
    styleUrls: ['./classificacao.scss'],
    providers: []
})

export class Classificacao implements OnInit, OnDestroy {

    sort = {};

    classificacaoId;
    risco;

    atual;
    qtdItensTotalAcoes;
    paginaAtualAcoes;
    itensPorPaginaAcoes;

    pergunta;
    parametros = [];

    colorPicker;
    iconeSelector;

    guiaClassificacoes;
    acaoSelecionado;
    objFiltroAcoes = [ 'descricao', 'descricao' ];
    
    tabela = {};
    @ViewChild("formPergunta", {read: ElementRef}) formPergunta: ElementRef;

    constructor( 
        private _state: GlobalState, 
        public router: Router,
        private route: ActivatedRoute,
        private modalService: NgbModal,
        private renderer: Renderer2,
        private guiaClassificacaoService: GuiaClassificacaoService,
        private toastr: ToastrService, 
        public vcr: ViewContainerRef
    ) { 
        this.route.params.subscribe(params => {
            this.classificacaoId = params['classificacaoId'] == 'novo' ? undefined : params['classificacaoId'];
        });

        this.risco = new Object();

        this.tabela['colunasTabela'] = [
            {'titulo': 'Descrição', 'chave': 'descricao', 'ordem': 'descricao'},
        ];

        this.tabela['ordenacao'] = {
            tipo: 'desc',
            ordem: 'impresso',
            paginaAtual: 1,
            itensPorPagina: 30
        };
    }
    
    ngOnDestroy(){
    }
    
    ngOnInit() {
        this.atualizaDados();
    }

    ngAfterViewInit() {        
    }

    onDrop(event) {
        event.preventDefault();
        let ordem = event.currentTarget.rowIndex;
        let elClassificacao = this.sort['elementoDrag'];
        let oClassificacao = this.sort['classificacao'];

        console.log(oClassificacao, elClassificacao, ordem);
    }
    onDragOver(event) {
        event.preventDefault();
    }
    onDragStart(event, classificacao) {
        this.sort['elementoDrag'] = event.srcElement;
        this.sort['classificacao'] = classificacao;
    }


    pesquisarTiposCuidado(texto) {
        this.atualizaDados(texto);
    }
    atualizaDados(evento = null) {
        let like = evento && evento.like ? evento.like : undefined;
        this.paginaAtualAcoes = evento ? evento.paginaAtual : this.paginaAtualAcoes;
        this.itensPorPaginaAcoes = evento ? evento.itensPorPagina : this.itensPorPaginaAcoes;
        
        this.guiaClassificacaoService.get({pagina: this.paginaAtualAcoes, quantidade: this.itensPorPaginaAcoes, simples: true, like: like}).subscribe(
            (guiaClassificacoes) => {
                if (this.paginaAtualAcoes == 1) {
                    this.tabela['dados'] = [];
                }

                this.tabela['dados'] = this.tabela['dados'].concat([], guiaClassificacoes.dados);
                this.tabela['qtdItensTotal'] = guiaClassificacoes.qtdItensTotal;
            }
        );
    }

    fnCfgAcoesRemote(term) {
        this.objFiltroAcoes = ['descricao', 'descricao'];
        return this.guiaClassificacaoService.get( { like : term, pagina : 1, quantidade : 10 } , true )
    }

    removeAcao(id, pos, event){
        if( confirm("Deseja excluir essa ação?") ){
            this.guiaClassificacaoService.delete(id).subscribe(
                retorno => {
                    this.guiaClassificacoes[pos].excluido = true;
                    this.toastr.success("Ação foi desativada com sucesso")
                },
                erro => {
                }
            ) 
            event.stopPropagation();
        }
    }


    filtrarAcoes(){
        if( this.acaoSelecionado ){
            this.guiaClassificacaoService.get( { id : this.acaoSelecionado.id }, false ).subscribe(
                (guiaClassificacoes) => {
                    this.guiaClassificacoes = guiaClassificacoes.dados;
                    this.qtdItensTotalAcoes = guiaClassificacoes.qtdItensTotal;
                }
            )
        }
    }

    abrir(acao) {
        let sId = acao ? acao.id : 'novo';        
        this.router.navigate([`/${Sessao.getModulo()}/classificacao/${sId}`]);
    }

    buscaAcoes(evento){

    }
}