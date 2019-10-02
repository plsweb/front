import { Component, ViewChild, ViewContainerRef, EventEmitter, ElementRef, Renderer, OnInit, AfterViewInit, TemplateRef, QueryList } from '@angular/core';
import { NgxUploaderModule } from 'ngx-uploader';
import { GuiaClassificacaoService, TabelaApi } from '../../../../../services';

import { Servidor } from '../../../../../services/servidor';
import { Sessao } from '../../../../../services/sessao';

import { ActivatedRoute, Router } from '@angular/router';

import { NgbdModalContent } from '../../../../../theme/components/modal/modal.component';
import { NgbModal, NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';

import { ToastrService } from 'ngx-toastr';

import * as moment from 'moment';

moment.locale('pt-br');

@Component({
    selector: 'detalheClassificacao',
    templateUrl: './detalheClassificacao.html',
    styleUrls: ['./detalheClassificacao.scss'],
    providers: []
})
export class DetalheClassificacao implements OnInit {
    
    guiaClassificacao;
    guiaClassificacaoId;

    modalInstancia;

    @ViewChild("bodyModalRemoverClassificacao", {read: TemplateRef}) bodyModalRemoverClassificacao: QueryList<TemplateRef<any>>;
    @ViewChild("footerModalRemoverClassificacao", {read: TemplateRef}) footerModalRemoverClassificacao: QueryList<TemplateRef<any>>;

    constructor(
        private toastr: ToastrService, 
        private vcr: ViewContainerRef,
        private router: Router,
        private route: ActivatedRoute,
        private guiaClassificacaoService: GuiaClassificacaoService,
        private tabelaApiService: TabelaApi,
        private modalService: NgbModal,
    ) {

        this.route.params.subscribe(params => {
            this.guiaClassificacaoId = params['guiaClassificacaoId'] == 'novo' ? undefined : params['guiaClassificacaoId'];
            this.carregaClassificacao();
        });

        this.iniciaAcao();
    }

    ngOnInit() {
    }

    ngAfterViewInit() {

    }

    //  =============================================
    //                  GETs and SETs
    //  =============================================
    getValor(evento, campo) {
        if (!this.guiaClassificacao){
            return;
        }
        this.guiaClassificacao[campo] = evento.valor;
    }

    //  =============================================
    //                  Componentes dados
    //  =============================================
    iniciaAcao() {
        this.guiaClassificacaoId = undefined;
        this.guiaClassificacao = new Object();
    }

    carregaClassificacao() {
        if (!this.guiaClassificacaoId){
            return;
        }

        let id = this.guiaClassificacaoId;
        let request = {id: id};

        this.guiaClassificacaoService.get(request).subscribe(
            (guiaClassificacaoResponse) => { 
                this.guiaClassificacao = guiaClassificacaoResponse.dados[0];
                this.guiaClassificacaoId = this.guiaClassificacao.id;
            },
            (erro) => { this.toastr.warning(erro); }
        );
    }

    //  =============================================
    //              Eventos components
    //  =============================================
    voltar() {
        this.router.navigate([`/${Sessao.getModulo()}/classificacao`]);
    }

    //  =============================================
    //                  Ações
    //  =============================================
    validaClassificacao() {
        
        if (!this.guiaClassificacao.descricao) {
            this.toastr.warning('Informe a descrição');
            return;
        }

        return true;
    }
    salvarCuidadoTipo() {

        if (!this.validaClassificacao()) {
            return;
        }

        let id = this.guiaClassificacaoId;
        let request = {
            id: id,
            descricao: this.guiaClassificacao.descricao,
            ordem: this.guiaClassificacao.ordem
        };

        if (this.guiaClassificacaoId) {
            this.guiaClassificacaoService.put(request).subscribe(
                (classificacaoResposta) => { 
                    this.toastr.success(`Classificação atualizada com sucesso`); 
                },
                (erro) => { this.toastr.warning(erro); }
            );
        } else {
            this.guiaClassificacaoService.post(request).subscribe(
                (classificacaoResposta) => {
                    this.router.navigate([`/${Sessao.getModulo()}/classificacao/${classificacaoResposta}`]); 
                },
                (erro) => { this.toastr.warning(erro); }
            );
        }
    }

    abrirModalExcluir() {
        this.modalInstancia = this.modalService.open(NgbdModalContent, {size: 'lg'});
        this.modalInstancia.componentInstance.modalHeader = `Remover Classificação`;

        this.modalInstancia.componentInstance.templateRefBody = this.bodyModalRemoverClassificacao;
        this.modalInstancia.componentInstance.templateBotoes = this.footerModalRemoverClassificacao;

        let fnSuccess = () => { console.log("Modal Fechada!");};
        let fnError = (erro) => { console.log("Modal Fechada!"); };
        this.modalInstancia.result.then((data) => fnSuccess, fnError);
    }

    excluir() {
        let id = this.guiaClassificacaoId;
        this.guiaClassificacaoService.delete(id).subscribe(

            (riscoResponse) => { 
                this.modalInstancia.close(); 
                this.voltar(); 
                this.toastr.success(`Classificação excluida com sucesso`); 
            },
            (erro) => { this.toastr.warning(erro); }
        );
    }
}