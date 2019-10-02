import { Component, ChangeDetectorRef, ViewChild, TemplateRef } from '@angular/core';
import { ChatService, ChatDestinatarioService, ChatMensagemService, PacienteCoacherService, UsuarioService, UtilService } from 'app/services';
import { Servidor } from 'app/services/servidor';
import { ToastrService } from 'ngx-toastr';
import { Sessao } from '../../../services/sessao';
import { debounceTime } from 'rxjs/operators';
import { Subject, Observable } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbdModalContent } from '../../../theme/components/modal/modal.component';

import * as moment from 'moment';
import { FormatosData } from '../../../theme/components/agenda/agenda'

@Component({
	selector: 'tela-chat',
	templateUrl: './chat.html',
	styleUrls: ['./chat.scss'],
})
export class Chat {
    usuarioGuid = Sessao.getUsuario()['guid'];
    modalChatMensagem;
    colunasTabela;
    ordenacao;
    chats = [];
    
    public novosChats: number;
    totalMensagens:number;
    chatAberto;

    formatosDeDatas;
    requestPadrao = {
        simples: true,
        pagina: 1,
        quantidade: 30
    }

    debounce: Subject<any> = new Subject<any>();

    @ViewChild("chatMensagem", {read: TemplateRef}) chatMensagem: TemplateRef<any>;

	constructor(
        private modalService: NgbModal,
        private serviceUtil: UtilService,
        private serviceChat: ChatService,
        private usuarioService: UsuarioService,
        private serviceChatMensagem: ChatMensagemService,
        private serviceChatDestinatario: ChatDestinatarioService,
        private servicePacienteCoacher: PacienteCoacherService,
        private toastr: ToastrService,
        private cdr: ChangeDetectorRef
    ) {
        this.ordenacao = {
            tipo: 'desc',
            ordem: 'data',
            paginaAtual: 1,
            itensPorPagina: 30
        };

        this.colunasTabela = [
            {'titulo': 'Data', 'chave': 'data', 'filtroClasse': 'DATE',   'filtroTipo': 'IGUAL'},
            {'titulo': 'Chat', 'chave': 'nome', 'filtroClasse': 'STRING', 'filtroTipo': 'LIKE'},
        ];
    }

	ngOnInit() {
        this.formatosDeDatas = new FormatosData();
        this.getChat(true);
        
        this.debounce.pipe(debounceTime(500)).subscribe(
            (value) => {
                console.log('Value changed to', value);
            }
        );
    }

    ngOnDestroy() {
        this.cdr.detach();
        this.debounce.unsubscribe();
    }

    criarChat() {
        if( !this.destinatario['usuario'] ){
            this.toastr.warning("Selecione um usuario para o chat");
        }

        let novoChat = {
            nome: this.destinatario['usuario'].nome
        }

        this.serviceChat.post(novoChat).subscribe(
            (retorno) => {
                novoChat['id'] = retorno;
                this.inserirDestinatario(novoChat);
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
                this.cdr.markForCheck();
            }
        );
    }
    
    timerChat;
    abrirChat(chat) {

        let cfgGlobal:any = Object.assign(NgbdModalContent.getCfgGlobal(), {size: 'lg'});
        
        this.modalChatMensagem = this.modalService.open(NgbdModalContent, cfgGlobal );
        this.modalChatMensagem.componentInstance.modalHeader = chat['nome'];
        this.modalChatMensagem.componentInstance.templateRefBody = this.chatMensagem;

        this.modalChatMensagem.result.then(
            (close) => {
                this.chatAberto = false;
                this.timerChat.unsubscribe();
            },
            (dismiss) => {
                this.chatAberto = false;
                this.timerChat.unsubscribe();
            }
        )

        this.timerChat = Observable.timer(0, 5000).timeInterval()
        .subscribe(
            (ok) => {

                if( Sessao.getToken() && true ){
                    let request = {
                        id: chat.id,
                        simples: false
                    }

                    this.serviceChat.get(request).subscribe(
                        (retorno) => {
                            let chat = retorno.dados || retorno;
                            this.chatAberto = chat[0];
                            this.chatAberto.ativo = true;

                            // this.serviceChatDestinatario.get({usuarioGuid: this.usuarioGuid}).subscribe();
                        },
                        (erro) => {
                            Servidor.verificaErro(erro, this.toastr);
                        }
                    )
                }
            }
        )
    }

    timerChats;
    getChat(simples = false, evento = null){
        let request = {
            usuarioGuid: this.usuarioGuid,
            simples: simples,
            quantidade: this.ordenacao.itensPorPagina,
            pagina: evento && evento.paginaAtual ? evento.paginaAtual : 1,
        }

        this.timerChats = Observable.timer(0, 15000)
        .timeInterval()
        .subscribe(
            (ok) => {
                request = Object.assign( this.requestPadrao, request );

                // SO EXECUTA SE USUARIO ESTIVER LOGADO E NAO FOR NA BASE LOCAL
                if( Sessao.getToken() && true ) { //Sessao.getBase() != "local"
                    this.serviceChat.get(request).subscribe(
                        (retorno) => {
                            this.totalMensagens = retorno.qtdItensTotal;
                            this.atualizaNovosChats(retorno.qtdItensTotal);
                            this.chats = retorno.dados || retorno;
                            this.cdr.markForCheck();
                        },
                        (erro) => {
                            Servidor.verificaErro(erro, this.toastr);
                            this.cdr.markForCheck();
                        }
                    )
                } else {
                    this.timerChats.unsubscribe();
                }
            }
        )
    }

    timerMensagens;
    getMensagens() {
        // SO EXECUTA SE USUARIO ESTIVER LOGADO E NAO FOR NA BASE LOCAL
        if( Sessao.getToken() && true ){ //Sessao.getBase() != "local"
            this.timerMensagens = Observable.timer(0, 3000).timeInterval()
                .subscribe((ok) => {
                    if ( this.chatAberto ) {
                        let request = {
                            usuarioGuid: this.usuarioGuid,
                            id: this.chatAberto['id'],
                            simples: false
                        }

                        this.serviceChat.get(request).subscribe(
                            (retorno) => {
                                let chat = retorno.dados || retorno;
                                this.chatAberto = chat[0];
                                this.cdr.markForCheck();
                            },
                            (erro) => {
                                Servidor.verificaErro(erro, this.toastr);
                                this.cdr.markForCheck();
                            }
                        )
                    } else {
                        console.warn("nao tem chats abertos");
                    }
                }
            );
        } else {
            this.timerMensagens.unsubscribe();
        }
    }

    fecharChat(chat, pos) {
        this.chatAberto = [];
        this.timerMensagens.unsubscribe();
    }

    atualizaNovosChats(chatsNovos){
        if( this.chats ){
            if( chatsNovos > this.totalMensagens ){
                this.novosChats = chatsNovos - this.totalMensagens;
            }else{
                this.novosChats = chatsNovos
            }
        }else{
            this.novosChats = chatsNovos;
        }
    }

    inserirDestinatario(novoChat){
        let request = {
            chat: {
                id: novoChat.id
            },
            usuario: this.destinatario['usuario'],
            data: moment().format(this.formatosDeDatas.dataHoraSegundoFormato)
        }

        this.serviceChatDestinatario.post( request ).subscribe(
            (retorno) => {
                this.toastr.success("Chat criado com sucesso");
                let chat = Object.assign(request, novoChat);
                this.chats.unshift( chat );
                this.usuarioSelecionado = '';
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
                this.toastr.error("Houve um erro ao criar um chat");
            }
        )
    }

    usuarioSelecionado;
    getUsuario(evento, chat = false){
        if ( evento ){
            this.destinatario['usuario'] = {
                guid : evento['guid'],
                nome : evento['nome']
            };
            this.usuarioSelecionado = evento['nome'];

            if (chat) {
                this.inserirDestinatario(chat);
            }
        } else {
            this.destinatario['usuario'] = undefined;
        }
    }

    objUsuario;
    destinatario = new Object();
    fnCfgUsuarioRemote(term) {
        this.usuarioService.usuarioPaginadoFiltro( 1, 10, term ).subscribe(
            (retorno) => {
                this.objUsuario = retorno.dados || retorno;
            }
        )
    }

    buscaBeneficiarioPaginado(evento){
    }

    enviarAnexo(anexo, chat) {
        let request = {
            chat: {
                id: chat.id
            },
            remetente: {
                guid: this.usuarioGuid
            },
            mensagem: `${anexo.file.descricao}${anexo.file.extensao}`,
            arquivo: { id: anexo.id }
        }

        this.serviceChatMensagem.post(request).subscribe(
            (retorno) => {
                let novaMensagem = {
                    id: retorno,
                    envio: moment().format(this.formatosDeDatas.dataHoraSegundoFormato),
                }

                novaMensagem = Object.assign( request, novaMensagem );
                chat.novaMensagem = undefined;
                chat.mensagem.push( novaMensagem );
            }
        );
    }

    abrirAnexo(id) {
        window.open(this.serviceUtil.getArquivo(id, true), '_blank');
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

    opcoesChat(chat) {
        console.log(chat)
    }
}