import { Component, ViewChild, TemplateRef, ViewContainerRef, OnInit, QueryList } from '@angular/core';
import { DicionarioTissService, GuiaLogService, ProcedimentoService, GuiaAuditoriaService, CobrancaService, ItemCobrancaService, ProfissionalService, CidService, UsuarioService, PrestadorAtendimentoService, ComposicaoItemCobrancaService, ParticipacaoService, Util } from '../../../../services';

import { Servidor } from '../../../../services/servidor';
import { Sessao } from '../../../../services/sessao';

import { ActivatedRoute, Router } from '@angular/router';

import { ToastrService } from 'ngx-toastr';
import * as moment from 'moment';

import { NgbdModalContent } from '../../../../theme/components/modal/modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormatosData } from '../../../../theme/components/agenda/agenda';
import { GlobalState } from '../../../../global.state';

@Component({
    selector: 'formulario',
    templateUrl: './formulario.html',
    styleUrls: ['./formulario.scss']
})

export class Formulario implements OnInit {
    refresh;

    cobranca;
    status;
    id;

    objParamsItemGuia = new Object();

    mensagensTISS;
    guiaAuditoria;
    
    mensagem = {};
    mensagens = [];
    qtdItensTotal;
    colunasTabela;

    preexistenciasFiltrados;
    preexistencias;
    paginaAtualPreExistencia = 1;
    itensPorPagina = 10;

    documento;
    paciente;

    arquivo;
    chatMsg;
    chatMsgHistorico;
    arquivoAnexado = '';
    nomeArquivo = '';

    modalInstancia;
    guiaLogStatusSelecionado;
    guiaLogStatus = [];
    mediarObs = '';
    formatosDeDatas = new FormatosData();
    momentjs = moment;
    
    paramId;
    erro = false;

    @ViewChild("bodyModalMediar", {read: TemplateRef}) bodyModalMediar: QueryList<TemplateRef<any>>;
    @ViewChild("templateBotoesMediar", {read: TemplateRef}) templateBotoesMediar: QueryList<TemplateRef<any>>;

    @ViewChild("bodyModalParecer", {read: TemplateRef}) bodyModalParecer: QueryList<TemplateRef<any>>;
    @ViewChild("templateBotoesParecer", {read: TemplateRef}) templateBotoesParecer: QueryList<TemplateRef<any>>;

    @ViewChild("bodyAuditarTodosItens", {read: TemplateRef}) bodyAuditarTodosItens: QueryList<TemplateRef<any>>;
    @ViewChild("botoesAuditarTodosItens", {read: TemplateRef}) botoesAuditarTodosItens: QueryList<TemplateRef<any>>;
    
    @ViewChild("modalEdita", {read: TemplateRef}) modalEdita: TemplateRef<any>;
    @ViewChild("modalEditaBotoes", {read: TemplateRef}) modalEditaBotoes: TemplateRef<any>;
    
    @ViewChild("bodyHistoricoExames", {read: TemplateRef}) bodyHistoricoExames: QueryList<TemplateRef<any>>;
    
    constructor(
        private vcr: ViewContainerRef,
        private toastr: ToastrService, 
        private route: ActivatedRoute,
        private router: Router,
        private _state: GlobalState, 
        private modalService: NgbModal,
        private serviceCid: CidService,
        private guiaLogService: GuiaLogService,
        private serviceUsuario: UsuarioService,
        private cobrancaService: CobrancaService,
        private serviceTISS: DicionarioTissService,
        private serviceItemCobranca: ItemCobrancaService,
        private serviceProcedimento: ProcedimentoService,
        private profissionalService: ProfissionalService,
        private serviceParticipacao: ParticipacaoService,
        private guiaAuditoriaService: GuiaAuditoriaService,
        private servicePrestador: PrestadorAtendimentoService,
        private serviceComposicaoItemCobranca: ComposicaoItemCobrancaService,
    ) {

        this.route.params.subscribe(params => {
            this.paramId = parseInt(params['id']);
        })

        this.colunasTabela = [
            {'titulo': 'Data', 'chave': 'data'},
            {'titulo': 'Mensagem', 'chave': 'mensagem'},
            {'titulo': 'Usuário', 'chave': 'usuario'}
        ];

        // this.guiaLogService.getStatus({pagina: 1, quantidade: 30}).subscribe(
        //     (resp) => {
        //         this.guiaLogStatus = resp.dados;
        //     }, (erro) => {
        //         Servidor.verificaErro(erro, this.toastr);
        //     }
        // );
    }

    cobrancaPadrao = new Object();
    ngOnInit() {
        this._state.notifyDataChanged('menu.isCollapsed', true);
        this.formatosDeDatas = new FormatosData();
        this.getCobranca(true)

        this.inicializaParametros();
    }

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


    valorProcedimentoSelecionado;
    idProcedimento;
    setNovoProcedimento(evento){
        if( evento ) {
            this.valorProcedimentoSelecionado = evento.descricao;
            this.objParamsItemGuia['procedimento'] = { id : evento.id };
            this.idProcedimento = evento.id;
        }else{
            this.objParamsItemGuia['procedimento'] = undefined;
            this.idProcedimento = '';
            this.valorProcedimentoSelecionado = '';
        }
    }
    
    objProcedimentos = [];    
    fnCfgProcedimentoRemote(term) {
       if ( term.match(/\D/g) ) {
            this.serviceProcedimento.procedimentoPaginadoFiltro( 1, 10, term ).subscribe(
                (retorno) => {
                    this.objProcedimentos = retorno.dados || retorno;
                }, (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                }
            );
        } else {
            this.serviceProcedimento.getProcedimentosCodigo(term).subscribe(
                (mensagens) => {
                    let retorno = mensagens.dados || mensagens;
                    this.objProcedimentos = (retorno) ? [retorno] : [];
                }, (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                }
            )
        }
    }
    
    valorMensagemSelecionado
    objMensagemTISS = [];    
    fnCfgMensagemRemote(term) {
        this.serviceTISS.getMensagemTISS({pagina:1, quantidade:10, like:term }).subscribe(
            (mensagens) => {
                this.objMensagemTISS = mensagens.dados;
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );
    }
    setMensagem(evento, item, pos){
        if(evento.descricao){
            if( item ){
                this.cobranca.itens[pos].mensagem = evento.descricao;
            }else{
                this.valorMensagemSelecionado = evento.descricao
            }
        }
    }

    setMsgTiss(pos){
        return (this.cobranca.itens[pos].mensagem) ? this.cobranca.itens[pos].mensagem : ''
    }

    getValor(evento, item, pos){
        this.cobranca.itens[pos].mensagem = evento;
        console.log(item);
        
        if( this.itensAlterados[item.id] ){
            this.itensAlterados[item.id] = item;
        }else{
            this.itensAlterados[item.id] = new Object();
            this.itensAlterados[item.id] = item;
        }

    }

    formataDataInclusao(cobranca, bReduzNome = false) {

        if (!cobranca.beneficiario || !cobranca.beneficiario.inclusao) {
            return '';
        }

        let valor = cobranca.beneficiario.tempoContrato || '';

        let sValor = `${cobranca.beneficiario.inclusao}, ${valor}`;
        
        if (bReduzNome && sValor.length > 28) {
            sValor = `${sValor.substr(0, 28)}...`;
        }

        return sValor;
    }

    formataBeneficiario(cobranca){
        return `${cobranca.beneficiario.codigo} - ${cobranca.beneficiario.nome}, ${cobranca.beneficiario.nascimento} (${cobranca.beneficiario.idade})`;
    }

    formataPrestador(cobranca){
        return `${cobranca.prestador.codigo} - ${cobranca.prestador.nome}`;
    }

    formataGuia(cobranca) {
        if (cobranca && cobranca.ano && cobranca.mes && cobranca.numero) {
            return `${cobranca.ano}.${cobranca.mes}.${cobranca.numero}`;
        } 

        return '';
    }

    formataStatus(cobranca) {
        return cobranca ? cobranca.status : '';
    }

    itensAlterados = new Object();
    atualizaGlosa(evento, item, pos) {

        if( !evento ){
            if( this.itensAlterados[item.id] ){
                this.itensAlterados[item.id] = new Object();
            }else{
                this.itensAlterados[item.id] = item;
                this.itensAlterados[item.id]['qtdMax'] = item['quantidadeSolicitada']
                this.cobranca.itens[pos]['quantidadeAutorizada'] = 0;
                this.itensAlterados[item.id]['quantidadeAutorizada'] = 0;
                this.cobranca.itens[pos]['naoAprovada'] = false;
            }

            this.cobranca.itens[pos]['naoAprovada'] = false;
        }else{
            if( this.itensAlterados[item.id] ){
                delete this.itensAlterados[item.id];
                this.cobranca.itens[pos]['naoAprovada'] = undefined;
            }

            this.getCobranca(true);
        }
        
        // if( !evento ){
        //     let objGlosa = { "quantidadeAutorizada" : 0 };
        //     this.serviceItemGuia.putGuiaItem( item.id, objGlosa ).subscribe(
        //         (status) => {
        //             this.toastr.success("Item da Guia editado com sucesso");
        //             item['glosa'] = true;
        //             this.getCobranca(true);
        //         }, erro => {
                        // Servidor.verificaErro(erro, this.toastr);
        //             this.toastr.error("Houve um erro ao editar o Item da Guia");
        //             this.getCobranca(false);
        //         }
        //     )
        // }
    }

    getCobranca(ok){
        this.objParamsItemGuia = new Object();

        if( ok ){
            let request = {
                id: this.paramId
            }

            this.cobrancaService.get(request).subscribe(
                (retorno) => {
                    let cobranca = (retorno.dados || retorno);
                    if( cobranca && cobranca.length ){
                        this.cobranca = cobranca[0];
                        this.id = parseInt(cobranca[0].id);
                        this.inicializaCobrancaPadrao();
                        this.status = this.cobranca.cobrancaStatus == 'EDITANDO';
                        // this.cobranca.itens = this.iniciaItens();
                    }else{
                        this.toastr.error("Não foi encontrado essa cobranca");
                    }
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                    this.erro = true;
                    // this.toastr.error("Houve um erro ao abrir a cobrança");
                }
            );
        }
    }

    inicializaCobrancaPadrao(){
        this.cobrancaPadrao = {
            cobranca: {
                id: this.cobranca.id
            }
        }
    }

    classesItens = [];
    setObjItensGuia(){
        this.cobranca.itens.forEach(
            (item) => {
                if ( this.classesItens.indexOf(item.procedimento.classe.descricao) < 0 ){
                    this.classesItens.push(item.procedimento.classe.descricao);
                }
            }
        )

    }

    retornaItensGuiaClasse(classe){

        let retornoArray = [];
        if( this.cobranca.itens && this.cobranca.itens.length ){
            this.cobranca.itens.forEach(
                (item, index) => {
                    if( item.procedimento.classe && item.procedimento.classe.descricao == classe ){
                        item['posicao'] = index;
                        retornoArray.push( item );
                    }
                }
            )

            return retornoArray
        }
         
        return retornoArray;
    }

    bloqueiaMsg(id){
        return !(this.itensAlterados[id]);
    }

    formataPlano(cobranca) {
        if (cobranca && cobranca.beneficiario && cobranca.beneficiario.plano && cobranca.beneficiario.plano.length > 15) {
            return cobranca && cobranca.beneficiario ? (`${cobranca.beneficiario.plano.substr(0,15)}...`) : '';
        } 
        return cobranca && cobranca.beneficiario ? cobranca.beneficiario.plano.substr(0,15) : '';
    }


    setQuantidadeSolicitada(evento, idItem, pos, item){
        if( evento.valor ){
            if( this.itensAlterados[idItem] ){
                
                if( evento.valor <= this.itensAlterados[idItem]['qtdMax'] ){
                    this.itensAlterados[idItem]['quantidadeAutorizada'] = evento.valor;
                }else{
                    this.cobranca.itens[pos]['quantidadeAutorizada'] = this.itensAlterados[idItem]['qtdMax'];
                    this.toastr.error("Quantidade nao permitida");
                }
            }else{
                this.itensAlterados[idItem] = new Object();
                this.itensAlterados[idItem] = item;
                this.itensAlterados[idItem]['qtdMax'] = item['quantidadeSolicitada']
                this.itensAlterados[idItem]['quantidadeAutorizada'] = evento.valor;
                this.cobranca.itens[pos]['quantidadeAutorizada'] = evento.valor;
            }
        }
    }

    modalNovoProcedimento;
    /*
    TIPO:
        Procedimento
        Composicao
    */
    novaComposicao = new Object();
    abreModalItem(item, tipo = 'Procedimento', idItemCobranca = undefined) {
        event.preventDefault();

        this.valorProcedimentoSelecionado = (item.procedimento) ? item.procedimento.codigo + ' - ' + item.procedimento.descricao : undefined;

        if (tipo == 'Composicao' && idItemCobranca) {
            item['item'] = { id: idItemCobranca };
        }

        let cfgGlobal:any = Object.assign(NgbdModalContent.getCfgGlobal(), {size: 'lg'});
        
        this.modalNovoProcedimento = this.modalService.open(NgbdModalContent, cfgGlobal);

        this.modalNovoProcedimento.componentInstance.modalHeader = `${this.status ? 'Editar' : ''} ${tipo}`;
        this.modalNovoProcedimento.componentInstance.templateRefBody = this[`modalEdita`];

        if (this.status) {
            this.modalNovoProcedimento.componentInstance.templateBotoes = this[`modalEditaBotoes`];
        }
        
        let context = new Object();
        console.log(item);
        
        context[`obj${tipo}`] = item;
        context[`criaNovo`] = false;
        this.modalNovoProcedimento.componentInstance.contextObject = context;

        this.modalNovoProcedimento.result.then(
            () => {
                this.novaComposicao = {};
                this.valorProcedimentoSelecionado = '';
                this.novoItem = {};
                item = {};
            }, () => {
                this.novaComposicao = {};
                this.valorProcedimentoSelecionado = '';
                this.novoItem = {};
                item = {};
            }
        );
        
        event.stopPropagation();
    }
    
    novoItem = new Object();
    salvarProcedimento(item, novo = false){
        // item = this.validaNovoProcedimento(item)
        if(!item){
            return;
        }
            
        let novoProcedimento = Object.assign( item, this.cobrancaPadrao );

        if (novoProcedimento.procedimento) {
            delete novoProcedimento.procedimento.descricao;
            delete novoProcedimento.procedimento.classe;
            delete novoProcedimento.procedimento.altoCusto;
            delete novoProcedimento.procedimento.codigo;
        }

        novoProcedimento = Util.retornaObjValidado(novoProcedimento, true);

        if (!novoProcedimento.id) {

            this.serviceItemCobranca.post( novoProcedimento ).subscribe(
                (retorno) => {
                    this.toastr.success("Procedimento adicionado com sucesso");
                    this.refreshProcedimentos();
                    (this.modalNovoProcedimento) ? this.modalNovoProcedimento.dismiss() : null;
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                    // this.toastr.error("Houve um erro ao editar procedimento");
                }
            )

        } else {

            this.serviceItemCobranca.put( novoProcedimento.id, novoProcedimento ).subscribe(
                (retorno) => {
                    this.refreshProcedimentos();
                    this.toastr.success("Procedimento editado com sucesso");
                    (this.modalNovoProcedimento) ? this.modalNovoProcedimento.dismiss() : null;
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                    // this.toastr.error("Houve um erro ao editar procedimento");
                }
            )
        }
    
        this.getCobranca(true);
    }

    removeItem(item, tipo = 'Procedimento'){
        event.preventDefault();

        if( !confirm(`Deseja remover ${tipo}?`) ){
            return;
        }

        let service = ( tipo == 'Procedimento' ) ? this.serviceItemCobranca : this.serviceComposicaoItemCobranca;
        service.delete( item.id ).subscribe(
            (retorno) => {
                this.toastr.success(`${tipo} removido com sucesso`);
                this.refreshProcedimentos();
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
                this.toastr.error(`Houve um erro ao remover`);
            }
        );

        event.stopPropagation();
    }

    itemCobrancaPadrao = new Object();
    salvarComposicao(item, novo = false){

        item = this.validaNovaComposicao(item)
        if(!item){
            return;
        }
            
        let novaComposicao = item;

        (novaComposicao.prestador) ? novaComposicao.prestador = { id: novaComposicao.prestador.id } : null;
        (novaComposicao.profissional) ? novaComposicao.profissional = { id: novaComposicao.profissional.id } : null;
        (novaComposicao.unidadeSaude) ? novaComposicao.unidadeSaude = { id: novaComposicao.unidadeSaude.id } : null;
        (novaComposicao.unidadeSaude) ? novaComposicao.unidadeSaude = { id: novaComposicao.unidadeSaude.id } : null;

        if( !novaComposicao.id ){

            this.serviceComposicaoItemCobranca.post( novaComposicao ).subscribe(
                (retorno) => {
                    this.toastr.success("Composição adicionada com sucesso");
                    this.refreshProcedimentos();
                    (this.modalNovoProcedimento) ? this.modalNovoProcedimento.dismiss() : null;
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                    // this.toastr.error("Houve um erro ao editar Composição");
                }
            )

        }else{

            this.serviceComposicaoItemCobranca.put( novaComposicao.id, novaComposicao).subscribe(
                (retorno) => {
                    this.refreshProcedimentos();
                    this.toastr.success("Composição editada com sucesso");
                    (this.modalNovoProcedimento) ? this.modalNovoProcedimento.dismiss() : null;
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                    // this.toastr.error("Houve um erro ao editar Composição");
                }
            )
        }
    
    }

    fnSetProcedimento(procedimento, obj){
        if ( procedimento ) {
            this.valorProcedimentoSelecionado = procedimento.codigo + ' - ' + procedimento.descricao;
            obj['procedimento'] = { 
                id : procedimento.id,
                tabelatipo: {
                    id: procedimento.tabelatipo.id
                }
            };
        } else {
            obj['procedimento'] = undefined;
            this.valorProcedimentoSelecionado = '';
        }
    }

    setDataItem(data, tipo, item){
        console.log(data);
        
        if( data && data.valor ){
            console.log("SetDATA:  " + data.valor);
            item[tipo] = data.valor;
        }
    }

    setValor(valor, quantidade) {
        if (valor) {
            valor = valor.toString().replace(",",".");
            let valorTotal = parseFloat(valor) * parseInt(quantidade);
            return valorTotal.toFixed(2)
        }
        return 0;
    }

    objUsuarios;
    novoProfissional = new Object();
    fnCfgUsuarioRemote(term) {
        this.serviceUsuario.usuarioPaginadoFiltro( 1, 10, term ).subscribe(
            (retorno) => {
                this.objUsuarios = retorno.dados || retorno;
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        )
    }

    usuarioPaciente
    usuarioCobrancaItemSelecionado;
    getUsuario(usuario, item, tipo) {
        if (usuario) {
            item[tipo] = { guid : usuario.guid }
            this.usuarioCobrancaItemSelecionado = usuario['nome'];
        } else {
            item[tipo] = undefined;
        }
    }

    objPrestador;
    fnCfgPrestadorRemote(term) {

        let request = {
            like: term,
            pagina: 1,
            quantidade: 10
        }
        this.servicePrestador.getPrestadorAtendimentoLike( request ).subscribe(
            (retorno) => {
                this.objPrestador = retorno.dados || retorno;
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        )
    }

    prestadorNovoItemSelecionado;
    getPrestador(prestador, item, tipo) {
        if (prestador) {
            item[tipo] = { 
                id : prestador.id,
                nome: prestador['nome']
            }
            this.prestadorNovoItemSelecionado = prestador['nome'];
        } else {
            item[tipo] = undefined;
        }
    }

    // objUnidadeSaude;
    // fnCfgUnidadeSaudeRemote(term?: string) {// TODO
    //     let request = term ? { like : term } : {};

    //     this.serviceComposicaoItemCobranca.getUnidadeSaude( request ).subscribe(
    //         (retorno) => {
    //             this.objUnidadeSaude = retorno.dados || retorno;
    //         }, (erro) => {
    //             Servidor.verificaErro(erro, this.toastr);
    //         }
    //     )
    // }

    // unidadeSaudeNovoItemSelecionado;
    // getUnidadeSaude(unidade, item, tipo) {
    //     if (unidade) {
    //         item[tipo] = { 
    //             id : unidade.id ,
    //             descricao: unidade['descricao']
    //         }
    //         this.unidadeSaudeNovoItemSelecionado = unidade['descricao'];
    //     } else {
    //         item[tipo] = undefined;
    //     }
    // }

    validaNovoProcedimento(item){

        if( !item['procedimento']  || (item['procedimento'] && !item['procedimento']['id']) ){
            this.toastr.warning("Informe um procedimento");
            return false;
        }

        if( !item['quantidade'] ){
            this.toastr.warning("Informe uma Quantidade");
            return false;
        }

        

        return this.retornaObjValidado(item);
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
                    }
                }
            }
        )

        return itemValidado;
    }

    validaNovaComposicao(item){
        return this.retornaObjValidado(item);
    }

    refreshProcedimentos(){

        let request = {
            cobranca:{
                id: this.cobrancaPadrao['id']
            }
        }

        this.serviceItemCobranca.get( request ).subscribe(
            (retorno) => {
                let cobrancaItens = retorno.dados || retorno;
                this.cobranca.itens = cobrancaItens;
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        )
    }

    refreshComposicoes(){
        // let request = {
        //     cobrancaItem:{
        //         id: this.cobrancaPadrao['id']
        //     }
        // }

        // this.serviceItemCobrancaComposicoes.get( request ).subscribe(
        //     (retorno) => {
        //         let cobrancaItens = retorno.dados || retorno;
        //         this.cobranca.itens = cobrancaItens;
        //     },
        //     (erro) => {
        //         Servidor.verificaErro(erro, this.toastr);
        //     }
        // )
    }

    mostraDesc(ev, item, tipo){
        if( item.procedimento[tipo] ){

            $(ev.target).find('.desc-item').show();
            $(ev.target).find('.desc-item').css({
                "top": ev.clientY + 20, 
                "left": ev.clientX - 200,
                "max-width": 200,
                "display": "block"
            });
            
        }
    }

    escondeContextMenu(){
        $('.desc-item').hide();
    }

    paginaAtualFiltroGuia = 1;
    itensPorPaginaFiltroGuia = 15;
    objFiltroGuias = new Object();
    guiaFiltro = [];
    guiaFiltroFiltradas = [];
    visualizarHistorico(evento, idProcedimento){
        console.log(evento);

        if (this.cobranca.pacientePlano && idProcedimento) {
            let request = {
                pagina: 0,
                quantidade: 0,
                procedimentoCodigo: idProcedimento,
                carteirinha: this.cobranca.pacientePlano.codigo
            };

            this.guiaAuditoriaService.getFiltroGuia(request).subscribe(
                (retorno) => {
                    let objretorno = retorno.dados || retorno;
                    this.guiaFiltro = (request['pagina'] == 1) ? objretorno : this.guiaFiltro.concat([], objretorno);
                    this.guiaFiltroFiltradas = this.guiaFiltro;

                    if( !this.guiaFiltroFiltradas.length ){
                        this.toastr.warning("Procedimento sem histórico");
                        return;
                    }
                    
                    this.modalInstancia = this.modalService.open(NgbdModalContent, {size: 'lg'});
                    this.modalInstancia.componentInstance.modalHeader = 'Histórico do Procedimento';
                    this.modalInstancia.componentInstance.templateRefBody = this.bodyHistoricoExames;
                    this.modalInstancia.componentInstance.custom_lg_modal = true;
                }, (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                }
            )
        } else {
            this.toastr.warning('Cobrança nao possui plano selecionado. Não é possível ver o histórico de procedimento');
            return;
        }
    }

    faturar(){
        this.toastr.success("Salvar Cobrança");

        this.cobrancaService.put(this.id, {cobrancaStatus: 'FATURANDO'}).subscribe(
            () => {
                this.toastr.success("Cobrança faturada");
                this.getCobranca(true);
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
                Servidor.verificaErro(erro, this.toastr);
            }
        )
    }

    direcionaPaciente(paciente){
        this.router.navigate([`/${Sessao.getModulo()}/paciente/formulario/${paciente.id}`]);
    }

    voltar(){
        // this.router.navigate([`/${Sessao.getModulo()}/previa`]);
        window.history.go(-1);
    }

    objProfissional;
    fnCfgprofissionalRemote(term) {

        let objParam: Object;
        if( !term.match(/\D/g) ){
            objParam = { conselhoNumero : term };
        }else{
            objParam = { like : term };
        }

        objParam['pagina'] = 1;
        objParam['quantidade'] = 10;

        this.profissionalService.get( objParam ).subscribe(
            (retorno) => {
                this.objProfissional = retorno.dados || retorno;
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );
    }

    profissionalNovoItemSelecionado
    getProfissional(evento, item){
        if( evento ){
            item['profissional'] = { 
                id : evento['id'],
                nome: evento['nome']
            };
            this.profissionalNovoItemSelecionado = evento['nome'];
        }
    }

    getParticipacao(evento, item){
        if( evento ){
            item['participacao'] = { 
                id : evento['id'],
                descricao: evento['codigo'] + ' - ' + evento['descricao']
            };
        }
    }

    valorCidSelecionado;
    setCidCobranca(evento, item){
        if( evento ){
            this.valorCidSelecionado = `${evento.codigo} - ${evento.descricao}`;
            item['cid'] = {id: evento.id};
        }
    }

    objCid = [];
    fnCfgCidRemote(term) {
        this.serviceCid.getCidLike(term).subscribe(
            (retorno) => {
                this.objCid = retorno.dados || retorno;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        );
    }

    opcoesParticipacao = [];
    opcoesUnidadeSaude = [];
    opcoesDmTissEncerramento = [];
    opcoesDmTissCaraterAtendimento = [];
    opcoesDmTissTpInternacao = [];
    opcoesDmTissTecnica = [];
    opcoesDmTissDespesa = [];
    opcoesDmTissUnidadeMedica = [];
    opcoesDmTissViaAcesso = [];
    opcoesCobrancaItemStatus = [];
    opcoesComposicaoStatus = [];
    opcoesCobrancaStatus = [];
    opcoesDmTissTpFaturamento = [];
    opcoesDmTissTpConsulta = [];
    opcoesDmTissTpAtendimento = [];
    opcoesDmTissRegimeInt = [];
    opcoesDmTissAcidente = [];
    inicializaParametros(){
        this.serviceParticipacao.get({simples: true}).subscribe(
            (retorno) => {
                this.opcoesParticipacao = retorno.dados || retorno;
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );

        this.serviceComposicaoItemCobranca.getUnidadeSaude({}).subscribe(
            (retorno) => {
                this.opcoesUnidadeSaude = retorno.dados || retorno;
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );

        this.serviceTISS.getCaraterAtendimento().subscribe(
            (retorno) => {
                this.opcoesDmTissCaraterAtendimento = retorno.dados || retorno;
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );

        this.serviceTISS.getTipoInternacao().subscribe(
            (retorno) => {
                this.opcoesDmTissTpInternacao = retorno.dados || retorno;
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );

        this.serviceTISS.getTipoEncerramento().subscribe(
            (retorno) => {
                this.opcoesDmTissEncerramento = retorno.dados || retorno;
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );

        this.serviceTISS.getTipoFaturamento().subscribe(
            (retorno ) => {
                this.opcoesDmTissTpFaturamento = retorno.dados || retorno;
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );

        this.serviceTISS.getRegimeInternacao().subscribe(
            (retorno ) => {
                this.opcoesDmTissRegimeInt = retorno.dados || retorno;
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );

        this.serviceTISS.getTipoAtendimento().subscribe(
            (retorno ) => {
                this.opcoesDmTissTpAtendimento = retorno.dados || retorno;
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );

        this.serviceTISS.getTissAcidente().subscribe(
            (retorno ) => {
                this.opcoesDmTissAcidente = retorno.dados || retorno;
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );

        this.serviceTISS.getTipoConsulta().subscribe(
            (retorno ) => {
                this.opcoesDmTissTpConsulta = retorno.dados || retorno;
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );

        this.serviceTISS.getUnidadeMedida().subscribe(
            (retorno ) => {
                this.opcoesDmTissUnidadeMedica = retorno.dados || retorno;
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );

        this.serviceTISS.getViaAcesso().subscribe(
            (retorno ) => {
                this.opcoesDmTissViaAcesso = retorno.dados || retorno;
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );

        this.serviceTISS.getDespesa().subscribe(
            (retorno ) => {
                this.opcoesDmTissDespesa = retorno.dados || retorno;
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );

        this.serviceTISS.getTecnica().subscribe(
            (retorno ) => {
                this.opcoesDmTissTecnica = retorno.dados || retorno;
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );

        // TODO CobrancaService
        // this.serviceItemCobranca.getStatus().subscribe(
        //     (retorno ) => {
        //         this.opcoesCobrancaItemStatus = retorno.dados || retorno;
        //     }, (erro) => {
        //         Servidor.verificaErro(erro, this.toastr);
        //     }
        // );

        // TODO CobrancaService
        // this.serviceComposicaoItemCobranca.getStatus().subscribe(
        //     (retorno ) => {
        //         this.opcoesComposicaoStatus = retorno.dados || retorno;
        //     }, (erro) => {
        //         Servidor.verificaErro(erro, this.toastr);
        //     }
        // );
    }

    validaErro(erro){
        if( erro._body && erro.status == 412 ){
            try{
                let response = JSON.parse(erro._body);
                this.toastr.error(response.message);
                return;
            }catch(e){
                console.error("Erro ao exibir mensagem");
            }
        }
    }
}