import { Component, Input, ChangeDetectionStrategy, EventEmitter, ChangeDetectorRef, SimpleChanges, OnInit, OnChanges, ViewChild, TemplateRef, QueryList, Output } from '@angular/core';

import { Servidor } from '../../../../services/servidor';
import { Sessao } from '../../../../services/sessao';

import { UtilService } from '../../../../services';

import { FormatosData } from '../../../../theme/components/agenda/agenda';
import { ActivatedRoute } from '@angular/router';
import { NgbdModalContent } from 'app/theme/components';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { GridAdicionarProcedimento } from '../gridAdicionarProcedimento';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'listaProcedimentos',
    templateUrl: './grid.component.html',
    styleUrls: ['./grid.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [GridAdicionarProcedimento]
})
export class ListaProcedimentos implements OnInit, OnChanges {

    @Input() filtros = {};
    @Input() codigo;
    @Input() labelIdAdd;
    @Input() labelIdList;
    @Input() service;
    @Input() modoSelecao = false;
    @Input() paginacaoScroll = false;
    @Input() novoProcedimento = [];
    @Input() modoDetalhado = true;
    @Input() somenteVisualizacao = true;

    items;
    expandido = false;

    requestBODY = new Object();
    visualizaHistoricoRealizacao = true;
    constructor(
        // private serviceAtendimentoTuss: AtendimentoTipoTussService,
        // private serviceProdutoTuss: ProdutoTussService,
        private modalService: NgbModal,
        private serviceUtil: UtilService,
        private toastr: ToastrService,
        private cdr: ChangeDetectorRef,
        private route: ActivatedRoute,
        private adicionarProcedimentoComponent: GridAdicionarProcedimento
    ) { }

    formatosDeDatas;
    ngOnInit() {
        this.formatosDeDatas = new FormatosData();
        this.cdr.markForCheck();
        console.log(this.service);
        this.buscarProcedimentos();
    }

    ngOnDestroy() {
        this.cdr.detach();
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes && changes['novoProcedimento'] && changes['novoProcedimento']['currentValue'] && changes['novoProcedimento']['currentValue'].length) {
            let idProcedimento = changes['novoProcedimento']['currentValue'][changes['novoProcedimento']['currentValue'].length - 1]
            this.retornoProcedimento({ id: idProcedimento });
        }
    }

    qtdItensTotal;
    paginaAtual = 1;
    itensPorPagina = 5;
    buscarProcedimentos(evento:any = {}) {

        let request = {
            pagina: evento.paginaAtual || this.paginaAtual,
            quantidade: this.itensPorPagina
        }

        request = Object.assign( request, evento );

        request[this.labelIdList] = this.codigo

        this.service.get(request).subscribe(
            (items) => {
                let retorno = items.dados || items;

                this.items = retorno;
                this.qtdItensTotal = items.qtdItensTotal;

                this.cdr.markForCheck();
            },
            (erro) => {
                Servidor.verificaErro(erro);
                this.cdr.markForCheck();
            },
        )
    }

    buscarProcedimentosLike(like = null){
        if( like && like != '' ){
            let request = {
                paginaAtual: 1,
                like: like
            };
            this.buscarProcedimentos(request);
        }else{
            let request = {
                paginaAtual: 1
            };
            this.buscarProcedimentos(request);
        }
    }

    retornoProcedimento(novoProcedimento) {
        this.paginaAtual = 1;
        this.buscarProcedimentos();
    }

    arrayChecados = [];
    verificaSeChecou(procedimento) {
        return this.arrayChecados.indexOf(procedimento.id) > -1;
    }

    @Output() setProcedimentoChecados = new EventEmitter();
    checkProcedimento(checado, procedimento) {
        if (checado) {
            this.arrayChecados.push(procedimento.id);
        } else {
            this.arrayChecados = this.arrayChecados.filter(
                (id) => {
                    return id != procedimento.id;
                }
            )
        }

        let arrayProcedimentosChecados = this.arrayChecados.map((id) => { return { id: id } });
        this.setProcedimentoChecados.emit(arrayProcedimentosChecados);

    }

    modalNovoProcedimento;
    valorProcedimentoSelecionado;
    @ViewChild("modalEditaProcedimento", { read: TemplateRef }) modalEditaProcedimento: TemplateRef<any>;
    @ViewChild("modalEditaProcedimentoBotoes", { read: TemplateRef }) modalEditaProcedimentoBotoes: TemplateRef<any>;

    abreModalItem(item) {

        this.valorProcedimentoSelecionado = item.procedimento.descricao;
        console.log(item);

        let cfgGlobal: any = Object.assign(NgbdModalContent.getCfgGlobal(), { size: 'lg' });

        this.modalNovoProcedimento = this.modalService.open(NgbdModalContent, cfgGlobal);
        this.modalNovoProcedimento.componentInstance.modalHeader = 'Editar Procedimento';
        this.modalNovoProcedimento.componentInstance.templateRefBody = this.modalEditaProcedimento;
        this.modalNovoProcedimento.componentInstance.templateBotoes = this.modalEditaProcedimentoBotoes;

        let procedimentoItem = JSON.parse(JSON.stringify(item));
        this.modalNovoProcedimento.componentInstance.contextObject = {
            procedimentoItem: procedimentoItem
        };

        this.modalNovoProcedimento.result.then(
            (data) => { },
            (reason) => { })

    }

    modalConfirmar;
    @ViewChild("bodyModalConfirm", { read: TemplateRef }) bodyModalConfirm: QueryList<TemplateRef<any>>;

    removeItem(procedimento) {

        this.modalConfirmar = this.modalService.open(NgbdModalContent, { backdrop: 'static', keyboard: false });
        this.modalConfirmar.componentInstance.modalHeader = 'Remover';
        this.modalConfirmar.componentInstance.templateRefBody = this.bodyModalConfirm;
        this.modalConfirmar.componentInstance.modalAlert = true;

        this.modalConfirmar.componentInstance.retorno.subscribe(
            (retorno) => {
                if (retorno) {
                    this.service.delete(procedimento.id).subscribe(
                        (retorno) => {
                            this.retornoProcedimento(procedimento);
                            this.toastr.success("Item removido com sucesso");
                        },
                        (erro) => {
                            Servidor.verificaErro(erro, this.toastr);
                            this.toastr.error("Houve um erro ao remover item");
                        }
                    )

                } else {
                    console.log("Nao remove");
                }
            }
        );


    }

    salvarProcedimento(procedimento) {
        let request = this.adicionarProcedimentoComponent.retornaObjValidado(procedimento);
        console.log(request);

        this.service.put(request.id, request).subscribe(
            (retorno) => {
                this.retornoProcedimento(procedimento);
                this.toastr.success("Procedimento salvo com sucesso");
                this.modalNovoProcedimento.dismiss();
            },
            (erro) => {
                Servidor.verificaErro(erro);
            }
        )
    }
}