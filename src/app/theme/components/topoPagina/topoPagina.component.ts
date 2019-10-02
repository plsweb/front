import { ViewChild, HostListener, Component, OnInit, TemplateRef } from '@angular/core';
import { GlobalState } from '../../../global.state';
import { Router } from '@angular/router';
import { UsuarioService, SegurancaService, PanicoPapelService } from '../../../services';

import { Sessao } from '../../../services/sessao';
import { Servidor } from '../../../services/servidor';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbdModalContent } from '../../../theme/components/modal/modal.component';

import { Observable } from 'rxjs/Rx';

import * as jQuery from 'jquery';
import * as moment from 'moment';
import { ToastrService } from 'ngx-toastr';

moment.locale('pt-br');

@Component({
    selector: 'topoPagina',
    templateUrl: './topoPagina.html',
    providers: [],
    styleUrls: ['./topoPagina.scss'],
})
export class TopoPagina implements OnInit {
    isScrolled: boolean = false;
    isMenuCollapsed: boolean = false;
    foto = 'assets/img/no-photo.png';
    nomeModulo: String;

    tema:string = localStorage.getItem("tema");

    momentjs = moment;
    abreModal = false;

    callCenterEmAtendimento;
    tempoDeLigacao;

    @ViewChild("bodyModalAlerta", {read: TemplateRef}) bodyModalAlerta: TemplateRef<any>;
    @ViewChild("botoesModalAlerta", {read: TemplateRef}) botoesModalAlerta: TemplateRef<any>;

    @ViewChild("bodyModalAlertasPanico", {read: TemplateRef}) bodyModalAlertasPanico: TemplateRef<any>;
    @ViewChild("botoesModalAlertasPanico", {read: TemplateRef}) botoesModalAlertasPanico: TemplateRef<any>;

    constructor(
            private _state: GlobalState, 
            private modalService: NgbModal, 
            private router: Router, 
            private toastr: ToastrService,
            private segurancaService: SegurancaService,
            private service: UsuarioService) {

        if( !Sessao.getToken() )
            return;

        this.service.usuario().subscribe(
            (usuario) => {
                localStorage.setItem("usuario", JSON.stringify({ id : usuario.id, guid : usuario.guid }) );

                this.service.fotoPorGuid("FOTO", usuario.guid, true).subscribe(
                    (result) => {
                        if( !result.match(".*assets.*") ){
                            this.foto = this.service.fotoPorGuid("FOTO", usuario.guid, false)
                        }
                    }
                );
            },
            (erro) => {
                if (erro.status === 401) {
                    this.service.sair();
                    this.router.navigate(['/login']);
                }
            }
            
        )

        this._state.subscribe('menu.isCollapsed', (isCollapsed) => {
            this.isMenuCollapsed = isCollapsed;
        });

    }

    ngAfterViewChecked() {
        var space = (this.isMenuCollapsed) ? "nowrap" : "normal";
        jQuery(".menuItem a span").css( "white-space" , space );

        let preferenciasUsuario = Sessao.getPreferenciasUsuarioLocalStorage();
        if (preferenciasUsuario && preferenciasUsuario['atividadeEmAndamento']) {
            this.callCenterEmAtendimento = preferenciasUsuario['atividadeEmAndamento'];
        } else {
            this.callCenterEmAtendimento = undefined;
        }
    } 
    
    executou = true;
    meusAlertas = [];
    timerAlertas;
    ngOnInit() {

        if( this.alertaEmitido ) {
            this.mensagemAviso = 'RESPONSÁVEIS NOTIFICADOS. AGUARDE SOCORRO';
        }

        this.timerAlertas = Observable.timer(0, 1000)
            .timeInterval()
            .subscribe(
                (ok) => {
                    // SO EXECUTA SE USUARIO ESTIVER LOGADO E NAO FOR NA BASE LOCAL
                    if( Sessao.getToken() && Sessao.getBase() != "local" ){
                        if( localStorage.getItem('idUnidade') ){

                            if( Sessao.getResponsavelPanico() ){

                                if( this.executou ){

                                    this.executou = false;

                                    this.segurancaService.getAlertaPanico( { unidadeAtendimentoId: localStorage.getItem('idUnidade') } ).subscribe(
                                        (alertas) => {
                                            this.executou = true;
                                            
                                            alertas.dados = this.validaAlertas(alertas.dados);

                                            if( (alertas.dados || alertas).length ){
                                                
                                                if( !this.meusAlertas.length )
                                                    this.toastr.warning("Voce está recebendo um alerta");

                                                this.meusAlertas = alertas.dados || alertas;
                                                    
                                                if( !this.modalAlertasPanico ){
                                                    this.abreModalAlertas();
                                                }
                                            }
                                        },
                                        (erro) => {
                                            console.error(erro);
                                            this.executou = true;
                                        }
                                    )

                                }else{
                                }
                            }else{
                            }
                        }
                    }else{
                        this.timerAlertas.unsubscribe();
                    }
                }
        )   
        
            
        switch (Sessao.getModulo()) {
            case "webauditoria":
                this.nomeModulo = "auditoria";
                break;
            case "webcontas":
                this.nomeModulo = "contas";
                break;
            case "webcenso":
                this.nomeModulo = "censo";
                break;
            case "webpep":
                this.nomeModulo = "pep";
                break;
        }
    }

    abreCallCenter() {
        this.router.navigate([`/${Sessao.getModulo()}/callcenter`]);
    }

    formatTempoLigacao(callCenterEmAtendimento) {
        let inicio = moment( callCenterEmAtendimento.inicioAtendimento, 'DD/MM/YYYY hh:mm:ss' );
        let fim = moment();
        let duration = moment.duration(fim.diff(inicio));

        let hora = ("0" + duration.hours()).slice(-2);
        let minuto = ("0" + duration.minutes()).slice(-2);
        let segundo = ("0" + duration.seconds()).slice(-2);

        return `${hora}:${minuto}:${segundo}`;
    }

    toggleMenu() {
        this.isMenuCollapsed = !this.isMenuCollapsed;
        
        this.validaEstiloMenu(this.isMenuCollapsed);

        this._state.notifyDataChanged('menu.isCollapsed', this.isMenuCollapsed);
        return false;
    }

    scrolledChanged(isScrolled) {
        this.isScrolled = isScrolled;
    }

    trocarConsultorio() {
        localStorage.removeItem('unidade');
        localStorage.removeItem('consultorio');
        localStorage.removeItem('idUnidade');

        let url = document.URL.split("/");
        let atual = url[url.length-1];
        if (atual != 'dashboard') {
            this.router.navigate([`/${Sessao.getModulo()}/dashboard`]);
        } else {
            location.reload();
        }

    }

    perfil(){
        this.router.navigate(['/usuario/perfil']);
    }

    sair() {
        this.service.sair();
        this.router.navigate(['/login']);
    }

    validaEstiloMenu(collapsed){
        jQuery(".menuItem a span").css( "white-space" , "nowrap" );

        setTimeout(function(){
            var space = (collapsed) ? "nowrap" : "normal";
            jQuery(".menuItem a span").css( "white-space" , space );
        }, 500);
    }

    mudaTema(nome_tema){
        var tema = localStorage.getItem("tema");
        jQuery(`head link#tema`)["0"].remove();
        jQuery("head")["0"].innerHTML += `<link id="tema" href="assets/css/`+nome_tema+`.css" rel="stylesheet">`;
        localStorage.setItem("tema", nome_tema);
        this.tema = nome_tema;
    }

    finalizarAtendimento(){
        let url = document.URL.split("/");
        let atual = url[url.length-1];
        if (atual != 'callcenter') {
            this.router.navigate([`/${Sessao.getModulo()}/callcenter`]);
        } else {
            this.abreModal = true;
        }
    }

    modalAlerta;
    mensagemAviso;
    alertaEmitido = Sessao.getPreferenciasUsuarioLocalStorage()['panico'] ? Sessao.getPreferenciasUsuarioLocalStorage()['panico']['alertaEmitido'] : undefined;
    idAlerta = Sessao.getPreferenciasUsuarioLocalStorage()['panico'] ? Sessao.getPreferenciasUsuarioLocalStorage()['panico']['idAlerta'] : undefined;
    alerta(){

        if( !this.alertaEmitido ){

            if( localStorage.getItem('idUnidade') ){
                let request = {
                    "usuario": {
                    "guid": Sessao.getUsuario()['guid']
                    },
                    "unidadeAtendimento": {
                    "id": localStorage.getItem('idUnidade')
                    },
                    "status": "PENDENTE"
                }

                if( localStorage.getItem('idConsultorio') ){
                    request["guiche"] = {
                        "id": localStorage.getItem('idConsultorio')
                    }
                }

                if( this.validaTela('atendimento') ){
                    let id = this.validaTela('atendimento', true);
                    if( !isNaN(id) ){
                        request["atendimento"] = {
                            "id": id
                        }
                    }
                }else{
                    if( this.validaTela('paciente') ){
                        let id = this.validaTela('paciente', true);
                        if( !isNaN(id) ){
                            request["paciente"] = {
                                "id": id
                            }
                        }
                    }
                }

                this.segurancaService.postAlertaPanico( request ).subscribe(
                    (retorno) => {
                        this.toastr.success("Pedido de socorro foi enviado");
                        this.idAlerta = retorno;
                        this.alertaEmitido = true;
                        let obj = {
                            alertaEmitido : true,
                            idAlerta: this.idAlerta
                        }
                        Sessao.setPreferenciasUsuarioLocalStorage('panico', obj);
                        // Sessao.setPreferenciasUsuarioLocalStorage('idAlerta', this.idAlerta);
                    }
                )

                this.mensagemAviso = 'SEU ALERTA FOI EMITIDO! AGUARDE SOCORRO';
                let obj = {
                    alertaEmitido: true
                }
                Sessao.setPreferenciasUsuarioLocalStorage('panico', obj);
                this.alertaEmitido = true;
            }else{
                this.toastr.warning("Obrigatório informar uma unidade");

                let url = document.URL.split("/");
                let atual = url[url.length-1];
                if (atual != 'dashboard') {
                    this.router.navigate([`/${Sessao.getModulo()}/dashboard`]);
                } else {
                    location.reload();
                }

                return;
            }
        }else if( this.alertaEmitido ){
            this.mensagemAviso = 'RESPONSÁVEIS NOTIFICADOS. AGUARDE SOCORRO';
        }

        // this.modalAlerta = this.modalService.open(NgbdModalContent, {size: 'lg'});
        // this.modalAlerta.componentInstance.modalHeader = 'Pedido de Socorro';

        // this.modalAlerta.componentInstance.templateRefBody = this.bodyModalAlerta;
        // this.modalAlerta.componentInstance.templateBotoes = this.botoesModalAlerta;

        // this.modalAlerta.result.then(
        //     (data) => {
        //         // this.toastr.success("Pedido de socorro foi enviado");
        //     }, 
        //     (reason) => this.alerta()
        // )
    }

    modalAlertasPanico;
    podeFechar = false;
    abreModalAlertas(){
        this.modalAlertasPanico = this.modalService.open(NgbdModalContent, {size: 'lg'});
        this.modalAlertasPanico.componentInstance.modalHeader = 'Pedidos de socorro';

        this.modalAlertasPanico.componentInstance.templateRefBody = this.bodyModalAlertasPanico;
        this.modalAlertasPanico.componentInstance.templateBotoes = this.botoesModalAlertasPanico;

        this.modalAlertasPanico.result.then(
            (data) => {
                console.log("data");
                this.toastr.success("Pedido recebido");
                if( !this.podeFechar ){
                    this.abreModalAlertas();
                }
            }, 
            (reason) => {
                console.log("reaseon");
                if( !this.podeFechar ){
                    this.abreModalAlertas();
                }
            }
        )

    }

    atualizaAlertas(){
        console.log(this.meusAlertas);

        let aPromises = [];

        this.meusAlertas.forEach((alerta)=>{

            aPromises.push(
                new Promise((resolve, reject) => {
                    let request = {
                        status : 'ALERTADO'
                    }
                    this.segurancaService.putAlertaPanico(alerta.id, request).subscribe((retorno) => {
                        resolve(retorno);
                    }, (result) => {
                        this.toastr.warning("Houve um erro ao atualizar status do alerta de panico");
                        reject(true);
                    })
                })
            );
        });
        Promise.all(aPromises).then(
            (retorno) => {  
                this.podeFechar = true;
                this.modalAlertasPanico.dismiss();
            }
        );
    }

    validaAlertas(alertas){
        return alertas.filter(
            (alerta) => {
                return alerta.status == "PENDENTE"
            }
        )
    }

    validaTela(nome, retornaId = false){
        let aUrl = document.URL.split("/");
        let posicao = aUrl.indexOf(nome)

        return (retornaId) ? this.getIdUrl(aUrl) : posicao > -1;
    }

    getIdUrl(aUrl){

        let id = aUrl[ aUrl.length -1 ]
        return id;
    }

    finalizarPedidoSocorro(){

        this.segurancaService.putAlertaPanico(this.idAlerta, { status: 'FINALIZADO' }).subscribe(
            (retorno) => {
                this.alertaEmitido = false;
                this.idAlerta = undefined;
                let obj = {
                    idAlerta: undefined,
                    alertaEmitido: false
                }

                Sessao.setPreferenciasUsuarioLocalStorage('panico', obj);
                this.toastr.success("Pedido de socorro finalizado");
                this.mensagemAviso = '';
            }
        )
    }
    
}
