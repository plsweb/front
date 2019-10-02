import { Router, ActivatedRoute } from '@angular/router';
import {Component, Input, HostListener, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, TemplateRef, QueryList } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { Observable } from 'rxjs/Rx';
import { ToastrService } from 'ngx-toastr';

import { Sessao, Servidor, PrescricaoItemService, ProdutoService, ProdutoItemService, PacientePrescricaoProdutoService,
         PacientePrescricaoItemService, PrescricaoPacienteExecucaoService, PrescricaoModeloService, DicionarioTissService, EstoqueService } from 'app/services';

import { FormatosData, NgbdModalContent } from 'app/theme/components';

import * as $ from 'jquery';
import * as moment from 'moment';


@Component({
    selector: 'gridPrescricoes',
    templateUrl: './grid.component.html',
    styleUrls: ['./grid.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridPrescricoes {
  
    @Input() idItemPrescricao;
    @Input() idPaciente;
    @Input() objPrescricao;
    @Input() modoRealizacao = false;
    @Input() modoDetalhado = true;
    @Input() validaEspecialidade = false;
    @Input() evolucao = false;
    @Input() somenteVisualizacao = false;
    @Input() mostraModelo = true;
    @Input() visualizaHistoricoRealizacao = false;
    @Input() itensModeloSelecionado;
    @Input() tamanhoVw = 5.3;

    opcoesDmTissUnidadeMedica;
    itensPrescricao = [];
    campoEdita = {
        'viaAcesso': { },
        'quantidade': { },
        'frequencia': { },
        'unidade': { },
        'tempoInfusao': { },
        'doseAplicada': { },
        'doseAplicadaUnidade': { },
    }

    opcoesFrequencia = [];
    opcoesUnidadeMedida = [];
    opcoesViaAcesso = [];

    momentjs = moment;
    object = Object;
    dataInicio: string;
    dataFim: string;

    unidadesAtendimento = [];
    atendimentoId;

    parent = $(".al-content").width();

    @ViewChild("bodyModalConfirm", {read: TemplateRef}) bodyModalConfirm: QueryList<TemplateRef<any>>;

    @ViewChild("bodyModalJustificativa", {read: TemplateRef}) bodyModalJustificativa: QueryList<TemplateRef<any>>;
    @ViewChild("modalJustificativaBotoes", {read: TemplateRef}) modalJustificativaBotoes: QueryList<TemplateRef<any>>;

    constructor(
        public router: Router,
        private route: ActivatedRoute,
        private cdr: ChangeDetectorRef,
        private toastr: ToastrService,
        private modalService: NgbModal,
        private serviceProduto: ProdutoService,
        private serviceTISS: DicionarioTissService,
        private serviceItemProduto: ProdutoItemService,
        private serviceEstoque: EstoqueService,
        private serviceModelos: PrescricaoModeloService,
        private serviceItemPrescricao: PrescricaoItemService,
        private servicePacienteItem: PacientePrescricaoItemService,
        private servicePacienteProduto: PacientePrescricaoProdutoService,
        private serviceHistoricoPrescricao: PrescricaoPacienteExecucaoService,
    ) {
        this.route.params.subscribe(params => {
            if( params['id'] ){
                this.atendimentoId = params['id'];
            }
        });
    }

    formatosDeDatas;
    ngOnInit() {
        this.formatosDeDatas = new FormatosData();

        this.serviceTISS.getUnidadeMedida().subscribe(
            (retorno ) => {
                this.opcoesDmTissUnidadeMedica = retorno.dados || retorno;
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );

        this.getFrequencias();
        this.getUnidades();
        this.getViasAcesso();

        this.unidadesAtendimento = Sessao.getVariaveisAmbiente('unidadesAtendimento');

        this.dataInicio = moment().format(this.formatosDeDatas.dataHoraSegundoFormato)
        this.dataFim = moment().format(this.formatosDeDatas.dataHoraSegundoFormato)

        this.buscarItensPrescricaoPaciente();
        if( !this.evolucao ){
            this.buscarItensPaciente();
        }
    }

    ngOnDestroy() {
        this.cdr.detach();
    }

    barCode = '';
    @HostListener('document:keyup', ['$event'])
    setLote($event: KeyboardEvent) {
        if( this.execucaoSelecionada ){
            console.log(this.barCode);
            if( ( $event.location == 0 ) &&
                ( $event.code != 'CapsLock' ) &&
                ( $event.code != 'Tab' ) &&
                ( $event.code != 'Enter' ) &&
                ( $event.code && !($event.code.toUpperCase().match('ARROW')) )
            ){
                this.barCode += $event.key
            }else if( $event.code == 'Enter' ){                
                let request = {
                    codigoBarra : this.barCode,
                    execucao: {
                        id: this.execucaoSelecionada.id
                    }
                }
                this.serviceEstoque.post( request ).subscribe(
                    (retorno) => {
                        this.barCode = ''
                        this.buscarProdutosItemPaciente(this.itemSelecionado.id);
                    },
                    (erro) => {
                        this.barCode = ''
                        this.buscarProdutosItemPaciente(this.itemSelecionado.id);
                        Servidor.verificaErro(erro, this.toastr);
                    }
                )
            }
        }else{
            this.barCode = '';
        }
    }

    refreshListInterval;
    buscando = false;
    buscarItensPaciente(){

        this.refreshListInterval = setInterval(()=>{
            if(!this.loadingProcedimentos) {
                this.buscarItensPrescricaoPaciente(false);
                this.cdr.markForCheck();
            }
        }, (1000
            *
            60
            *
            3
            ) /* A CADA 3 MINUTOS */)
    }

    itemSelecionado;
    produtosItem = [];
    selecionaItem(item){
        if( this.itemSelecionado == item.id ){
            this.itemSelecionado = undefined
        }else{
            
            this.itemSelecionado = item.id;
            this.produtosItem = [];
            this.buscarProdutosItemPaciente(item.id);

        }
    }

    loadingProdutos = true;
    buscarProdutosItemPaciente(id, loading = true){

        if( loading ){
            this.loadingProdutos = true;
        }

        this.servicePacienteProduto.get( { pacienteprescricaoItemId : id } ).subscribe(
            (produtos) => {
                this.loadingProdutos = false;
                this.produtosItem = produtos.dados || produtos
                this.cdr.markForCheck();
            },
            (error) => {
                this.loadingProdutos = false
                Servidor.verificaErro(error, this.toastr);
                this.cdr.markForCheck();
            },
        )
    }

    resize() {
        this.parent = $(".al-content").width();
    }

    excluirProduto(ev, produto){
        ev.stopPropagation();

        if( this.somenteVisualizacao ){
            return;
        }

        if( confirm("Deseja realmente apagar esse produto") ){
            let param = { apagado : true };
            this.servicePacienteProduto.atualizar( produto.id, param).subscribe(
                (retorno) => {
                    this.toastr.success("Produto apagado com sucesso");
                    this.buscarProdutosItemPaciente(this.itemSelecionado, false);
                    this.cdr.markForCheck();
                },
                (error) => {
                    Servidor.verificaErro(error, this.toastr);
                    this.cdr.markForCheck();
                },
            )
        }
    }

    deleteItem(item, i) {
        if(confirm("Deseja remover este item?")){
            if (this.itensModeloSelecionado[i] == item) {
                this.itensModeloSelecionado = this.itensModeloSelecionado.filter(
                    (item, indice) => {
                        return indice != i;
                    }
                )
            }
        }
    }

    removerItem(ev, item){
        ev.stopPropagation();

        if( this.somenteVisualizacao ){
            return;
        }

        this.modalConfirmar = this.modalService.open(NgbdModalContent);
        this.modalConfirmar.componentInstance.modalHeader = item.prescricaoItem.nome;
        this.modalConfirmar.componentInstance.modalMensagem = `Deseja excluir esse item da prescrição?`;
        this.modalConfirmar.componentInstance.modalAlert = true;

        this.modalConfirmar.componentInstance.retorno.subscribe(
            (retorno) => {
                if (retorno) {
                    this.servicePacienteItem.excluir(item.id).subscribe(
                        () => {
                            this.toastr.success("Item excluido com sucesso");
                            this.buscarItensPrescricaoPaciente(false);
                        },
                        (error) => {
                            Servidor.verificaErro(error, this.toastr);
                        },
                    );
                }
            }
        );
    }

    suspenderItem(ev, item){
        ev.stopPropagation();

        if( this.somenteVisualizacao ){
            return;
        }

        this.modalConfirmar = this.modalService.open(NgbdModalContent);
        this.modalConfirmar.componentInstance.modalHeader = item.prescricaoItem.nome;
        this.modalConfirmar.componentInstance.modalMensagem = `Deseja suspender esse item da prescrição?`;
        this.modalConfirmar.componentInstance.modalAlert = true;

        this.modalConfirmar.componentInstance.retorno.subscribe(
            (retorno) => {
                if (retorno) {
                    this.servicePacienteItem.atualizar(item.id, {status: 'SUSPENSO'}).subscribe(
                        () => {
                            this.toastr.success("Item suspenso com sucesso");
                            this.buscarItensPrescricaoPaciente(false);
                            this.itensPrescricao
                        },
                        (error) => {
                            Servidor.verificaErro(error, this.toastr);
                        },
                    );
                }
            }
        );
    }

    getData(data){
        this.objParamAddProcedimento['horaInicio'] = data['valor'];
    }

    valorProcedimentosSelecionado;
    objParamAddProcedimento:any = {
        frequencia: {id: 0},
        usoContinuo: false,
        viaAcesso: '0',
        dias: '1'
    };

    setObjParamProcedimentos(evento){
        if( evento ){
            this.objParamAddProcedimento['prescricaoItem'] = { 
                id : evento.id,
            };

            this.valorProcedimentosSelecionado = evento.nome;
            this.objParamAddProcedimento['orientacaoPadrao'] = evento.orientacaoPadrao ? evento.orientacaoPadrao : '';

            this.objParamAddProcedimento['doseMaximaUnidade'] = evento.doseMaximaUnidade ? {id: evento.doseMaximaUnidade.id} : null;
            this.objParamAddProcedimento['doseMaximaValor'] = evento.doseMaximaValor ? evento.doseMaximaValor : null;
            this.objParamAddProcedimento['frequencia'] = evento.frequencia ? {id: evento.frequencia.id} : {id: '0'};
            this.objParamAddProcedimento['viaAcesso'] = evento.viaAcesso ? evento.viaAcesso : '0';
            this.objParamAddProcedimento['padrao'] = evento;
        }
    }

    setObjParamModelos(evento){
        this.itensModeloSelecionado = [];

        if( evento ){
            this.itensModeloSelecionado = evento.itens.map(
                (item) => {
                    item['padrao'] = item.prescricaoItem;
                    item['dias'] = 1;
                    return item;
                }
            );
            this.valorModelosSelecionado = evento.nome;
            this.cdr.markForCheck();
        }
    }

    clearObjParamProcedimentos() {
        delete this.objParamAddProcedimento['padrao'];
        delete this.objParamAddProcedimento['prescricaoItem'];
    }

    modalMensagem;
    modalConfirmar;
    setProcedimentosFrequencia(evento, objeto, id){
        this.modalConfirmar ? this.modalConfirmar.close() : null;

        if (evento && evento.valor || ( evento && evento.valor && evento.valor['id']) ) {
            this.opcoesFrequencia.filter((freq) => {
                if (freq.id == evento.valor && freq.minutos != 0 && objeto['padrao']) {

                    if( objeto['padrao'] && (objeto['padrao'].frequenciaMinima || objeto['padrao'].frequenciaMaxima) && freq.minutos ){

                        if ( (
                                (objeto['padrao'].frequenciaMinima && objeto['padrao'].frequenciaMinima.minutos) && 
                                (freq.minutos < objeto['padrao'].frequenciaMinima.minutos)
                            ) || 
                            (
                                (objeto['padrao'].frequenciaMaxima && objeto['padrao'].frequenciaMaxima.minutos) && 
                                (freq.minutos > objeto['padrao'].frequencia.frequenciaMaxima.minutos) 
                            )
                        ) {
                            this.modalMensagem =
                                "Frequência selecionada fora do intervalo, deseja continuar?" +
                                (( objeto['padrao'].frequenciaMinima ) ? "\nFrequência Mínima: " + objeto['padrao'].frequenciaMinima.descricao : '') +
                                (( objeto['padrao'].frequenciaMaxima ) ? "\nFrequência Máxima: " + objeto['padrao'].frequenciaMaxima.descricao : '');
        
                            //TODO Desabilita o close() ao clicar fora do modal
                            this.modalConfirmar = this.modalService.open(NgbdModalContent, {backdrop: 'static'});
                            this.modalConfirmar.componentInstance.modalHeader = 'Divergência';
                            this.modalConfirmar.componentInstance.templateRefBody = this.bodyModalConfirm;
                            this.modalConfirmar.componentInstance.modalAlert = true;
        
                            this.modalConfirmar.componentInstance.retorno.subscribe(
                                (retorno) => {
                                    if (retorno) {
                                        objeto['frequencia'] = { id : evento.valor };
        
                                    } else {
                                        if( objeto['padrao'] && objeto['padrao'].frequencia && objeto['padrao'].frequencia.id){
                                            objeto['frequencia'] = objeto['padrao'].frequencia;
                                            $("#" + id).val(objeto['frequencia']['id']);
                                        }else{
                                            $("#" + id).val('0');
                                        }
                                    }
        
                                    this.alertaFrequenciaMinima = `Confirmou a mensagem: '${this.modalMensagem}'`;
                                }, (error) => {
                                    Servidor.verificaErro(error, this.toastr);
                                }
                            );
                        } else {
                            objeto['frequencia'] = { id : evento.valor };
                        }
                    }
                } else {
                    objeto['frequencia'] = { id: evento.valor };
                }
            });
        }
    }

    setProcedimentosDoseMaxima(evento, objeto, id){
        this.modalConfirmar ? this.modalConfirmar.close() : null;

        if ( 1 > 2 ) {
            this.modalMensagem = `Dose Máxima maior que a padrão, deseja continuar?`;

            this.modalConfirmar = this.modalService.open(NgbdModalContent);
            this.modalConfirmar.componentInstance.modalHeader = 'Divergência';
            this.modalConfirmar.componentInstance.templateRefBody = this.bodyModalConfirm;
            this.modalConfirmar.componentInstance.modalAlert = true;

            this.modalConfirmar.componentInstance.retorno.subscribe(
                (retorno) => {
                    if (retorno) {

                    } else {

                    }
                }
            );
        }
    }

    objProcedimentos;  
    fnCfgProcedimentosRemote(term) {
        let requestFiltro = {
            unidadeAtendimentoId: this.objPrescricao['unidadeAtendimento'] ? this.objPrescricao['unidadeAtendimento']['id'] : undefined,
            like : term,
        }
        this.serviceItemPrescricao.get( Object.assign({},requestFiltro) ).subscribe(
            (retorno) => {
                this.objProcedimentos = retorno.dados || retorno;
                this.cdr.markForCheck();
            },
            (error) => {
                Servidor.verificaErro(error, this.toastr);
                this.cdr.markForCheck();
            },
        );
    }

    objModelos
    valorModelosSelecionado
    fnCfgModelosRemote(term) {
        let requestFiltro = {
            like : term,
        }
        this.serviceModelos.get( Object.assign({},requestFiltro) ).subscribe(
            (retorno) => {
                this.objModelos = retorno.dados || retorno;
                this.cdr.markForCheck();
            },
            (error) => {
                Servidor.verificaErro(error, this.toastr);
                this.cdr.markForCheck();
            },
        );
    }

    valorProdutosSelecionado;
    setObjParamProdutos(evento){
        if( evento ){
            this.objParamAddProduto['produto'] = { 
                id : evento.id,
            };

            this.valorProdutosSelecionado = evento.nome;
            this.cdr.markForCheck();
        }        
    }

    objProdutos;  
    fnCfgProdutosRemote(term) {
        this.serviceProduto.get({ like : term, principal : true }).subscribe(
            (retorno) => {
                this.objProdutos = retorno.dados || retorno;
                this.cdr.markForCheck();
            },
            (error) => {
                Servidor.verificaErro(error, this.toastr);
                this.cdr.markForCheck();
            },
        );
    }

    alertaFrequenciaMinima;
    salvarProcedimento(){
        this.objParamAddProcedimento['prescricaoPaciente'] = {
            id : this.idItemPrescricao
        }

        let validaProcedimento = this.validaProcedimento(this.objParamAddProcedimento);
        if( validaProcedimento['error'] ){
            this.toastr.error( validaProcedimento['mensagem'] );
            return;
        }

        this.validaDataHoras();
        delete this.objParamAddProcedimento.padrao;

        Observable.fromPromise(this.servicePacienteItem.salvar(this.objParamAddProcedimento))
            .finally(
                () => {
                    this.inicializaCamposData();
                    this.cdr.markForCheck();
                }
            )
            .subscribe(
                (retorno) => {
                    this.serviceItemProduto.get( { idPrescricaoItem : this.objParamAddProcedimento['prescricaoItem']['id'] } ).subscribe(
                        (produtos)=> {
                            let protudosItem = produtos.dados || produtos;
                            let aPromises = [];
                
                            protudosItem.forEach((produto)=>{
                
                                aPromises.push(
                                    new Promise((resolve, reject) => {
                
                                        let request = {
                                            "pacientePrescricaoItem": {
                                                "id": retorno 
                                            },
                                            "produto": {
                                                "id": produto.produto.id
                                            },
                                            "quantidade": produto.quantidade,
                                            "viaAcesso": produto.viaAcesso
                                        };

                                        (produto.unidade) ? request['unidade'] = { id : produto.unidade.id } : null

                                        this.servicePacienteProduto.salvar(request).subscribe(
                                            () => {
                                                resolve(true);
                                            }, (error) => {
                                                Servidor.verificaErro(error, this.toastr);
                                            }
                                        );
                                    })
                                );
                            });
                            Promise.all(aPromises).then(()=>{
                                console.log("finalizada inserção dos pacientePrescricaoProdutos");
                            });

                            this.objParamAddProcedimento = {
                                frequencia: {id: 0},
                                viaAcesso: '0'
                            };

                            this.valorProcedimentosSelecionado = '';
                        }, (error) => {
                            Servidor.verificaErro(error, this.toastr);
                        }
                    );

                    this.toastr.success("Procedimento adicionado com sucesso");
                    this.buscarItensPrescricaoPaciente(false);

                    console.log(retorno)
                    if (!!this.alertaFrequenciaMinima) {
                        console.log(this.alertaFrequenciaMinima)
                        let request = {
                            data: moment().format(this.formatosDeDatas.dataHoraSegundoFormato),
                            usuario: { guid : Sessao.getUsuario()['guid'] },
                            pacientePrescricaoItem: { id : retorno },
                            descricao: this.alertaFrequenciaMinima,
                        }
                        this.servicePacienteItem.salvarLog(request).subscribe(
                            (retorno) => {
                                console.log(retorno)
                            }, (error) => {
                                Servidor.verificaErro(error, this.toastr);
                            }
                        );

                        this.alertaFrequenciaMinima = null;
                    }
                },
                (error) => {
                    Servidor.verificaErro(error, this.toastr);
                },
            )
    }

    adicionarModelo(){
        
        if( this.itensModeloSelecionado && !this.itensModeloSelecionado.length ){
            this.toastr.warning("Selecione um modelo");
            return;
        }

        console.log(this.itensModeloSelecionado);
        
        let aPromiseItens = [];
        this.itensModeloSelecionado.forEach((item) => {
            let dataRef = item.horaInicio ? moment( item.horaInicio , this.formatosDeDatas.dataHoraSegundoFormato) : moment( moment(), this.formatosDeDatas.dataHoraSegundoFormato );

            let obj = {
                horaInicio: dataRef.format(this.formatosDeDatas.dataHoraSegundoFormato),
                horaFim:  dataRef.add( item['dias'], 'd' ).format( this.formatosDeDatas.dataHoraSegundoFormato ),
                prescricaoItem: {
                    id: item.prescricaoItem.id
                },
                prescricaoPaciente: {
                    id: this.idItemPrescricao
                },
                dosePadrao: item.dosePadrao,
                usoContinuo: !!item.usoContinuo,
            }

            if( item.frequencia ){
                obj['frequencia'] = item['frequencia'];
            }

            if( item.viaAcesso ){
                obj['viaAcesso'] = item['viaAcesso'];
            }

            console.log(obj);

            this.servicePacienteItem.salvar( obj ).subscribe(
                (retorno) => {
                    this.serviceItemProduto.get( { idPrescricaoItem : obj['prescricaoItem']['id'] } ).subscribe(
                        (produtos)=> {
                            let protudosItem = produtos.dados || produtos;
                            let aPromises = [];
                
                            protudosItem.forEach((produto)=>{
                                aPromises.push(
                                    new Promise((resolve, reject) => {

                                        let request = {
                                            "pacientePrescricaoItem": {
                                                "id": retorno 
                                            },
                                            "produto": {
                                                "id": produto.produto.id
                                            },
                                            "quantidade": produto.quantidade,
                                            "viaAcesso": produto.viaAcesso
                                        };

                                        (produto.unidade) ? request['unidade'] = { id : produto.unidade.id } : null
                                        
                                        this.servicePacienteProduto.salvar(request).subscribe(
                                            () => {
                                                resolve(true);
                                            }, (error) => {
                                                Servidor.verificaErro(error, this.toastr);
                                            }
                                        );
                                    })
                                );
                            });

                            Promise.all(aPromises).then(()=>{
                                console.log("finalizada inserção dos pacientePrescricaoProdutos");
                                this.buscarItensPrescricaoPaciente(false);
                            });
                        }, (error) => {
                            Servidor.verificaErro(error, this.toastr);
                        }
                    );
                }, (error) => {
                    Servidor.verificaErro(error, this.toastr);
                }
            );
        });

        this.valorModelosSelecionado = '';
        this.itensModeloSelecionado = false;
    }

    validaStatus(status) {
        switch (status) {
            case 'ABERTO':
                return 'aberto';
            case 'PRESCRITO':
                return 'prescrito';
            case 'SUSPENSO':
                return 'suspenso';
            case 'EXECUTADO':
                return 'executado';
            case 'CANCELADO':
                return 'cancelado';
            default:
                break;
        }
    }

    ordemItemPrescricao(sobe, desce) {       
        let request = {
            novoMenor: {id: sobe},
            novoMaior: {id: desce},
            prescricaoPaciente: {id: this.idItemPrescricao}
        }

        this.serviceItemPrescricao.ordemItem(request).subscribe(
            () => {
                this.buscarItensPrescricaoPaciente(null);
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    validaProcedimento(obj){
        let objerro = new Object();
        objerro['error'] = false;

        
        if( !obj['prescricaoItem'] || ( obj['prescricaoItem'] && !obj['prescricaoItem']['id'] ) ){
            objerro['mensagem'] = 'Selecione um Procedimento valido';
            objerro['error'] = true;
        }

        if (!obj['doseAplicada'] || !obj['doseAplicadaUnidade'] || !obj['doseAplicadaUnidade']['id']) {
            objerro['mensagem'] = 'Informe a Dose Aplicada';
            objerro['error'] = true;
        }


        return objerro;
    }

    validaProduto(obj){
        let objerro = new Object();
        objerro['error'] = false;
        
        if( !obj['produto'] || ( obj['produto'] && !obj['produto']['id'] ) ){
            objerro['mensagem'] = 'Selecione um Produto valido';
            objerro['error'] = true;
        }

        return objerro;
    }

    validaDataHoras(){
        if( this.objParamAddProcedimento['horaInicio'] ){
            let data = this.objParamAddProcedimento['horaInicio'];
            this.objParamAddProcedimento['horaInicio'] = moment(data, this.formatosDeDatas.dataHoraSegundoFormato).format(this.formatosDeDatas.dataHoraSegundoFormato);
        }else{
            this.objParamAddProcedimento['horaInicio'] = moment().format(this.formatosDeDatas.dataHoraSegundoFormato)
        }

        this.objParamAddProcedimento['horaFim'] = moment( this.objParamAddProcedimento['horaInicio'], this.formatosDeDatas.dataHoraSegundoFormato )
                                                    .add( this.objParamAddProcedimento['dias'], 'd' )
                                                    .format( this.formatosDeDatas.dataHoraSegundoFormato );

                                                    
                                                    
        // if( this.objParamAddProcedimento['horaFim'] ){
        //     let data = this.objParamAddProcedimento['horaFim'];
        //     this.objParamAddProcedimento['horaFim'] = moment(data).format(this.formatosDeDatas.dataHoraSegundoFormato);
        // }else{
        //     this.objParamAddProcedimento['horaFim'] = moment().format(this.formatosDeDatas.dataHoraSegundoFormato)
        // }

    }

    objParamAddProduto = new Object();
    salvarNovoProduto(){

        this.objParamAddProduto['pacientePrescricaoItem'] = {
            id : this.itemSelecionado
        }

        let validaProduto = this.validaProduto(this.objParamAddProduto);
        if( validaProduto['error'] ){
            this.toastr.error( validaProduto['mensagem'] );
            return;
        }

        this.servicePacienteProduto.salvar( this.objParamAddProduto ).subscribe(
            (retorno) => {
                this.toastr.success("Novo produto salvo com sucesso");
                this.buscarProdutosItemPaciente(this.itemSelecionado, false);

                this.objParamAddProduto = new Object();
                this.valorProdutosSelecionado = '';
            },
            (error) => {
                Servidor.verificaErro(error, this.toastr);
            },
        )
    }

    editaCampoItem(ev, label, id, valor) {
        ev.stopPropagation();

        if (!this.modoRealizacao && !this.somenteVisualizacao){
            if( !this.campoEdita[label]['id'] || ( id != this.campoEdita[label]['id'] ) ){
                this.campoEdita[label] = {
                    'id' : id,
                    'valor' : valor
                }
            }
        }
    }

    getCampoEditado(label, id, valor) {
        this.campoEdita[label] = {
            'id' : id,
            'valor': valor
        }
    }

    salvarCampoEdita(label, valor) {
        if( this.somenteVisualizacao ){
            return;
        }

        if( label != 'quantidade' && label != 'viaAcesso' && label != 'doseAplicada' && label != 'tempoInfusao' ){
            valor = { id : valor };
        }

        let param = new Object();
        param[label] = valor;
        
        this.servicePacienteItem.atualizar(this.campoEdita[label]['id'], param).subscribe(
            (produtoRet) => {
                this.toastr.success("Item editado com sucesso");
                this.campoEdita[label]['id'] = undefined;
                this.buscarItensPrescricaoPaciente(false);
            },
            (error) => {
                Servidor.verificaErro(error, this.toastr);
                this.campoEdita[label]['id'] = undefined;
            }
        );
    }

    salvarCampoEditaProduto(label, valor){
        if( label != 'quantidade' && label != 'viaAcesso' && label != 'doseAplicada' && label != 'tempoInfusao'){
            valor = { id : valor };
        }

        if( this.somenteVisualizacao ){
            return;
        }

        let param = new Object();
        param[label] = valor;
        
        this.servicePacienteProduto.atualizar(this.campoEdita[label]['id'], param).subscribe(
            () => {
                this.toastr.success("Item editado com sucesso");
                this.campoEdita[label]['id'] = undefined;
                this.buscarProdutosItemPaciente(this.itemSelecionado, false);
            },
            (error) => {
                Servidor.verificaErro(error, this.toastr);
                this.campoEdita[label]['id'] = undefined;
            }
        );
    }

    valorQuantidade(label, evento) {
        this.campoEdita[label]['valor'] = evento.valor;
    }

    cancelCampoEdita(label) {
        this.campoEdita[label] = {
            'id' : 0,
            'valor': 0
        }
    }

    
    getFrequencias(){
        this.serviceItemProduto.getFrequencias({}).subscribe(
            (retorno) => {
                this.opcoesFrequencia = retorno.dados || retorno;
            },
            (error) => {
                Servidor.verificaErro(error, this.toastr);
            },
        )
    }

    getUnidades(){
        this.serviceItemProduto.getUnidades({}).subscribe(
            (retorno) => {
                this.opcoesUnidadeMedida = retorno.dados || retorno;
            },
            (error) => {
                Servidor.verificaErro(error, this.toastr);
            },
        )
    }

    getViasAcesso(){
        this.serviceItemProduto.getViasAcesso({}).subscribe(
            (retorno) => {
                this.opcoesViaAcesso = retorno.dados || retorno;
            },
            (error) => {
                Servidor.verificaErro(error, this.toastr);
            },
        )
    }

    obrigaOrdem;
    loadingProcedimentos = false;
    buscarItensPrescricaoPaciente(loading = true){
        if (loading) {
            this.loadingProcedimentos = true;
        }

        let request = { 
            prescricaoPacienteId: this.idItemPrescricao,
            validaEspecialidade: this.validaEspecialidade,
            usuarioGuid: Sessao.getUsuario()['guid'],
        }

        this.servicePacienteItem.get(request).subscribe(
            (retorno) => {
                this.loadingProcedimentos = false;
                this.itensPrescricao = retorno.dados || retorno;
                // this.obrigaOrdem = this.itensPrescricao[0].prescricaoItem.obrigaOrdem;
                this.obrigaOrdem = true;
                this.inicializaCamposData();
                
                if (this.modoRealizacao && this.visualizaHistoricoRealizacao) {
                    let aPromise = [];
                    this.itensPrescricao.forEach(
                        (item) => {
                            this.buscaHistoricoPrescricao(null, item);
                        }
                    )
                }
                this.cdr.markForCheck();

            },
            (error) => {
                Servidor.verificaErro(error, this.toastr);
                this.loadingProcedimentos = false;
                this.cdr.markForCheck();
            },
        )
    }

    paginaAtualHistorico = 1;
    itensPorPaginaHistorico = 5;
    qtdItensTotalHistorico;
    historicoPrescricoes = new Object();
    buscaHistoricoPrescricao(evento = null, item = null){
        if( this.modoRealizacao && this.visualizaHistoricoRealizacao ){

            let request = {
                // pagina: ( evento ) ? evento.paginaAtual : this.paginaAtualHistorico,
                pagina: 1,
                quantidade: this.itensPorPaginaHistorico,
                pacientePrescricaoItemId: item.id
            }
            
            this.serviceHistoricoPrescricao.get( request ).subscribe(
                (historico) => {
                    
                    this.historicoPrescricoes[item.id] = this.ordenaHistorico(historico.dados || historico);
                    this.cdr.markForCheck();
                    // this.validaProximaPrescricao(item);
                },
                (error) => {
                    Servidor.verificaErro(error, this.toastr);
                }
            )
        }
    }

    validaClasse(pos){
        return ( pos % 2 == 0 );
    }

    ordenaHistorico(historico){
        //ORDENA PARA MOSTRAR OS PROXIMOS EM SEQUENCIA
        return historico.sort(
            (a,b) => {
                let retornoSort = moment(a.dataPrevista, this.formatosDeDatas.dataHoraSegundoFormato).diff( moment(b.dataPrevista, this.formatosDeDatas.dataHoraSegundoFormato) );

                return retornoSort;
            } 
        );
    }

    validaObjHistoricoPrescricoes(){
        this.cdr.markForCheck();
        return this.historicoPrescricoes && Object.keys(this.historicoPrescricoes).length > 0
    }

    proximaPrescricao;
    validaProximaPrescricao(item){
        let dataPrevista;

        // SE AINDA NAO TEVE EXECUÇÃO, PEGA  APROXIMA CON REFERÊNCIA A DATA INICIAL
        if( !this.historicoPrescricoes[item.id].length ){
            dataPrevista = this.calculaProxima(item, 'horaInicio', item.frequencia);
            
        }else{
            // SE JA TEVE EXECUÇÃO, PEGA  A ULTIMA EXECUTADA
            let ultimaExecucao = this.historicoPrescricoes[item.id][this.historicoPrescricoes[item.id].length -1];
            let frequencia = (ultimaExecucao.pacientePrescricaoItem) ? ultimaExecucao.pacientePrescricaoItem.prescricaoItem.frequencia : ultimaExecucao;

            if( ultimaExecucao.status != 'INICIAL' ){
                dataPrevista = this.calculaProxima(ultimaExecucao, 'dataExecutada', frequencia);
            }else{
                return;
            }

            let existe = this.historicoPrescricoes[item.id].filter(
                (execucao) => {
                    return dataPrevista == execucao.dataPrevista;
                }
            )

            if( existe && existe.length ){
                return;
            }

        }

        // SE TEM DATA FIM, E FOR DEPOIS DA DATA FINAL NAO INSERE NOVA MEDICAÇÃO
        let depois = moment( dataPrevista, this.formatosDeDatas.dataHoraSegundoFormato ).isAfter( moment( item['horaFim'], this.formatosDeDatas.dataHoraSegundoFormato ) )
        if( item['horaFim'] && depois ){
            return;
        }

    }

    criaProximaMedicacao(item, dataPrevista){
        let obj = { 
            "pacientePrescricaoItem" : {
                "id":item.id
            }, 
            "dataPrevista" : dataPrevista, 
            "usuarioExecucao" : {
                "guid": Sessao.getUsuario()['guid']
            }
        }

        this.serviceHistoricoPrescricao.salvar( obj ).subscribe(
            (retorno) => {
                console.log("Prescricao de hoje foi criada");

                this.historicoPrescricoes[item.id].push({
                    id: retorno,
                    dataPrevista: dataPrevista,
                    status: 'INICIAL',
                    pacientePrescricaoItem : {
                        prescricaoItem : {
                            frequencia: {
                                minutos: item.frequencia.minutos
                            }
                        }
                    }
                });
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    calculaProxima(item, dataReferencia, frequencia){
        let minutosFrequencia = frequencia && frequencia.minutos ? frequencia.minutos: 1
        if( minutosFrequencia == 1 ){
            console.warn("Sem frequencia");
        }

        let dataPrevista = moment( item[dataReferencia], this.formatosDeDatas.dataHoraSegundoFormato ).add( minutosFrequencia, 'm' ).format( this.formatosDeDatas.dataHoraSegundoFormato );

        return dataPrevista;
    }

    inicializaCamposData(){
        this.objParamAddProcedimento['horaInicio'] = moment().format(this.formatosDeDatas.dataHoraSegundoFormato)
        this.objParamAddProcedimento['horaFim'] = moment().format(this.formatosDeDatas.dataHoraSegundoFormato)
        this.objParamAddProcedimento['usoContinuo'] = false;
    }

    bolar = false;
    textoJustificativa;
    mudaStatusMedicacao(id, execucao, pos, item, ev = null){
        (ev) ? ev.preventDefault() : null;

        if( execucao.status != 'INICIAL' && execucao.status != 'PENDENTE')
            return;

        if( this.antesDataPrevista(execucao, 'dataPrevista') ){
            this.toastr.warning(`Medicação antes da data prevista: ${ execucao['dataPrevista'] }`);
            return;
        }

        let dataExecutada = moment().format(this.formatosDeDatas.dataHoraSegundoFormato);
        let obj = {
            dataExecutada: dataExecutada,
            status: id,
            usuarioExecucao: {
                guid: Sessao.getUsuario()['guid']
            }
        }

        if( this.atendimentoId ){
            obj['atendimento'] = { 
                id: this.atendimentoId 
            };
        }else if( this.objPrescricao.atendimento && this.objPrescricao.atendimento.id ){
            obj['atendimento'] = { 
                id: this.objPrescricao.atendimento.id
            };
        }else{
            this.toastr.warning("Não há atendimento para essa prescrição");
            return;
        }

        if( id == "BOLADO"){

            if( !this.bolar  ){
                this.bolar = true;
                this.abreModalJustifica(id, execucao, pos, item);
                return
            }else{
                if( !this.textoJustificativa ){
                    this.toastr.warning("É obrigatoria justificativa para bolar medicação");
                    return;
                }
                obj['justificativa'] = this.textoJustificativa;

                this.salvarStatusExecucao(execucao, id, item, pos, obj, dataExecutada);
                this.modalJustificativa.close();
            }

        } else if( id == "CHECADO" || id == "INICIAL"){

            this.modalConfirmar = this.modalService.open(NgbdModalContent);
            this.modalConfirmar.componentInstance.modalHeader = item.prescricaoItem.nome;
            this.modalConfirmar.componentInstance.modalMensagem = `Confirma ${(id == "INICIAL") ? 'início d' : ''}a medicação?`;
            this.modalConfirmar.componentInstance.modalAlert = true;

            this.modalConfirmar.componentInstance.retorno.subscribe(
                (retorno) => {
                    if (retorno) {
                        if( id == "INICIAL" ){
                            delete obj.dataExecutada
                            obj['inicio'] = dataExecutada; 
                            this.salvarStatusExecucao(execucao, id, item, pos, obj, dataExecutada);
                        }else{
                            this.abreModalSlots(execucao, id, item, pos, obj, dataExecutada);
                        }
                    }
                }
            );
        }
    }

    modalSlots;
    execucaoSelecionada;
    @ViewChild("bodyLotesPrescricao", {read: TemplateRef}) bodyLotesPrescricao: TemplateRef<any>;
    @ViewChild("botoesLotesPrescricao", {read: TemplateRef}) botoesLotesPrescricao: TemplateRef<any>;
    abreModalSlots(execucao, id, item, pos, obj, dataExecutada){
        
        this.execucaoSelecionada = execucao;
        this.itemSelecionado = item;
        let cfgGlobal:any = Object.assign(NgbdModalContent.getCfgGlobal(), {size: 'lg'});
        this.modalSlots = this.modalService.open(NgbdModalContent, cfgGlobal );
        this.modalSlots.componentInstance.modalHeader  = 'Informe os Lotes para cada produto';
        this.modalSlots.componentInstance.templateRefBody = this.bodyLotesPrescricao;
        this.modalSlots.componentInstance.templateBotoes = this.botoesLotesPrescricao;
        
        let objContext = { 
            id: id, 
            execucao: execucao,
            pos: pos,
            item: item,
            obj: obj,
            dataExecutada: dataExecutada
        }

        this.buscarProdutosItemPaciente(item.id);
        
        this.modalSlots.componentInstance.contextObject = objContext;

        this.modalSlots.result.then(
            (data) => {
                this.execucaoSelecionada = undefined;
            },
            (reason) => {
                this.execucaoSelecionada = undefined;
            }
        )
    }

    regraPosMedicacao(execucao, obj, item){
        if( obj.status == 'CHECADO' || obj.status == 'BOLADO' ){

            this.bolar = false;

            let ultimaExecucao = this.historicoPrescricoes[item.id][this.historicoPrescricoes[item.id].length -1];

            if( ultimaExecucao.id == execucao.id ){

                let frequencia = (ultimaExecucao.pacientePrescricaoItem) ? ultimaExecucao.pacientePrescricaoItem.prescricaoItem.frequencia : ultimaExecucao;
                let dataPrevista = this.calculaProxima(ultimaExecucao, 'dataExecutada', frequencia);
                
                // SE TEM DATA FIM, E FOR DEPOIS DA DATA FINAL NAO INSERE NOVA MEDICAÇÃO
                let depois = moment( dataPrevista, this.formatosDeDatas.dataHoraSegundoFormato ).isAfter( moment( item['horaFim'], this.formatosDeDatas.dataHoraSegundoFormato ) )
                if( item['horaFim'] && depois ){
                    this.toastr.success("Medicação encerrada.  " + item['horaFim']);
                    return;
                }

                // this.criaProximaMedicacao(item, dataPrevista);

            }

        }

        this.toastr.success("Medicação atualizada");
    }

    salvarStatusExecucao(execucao, status, item, pos, obj, dataExecutada, lotes = null){

        if( lotes ){
            // VALIDA O OBJETO REQUEST MANDANDO OS LOTES
        }

        this.serviceHistoricoPrescricao.atualizar( execucao.id, obj ).subscribe(
            () => {
                
                // PEGA POSICAO E MUDA O STATUS
                this.historicoPrescricoes[item.id][pos]['status'] = status;
                this.historicoPrescricoes[item.id][pos]['dataExecutada'] = dataExecutada;
                (this.modalSlots) ? this.modalSlots.dismiss() : null;
                
                this.regraPosMedicacao(execucao, obj, item);
                this.cdr.markForCheck();
            },
            (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        )
    }

    modalJustificativa;
    abreModalJustifica(id, execucao, pos, item){
        this.modalJustificativa = this.modalService.open(NgbdModalContent, {size: 'lg'});
        this.modalJustificativa.componentInstance.modalHeader  = 'Justificativa de Medicação';
        this.modalJustificativa.componentInstance.templateRefBody = this.bodyModalJustificativa;
        this.modalJustificativa.componentInstance.templateBotoes = this.modalJustificativaBotoes;

        let objContext = { 
            id: id, 
            execucao: execucao,
            pos: pos,
            item
        }
        this.modalJustificativa.componentInstance.contextObject = objContext

        this.modalJustificativa.result.then(
            (data) => {
                this.bolar = false;
            },
            (reason) => {
                this.bolar = false;
            }
        )

    }

    antesDataPrevista(item, dataReferencia){
        return !moment().isSameOrAfter( moment( item[dataReferencia], this.formatosDeDatas.dataHoraSegundoFormato ) );
    }

    converteHora(valor = 0) {
        let hora = Math.floor(valor / 60);
        let minuto = Math.floor(valor % 60);

        return `${("00" + hora).slice(-2)}:${("00" + minuto).slice(-2)}:00`;
    }
}