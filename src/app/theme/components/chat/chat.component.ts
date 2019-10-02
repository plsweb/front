import { Component, ChangeDetectionStrategy, ChangeDetectorRef, ElementRef, ViewChild, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ChatService, ChatDestinatarioService, ChatMensagemService, PacienteCoacherService, UsuarioService, UtilService } from 'app/services';
import { Servidor } from 'app/services/servidor';
import { ToastrService } from 'ngx-toastr';
import { Sessao } from '../../../services/sessao';
import { debounceTime } from 'rxjs/operators';
import { Subject, Observable } from 'rxjs';
import * as moment from 'moment';
import { FormatosData } from '../../components/agenda/agenda'

@Component({
    selector: 'chat',
    styleUrls: ['./chat.scss'],
    templateUrl: './chat.html',
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class Chat implements OnChanges {

    @Input() mostraPopup = true;
    @Input() chatSelecionado;

    public novosChats: number;
    public chats;
    chatAbertos = [];
    usuarioGuid = Sessao.getUsuario()['guid'];
    token = Sessao.getToken();

    formatosDeDatas;
    requestPadrao = {
        simples: true,
        pagina: 1,
        quantidade: 30
    }
    totalMensagens:number;
    debounce: Subject<any> = new Subject<any>();

    @ViewChild('divChatMensagens') private divChatMensagens: ElementRef;

    constructor(
        private serviceUtil: UtilService,
        private serviceChat: ChatService,
        private usuarioService: UsuarioService,
        private serviceChatMensagem: ChatMensagemService,
        private serviceChatDestinatario: ChatDestinatarioService,
        private servicePacienteCoacher: PacienteCoacherService,
        private toastr: ToastrService,
        private cdr: ChangeDetectorRef
    ) {

    }

    qtdItensTotal;
    paginaAtual = 1;
    itensPorPagina = 0;
    ngOnInit() {

        this.formatosDeDatas = new FormatosData();
        this.getMensagens();
        
        this.debounce.pipe(debounceTime(500)).subscribe(
            (value) => {
                console.log('Value changed to', value);
            }
        );
    }

    ngOnChanges(changes: SimpleChanges){
        
        if( changes['chatSelecionado'] ){          
            console.log(changes['chatSelecionado']);

            let antes = changes['chatSelecionado']["previousValue"];
            let depois = changes['chatSelecionado']["currentValue"];

            let novoMelhorado = Object.assign(depois, antes);

            this.chatSelecionado = novoMelhorado;
            this.chatSelecionado['mensagem'] = depois['mensagem'];
            this.chatSelecionado['destinatarios'] = depois['destinatarios'];
            this.chatSelecionado['nome'] = depois['nome'];

            if( antes && (antes['mensagem'].length < depois['mensagem'].length) ){
                this.scrollToBottom(1, 100);
            }else if( !antes ){
                this.scrollToBottom(1, 100);
            }
        }
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

    abrirChat(chat) {
        chat.ativo = true;
        let duplicado = this.chatAbertos.filter(chats => chats.id == chat.id);

        if (duplicado.length) {
            return;
        } else if (this.chatAbertos.length == 3) {
            this.chatAbertos.pop();    
        }
        this.chatAbertos.unshift(chat);
    }

    fecharChat(chat, pos) {
        if (!chat.ativo) {
            this.chatAbertos.splice(pos,1);
        }
        chat.ativo = false;
    }

    timerChat;
    timerMensagens;
    getMensagens(evento = null){
        let request = {
            usuarioGuid: this.usuarioGuid,
            simples: false,
            pagina: evento && evento.paginaAtual ? evento.paginaAtual : 1,
            quantidade: this.itensPorPagina
        }

        request = Object.assign( this.requestPadrao, request );

        this.timerChat = Observable.timer(0, 30000)
            .timeInterval()
            .subscribe(
                (ok) => {
                    // SO EXECUTA SE USUARIO ESTIVER LOGADO E NAO FOR NA BASE LOCAL
                    if( Sessao.getToken() && Sessao.getBase() != "local" ){
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
                    }else{
                        this.timerChat.unsubscribe();
                    }
                }
        )

        this.timerMensagens = Observable.timer(0, 15000)
            .timeInterval()
            .subscribe(
                (ok) => {
                    
                    // SO EXECUTA SE USUARIO ESTIVER LOGADO E NAO FOR NA BASE LOCAL
                    if( Sessao.getToken() && Sessao.getBase() != "local" ){

                    if( this.chatAbertos && this.chatAbertos.length ){
                        this.chatAbertos.forEach(
                            (chat, i) => {
                                let request = {
                                    usuarioGuid: this.usuarioGuid,
                                    id: chat.id,
                                    simples: false
                                }
                                // this.serviceChat.get(request).subscribe(
                                //     (retorno) => {
                                //         let chat = retorno.dados || retorno;
                                //         this.chatAbertos[i].mensagem = chat[0].mensagem;
                                //         this.chatAbertos[i].destinatarios = chat[0].destinatarios;
                                //         this.cdr.markForCheck();
                                //     },
                                //     (erro) => {
                                //         Servidor.verificaErro(erro, this.toastr);
                                //         this.cdr.markForCheck();
                                //     }
                                // )
                            }
                        )
                    }else{
                        // console.warn("nao tem chats abertos");
                    }

                    }else{
                        this.timerMensagens.unsubscribe();
                    }
                    
                }
        )
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
        this.cdr.markForCheck();
    }

    visualizouChats(){
        this.novosChats = 0;
    }

    mostraUltimaMensagem(chat) {
        if ( chat.mensagem.length > 1 ){
            // console.log("Varias mensagens");

            return chat.mensagem[ chat.mensagem.length - 1 ].mensagem;

        } else {
            // console.log("SO UMA MENSAGEM");

            return chat.mensagem[0].mensagem;
        }
    }

    inserirDestinatario(novoChat){
        if (!this.destinatario['usuario']) {
            return;
        }

        let request = {
            chat: {
                id: novoChat.id
            },
            usuario: this.destinatario['usuario']
        }

        this.serviceChatDestinatario.post( request ).subscribe(
            (retorno) => {
                ( novoChat['destinatarios'] && novoChat['destinatarios'].length ) ? novoChat['destinatarios'].push( this.destinatario ) : [this.destinatario];
                // novoChat['destinatarios'].concat(novoChat['destinatarios'], [this.destinatario])
                this.destinatario = new Object();
                this.usuarioSelecionado = '';
                this.abrirChat(novoChat);
                this.cdr.markForCheck();
            }
        );
    }

    removerDestinatario(destinatario) {
        this.serviceChatDestinatario.delete(destinatario.id).subscribe(
            (retorno) => {
                this.toastr.warning(`${destinatario.usuario.nome} removido do chat`);
                this.chatAbertos[destinatario.chat.id].forEach(element => {
                    console.log(element);
                });
                this.cdr.markForCheck();
            }
        )
    }

    enviarMensagem(chat, mensagem, pos){
        // REALIZAR POST
        // console.log(chat, mensagem);

        let request = {
            chat: {
                id: chat.id
            },
            remetente: {
                guid: this.usuarioGuid
            },
            mensagem : mensagem
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
                this.cdr.markForCheck();
                this.scrollToBottom(pos);
            }
        )
    }

    arquivo: any = false;
    enviarAnexo(anexo, chat) {
        this.arquivo = anexo;
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
                chat.mensagem.push( novaMensagem );
                chat.novaMensagem = undefined;
                this.cdr.markForCheck();
                this.arquivo = false;
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

    usuarioSelecionado;
    getUsuario(evento, chat = false){
        if ( evento ){ console.log(evento)
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
        this.cdr.markForCheck();
    }

    objUsuario;
    destinatario = new Object();
    fnCfgUsuarioRemote(term) {
        this.usuarioService.usuarioPaginadoFiltro( 1, 10, term ).subscribe(
            (retorno) => {
                this.objUsuario = retorno.dados || retorno;
                this.cdr.markForCheck();
            }
        )
    }

    scrollToBottom(pos, tempo = 1): void {
        setTimeout(() => {
            try {
                let chatElement = document.getElementById(`index-${pos}`);
                chatElement.scrollTop = chatElement.scrollHeight;
            } catch(err) {
                console.warn("nao foi possivel rolar...");
            }     
        }, tempo);   
    }
}