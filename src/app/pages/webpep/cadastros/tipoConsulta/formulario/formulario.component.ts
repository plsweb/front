import { Component, ViewContainerRef, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';

import { TipoAtendimentoService, LocalAtendimentoService, ProcedimentoService, PacienteOperadoraService, AtendimentoTipoTussService } from '../../../../../services';
import { Sessao, Servidor } from '../../../../../services';

import { FormatosData } from '../../../../../theme/components';

import * as moment from 'moment';
import * as jQuery from 'jquery';

@Component({
    selector: 'formulario',
    templateUrl: './formulario.html',
    styleUrls: ['./formulario.scss'],
    providers: [TipoAtendimentoService]
})
export class Formulario implements OnInit {

    idTipoConsulta

    novoAtendimento = new Object();
    unidadesAtendimento = [];

    formatosDeDatas;
    colorPicker;

    unidadesSelecionadas = [];

    tamanhoMaximo = 150;

    constructor(
        
        private toastr: ToastrService, 
        private vcr: ViewContainerRef,
        private route: ActivatedRoute,
        private service: TipoAtendimentoService,
        private serviceOperadora: PacienteOperadoraService,
        private serviceProcedimento: ProcedimentoService,
        private serviceAtendimentoTipoTuss: AtendimentoTipoTussService,
        private localAtendimentoService: LocalAtendimentoService,
        private router: Router) {

        this.route.params.subscribe(params => {
            this.idTipoConsulta = (params["idtipoconsulta"] != 'novo') ? params["idtipoconsulta"] : undefined
        });
    }

    ngOnInit() {
        this.formatosDeDatas = new FormatosData();

        if( this.idTipoConsulta ){
            this.setTipoConsulta();
        }else{
            this.novoAtendimento['ativo'] = true;
            this.novoAtendimento['faturar'] = true;
        }

        this.unidadesAtendimento = Sessao.getVariaveisAmbiente('unidadesAtendimento');

    }

    salvarTipo(){
        this.novoAtendimento = this.validaNovoAtendimento(this.novoAtendimento);

        if( !this.novoAtendimento['tempo'] ){
            this.toastr.warning("Duração da consulta é obrigatória");
            return;
        }

        if( this.novoAtendimento['enviaSms'] && !this.novoAtendimento['mensagemSms'] ){
            this.toastr.warning("É obrigatório informar uma mensagem para enviar SMS");
            return;
        }

        if (this.idTipoConsulta) {
            this.service.atualizar(this.idTipoConsulta, this.novoAtendimento).subscribe(
                () => {
                    this.toastr.success("Tipo "+this.novoAtendimento['descricao']+" atualizado com sucesso");
                }
            );
        } else {
            this.service.salvar(this.novoAtendimento).subscribe(
                retorno => {
                    this.idTipoConsulta = retorno;
                    this.router.navigate([`/${Sessao.getModulo()}/tipoconsulta/${retorno}`]);
                    this.toastr.success("Tipo "+this.novoAtendimento['descricao']+" adicionado com sucesso");
                    this.setTipoConsulta();
                }
            );
        }
    }

    setTipoConsulta(){
        this.service.atendimentoTipo({id: this.idTipoConsulta}).subscribe(
            (tipo) => {
                this.novoAtendimento = this.validaTipo( ( tipo.dados && tipo.dados.length ) ? tipo.dados[0] : tipo[0]);
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        )
    }

    validaNovoAtendimento(tipo){

        if( !tipo.enviaSms ){
            tipo.mensagemSms = "";
            tipo.mensagemConfimando = "";
        }

        delete tipo.unidadesAtendimento;
        delete tipo.centroCustoRegras;

        return tipo;
    }

    validaTipo(tipo){
        return tipo;
    }

    setObjColorPicker(colorPicker) {
        this['colorPicker'] = colorPicker;
        this.novoAtendimento["cor"] = colorPicker.corSelecionada;
    }

    trocaCor(valor) {
        if (valor.colorPicker) {
            this['colorPicker'] = valor['colorPicker'];
        }
    }

    validaCheck(unidadeCheck){
        let estado = false;
        
        if( this.novoAtendimento['unidadesAtendimento'] && this.novoAtendimento['unidadesAtendimento'].length ){
            this.novoAtendimento['unidadesAtendimento'].forEach(
                (unidade) => {
                    if( unidade.id == unidadeCheck.id ){
                        estado = true;
                    }
                }
            )
        }

        return estado;
    }

    salvarUnidadeAtendimento(valida, unidade){
        let obj = {
            "atendimentoTipo" : {
                "id" : this.idTipoConsulta
            },
            "unidadeAtendimento" : {
                "id": unidade.id
            }
        }

        if( valida ){
            this.service.salvarAtendimentoTipoUnidade(obj)
                .subscribe((unidade) => {
                    this.toastr.success("Unidade de Atendimento atualizada com sucesso");
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                }
            );
        }else{

            this.service.excluirAtendimentoTipoUnidade(obj)
                .subscribe((especialidades) => {
                    this.toastr.success("Unidade de Atendimento removida com sucesso");
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                }
            );
        }
    }

    voltar(){
        this.router.navigate([`/${Sessao.getModulo()}/tipoconsulta`]);
    }
}