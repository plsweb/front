import { Router } from '@angular/router';
import { Component, OnInit } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ToastrService } from 'ngx-toastr';

import { Servidor, UsuarioService, GuiaService, Sessao } from '../../../services';

import { Saida } from '../../../theme/components/entrada/entrada.component';
import { NgbdModalContent } from '../../../theme/components/modal/modal.component';

@Component({
    selector: 'perfil',
    templateUrl: './perfil.html',
    styleUrls: ['./perfil.scss'],
})
export class Perfil implements OnInit {

    id:string;
    nome:Saida;
    email:Saida;
    celular:Saida;
    nascimento:Saida;
    conselho:Saida;
    registro:Saida;
    receberemail:Saida;
    recebersms:Saida;
    ordemfila:Saida;
    uf:Saida;
    usuario;
    conselhos = [];
    ordensFilaAtendimento = [];
    imagem:string;
    senha:string;
    novasenha:Saida;
    confirmacao:Saida;
    assinatura:string;
    activeModal:any;

    constructor(
        private service: UsuarioService,
        private modalService: NgbModal,
        private guiaService: GuiaService,
        private toastr: ToastrService,
        private router: Router) {
        this.service.usuario().subscribe(
            usuario => {
                this.id = usuario.guid;
            }
        )
    }

    ngOnInit() {
        this.guiaService.getConselho()
            .subscribe((conselhos) => {
                this.conselhos = conselhos;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        );

        this.service.getOrdemFilaAtendimento()
            .subscribe((ordensFilaAtendimento) => {
                this.ordensFilaAtendimento = ordensFilaAtendimento;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        );

        this.service.usuarioSessao()
            .subscribe((usuario) => {
                this.usuario = usuario;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        );

        this.imagem = this.service.foto("FOTO");  
        this.assinatura = this.service.foto("ASSINATURA");  

    }

    submit() {
        this.salvar();
    }

    getImagemCompleta(objImagemBase64){
        
        let objImagem = { "imagem" : objImagemBase64["image"] }

        this.service.setImagem(objImagem, objImagemBase64["tipo"]).subscribe(
            (status) => {
                if (status) {
                    alert("Imagem editada com sucesso.");
                }
            }
        );

    }

    alterarSenha(bodyModal, templateBotoes){
        this.activeModal = this.modalService.open(NgbdModalContent, {size: 'sm'})
        this.activeModal.componentInstance.modalHeader = 'Alteração de Senha';
        this.activeModal.componentInstance.templateRefBody = bodyModal;
        this.activeModal.componentInstance.templateBotoes = templateBotoes;
    }

    salvarSenha(){
        this.senha = ( this.novasenha.valido && ( this.novasenha.valor == this.confirmacao.valor ) ) ? this.novasenha.valor : null;
        if( this.senha ){
            var objUsuario = new Object();
                objUsuario["senha"] = this.senha;

            this.service.atualizar(this.id, objUsuario).subscribe(
                (guid) => {
                    if (guid) {
                        alert("Senha editada com sucesso.");
                        this.activeModal.close();
                    }
                }
            );
        
        }else{
            alert("Senhas informadas não coincidem")
        }
    }

    salvar(){

        var objUsuario = new Object();

        (this.nome.valido)         ? objUsuario["nome"]          = this.nome.valor         : null;
        (this.email.valido)        ? objUsuario["email"]         = this.email.valor        : null;
        (this.celular.valido)      ? objUsuario["celular"]       = this.celular.valor      : null;
        (this.nascimento.valido && this.nascimento.valor != "")    ? objUsuario["nascimento"] = this.nascimento.valor + " 00:00:00" : null;
        (this.conselho.valido   && this.conselho.valor != "0")     ? objUsuario["conselho"]     = { id : this.conselho.valor }     : null;
        (this.registro.valido)     ? objUsuario["conselhoRegistro"]      = this.registro.valor     : null;
        (this.uf.valido)           ? objUsuario["conselhoUf"]            = this.uf.valor     : null;
        (this.ordemfila.valido)    ? objUsuario["ordemFilaAtendimento"]     = this.ordemfila.valor     : null;
        (this.receberemail.valido) ? objUsuario["receberEmail"] = this.receberemail.valor : null;
        (this.recebersms.valido)   ? objUsuario["receberSms"]   = this.recebersms.valor   : null;

        this.service.atualizar(this.id, objUsuario).subscribe(
            (guid) => {
                if (guid) {
                    alert("Usuario editado com sucesso.");
                    this.router.navigate([`/${Sessao.getModulo()}/usuario/perfil`]);
                }
            }
        );
    }

    getNovaSenha(evento){
        this.novasenha = evento;        
    }

    getConfirmacao(evento){
        this.confirmacao = evento;        
    }

    getNome(evento){
        this.nome = evento;
    }

    getEmail(evento){
        this.email = evento;
    }

    getCelular(evento){
        this.celular = evento;
    }

    getNascimento(evento){
        this.nascimento = evento;
    }

    getConselho(evento){
        this.conselho = evento;
    }

    getRegistro(evento){
        this.registro = evento;
    }

    getReceberEmail(evento){
        this.receberemail = evento;
    }

    getReceberSms(evento){
        this.recebersms = evento;
    }

    getOrdemFila(evento){
        this.ordemfila = evento;
    }

    getUf(evento){
        this.uf = evento;
    }

    
}
