import { Component, ViewChild, ViewContainerRef, EventEmitter, ElementRef, Renderer, OnInit, AfterViewInit, TemplateRef, QueryList } from '@angular/core';
import { NgxUploaderModule } from 'ngx-uploader';
import { CuidadoTipoService, TabelaApi } from '../../../../services';
import { Servidor } from '../../../../services/servidor';
import { Sessao } from '../../../../services/sessao';
import { ActivatedRoute, Router } from '@angular/router';

import { NgbdModalContent } from '../../../../theme/components/modal/modal.component';
import { FormatosData } from '../../../../theme/components/agenda/agenda';
import { NgbModal, NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';

import { ToastrService } from 'ngx-toastr';

import * as moment from 'moment';

moment.locale('pt-br');

@Component({
    selector: 'detalheCuidadoTipo',
    templateUrl: './detalheCuidadoTipo.html',
    styleUrls: ['./detalheCuidadoTipo.scss'],
    providers: []
})
export class DetalheCuidadoTipo implements OnInit {
    
    cuidadoTipo;
    cuidadoTipoId;
    tiposTabela;
    atual = "geral";
    opcoesConflitos = [];

    modalInstancia;

    @ViewChild("bodyModalRemoverTipoCuidado", {read: TemplateRef}) bodyModalRemoverTipoCuidado: QueryList<TemplateRef<any>>;
    @ViewChild("footerModalRemoverTipoCuidado", {read: TemplateRef}) footerModalRemoverTipoCuidado: QueryList<TemplateRef<any>>;

    constructor(
        private toastr: ToastrService, 
        private vcr: ViewContainerRef,
        private router: Router,
        private route: ActivatedRoute,
        private cuidadoTipoService: CuidadoTipoService,
        private tabelaApiService: TabelaApi,
        private modalService: NgbModal,
    ) {
        this.route.params.subscribe(params => {
            this.cuidadoTipoId = params['cuidadoTipoId'] == 'novo' ? undefined : params['cuidadoTipoId'];
            this.carregaTipoCuidado();
        });

        this.iniciaAcao();
    }

    ngOnInit() {

        this.atual = 'geral';

        this.opcoesConflitos = [
            { descricao:'E', id:'E'},
            { descricao:'OU', id:'OU'},
        ];
        this.iniciaTabelas();
    }

    ngAfterViewInit() {

    }

    //  =============================================
    //                  GETs and SETs
    //  =============================================
    getNome(evento) {
        if (!this.cuidadoTipo){
            return;
        }
        this.cuidadoTipo.descricao = evento.valor;
    }
    getTabela(evento) {
        if (!this.cuidadoTipo){
            return;
        }

        if( evento.valor ){
            this.cuidadoTipo.tabela = {id:evento.valor};
        }
    }

    //  =============================================
    //                  Componentes dados
    //  =============================================
    iniciaAcao() {
        this.cuidadoTipoId = undefined;
        this.cuidadoTipo = new Object();
    }

    carregaTipoCuidado() {
        if (!this.cuidadoTipoId){
            return;
        }

        let id = this.cuidadoTipoId;
        let request = {id: id};

        this.cuidadoTipoService.get(request).subscribe(
            (cuidadoTipoResponse) => { 
                this.cuidadoTipo = cuidadoTipoResponse.dados[0];
                this.cuidadoTipoId = this.cuidadoTipo.id;
            },
            (erro) => { 
                Servidor.verificaErro(erro, this.toastr);
                this.toastr.warning(erro); }
        );
    }

    iniciaTabelas() {
        this.tabelaApiService.get().subscribe((tabelas)=> {
            this.tiposTabela = tabelas.dados;
        },
        (erro) => {
            Servidor.verificaErro(erro, this.toastr);
        },);
    }

    //  =============================================
    //              Eventos components
    //  =============================================
    navegar(aba) {
        this.atual = aba;
    }

    voltar() {
        this.router.navigate([`/${Sessao.getModulo()}/cuidadotipo`]);
    }

    //  =============================================
    //                  Ações
    //  =============================================
    validaTipoCuidado() {
        
        if (!this.cuidadoTipo.descricao) {
            this.toastr.warning('Informe o nome');
            return;
        }

        // if (!this.cuidadoTipo.tabela) {
        //     this.toastr.warning('Informe a tabela');
        //     return;
        // }

        return true;
    }
    salvarCuidadoTipo() {

        if (!this.validaTipoCuidado()) {
            return;
        }

        let id = this.cuidadoTipoId;
        let request = {
            id: id,
            descricao: this.cuidadoTipo.descricao,
        };

        if( this.cuidadoTipo.tabela && this.cuidadoTipo.tabela.id != '0' ){
            request['tabela'] = this.cuidadoTipo.tabela;
        }

        if (this.cuidadoTipoId) {
            this.cuidadoTipoService.put(request).subscribe(
                (cuidadoResponse) => { 
                    this.toastr.success(`Tipo de Cuidado atualizada com sucesso`); 
                },
                (erro) => { 
                    Servidor.verificaErro(erro, this.toastr);
                    this.toastr.warning(erro); }
            );
        } else {
            this.cuidadoTipoService.post(request).subscribe(
                (cuidadoResponse) => {
                    this.router.navigate([`/${Sessao.getModulo()}/cuidadotipo/${cuidadoResponse}`]); 
                },
                (erro) => { this.toastr.warning(erro); }
            );
        }
    }

    abrirModalExcluir() {
        this.modalInstancia = this.modalService.open(NgbdModalContent, {size: 'lg'});
        this.modalInstancia.componentInstance.modalHeader = `Remover Tipo de Cuidado`;

        this.modalInstancia.componentInstance.templateRefBody = this.bodyModalRemoverTipoCuidado;
        this.modalInstancia.componentInstance.templateBotoes = this.footerModalRemoverTipoCuidado;

        let fnSuccess = () => { console.log("Modal Fechada!");};
        let fnError = (erro) => { console.log("Modal Fechada!"); };
        this.modalInstancia.result.then((data) => fnSuccess, fnError);
    }

    excluir() {
        let id = this.cuidadoTipoId;
        this.cuidadoTipoService.delete(id).subscribe(

            (riscoResponse) => { 
                this.modalInstancia.close(); 
                this.voltar(); 
                this.toastr.success(`Tipo de Cuidado excluido com sucesso`); 
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
                this.toastr.warning(erro); }
        );
    }
}