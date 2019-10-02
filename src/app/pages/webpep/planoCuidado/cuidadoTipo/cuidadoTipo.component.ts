import { Component, OnInit, OnDestroy, TemplateRef, Renderer2, ViewContainerRef, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef, Renderer, QueryList } from '@angular/core';
import { BrowserHelpers, PerguntaService, CuidadoService, CuidadoTipoService} from '../../../../services';

import { ActivatedRoute, Router } from '@angular/router';
import { GlobalState } from '../../../../global.state';
import { Notificacao, Aguardar, TopoPagina, Agenda } from '../../../../theme/components';
import { FormatosData } from '../../../../theme/components/agenda/agenda';
import { NgbdModalContent } from '../../../../theme/components/modal/modal.component';
import { TreeviewItem } from 'ngx-treeview';

import { Servidor } from '../../../../services/servidor';
import { Sessao } from '../../../../services/sessao';

import { ToastrService } from 'ngx-toastr';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import * as jQuery from 'jquery';

moment.locale('pt-br');

@Component({
    selector: 'cuidadoTipo',
    templateUrl: './cuidadoTipo.html',
    styleUrls: ['./cuidadoTipo.scss'],
    providers: []
})

export class CuidadoTipo implements OnInit, OnDestroy {

    cuidadoTipoId;
    risco;

    atual;
    qtdItensTotalAcoes;
    paginaAtualAcoes;
    itensPorPaginaAcoes;

    pergunta;
    parametros = [];

    colorPicker;
    iconeSelector;

    tiposCuidado;
    acaoSelecionado;
    objFiltroAcoes = [ 'descricao', 'descricao' ];
    
    
    @ViewChild("formPergunta", {read: ElementRef}) formPergunta: ElementRef;

    constructor( 
        private _state: GlobalState, 
        public router: Router,
        private route: ActivatedRoute,
        private modalService: NgbModal,
        private renderer: Renderer2,
        private serviceCuidadoTipo: CuidadoTipoService,
        private toastr: ToastrService, 
        private vcr: ViewContainerRef,
        private servicePergunta: PerguntaService
    ) { 
        this.route.params.subscribe(params => {
            this.cuidadoTipoId = params['cuidadoTipoId'] == 'novo' ? undefined : params['cuidadoTipoId'];
        });

        this.risco = new Object();
    }
    
    ngOnDestroy(){
    }
    
    ngOnInit() {
        this.buscaCuidadosTipo();
    }

    ngAfterViewInit() {        
    }


    pesquisarTiposCuidado(texto) {
        this.buscaCuidadosTipo(texto);
    }
    buscaCuidadosTipo(evento = null) {
        this.paginaAtualAcoes = evento ? evento.paginaAtual : this.paginaAtualAcoes;

        this.serviceCuidadoTipo.get({pagina: this.paginaAtualAcoes, quantidade: this.itensPorPaginaAcoes, simples: true}).subscribe(
            (tiposCuidado) => {
                this.tiposCuidado = tiposCuidado.dados;
                this.qtdItensTotalAcoes = tiposCuidado.qtdItensTotal;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        );
    }

    fnCfgAcoesRemote(term) {
        this.objFiltroAcoes = ['descricao', 'descricao'];
        return this.serviceCuidadoTipo.get( { like : term, pagina : 1, quantidade : 10 } , true )
    }

    removeAcao(id, pos, event){
        if( confirm("Deseja excluir essa ação?") ){
            this.serviceCuidadoTipo.delete(id).subscribe(
                retorno => {
                    this.tiposCuidado[pos].excluido = true;
                    this.toastr.success("Ação foi desativada com sucesso")
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                },
            ) 
            event.stopPropagation();
        }
    }


    filtrarAcoes(){
        if( this.acaoSelecionado ){
            
            this.serviceCuidadoTipo.get( { id : this.acaoSelecionado.id }, false ).subscribe(
                (tiposCuidado) => {
                    this.tiposCuidado = tiposCuidado.dados;
                    this.qtdItensTotalAcoes = tiposCuidado.qtdItensTotal;
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                }
            )
        }
    }

    abrir(acao) {
        let sId = acao ? acao.id : 'novo';        
        this.router.navigate([`/${Sessao.getModulo()}/cuidadotipo/${sId}`]);
    }

    buscaAcoes(evento){

    }
}