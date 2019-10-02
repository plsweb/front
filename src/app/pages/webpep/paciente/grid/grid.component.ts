import { Component, ViewContainerRef, OnInit } from '@angular/core';
import { PacienteService } from '../../../../services';

import { Servidor } from '../../../../services/servidor';
import { Sessao } from '../../../../services/sessao';

import { ActivatedRoute, Router } from '@angular/router';
import { FormatosData } from '../../../../theme/components/agenda/agenda';
import { Saida } from '../../../../theme/components/entrada/entrada.component';

import { Observable, of } from 'rxjs';
import { delay } from 'rxjs/operators';
import * as moment from 'moment';
moment.locale('pt-br');

import * as jQuery from 'jquery';


import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'grid',
    templateUrl: './grid.html',
    styleUrls: ['./grid.scss'],
})
export class Grid implements OnInit {
    pacientes;
    carteira: Saida;
    cpf = new Object();
    filtroNome;
    itensPorPagina;
    nome: Saida;
    paginaAtual;
    qtdItensTotal;

    momentjs = moment;
    formatosDeDatas;

    constructor(
        private servicePaciente: PacienteService,
        private router: Router,
        private route: ActivatedRoute,
        private toastr: ToastrService,
        public vcr: ViewContainerRef ) 
    { }

    ngOnInit() {
        this.paginaAtual = 1;
        this.itensPorPagina = 25;

        this.formatosDeDatas = new FormatosData;
    }

    getCarteira(evento) {
        this.carteira = evento;
        if( !this.carteira.valor ){
            this.cpf = { valido: false, valor: '' };
        }
    }

    getNome(evento) {
        this.nome = evento;
    }

    abrir(paciente) {
        this.router.navigate([`/${Sessao.getModulo()}/paciente/formulario/${paciente.id}`]);
    }

    validaCodigo(event){

        if(this.carteira.valor.match("   :ç")){

            let observable = of(event (delay(500)) );

            observable.subscribe(
                data => {

                    var leitura = this.carteira.valor;
                    var arrLeitura =  leitura.split("   :ç");

                    var titular = arrLeitura[0].replace("%", "").trim();
                    jQuery("entrada #filtroNome").val(titular);
                    this.nome.valor = titular;
                    this.nome.valido = true;

                    var codigo = arrLeitura[1].toLowerCase().split("=")[0];
                    jQuery("entrada #filtroCart").val(codigo);
                    this.carteira.valor = codigo;
                    this.carteira.valido = true;
                }
            );
        }else if( this.carteira.valor.length == 11 ){

            this.cpf['valor']  = this.carteira.valor
            this.cpf['valido'] = true;
            this.carteira.valido = false;

        }
    }

    limpar(campo) {
        switch (campo) {
            case 'CARTEIRA' :
                jQuery("entrada #filtroCart").val('');
                this.carteira.valor = '';
                break;
            case 'NOME':
                jQuery("entrada #filtroNome").val('');
                this.nome.valor = '';
                break;
            default:
                jQuery("entrada #filtroCart").val('');
                jQuery("entrada #filtroNome").val('');
                this.carteira.valor = '';
                this.nome.valor = '';
                break;
        }
    }

    filtrar() {
        this.buscarPaginado(null);
    }

    buscarPaginado(evento) {
        this.abrirCarregar();

        if (evento) {
            this.paginaAtual = evento ? evento.paginaAtual : this.paginaAtual;
        } else {
            this.paginaAtual = 1;
        }

        if (this.carteira.valido && this.carteira.valor && this.carteira.valor.length != 11) {
            this.limpar("NOME");

            if( this.carteira.valor.length == 17  ){

                this.servicePaciente.getPaciente( { carteirinha : this.carteira.valor, pagina: 1, quantidade: 100 } ).subscribe(
                    (pacientes) => {
                        this.pacientes = pacientes.dados;
                        this.qtdItensTotal = pacientes.qtdItensTotal;
                        this.fecharCarregar();
                    },
                    (erro) => {
                        Servidor.verificaErro(erro, this.toastr);
                            this.fecharCarregar();
                    }
                );
            }else{
                this.toastr.warning("Carteirinha invalida");
                this.fecharCarregar();
                return;
            }

        }else if( this.cpf['valido'] ){

            if( this.cpf['valor'].length == 11 ){

                this.servicePaciente.getPaciente( { pagina: this.paginaAtual, quantidade : this.itensPorPagina, cpf : this.cpf['valor'] } ).subscribe(
                    (pacientes) => {
                        this.pacientes = pacientes.dados;
                        this.qtdItensTotal = pacientes.qtdItensTotal;
                        this.fecharCarregar();
                    },
                    (erro) => {
                        Servidor.verificaErro(erro, this.toastr);
                            this.fecharCarregar();
                    },
                );

            }else{
                this.toastr.warning("Cpf invalido");
                this.fecharCarregar();
                return;
            }

        }else if (this.nome.valido && this.nome.valor) {
            this.limpar("CARTEIRA");

            // this.service.getPacienteLikePaginado(this.paginaAtual, this.itensPorPagina, this.nome.valor).subscribe(
            this.servicePaciente.getPaciente( { pagina: this.paginaAtual, quantidade : this.itensPorPagina, like : this.nome.valor, simples: true } ).subscribe(
                (pacientes) => {
                    this.pacientes = pacientes.dados;
                    this.qtdItensTotal = pacientes.qtdItensTotal;
                        this.fecharCarregar();
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                        this.fecharCarregar();
                },
            );
        }else{
            this.fecharCarregar();
            this.toastr.warning("Pesquisa inválida");
        }
    }

    adicionarPaciente(){
        this.router.navigate([`/${Sessao.getModulo()}/paciente/novo`]);
    }

    abrirCarregar() {
        jQuery("#preloader").fadeIn(10);
    }

    fecharCarregar() {
        jQuery("#preloader").fadeOut(10);
    }
}