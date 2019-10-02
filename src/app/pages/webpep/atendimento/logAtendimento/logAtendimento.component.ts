import { Component, Input, Output, ViewContainerRef, EventEmitter, OnInit } from '@angular/core';
import { GuiaLogService, TabelaApi, UsuarioService, LogAtendimentoService, UtilService } from '../../../../services';

import { Servidor } from '../../../../services/servidor';
import { Sessao } from '../../../../services/sessao';

import { ActivatedRoute, Router } from '@angular/router';
import { Http } from '@angular/http';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ToastrService } from 'ngx-toastr';


import * as moment from 'moment';

moment.locale('pt-br');

@Component({
    selector: 'logAtendimento',
    templateUrl: './logAtendimento.html',
    styleUrls: ['./logAtendimento.scss'],
    providers: []
})
export class LogAtendimento implements OnInit {
    
    token;
    guidUsuario = (localStorage.getItem('usuario')) ? JSON.parse(localStorage.getItem('usuario'))['guid'] : 'guid_invalido';
    mensagens = [];
    momentjs = moment;
    permiteUpload = false;
    serverUrl;

    @Input() atendimentoId;
    @Input() mostraBotaoVoltar = true;
    @Output() refresh: EventEmitter<any> = new EventEmitter();

    private servidor;

    constructor(
        private toastr: ToastrService, 
        private vcr: ViewContainerRef,
        private router: Router,
        private route: ActivatedRoute,
        private serviceUtil: UtilService,
        private usuarioService: UsuarioService,
        private logService: LogAtendimentoService,
        http: Http
    ) {
        this.servidor = new Servidor(http, router);
        this.token = localStorage.getItem('token');
    }

    ngOnInit() {
        this.refresh.emit({
            carregaMensagens: this.carregaMensagens.bind(this),
        });
    }

    ngAfterViewInit() {
        this.carregaMensagens();
    }

    carregaMensagens() {
        if (!this.atendimentoId){
            return;
        }

        let id = this.atendimentoId;
        let request = {
            atendimentoId: id
        };
        this.logService.get(request).subscribe((resposta) => {
            this.mensagens = this.validaObjetoMensagens( resposta.dados );
        }, 
        (erro) => { 
            Servidor.verificaErro(erro, this.toastr);
            this.toastr.warning(erro); 
        });
    }

    pegaFotoImagem(mensagem){
        let sUrl = mensagem.src;

        if (mensagem.usuario && mensagem.usuario.guid) {
            sUrl = this.usuarioService.fotoPorGuid('FOTO', mensagem.usuario.guid, false);
        }
        
        return sUrl;
    }

    extensaoAnexo(extensao) {
        switch (extensao) {
            case '.pdf':
                return 'pdf';

            case '.png':
            case '.jpg':
            case '.jpeg':
                return 'image';

            default:
                return 'archive';
        }
    }

    abrirAnexo(id) {
        window.open(this.serviceUtil.getArquivo(id, true), '_blank');
    }

    validaObjetoMensagens(retorno){

        return retorno.map((log) => {
            log.posicao = log.usuario ? ( (log.usuario.guid == this.guidUsuario) ? 'right' : 'left' ) : 'center';
            log.src = log.usuario ? '' : 'assets/img/theme/no-photo.png';
            log.nome = log.usuario ? log.usuario.nome : 'SISTEMA';

            return log;
        });

    }

    nomeArquivo;
    arquivo;
    uploadArquivo(arquivos) {
        
        var reader:any = new FileReader();
        reader.readAsBinaryString(arquivos[0]);
        this.nomeArquivo = arquivos[0].name;

        reader.onload = () => {
            this.arquivo = btoa(reader.result);
        };
        reader.onerror = () => {
            console.log('Erro ao carregar arquivo');
        };
    }
}