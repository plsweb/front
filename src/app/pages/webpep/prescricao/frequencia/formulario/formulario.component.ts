import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Sessao, Servidor, PrescricaoFrequenciaService } from '../../../../../services';

import { FormatosData } from '../../../../../theme/components';

import { ToastrService } from 'ngx-toastr';

import * as moment from 'moment';
moment.locale('pt-br');

@Component({
	selector: 'formulario',
	templateUrl: './formulario.html',
	styleUrls: ['./formulario.scss']
})
export class Formulario implements OnInit {
    idFrequencia;
    formatosDeDatas;
    novaFrequencia:any;
    objFrequenciaPadrao:any = new Object();
    opcoesUnidades = [
        { id: 'minute', descricao: 'Minutos' },
        { id: 'hour', descricao: 'Horas' },
        { id: 'week', descricao: 'Semana' },
        { id: 'month', descricao: 'Mês' },
        { id: 'year', descricao: 'Ano' }
    ]

    constructor(
        private toastr: ToastrService, 
        private router: Router, 
        private route: ActivatedRoute,
        private serviceFrequencia: PrescricaoFrequenciaService,
    ) {
        this.serviceFrequencia
        
        this.route.params.subscribe(params => {
            if( (params["idfrequencia"] != 'novo') ){
                this.idFrequencia = params["idfrequencia"];
                this.objFrequenciaPadrao = {
                    frequencia: {
                        id: this.idFrequencia
                    }
                }
            }
        });
    }

    ngOnInit() {
        this.formatosDeDatas = new FormatosData();

        if( this.idFrequencia ){
            this.setFrequencia();
        }else{
            this.novaFrequencia = new Object();
        }
    }

    setFrequencia(){
        this.serviceFrequencia.get( { id : this.idFrequencia } ).subscribe(
            (frequencia) => {
                this.novaFrequencia = this.validaFrequencia( ( frequencia.dados && frequencia.dados.length ) ? frequencia.dados[0] : frequencia[0]);
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        )
    }

    validaFrequencia(obj){
        return obj;
    }

    salvarFrequencia(){
        
        if( !this.validaFrequencia(this.novaFrequencia) ){
            return;
        }

        let requestFrequencia = this.validaNovaFrequencia(this.novaFrequencia);
        if( !requestFrequencia ){
            return;
        }
        if(!this.idFrequencia){
            this.serviceFrequencia.post(requestFrequencia).subscribe(
                retorno => {
                    this.idFrequencia = retorno;
                    this.router.navigate([`/webpep/frequencia/${retorno}`]);
                    this.toastr.success("Frequencia "+this.novaFrequencia['nome']+" adicionada com sucesso");
                    this.setFrequencia();
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                },
            ) 
        }else{
            this.serviceFrequencia.put( this.idFrequencia, requestFrequencia).subscribe(
                () => {
                    this.toastr.success("Frequencia "+this.novaFrequencia['nome']+" atualizada com sucesso");
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                },
            )
        }
    }

    validaNovaFrequencia(obj){

        if( !this.novaFrequencia['valor'] ){
            this.toastr.error("Informe um valor");
            return false;
        }

        if( !this.novaFrequencia['tipo'] ){
            this.toastr.error("Informe um tipo");
            return false;
        }

        let duracaoMinutos = moment.duration( parseInt(this.novaFrequencia['valor']), this.novaFrequencia['tipo']).asMinutes();

        obj['minutos'] = duracaoMinutos;
        return obj;
    }

    voltar(){
        this.router.navigate([`/${Sessao.getModulo()}/frequencia`]);
    }

}