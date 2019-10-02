import {Component, Input, ChangeDetectionStrategy, ChangeDetectorRef, EventEmitter, Output } from '@angular/core';

import { Servidor } from '../../../../services/servidor';
import { Sessao } from '../../../../services/sessao';

import { PacientePrescricaoService, PrescricaoModeloService, UtilService, ModeloDiagnosticoService, CidService, CiapService, ProfissionalService, ProcedimentoService, PacienteOperadoraService, AtendimentoTipoTussService, ProdutoTussService } from '../../../../services';

import { ToastrService } from 'ngx-toastr';
import { FormatosData } from '../../../../theme/components/agenda/agenda';

import * as moment from 'moment';

@Component({
    selector: 'gridAdicionarProcedimento',
    templateUrl: './grid.component.html',
    styleUrls: ['./grid.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridAdicionarProcedimento {
  
    @Input() codigo;
    @Input() labelId;
    @Input() objProcedimento = new Object();
    @Input() edita = false;
    @Input() service;

    operadoras = [];

    @Output() onSave= new EventEmitter();

    constructor(
        private servicePacientePrescricao: PacientePrescricaoService,
        private serviceProcedimento: ProcedimentoService,
        private serviceOperadora: PacienteOperadoraService,
        // private serviceAtendimentoTipoTuss: AtendimentoTipoTussService,
        // private serviceAtendimentoTuss: AtendimentoTussService, //IMPORTAR A CLASSE
        // private serviceProdutoTuss: ProdutoTussService,
        private toastr: ToastrService,
        private cdr: ChangeDetectorRef
    ) {
        setInterval(() => {
            this.cdr.markForCheck();
        }, 500);

    }

    formatosDeDatas;
    unidadesAtendimento = [];
    ngOnInit() {

        this.cdr.reattach();
        this.formatosDeDatas = new FormatosData();

        this.unidadesAtendimento = Sessao.getVariaveisAmbiente('unidadesAtendimento');
        console.log(this.unidadeSelecionada);
        
        console.log(this.service);
        
        this.inicializaVariaveis();
    }
    
    unidadeSelecionada = Sessao.getIdUnidade();
    salvarProcedimento() {

        if( !this.unidadeSelecionada ){
            this.toastr.warning("Selecione uma unidade");
            return;
        }

        if( !this.validaProcedimento(this.objProcedimento) ){
            return;
        }

        this.objProcedimento = this.retornaObjValidado( this.objProcedimento );

        let param = {
            data : moment().format(this.formatosDeDatas.dataHoraSegundoFormato),
            usuario: {
                guid: Sessao.getUsuario()['guid']
            },
            unidadeAtendimento: {
                id : this.unidadeSelecionada
            }
        }
        // tipo
        // produto
        param[this.labelId] = {
            id: this.codigo
        }

        param = Object.assign( param, this.objProcedimento );

        this.adicionarProcedimento(param);
    }

    adicionarProcedimento(param){

        this.service.post( param ).subscribe(
            (retorno) => {
                this.toastr.success( 'Procedimento adicionado com sucesso' );
                
                param['id'] = retorno;
                this.cdr.markForCheck();
                this.onSave.emit( param );
                
                this.objProcedimento['procedimento'] = undefined;
                this.objProcedimento['quantidade'] = 1;
                this.objProcedimento['operadora'] = { id : 1 };
                this.cdr.markForCheck();
            },
            erro => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );
    }

    objConfiguraHorarioTuss = new Object();
    valorProcedimentoSelecionado;
    fnSetProcedimento(procedimento, obj){
        if( procedimento ) {
            this.valorProcedimentoSelecionado = procedimento.descricao;
            obj['procedimento'] = { 
                id : procedimento.id,
                descricao : procedimento.descricao,
                tabelatipo:{
                    id: procedimento.tabelatipo.id
                }
            };
        }else{
            obj['procedimento'] = undefined;
            this.valorProcedimentoSelecionado = '';
        }
    }

    setOperadora(evento, procedimento){
        if( evento && evento.valor ){
            console.log(evento);
            
            procedimento['operadora'] = this.operadoras.filter(
                (operadora) => {
                    return operadora.id == evento.valor;
                }
            )[0]
        }
    }
    
    objProcedimentos = [];    
    fnCfgProcedimentoRemote(term) {
        if( term.match(/\D/g) ){
            this.serviceProcedimento.procedimentoPaginadoFiltro( 1, 10, term ).subscribe(
                (retorno) => {
                    this.objProcedimentos = retorno.dados || retorno;
                }
            );
        }else{
            this.serviceProcedimento.getProcedimentosCodigo(term).subscribe(
                (retorno) => {
                    let procedimento = retorno.dados || retorno;
                    this.objProcedimentos = (procedimento) ? [procedimento] : [];
                }
            )
        }
    }

    inicializaVariaveis(){
        this.refreshOperadoras();
    }

    refreshOperadoras() {
        this.serviceOperadora.getOperadoraPaginado().subscribe(
            (operadora) => {
                this.operadoras = operadora.dados;
            }
        );
    }

    validaProcedimento(objProcedimento){
        if( !objProcedimento['procedimento'] ){
            this.toastr.warning("É obrigatório informar o procedimento");
            return false;
        }

        // if( !objProcedimento['operadora'] ){
        //     this.toastr.warning("É obrigatório informar uma operadora");
        //     return false;
        // }

        return true;
    }

    retornaObjValidado(item){
        let itemValidado = Object.assign({}, item);
        Object.keys( item ).forEach(
            (chave) => {
                if( item[chave] && item[chave]['id'] ){
                    if( !item[chave]['id'] || item[chave]['id'] == '0' ){
                        delete itemValidado[chave];
                    } else if(chave != 'procedimento') {
                        itemValidado[chave] = {
                            id: item[chave]['id']
                        }
                    }else if(chave == 'procedimento') {
                        itemValidado['procedimento'] = {
                            id: item['procedimento']['id'],
                            tabelatipo: item['procedimento']['tabelatipo'],
                        }
                    }
                }
            }
        )

        return itemValidado;
    }

}

