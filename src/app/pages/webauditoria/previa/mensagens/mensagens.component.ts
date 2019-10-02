import { Component, ViewChild, Input, Output, ViewContainerRef, EventEmitter, ElementRef, Renderer, OnInit, AfterViewInit, TemplateRef, QueryList } from '@angular/core';
import { NgxUploaderModule } from 'ngx-uploader';
import { GuiaLogService, TabelaApi, UsuarioService } from '../../../../services';

import { Servidor } from '../../../../services/servidor';
import { Sessao } from '../../../../services/sessao';

import { ActivatedRoute, Router } from '@angular/router';
import { Http, Headers, Response } from '@angular/http';

import { NgbdModalContent } from '../../../../theme/components/modal/modal.component';
import { NgbModal, NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';

import { ToastrService } from 'ngx-toastr';


import * as moment from 'moment';

moment.locale('pt-br');

@Component({
    selector: 'mensagens',
    templateUrl: './mensagens.html',
    styleUrls: ['./mensagens.scss'],
    providers: []
})
export class Mensagens implements OnInit {
    
    id;
    token;
    mensagens = [];
    momentjs = moment;
    serverUrl;

    @Input() guiaId;
    @Input() historico = true;
    @Input() mostraBotaoVoltar = true;
    @Output() refresh: EventEmitter<any> = new EventEmitter();


    private servidor;

    constructor(
        private toastr: ToastrService, 
        private vcr: ViewContainerRef,
        private router: Router,
        private route: ActivatedRoute,
        private guiaLogService: GuiaLogService,
        private tabelaApiService: TabelaApi,
        private usuarioService: UsuarioService,
        private modalService: NgbModal,
        http: Http
    ) {
        this.servidor = new Servidor(http, router);
        this.serverUrl = this.servidor.getUrl('');

        this.route.params.subscribe(params => {
            this.id = this.guiaId;
            this.carregaMensagens();
        });

        this.token = localStorage.getItem('token');
    }

    ngOnInit() {
        this.refresh.emit({
            carregaMensagens: this.carregaMensagens.bind(this),
            chat: !this.historico
        });
    }

    ngAfterViewInit() {
        this.id = this.guiaId;
    }

    //  =============================================
    //                  GETs and SETs
    //  =============================================

    //  =============================================
    //                  Metodos do Componente
    //  =============================================
    carregaMensagens(tipo = undefined) {
        if (!this.id){
            return;
        }

        let id = this.id;
        let request = {guiaId: id};
        this.guiaLogService.get(request).subscribe((resposta) => {
            let aMensagens = resposta.dados.map((log, i ) => {
                //log.posicao = i%2 == 0 ? 'left' : 'right',
                //  Descomentar Aqui
                log.posicao = log.tipo == 'OPERADORA' ? 'right' : (log.tipo == 'NORMAL' ? 'center' : 'left');
                log.src = log.usuario ? '' : 'assets/img/theme/no-photo.png';
                log.nome = log.usuario ? log.usuario.nome : log.nome;

                return log;
            });

            this.mensagens = aMensagens.filter((mensagem) => {

                if (this.historico) {
                    return !mensagem.chat;
                }
                mensagem.arquivos = mensagem.arquivos || [];

                return mensagem.chat;
            });

        }, (erro) => { this.toastr.warning(erro); });
    }

    pegaFotoImagem(mensagem){
        let sUrl = mensagem.src;
        let token = localStorage.getItem('token');
        let base = window.location.origin;

        if (mensagem.usuario && mensagem.usuario.guid) {

            //sUrl = `${base}/#/webresources/web/usuario/imagem/${token}/FOTO/${mensagem.usuario.guid}`;
            sUrl = this.usuarioService.fotoPorGuid('FOTO', mensagem.usuario.guid, false);
        }
        
        return sUrl;
    }

    eAnexo(descricao){
        if( descricao ){
            return descricao.match(/FINALIZAÇÃO DE ANEXO:/g);
        }else{
            return false;
        }
    }
    getNomeAnexo(descricao){
        return descricao.replace(/.*FINALIZAÇÃO DE ANEXO:/g, '').trim();
    }

    //  =============================================
    //              Eventos components
    //  =============================================
    voltar() {
        this.router.navigate([`/${Sessao.getModulo()}/previa`]);
    }

    //  =============================================
    //                  Ações
    //  =============================================
    
}