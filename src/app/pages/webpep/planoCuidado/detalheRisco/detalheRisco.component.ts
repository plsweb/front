import { Component, OnInit, OnDestroy, TemplateRef, Renderer2, ViewContainerRef, ChangeDetectionStrategy, ChangeDetectorRef, ViewChild, ElementRef, Renderer, QueryList } from '@angular/core';
import { BrowserHelpers, PerguntaService, CuidadoService, RiscoService, RiscoGrauService, CuidadoRiscoGrauService, RiscoCalculoService} from '../../../../services';
import { Servidor } from '../../../../services/servidor';
import { Sessao } from '../../../../services/sessao';

import { ActivatedRoute, Router } from '@angular/router';
import { GlobalState } from '../../../../global.state';
import { Notificacao, Aguardar, TopoPagina, Agenda } from '../../../../theme/components';
import { FormatosData } from '../../../../theme/components/agenda/agenda';
import { NgbdModalContent } from '../../../../theme/components/modal/modal.component';
import { TreeviewItem } from 'ngx-treeview';

import { ToastrService } from 'ngx-toastr';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import * as moment from 'moment';
import * as jQuery from 'jquery';

moment.locale('pt-br');

@Component({
    selector: 'detalheRisco',
    templateUrl: './detalheRisco.html',
    styleUrls: ['./detalheRisco.scss'],
    providers: [CuidadoService, RiscoService, RiscoGrauService, CuidadoRiscoGrauService, RiscoCalculoService]
})

export class DetalheRisco implements OnInit, OnDestroy {

    riscoId;
    risco;

    nivelRiscoId;
    nivelRisco;

    riscoCalculo;
    riscoCalculoId;

    atual;
    qtdItensTotalNiveis;
    paginaAtualNiveis;
    itensPorPaginaNiveis;

    qtdItensTotal;
    paginaAtual;
    itensPorPagina;

    pergunta;
    objFiltro = [ 'descricao', 'descricao' ];
    sexoOpcoes = [];

    riscosGrauSaude = [];
    cuidadosRiscoGrau = [];
    cuidado;
    novoCuidadoRiscoGrau = new Object();

    perguntasRisco = [];

    modalInstancia;

    colorPicker;
    iconeSelector;
    
    @ViewChild("formPergunta", {read: ElementRef}) formPergunta: ElementRef;

    @ViewChild("bodyModalRemoverRisco", {read: TemplateRef}) bodyModalRemoverRisco: QueryList<TemplateRef<any>>;
    @ViewChild("footerModalRemoverRisco", {read: TemplateRef}) footerModalRemoverRisco: QueryList<TemplateRef<any>>;

    @ViewChild("bodyModalRemoverRiscoCalculo", {read: TemplateRef}) bodyModalRemoverRiscoCalculo: QueryList<TemplateRef<any>>;
    @ViewChild("footerModalRemoverRiscoCalculo", {read: TemplateRef}) footerModalRemoverRiscoCalculo: QueryList<TemplateRef<any>>;

    @ViewChild("tmplFmrNivelRisco", {read: TemplateRef}) tmplFmrNivelRisco: QueryList<TemplateRef<any>>;
    @ViewChild("bodyModalRemoverNivelRisco", {read: TemplateRef}) bodyModalRemoverNivelRisco: QueryList<TemplateRef<any>>;
    @ViewChild("footerModalRemoverNivelRisco", {read: TemplateRef}) footerModalRemoverNivelRisco: QueryList<TemplateRef<any>>;
    @ViewChild("footerModalEditarNivelRisco", {read: TemplateRef}) footerModalEditarNivelRisco: QueryList<TemplateRef<any>>;

    @ViewChild("bodyModalcfgCuidadoNivelRisco", {read: TemplateRef}) bodyModalcfgCuidadoNivelRisco: QueryList<TemplateRef<any>>;
    @ViewChild("footerModalcfgCuidadoNivelRisco", {read: TemplateRef}) footerModalcfgCuidadoNivelRisco: QueryList<TemplateRef<any>>;

    @ViewChild("tmplFmrCalculoRisco", {read: TemplateRef}) tmplFmrCalculoRisco: QueryList<TemplateRef<any>>;
    @ViewChild("footerModalEditarCalculoRisco", {read: TemplateRef}) footerModalEditarCalculoRisco: QueryList<TemplateRef<any>>;

    constructor( 
        private _state: GlobalState, 
        public router: Router,
        private route: ActivatedRoute,
        private modalService: NgbModal,
        private renderer: Renderer2,
        private toastr: ToastrService, 
        private vcr: ViewContainerRef,
        private servicePergunta: PerguntaService,
        private cuidadoService: CuidadoService,
        private riscoService: RiscoService,
        private riscoGrauService: RiscoGrauService,
        private cuidadoRiscoGrauService: CuidadoRiscoGrauService,
        private riscoCalculoService: RiscoCalculoService
    ) { 
        this.route.params.subscribe(params => {
            this.riscoId = params['riscoid'] == 'novo' ? undefined : params['riscoid'];
        });

        this.risco = new Object();
        this.iniciaNivelRisco();

        this.sexoOpcoes = [
            {id: 'A',  descricao: 'Ambos'},
            {id: 'M', descricao: 'Masculino'},
            {id: 'F', descricao: 'Feminino'},
        ];
    }
    
    ngOnInit() {
        this.atual = 'geral';

        if (this.riscoId) {
            this.carregaRisco();
        }
    }

    ngOnDestroy() {
    }

    ngAfterViewInit() {
        this.inicializaVariaveis();
    }

    setObjColorPicker(colorPicker) {
        this['colorPicker'] = colorPicker;
    }
    trocaCor(valor) {
        if (valor) {
            this.nivelRisco.cor = this['colorPicker'] = valor;
        }
    }

    setObjIconeSelector(iconeSelector) {
        this['iconeSelector'] = iconeSelector;
    }
    trocaIcone(valor) {
        if (valor) {
            this.risco.icone = this['iconeSelector'] = valor;
        }
    }

    getNovoCuidadoRiscoGrauFrequencia(valor) {
        if (valor) {
            this.novoCuidadoRiscoGrau['frequencia'] = valor.valor;
        }
    }

    perguntaSelecionada
    getPergunta(pergunta) {
        this.pergunta = pergunta;
        
        if( pergunta ){
            this.perguntaSelecionada = pergunta.descricao;

            if( pergunta.tipo.toUpperCase() == "BOOLEAN" ){
                this.pergunta.opcoes = [{ id: 'true', nome: 'Sim' }, { id: 'false', nome: 'Não' }];
            }

        }
    }

    cuidadoSelecionado;
    getCuidado(cuidado) {
        this.cuidado = cuidado;
        if( cuidado ){
            this.cuidadoSelecionado = cuidado.descricao;
        }
    }

    getSexo(sexo) {
        this.riscoCalculo.sexo = sexo.valor;
    }
    
    objPerguntas;
    fnCfgPerguntaRemote(term) {
        this.servicePergunta.pergunta({ pagina: 1, quantidade: 10, like : term }).subscribe(
            (retorno) => {
                this.objPerguntas = retorno.dados || retorno;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        )
    }

    objCuidados;
    fnCfgCuidadoRemote(term) {
        this.cuidadoService.get({ pagina: 1, quantidade: 10, like : term }).subscribe(
            (retorno) => {
                this.objCuidados = retorno.dados || retorno;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        )
    }

    //  #############################################
    //               Ações da tela
    //  #############################################
    navegar(aba) {
        this.atual = aba;

        this.inicializaVariaveis();
    }

    inicializaVariaveis() {
        this.qtdItensTotal = 0;
        this.paginaAtual = 1;
        this.itensPorPagina = 15;

        this.qtdItensTotalNiveis = 0;
        this.paginaAtualNiveis = 1;
        this.itensPorPaginaNiveis = 15;
    }

    voltar() {
        this.router.navigate([`/${Sessao.getModulo()}/risco`]);
    }

    validaRisco() {

        if (!this.risco.nome) {
            this.toastr.warning('Informe o nome');
            return;
        }

        if (!this.risco.icone) {
            this.toastr.warning('Informe o icone');
            return;
        }

        return true;
    }

    carregaRisco() {
        let id = this.riscoId;
        let request = {id: id};

        this.riscoService.get(request).subscribe(
            (riscoResponse) => { 
                this.risco = riscoResponse.dados[0];
            },
            (erro) => { this.toastr.warning(erro); }
        );
    }

    adicionarCalculoRisco() {
        this.abrirModalEditarRiscoCalculo()
    }

    abrirModalEditarRiscoCalculo(riscoCalculo = null) {
        riscoCalculo = riscoCalculo || {};
        this.riscoCalculo = JSON.parse(JSON.stringify(riscoCalculo));
        this.riscoCalculoId = riscoCalculo.id;
        
        if (riscoCalculo.pergunta) {
            this.servicePergunta.getId(riscoCalculo.pergunta.id).subscribe(
                (pergunta) => {
                    this.pergunta = pergunta.dados[0];
                }
            );
        } else {
            this.pergunta = riscoCalculo.pergunta;
        }

        if( this.riscoCalculoId && !riscoCalculo.sexo ){
            this.riscoCalculo.sexo = 'A';
        }
        riscoCalculo.valor = riscoCalculo.perguntaOpcao ? riscoCalculo.perguntaOpcao.id : riscoCalculo.valor;

        this.perguntaSelecionada = riscoCalculo.pergunta ? riscoCalculo.pergunta.descricao : null;
        let acao = this.riscoCalculoId ? 'Editar' : 'Adicionar';
        this.modalInstancia = this.modalService.open(NgbdModalContent, {size: 'lg'});
        this.modalInstancia.componentInstance.modalHeader = `${acao} Cálculo de Risco`;

        this.modalInstancia.componentInstance.templateRefBody = this.tmplFmrCalculoRisco;
        this.modalInstancia.componentInstance.templateBotoes = this.footerModalEditarCalculoRisco;

        let fnSuccess = (agendamentoGrupoResposta) => {
            this.iniciaNivelRisco();
        };
        let fnError = (agendamentoGrupoResposta) => { 
            this.iniciaNivelRisco();
        };
        this.modalInstancia.result.then((data) => fnSuccess, fnError);
    }

    abrirModalEditarNivelRisco(nivelRisco) {
        this.nivelRisco = nivelRisco;
        this.nivelRiscoId = nivelRisco.id;

        if( this.nivelRiscoId && !nivelRisco.sexo ){
            this.nivelRisco.sexo = 'A';
        }
        this.modalInstancia = this.modalService.open(NgbdModalContent, {size: 'lg'});
        this.modalInstancia.componentInstance.modalHeader = `Editar Nível de Risco`;

        this.modalInstancia.componentInstance.templateRefBody = this.tmplFmrNivelRisco;
        this.modalInstancia.componentInstance.templateBotoes = this.footerModalEditarNivelRisco;

        let fnSuccess = (agendamentoGrupoResposta) => {
            this.iniciaNivelRisco();
        };
        let fnError = (agendamentoGrupoResposta) => { 
            this.iniciaNivelRisco();
        };
        this.modalInstancia.result.then((data) => fnSuccess, fnError);
    }

    abrirModalExcluirRiscoCalculo(riscoCalculo) {
        this.riscoCalculo = riscoCalculo;
        this.riscoCalculoId = riscoCalculo.id;
        this.modalInstancia = this.modalService.open(NgbdModalContent, {size: 'lg'});
        this.modalInstancia.componentInstance.modalHeader = `Excluir pergunta de Risco`;

        this.modalInstancia.componentInstance.templateRefBody = this.bodyModalRemoverRiscoCalculo;
        this.modalInstancia.componentInstance.templateBotoes = this.footerModalRemoverRiscoCalculo;

        let fnSuccess = (agendamentoGrupoResposta) => { 
            this.iniciaNivelRisco();
        };
        let fnError = (agendamentoGrupoResposta) => { 
            this.iniciaNivelRisco();
        };
        this.modalInstancia.result.then((data) => fnSuccess, fnError);
    }

    abrirModalExcluirNivelRisco(nivelRisco) {
        this.nivelRisco = nivelRisco;
        this.nivelRiscoId = nivelRisco.id;
        this.modalInstancia = this.modalService.open(NgbdModalContent, {size: 'lg'});
        this.modalInstancia.componentInstance.modalHeader = `Excluir Nível de Risco`;

        this.modalInstancia.componentInstance.templateRefBody = this.bodyModalRemoverNivelRisco;
        this.modalInstancia.componentInstance.templateBotoes = this.footerModalRemoverNivelRisco;

        let fnSuccess = (agendamentoGrupoResposta) => { 
            this.iniciaNivelRisco();
        };
        let fnError = (agendamentoGrupoResposta) => { 
            this.iniciaNivelRisco();
        };
        this.modalInstancia.result.then((data) => fnSuccess, fnError);
    }

    abrirModalCfgCuidadoNivelRisco(nivelRisco) {
        this.nivelRisco = nivelRisco;
        this.nivelRiscoId = nivelRisco.id;
        this.modalInstancia = this.modalService.open(NgbdModalContent, {size: 'lg'});
        this.modalInstancia.componentInstance.modalHeader = `Configura Cuidados para o Nível de Risco '${nivelRisco.descricao}'`;

        this.modalInstancia.componentInstance.templateRefBody = this.bodyModalcfgCuidadoNivelRisco;
        this.modalInstancia.componentInstance.templateBotoes = this.footerModalcfgCuidadoNivelRisco;

        this.iniciaConfiguracaoCuidado();
        
        let fnSuccess = (agendamentoGrupoResposta) => { 
        };
        let fnError = (erro) => { console.log("Modal Fechada!"); };
        this.modalInstancia.result.then((data) => fnSuccess, fnError);
    }

    abrirModalExcluir() {
        this.modalInstancia = this.modalService.open(NgbdModalContent, {size: 'lg'});
        this.modalInstancia.componentInstance.modalHeader = `Remover Risco`;

        this.modalInstancia.componentInstance.templateRefBody = this.bodyModalRemoverRisco;
        this.modalInstancia.componentInstance.templateBotoes = this.footerModalRemoverRisco;

        let fnSuccess = (agendamentoGrupoResposta) => { console.log("Modal Fechada!");};
        let fnError = (erro) => { console.log("Modal Fechada!"); };
        this.modalInstancia.result.then((data) => fnSuccess, fnError);
    }

    excluir() {
        let id = this.riscoId;
        this.riscoService.delete(id).subscribe(

            (riscoResponse) => { 
                this.modalInstancia.close(); 
                this.voltar(); 
                this.toastr.success(`Risco excluido com sucesso`); 
            },
            (erro) => { this.toastr.warning(erro); }
        );
    }

    excluirRiscoCalculo() {
        let id = this.riscoCalculoId;
        this.riscoCalculoService.delete(id).subscribe(

            (riscoResponse) => { 
                this.buscarPerguntasPaginado();
                this.modalInstancia.close(); 
                this.toastr.success(`Cálculo de Risco excluido com sucesso`); 
            },
            (erro) => { this.toastr.warning(erro); }
        );
    }

    salvarRisco() {
        let id = this.riscoId;
        let request = {
            id: id,
            nome: this.risco.nome,
            icone: this.risco.icone,
            formulaMasculino: this.risco.formulaMasculino,
            formulaFeminino: this.risco.formulaFeminino
        };

        if (!this.validaRisco()) {
            return;
        }

        if (this.riscoId) {
            this.riscoService.put(request, id).subscribe(
                (riscoResponse) => { 
                    this.toastr.success(`Risco atualizado com sucesso`); 
                    this.router.navigate([`/${Sessao.getModulo()}/risco/${id}`]);
                },
                (erro) => { this.toastr.warning(erro); }
            );
        } else {
            this.riscoService.post(request).subscribe(
                (riscoResponse) => { 
                    this.router.navigate([`/${Sessao.getModulo()}/risco/${riscoResponse}`]); 
                },
                (erro) => { this.toastr.warning(erro); }
            );
        }
        
    }

    salvarCalculoRisco() {
        let id = this.riscoCalculoId || undefined;
        
        if (!this.validaCalculoRisco()) {
            return;
        }

        let request = {
            "id": id,
            "pergunta": {
                "id": this.pergunta.id
            },
            "sexo": this.riscoCalculo.sexo == '' ? undefined : this.riscoCalculo.sexo ,
            "peso": this.riscoCalculo.peso,
            "risco": {
                "id": this.riscoId
            }
        };

        if (this.pergunta.opcoes && this.pergunta.opcoes.length && this.pergunta.tipo != 'FUNCAO') {
            if( this.pergunta.tipo != "BOOLEAN" ){
                request["perguntaOpcao"] = {
                    "id":  this.riscoCalculo.valor
                };
            }else{
                request["valor"] = this.riscoCalculo.valor
                if( request["valor"] == "true" ){
                    request["valor"] = '1';
                }else if( request["valor"] == "false" ){
                    request["valor"] = '0';
                }
            }
        } else {
            request["valorFinal"] = this.riscoCalculo.valorFinal;
            request["valorInicial"] = this.riscoCalculo.valorInicial;
        }

        let acao = this.riscoCalculoId ? 'put' : 'post';
        
        this.riscoCalculoService[acao](request).subscribe(
            this.successSalvaRiscoCalculo.bind(this),
            (erro) => { this.toastr.warning(erro); }
        )
    }

    salvarCfgCuidadosNivelRisco() {
        if (!this.validaCuidadoNivelRisco()) {
            return;
        }

        let request = {
            "cuidado": {
                "id": this.cuidado.id
            },
            "frequencia": this.novoCuidadoRiscoGrau['frequencia'],
            "riscoGrau": {
                "id": this.nivelRiscoId
            },
            "repetir": this.novoCuidadoRiscoGrau['repetir']
        };
        this.cuidadoRiscoGrauService.post(request).subscribe((resposta)=>{
            this.iniciaConfiguracaoCuidado();
        });
    }

    trocaEstadoNovoCuidadoRiscoGrauPaciente($event) {
        this.novoCuidadoRiscoGrau['repetir'] = $event;
    }

    formataResposta(perguntaRisco) {
        if (perguntaRisco.valorInicial == perguntaRisco.valorFinal && (perguntaRisco.valorInicial || perguntaRisco.valorFinal) ) {
            return perguntaRisco.valorInicial;
        }else if( perguntaRisco.pergunta.tipo == "BOOLEAN" ){
            return (perguntaRisco.valor == '1') ? "Sim" : "Não";
        }
        return `Entre '${perguntaRisco.valorInicial}' e '${perguntaRisco.valorFinal}'`;
    }

    validaCuidadoNivelRisco() {
        if (!this.cuidado || !this.cuidado.id){
            this.toastr.warning('Informe o Cuidado');
            return;
        }

        if (!this.novoCuidadoRiscoGrau['frequencia']) {
            this.toastr.warning('Informe a frequencia');
            return;
        }

        return true;
    }

    validaCalculoRisco() {

        if (!this.pergunta) {
            this.toastr.warning('Informe a pergunta');
            return;
        }

        if (this.pergunta.opcoes && this.pergunta.opcoes.length && this.pergunta.tipo != 'FUNCAO') {
            if (!this.riscoCalculo.valor) {
                this.toastr.warning('Informe o valor');
                return;
            }
        } else {
            if (!this.riscoCalculo.valorInicial) {
                this.toastr.warning('Informe o valor Inicial');
                return;
            }
            if (!this.riscoCalculo.valorFinal) {
                this.toastr.warning('Informe o valor Final');
                return;
            }
        }

        if (!this.riscoCalculo.peso) {
            this.toastr.warning('Informe a peso');
            return;
        }

        return true;
    }

    validaNivelRisco() {
        if (!this.nivelRisco.descricao) {
            this.toastr.warning('Informe o nome');
            return;
        }
        if (!this.nivelRisco.minimo && this.nivelRisco.minimo != 0) {
            this.toastr.warning('Informe o valor minimo');
            return;
        }
        if (!this.nivelRisco.maximo) {
            this.toastr.warning('Informe o valor maximo');
            return;
        }
        if (!this.nivelRisco.percentual) {
            this.toastr.warning('Informe o valor percentual');
            return;
        }
        if (!this.nivelRisco.sexo) {
            this.toastr.warning('Informe o sexo');
            return;
        }else if( this.nivelRisco.sexo == 'A' ){
            this.nivelRisco.sexo = '';
        }
        if (!this.nivelRisco.cor) {
            this.toastr.warning('Informe a cor');
            return;
        }

        return true;
    }

    formataSexo(sexoId) {
        let sexoDescricao = this.sexoOpcoes.filter((sexo) => sexo.id == sexoId )[0];
        return sexoDescricao['descricao'] || "";
    }

    iniciaNivelRisco(){
        this.nivelRiscoId = undefined;
        this.nivelRisco = new Object();
    }

    iniciaConfiguracaoCuidado(){
        this.cuidadosRiscoGrau = [];

        this.cuidadoRiscoGrauService.get({riscoGrauId: this.nivelRiscoId}).subscribe((cuidadoRiscoGrauResponse) => {
            this.cuidadosRiscoGrau = cuidadoRiscoGrauResponse.dados;
        },
        (erro) => {
            Servidor.verificaErro(erro, this.toastr);
        });
    }

    excluirCuidadoRiscoGrau(cuidadoRiscoGrau) {
        this.cuidadoRiscoGrauService.delete(cuidadoRiscoGrau.id).subscribe((cuidadoRiscoGrauResponse) => {
            this.iniciaConfiguracaoCuidado();
        });
    }

    excluirNivelRisco() {
        let riscoId = this.riscoId;
        let nivelRiscoId = this.nivelRiscoId;
        let successExcluirNivelRisco = (riscoResponse) => { 
            this.toastr.success(`Nível de Risco salvo com sucesso`); 
            this.buscarNiveisRiscosSaudePaginado(null, null);
            this.modalInstancia.close();
        };

        this.riscoGrauService.delete(nivelRiscoId).subscribe(
            successExcluirNivelRisco,
            (erro) => { 

                Servidor.verificaErro(erro, this.toastr);

                this.toastr.warning(erro); }
        );
    }

    salvarNivelRisco() {
        if (!this.validaNivelRisco()) {
            return;
        }

        let riscoId = this.riscoId;
        let nivelRiscoId = this.nivelRiscoId;
        let request = {
            risco: {id: riscoId},
            id: nivelRiscoId,
            descricao: this.nivelRisco.descricao,
            minimo: this.nivelRisco.minimo,
            maximo: this.nivelRisco.maximo,
            percentual: this.nivelRisco.percentual,
            sexo: this.nivelRisco.sexo,
            cor: this.nivelRisco.cor
        };


        let successSalvaRisco = (riscoResponse) => { 
            this.toastr.success(`Nível de Risco salvo com sucesso`); 
            this.buscarNiveisRiscosSaudePaginado(null, null);

            this.iniciaNivelRisco();
            if (this.modalInstancia && this.modalInstancia.close){
                this.modalInstancia.close();
            }
        };

        if (this.nivelRiscoId) {
            this.riscoGrauService.put(request, nivelRiscoId).subscribe(
                successSalvaRisco,
                (erro) => { this.toastr.warning(erro); }
            );
        } else {
            this.riscoGrauService.post(request).subscribe(
                successSalvaRisco,
                (erro) => { 
                    Servidor.verificaErro(erro, this.toastr);
                    this.toastr.warning(erro); }
            );
        }
    }

    successSalvaRiscoCalculo(riscoResponse, isJumbo = false) {
        this.toastr.success(`Pergunta salva com sucesso`); 

        if (isJumbo) {
            let perguntas = this.perguntasRisco.slice();
            perguntas = perguntas.concat(riscoResponse);

            this.perguntasRisco = perguntas;
        }
        this.buscarPerguntasPaginado();
    }

    adicionarPerguntaRisco() {
        
        let request = {
            "pergunta": {
                "id": this.pergunta.id
            },
            "risco": {
                "id": this.risco.id
            }
        };

        //  Chama o Jumbo
        this.riscoCalculoService.postJumbo(request).subscribe(
            this.successSalvaRiscoCalculo.bind(this),
            (erro) => { this.toastr.warning(erro); }
        );
    }

    validaCampoPergunta(pergunta){
        return pergunta && pergunta.opcoes && pergunta.opcoes.length && pergunta.tipo != 'FUNCAO';
    }


    //  #############################################
    //          Funcionalidades da tela
    //  #############################################

    getNivelRiscoDescricao(descricao) {
        if( descricao && descricao.valor && descricao.valor.toString().length ){
            this.nivelRisco.descricao = descricao.valor;
        }
    }
    getNivelRiscoMinimo(minimo) {
        if( minimo && minimo.valor && minimo.valor.toString().length ){
            this.nivelRisco.minimo = minimo.valor;
        }
    }
    getNivelRiscoMaximo(maximo) {
        if( maximo && maximo.valor && maximo.valor.toString().length ){
            this.nivelRisco.maximo = maximo.valor;
        }
    }
    getNivelRiscoPercentual(percentual) {
        if( percentual && percentual.valor && percentual.valor.toString().length ){
            this.nivelRisco.percentual = percentual.valor;
        }
    }
    getNivelRiscoSexo(sexo) {
        if( sexo && sexo.valor && sexo.valor.toString().length ){
            this.nivelRisco.sexo = sexo.valor;
        }
    }
    getNivelRiscoPeso(peso) {
        if( peso && peso.valor && peso.valor.toString().length ){
            this.nivelRisco.peso = peso.valor;
        }
    }

    getNome(nome){
        this.risco.nome = nome.valor;
    }
    getPerguntaOpcao(perguntaOpcao){
        this.riscoCalculo.valor = perguntaOpcao.valor;
    }
    getValorInicial(valorInicial){
        this.riscoCalculo.valorInicial = valorInicial.valor;
    }
    getValorFinal(valorFinal){
        this.riscoCalculo.valorFinal = valorFinal.valor;
    }
    getPeso(peso){
        this.riscoCalculo.peso = peso.valor;
    }

    getFormulaFeminino(formula) {
        this.risco.formulaFeminino = formula.valor;
    }

    getFormulaMasculino(formula) {
        this.risco.formulaMasculino = formula.valor;
    }

    pesquisarNiveisRiscosSaude(texto) {
        this.buscarNiveisRiscosSaudePaginado(null, texto);
    }

    buscarNiveisRiscosSaudePaginado(evento = null, like = undefined) {
        this.paginaAtualNiveis = evento ? evento.paginaAtual : this.paginaAtualNiveis;

        let request = {
            idRisco: this.riscoId,
            pagina: this.paginaAtualNiveis, 
            quantidade: this.itensPorPaginaNiveis,
            simples: true,
            like: like
        };


        this.riscoGrauService.get(request).subscribe(
            (riscosSaude) => {
                this.riscosGrauSaude = riscosSaude.dados;
                this.qtdItensTotalNiveis = riscosSaude.qtdItensTotal;
            },
            (erro) => {
                this.toastr.warning(erro);
            }
        );
    }

    buscarPerguntasPaginado(evento = null, paciente = null) {
        this.paginaAtual = evento ? evento.paginaAtual : this.paginaAtual;

        if (!this.riscoId) {
            console.warn("Id do risco invalido");
            return;
        }

        this.riscoCalculoService.get({pagina: this.paginaAtual, quantidade: this.itensPorPagina, idRisco: this.riscoId}).subscribe(
            (riscosSaude) => {
                this.perguntasRisco = riscosSaude.dados;
                this.qtdItensTotal = riscosSaude.qtdItensTotal;
            },
            (erro) => {
                this.toastr.warning(erro);
            }
        );
    }
}