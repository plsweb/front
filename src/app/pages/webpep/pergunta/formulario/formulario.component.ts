import { Component, ViewContainerRef, ViewChild, Input, Output, EventEmitter, ElementRef, Renderer2, TemplateRef, QueryList, Renderer, OnInit } from '@angular/core';
import { NgxUploaderModule } from 'ngx-uploader';
import { BrowserHelpers, PerguntaService, PerguntaOpcaoService, FormularioService, PerguntaCondicao, UtilService, GrupoPerguntaService, GrupoPerguntaCondicao } from '../../../../services';

import { Servidor } from '../../../../services/servidor';
import { Sessao } from '../../../../services/sessao';

import { ActivatedRoute, Router } from '@angular/router';
import { Saida } from '../../../../theme/components/entrada/entrada.component';

import { NgbdModalContent } from '../../../../theme/components/modal/modal.component';

import { ToastrService } from 'ngx-toastr';

import { NgbModal, NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';

import * as jQuery from 'jquery';

@Component({
    selector: 'formulario',
    templateUrl: './formulario.html',
    styleUrls: ['./formulario.scss'],
    providers: [PerguntaCondicao]
})
export class Formulario implements OnInit {

    descricao: Saida;
    descricaoValor;
    grupo;
    grupoId: number;
    id: number;
    mascara: Saida;
    mascaraValor = "";
    tipoFuncao;
    opcao: Saida;
    opcoes = [];
    temMascara:Boolean = false;
    temOpcoes:Boolean = false;
    possuiScores: Boolean = false;
    tipo: Saida;
    tipos = [];
    podeSalvar: Boolean = true;
    tipoValor;
    canAdd:boolean = true;

    blockOper:boolean = true;
    blockComp:boolean = false;
    objCampos;

    atual = "geral";
    perguntaCondicao;
    grupoPerguntaCondicao;
    formularioCondicao;
    objFiltroPerguntaCondicao = [ 'descricao', 'descricao' ];
    condicoes = [];
    condicao;
    valorCondicao;
    tipoDependente;
    condicaoSelecionada = [];
    idGrupoPerguntaPai = localStorage.getItem('idGrupoPerguntaPai');
    modalBaseInstancia;
    bEditarCondicao;

    qtdItensTotal;
    paginaAtual = 1;
    itensPorPagina = 15;

    objFiltroTabela = new Object();

    score:string="";
    grupoPerguntaId;
    descricaoScore:any;

    content_score: string = "";

    @ViewChild("inputScore") inputScore: ElementRef;
    @ViewChild("frmCondicao") frmCondicao: ElementRef;

    opcoesDependente = [
        // {"id": "pergunta", "descricao": "Pergunta (Global)"},
        {"id": "pergunta" /*grupoPergunta*/, "descricao": "Pergunta (Formulário)"},
        {"id": "formulario", "descricao": "Formulário"},
    ];

    scorecomp = [
        {"id" : "X >" ,  "descricao" : "maior que"},
        {"id" : "X <" ,  "descricao" : "menor que"},
        {"id" : "X >=" , "descricao" : "maior/igual"},
        {"id" : "X <=" , "descricao" : "menor/igual"},
        {"id" : "X ==" ,  "descricao" : "igual a"},
        {"id" : "X !=" , "descricao" : "diferente de"}
    ];

    scoreoper = [
        {"id" : "||" , "descricao" : "OU"},
        {"id" : "&&" , "descricao" : "E"}
    ]

    opcSexo = [
        {'id' : 'M', 'descricao' : 'Masculino'},
        {'id' : 'F', 'descricao' : 'Feminino'}
    ];

    @ViewChild("modalRemoverCondicao", {read: TemplateRef}) modalRemoverCondicao: QueryList<TemplateRef<any>>;
    @ViewChild("modalRemoverCondicaoBotoes", {read: TemplateRef}) modalRemoverCondicaoBotoes: QueryList<TemplateRef<any>>;

    @ViewChild("modalEditarCondicao", {read: TemplateRef}) modalEditarCondicao: QueryList<TemplateRef<any>>;
    @ViewChild("modalEditarCondicaoBotoes", {read: TemplateRef}) modalEditarCondicaoBotoes: QueryList<TemplateRef<any>>;

    constructor(
        private renderer : Renderer2,
        private router: Router,
        private route: ActivatedRoute,
        private modalService: NgbModal,
        private serviceEntrada: UtilService,
        private serviceFormulario: FormularioService,
        private servicePergunta: PerguntaService,
        private serviceOpcao: PerguntaOpcaoService,
        private serviceGrupoPerguntaCondicao: GrupoPerguntaCondicao,
        private serviceGrupoPergunta: GrupoPerguntaService,
        private toastr: ToastrService,
        public vcr: ViewContainerRef
    ) {

        this.route.params.subscribe(params => {

            if (params['id'] != 0) {
                this.id = params['id'];
            }

            if (params['grupo']) {
                this.grupoId = params['grupo'];

                if (this.grupoId) {
                    this.serviceFormulario.getformularioGrupoPorId(this.grupoId).subscribe(
                        (grupo) => {
                            this.grupo = grupo;
                        },
                        (erro) => {
                            Servidor.verificaErro(erro, this.toastr);
                            console.error(erro);
                        }
                    );
                }
            } else if (localStorage.getItem('grupo')) {
                this.serviceFormulario.getformularioGrupoPorId(localStorage.getItem('grupo')).subscribe(
                    (grupo) => {
                        this.grupo = grupo;
                    },
                    (erro) => {
                        Servidor.verificaErro(erro, this.toastr);
                        console.error(erro);
                    }
                );
                localStorage.removeItem('grupo');
            }
        });

        this.route.queryParams.subscribe(queryParam => {
            if (queryParam['grupoPergunta']) {
                this.grupoPerguntaId = queryParam['grupoPergunta'];
                console.log("Grupo Pergunta:  " + this.grupoPerguntaId);
            }
        });
    }


    objGrupoPerguntas = []
    ngOnInit() {

        // localStorage.setItem( 'gruposPergunta', JSON.stringify( gruposPergunta ) );
        let gruposPergunta = localStorage.getItem('gruposPergunta');
        let arrayGruposPergunta;
        if( gruposPergunta ){
            arrayGruposPergunta = JSON.parse(gruposPergunta);
            console.log(arrayGruposPergunta);
            this.objGrupoPerguntas = arrayGruposPergunta.filter(
                (grupoPergunta) => {
                    return grupoPergunta.pergunta.id != this.id
                }
            );
        }


        this.objCampos = JSON.stringify({ "filtro":"descricao,descricao,tipo", "filtroAdicional":"tipo", "resposta":"descricao"})

        this.servicePergunta.getPerguntaTipo().subscribe(
            (tipos) => {
                tipos.forEach(
                    function (val) {
                        val.id = val.codigo;
                    }
                );

                this.tipos = tipos;

            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
                console.error(erro);
            }
        );

        if (this.id) {

            this.serviceOpcao.getPorPerguntaId(this.id).subscribe(
                (opcoes) => {
                    if (opcoes) {
                        this.opcoes = opcoes;
                    }
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                },
            );

            this.servicePergunta.getId(this.id).subscribe(
                (pergunta) => {
                    pergunta = pergunta.dados[0];
                    this.descricaoValor = pergunta.descricao;
                    this.tipoValor = pergunta.tipo;
                    this.mascaraValor = pergunta.mascara || "";

                    this.validaMascaraExpressaoRegular();
                    this.opcoes = pergunta.opcoes;

                    if( this.tipoValor == "TABELA" ){
                        this.setObjFiltroTabela(pergunta);
                    }else if( this.tipoValor == "FUNCAO" ){
                        this.temOpcoes = true;
                    }
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                    console.error(erro);
                }
            );
        }
    }

    validar() {
    }

    validaMascara($event){
        if(this.tipoFuncao){
            if( (this.mascara) && (this.mascara.valor.match(/\^/g) && !this.mascara.valor.match(/\([\w|\D]+\^[\w|\D]\)/g)) ){ //.match(/\([\w|\d|\^]*\)/g)

                this.toastr.error("Utilização de potência deve ser entre parênteses. Ex.: '(5^3), (5^2/3)' ");
                this.podeSalvar = false;
            }else{
                this.podeSalvar = true;
            }
        }
    }

    getDescricao(evento) {
        this.descricao = evento;
        this.validar();
    }

    getTipo(evento) {
        this.tipo = evento;
        this.tipoFuncao = false;
        this.temMascara = false;

        switch (evento.valor) {
            case "TEXTO":
                this.temMascara = true;
                break;
            case "RADIO":
            case "SELECAO":
                this.temOpcoes = true;
                break;
            case "FUNCAO":
                this.tipoFuncao = true;
                if( this.opcoes.length > 0 ){
                    this.possuiScores = true;
                }
                break;
            default:
                this.temMascara = false;
                break;
        }

        this.validar();
    }

    temScores(score){
        this.possuiScores = (score.valor == "true") || (score.valor == true) ? true : false
        this.temOpcoes = (this.possuiScores) ? true : false;
    }

    getMascara(evento) {

        this.mascara = evento;
        this.mascaraValor = evento.valor;
        this.validar();
    }

    getOpcao(evento) {
        this.opcao = evento;
        this.validar();
    }

    addOpcao() {

        if(this.tipoFuncao){
            this.opcao = new Saida();
            this.opcao.valor =  this.score + " | " + this.descricaoScore;
        }

        if (this.id) {
            let opcao = {
                "id" : null,
                "descricao" : this.opcao.valor,
                "pergunta" : {
                    "id" : this.id
                }
            }
            this.insereOpcoes(opcao);
        }
        this.score = ""; this.descricaoScore = "";
        this.blockComp =false;
        this.blockOper = false;
    }

    insereOpcoes(opcao){
        this.serviceOpcao.inserir(opcao).subscribe(
            (status) => {
                if (status) {
                    this.atualizaOpcoes();
                }
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        );
    }

    voltar() {
        localStorage.removeItem('grupo');

        if(this.grupo) {
            this.router.navigate([`/${Sessao.getModulo()}/formulario/formulario/` + this.grupo.formulario.id]);
        } else {
            window.history.go(-1);
        }
    }

    removerItem(id) {
        if (confirm("Deseja mesmo remover essa opção?")) {

            this.serviceOpcao.apagar(id).subscribe(
                (status) => {
                    if (status) {
                        this.atualizaOpcoes();
                    }
                }
            );
        }
    }

    atualizaOpcoes() {
        if (this.id) {
            this.serviceOpcao.getPorPerguntaId(this.id).subscribe(
                (opcoes) => {
                    if (opcoes) {
                        this.opcoes = opcoes.sort(
                            (a,b) => {
                                return a.id - b.id
                            }
                        );
                    }
                }
            );
        }
    }

    expressaoRegular = false;
    submit() {
        let pergunta = {
            "descricao": this.descricao.valor,
            "tipo": this.tipo.valor,
            "mascara": this.mascara && this.mascara.valor ? this.mascara.valor : ""
        };

        if( this.tipo.valor == 'TEXTO' && this.expressaoRegular && pergunta['mascara'] ){
            if( pergunta['mascara'].indexOf(' ') >= 0 ){
                let arrmascaratemp = pergunta['mascara'].split( ' ' );

                let mascaraUnidade = arrmascaratemp[1];
                let mascara = arrmascaratemp[0];

                pergunta['mascara'] = `/${mascara}/g ${mascaraUnidade}`;
            }else{
                pergunta['mascara'] = `/${pergunta['mascara']}/g`;
            }
        }

        if( this.tipo.valor == "TABELA" ){
            pergunta = this.validaTipoTabela(pergunta);

            if( pergunta['erro'] ){
                this.toastr.error("Houve um erro ao salvar: " + pergunta['tipoErro']);
                return;
            }

        }

        if (this.grupo) {
            sessionStorage.setItem('grupo', this.grupo.id);
        }

        if (!this.id) {
            let status;
            this.servicePergunta.inserir(pergunta).subscribe(
                (status) => {

                    if (this.grupoId) {
                        let grupoPergunta = {
                            formularioGrupo: { id: this.grupoId },
                            pergunta: { id: status },
                            obrigatorio: false
                        };

                        this.servicePergunta.adicionarEmUmGrupo(grupoPergunta).subscribe(
                            (status2) => {
                            }
                        );
                    }

                    this.toastr.success("Pergunta inserida com sucesso.");
                    this.router.navigate([`/${Sessao.getModulo()}/pergunta/formulario/` + status]);
                }
            );
        } else {
            this.servicePergunta.atualizar(this.id, pergunta).subscribe(
                (status) => {
                    if (status) {

                        this.toastr.success("Pergunta editada com sucesso.");
                        this.router.navigate([`/${Sessao.getModulo()}/pergunta/formulario/` + status]);
                    }
                }
            );
        }

    }

    setObjFiltroTabela(pergunta){
        this.objFiltroTabela['nomeTabela'] = pergunta.tabela
        if( pergunta.tabelaCampos ){
            let objParam = JSON.parse( pergunta.tabelaCampos );

            this.objFiltroTabela['filtro'] = objParam.filtro.split(",")[0]
            this.objFiltroTabela['filtroAdicional'] = objParam.filtroAdicional;
            this.objFiltroTabela['resposta'] = objParam.resposta;
        }

    }

    validaTipoTabela(objPergunta){
        if( !this.objFiltroTabela['nomeTabela'] ){
            return { erro : true, tipoErro: 'Nao foi informado um nome de tabela' }
        }else if( !this.objFiltroTabela['filtro'] ){
            return { erro : true, tipoErro: 'Nao foi informado um filtro válido para a tabela: ' + this.objFiltroTabela['nomeTabela'] }
        }

        objPergunta['tabela'] = this.objFiltroTabela['nomeTabela']
        objPergunta['tabelaCampos'] = JSON.stringify({
            filtro : this.objFiltroTabela['filtro'],
            filtroAdicional : this.objFiltroTabela['filtro'] + ( this.objFiltroTabela['filtroAdicional'] ? ("," + this.objFiltroTabela['filtroAdicional']) : '' ),
        });

        return objPergunta
    }

    validaElementosFormula(id){
        if( this.podeSalvar ){
            this.apagaOpcoes();

            var elemFormula = this.mascara.valor.replace(/[0-9]|\)|\(/g, "").split(/[+/^*\-]/);
            var objParam = [];

            for(let i=0; i<elemFormula.length; i++){
                if( elemFormula[i].length > 0 ){
                    let opcao = {
                        "id" : null,
                        "descricao" : elemFormula[i],
                        "pergunta" : {
                            "id" : id
                        }
                    }
                    this.insereOpcoes(opcao);
                    objParam.push(opcao);
                }
            }
        }

        return objParam;
    }

    apagaOpcoes(){
        for(var i=0; i<this.opcoes.length; i++){
            this.serviceOpcao.apagar(this.opcoes[i]["id"]).subscribe();
        }
    }

    addOperador(oper){


        this.score += " " + oper.id + " ";

        this.blockOper = true;
        this.blockComp = false;

        this.setFocus();
    }

    addComparador(comp){

        this.blockComp = true;
        this.blockOper = false;

        this.score += " " + comp.id + " ";
        this.setFocus();
    }

    getScore(evento){
        var key = this.validaNumero(evento)
        this.score += ( (key != undefined) && (key.length == 1) ) ? key : "";

        if(this.score == ""){
            this.blockComp = false;
            this.blockOper = false;
        }
    }

    validaNumero(evento){

        if(( evento.key.match("[0-9]") ) ){
            return evento.key;
        }
        else if( (evento.key.match("[a-zA-Z]")) && (evento.key.length == 1) ){
            var valor = jQuery("#Score").val();
            jQuery("input#Score").val( valor.substring(0,(valor.length - 1)) );
        }

        this.score = jQuery("input#Score").val();
        if( valor == "" ){
            this.score = "";
        }
        return "";
    }

    getDescScore(evento){
        let el = evento.target;
        this.descricaoScore = el.value;
    }

    changeValueScore(evento){
    }

    trataInput(elem, possuiInput){
        var div = jQuery(elem);
        if(possuiInput){
        }else{
            div["0"].lastElementChild.onchange = this.changeValueScore;
        }
        return div;
    }

    perguntaSelecionada;
    getPergunta(evento){
        if( evento ){
            this.mascaraValor+= evento['descricao'].replace(/ /g, "");
            this.toastr.success("Pergunta adicionada na fórmula")
            this.perguntaSelecionada = '';
        }

    }

    opcOperacoes = [
        {
            "id": "+",
            "descricao": "Soma"
        },
        {
            "id": "-",
            "descricao": "Subtração"
        },
        {
            "id": "*",
            "descricao": "Multiplicação"
        },
        {
            "id": "/",
            "descricao": "Divisão"
        },
        {
            "id": "^",
            "descricao": "Potencia"
        },
        {
            "id": "^",
            "descricao": "Raiz"
        }
     ]

    getOperador(evento){
        if( evento && evento.valor ){
            this.mascaraValor+= evento.valor;
            this.toastr.success("Operador adicionado a fórmula")
        }
    }

    setFocus(){
        const element = this.renderer.selectRootElement('#Score');

        setTimeout(() => element.focus(), 0);
    }

    navegar(aba) {
        this.atual = aba;
    }

    perguntaCondicaoSelecionada;
    getPerguntaCondicao(perguntaCondicao) {
        if (perguntaCondicao.tipo == 'BOOLEAN') {
            perguntaCondicao.opcoes = [
                {descricao : "Sim", id : '1'},
                {descricao : "Não", id : '0'}
            ]
        }
        console.log(perguntaCondicao);
        

        this.perguntaCondicao = perguntaCondicao;
        this.perguntaCondicaoSelecionada = perguntaCondicao.descricao

    }

    getFormularioCondicao(formularioCondicao) {
        this.formularioCondicao = formularioCondicao;
    }

    getCondicao(evento) {
        if (!evento.valor){
            return;
        }
        this.condicao = evento.valor;
    }

    getValorCondicao(evento) {
        this.valorCondicao = evento.valor;
    }

    getDadosCondicao(evento, tipo) {
        this.condicaoSelecionada[tipo] = evento.valor;
    }

    getValorTipoDependente(evento) {
        this.tipoDependente = evento.valor;
    }

    objTabelas;
    fnCfgGetTabelasRemote(term){
        return this.serviceEntrada.getTabelas( { like : term} ).subscribe(
            (retorno) => {
                this.objTabelas = retorno.dados || retorno;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        );
    }

    objCamposTabelas
    fnCfgGetCamposTabelasRemote(term){
        return this.serviceEntrada.getCamposTabelas( { tabela: this.objFiltroTabela['nomeTabela'], like : term  } ).subscribe(
            (retorno) => {
                this.objCamposTabelas = retorno.dados || retorno;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        );
    }

    buscarPerguntasCondicaoPaginado(evento = null, paciente = null) {
        this.paginaAtual = evento ? evento.paginaAtual : this.paginaAtual;
        let requestCondicao = {
            pagina: this.paginaAtual,
            quantidade: this.itensPorPagina,
            grupoPerguntaId: this.grupoPerguntaId
        };

        if( this.tipoValor == "BOOLEAN" ){
            this.opcoes = [{ id: '1', descricao: 'Sim' }, { id: '0', descricao: 'Não' }];
        }
        
        this.condicoes = [];
        this.serviceGrupoPerguntaCondicao.get(requestCondicao).subscribe(
            (condicaoResponse) => {
                // TODO Filtra condições do Formulario
                // condicaoResponse.dados.forEach((condicao) => {
                //     if (condicao.perguntaFilho) {
                //         this.condicoes.push(condicao);

                //     } else {
                //         if (condicao.grupoPerguntaFilho.formularioGrupo.id == JSON.parse(localStorage.getItem('gruposPergunta'))[0].formularioGrupo.id) {
                //             this.condicoes.push(condicao);
                //         }
                //     }

                //     this.qtdItensTotal = this.condicoes.length;
                // });

                this.condicoes = condicaoResponse.dados;
                this.qtdItensTotal = condicaoResponse.qtdItensTotal;
            }, (erro) => { 
                Servidor.verificaErro(erro, this.toastr);
                this.toastr.warning(erro);
            }
        );
    }

    condicaoFilhoVisual(condicao) {
        let tipo = "";
        let nome = "";
        if (condicao.perguntaFilho) {
            // tipo = "Pergunta (Global)";
            tipo = "Pergunta (Formulário)";
            nome = condicao.perguntaFilho.descricao;
        } else if (condicao.grupoPerguntaFilho) {
            tipo = "Pergunta (Formulário)";
            nome = condicao.grupoPerguntaFilho.pergunta.descricao;
        } else if (condicao.formularioFilho) {
            tipo = "Formulário";
            nome = condicao.formularioFilho.titulo;
        }

        return `${tipo} "${nome}"`;
    }

    condicaoRespostaVisual(condicao) {
        if( condicao && condicao.resposta ){
            let jsonResposta = JSON.parse(condicao.resposta);
            let valor = jsonResposta.valor;

            if (this.opcoes && this.opcoes.length) {
                let tmpValor = this.opcoes.filter((opcao)=>{ return opcao.id == valor})[0];

                if (tmpValor) {
                    valor = tmpValor.descricao;
                }
            }

            let sCondicao = jsonResposta.condicao.replace(/X /, `${condicao.grupoPergunta.pergunta.descricao} `)
            return `${sCondicao} ${valor}`;
        }
    }

    editarCondicao(acao = "put") {
        this.adicionarCondicao(acao);
    }

    adicionarCondicao(acao = "post") {
        if ( (this.tipoDependente == 'pergunta' || this.tipoDependente == 'grupoPergunta') && (!this.perguntaCondicao || !this.perguntaCondicao.id || this.perguntaCondicao.id == '0') ) {
            this.toastr.warning('Por favor informe a Pergunta');
            return;
        // } else if (  this.tipoDependente == 'grupoPergunta' && (!this.perguntaCondicao || !this.perguntaCondicao.id || this.perguntaCondicao.id == '0') ) {
        //     this.toastr.warning('Por favor informe o Grupo de Perguntas');
        //     return;
        } else if (  this.tipoDependente == 'form' && (!this.formularioCondicao || !this.formularioCondicao.id || this.formularioCondicao.id == '0') ) {
            this.toastr.warning('Por favor informe o Formulario');
            return;
        } else if (!this.tipoDependente || this.tipoDependente == '0') {
            this.toastr.warning('Por favor informe o tipo de Dependente');
            return;
        }

        if (!BrowserHelpers.validaElementContent(this.frmCondicao.nativeElement.Condição) ) {
            this.toastr.warning('Por favor informe a Condição');
            return;
        }

        if (!BrowserHelpers.validaElementContent(this.frmCondicao.nativeElement.ValordaCondição) ) {
            if( this.tipoValor == "BOOLEAN" ){
                if( this.frmCondicao.nativeElement.ValordaCondição.value == "undefined" ){
                    this.toastr.warning('Por favor informe o Valor da Condição');
                    return; 
                }
            }else{
                this.toastr.warning('Por favor informe o Valor da Condição');
                return; 
            }
        }

        let valor = this.frmCondicao.nativeElement.ValordaCondição.value;

        let resposta = {
            condicao: this.frmCondicao.nativeElement.Condição.value,
            valor: valor
        };

        let requestCondicao = {
            id: this.condicaoSelecionada ? this.condicaoSelecionada['id'] : undefined,
            // pergunta: {id: this.id}, //MODO PERGUNTA GLOBAL
            grupoPergunta: {id: this.grupoPerguntaId},
            resposta: JSON.stringify(resposta),
            sexo: this.condicaoSelecionada['sexo'],
            idadeFim: this.condicaoSelecionada['idadeFim'],
            idadeInicio: this.condicaoSelecionada['idadeInicio'],
        };
        
        requestCondicao = this.validaRequestCondicao(requestCondicao);

        let condicao = this[this.tipoDependente+'Condicao'];
        if( condicao[this.tipoDependente+'Filho'] ){
            requestCondicao[this.tipoDependente + 'Filho'] = {id: condicao[this.tipoDependente+'Filho'].id};
        }else{
            requestCondicao[this.tipoDependente + 'Filho'] = {id: condicao.id};
        }
        this.salvaOuEditaCondicao(acao, requestCondicao)

    }

    validaRequestCondicao(requestCondicao){
        if(!this.condicaoSelecionada['sexo'] || ( this.condicaoSelecionada['sexo'] && !this.condicaoSelecionada['sexo'].toString().length ) ){
            delete requestCondicao.sexo;
        }

        if(!this.condicaoSelecionada['idadeFim'] || ( this.condicaoSelecionada['idadeFim'] && !this.condicaoSelecionada['idadeFim'].toString().length ) ){
            delete requestCondicao.idadeFim;
        }
        
        if(!this.condicaoSelecionada['idadeInicio'] || ( this.condicaoSelecionada['idadeInicio'] && !this.condicaoSelecionada['idadeInicio'].toString().length ) ){
            delete requestCondicao.idadeInicio;
        }

        return requestCondicao;
    }

    excluirCondicao() {
        this.serviceGrupoPerguntaCondicao.delete(this.condicaoSelecionada['id']).subscribe(
            (condicaoResponse) => {
                this.toastr.success('Condição excluida com sucesso');
                this.buscarPerguntasCondicaoPaginado();
                this.modalBaseInstancia.close();
            }, (erro) => { this.toastr.warning(erro); }
        );
    }

    salvaOuEditaCondicao(acao, requestCondicao){
        if (!this.bEditarCondicao) {
            this.serviceGrupoPerguntaCondicao[acao](requestCondicao).subscribe(
                (condicaoResponse) => {
                    this.toastr.success('Condição adicionada com sucesso');
                    this.buscarPerguntasCondicaoPaginado();
                    if (this.modalBaseInstancia && this.modalBaseInstancia.close){
                        this.modalBaseInstancia.close();
                    }
                }, (erro) => { this.toastr.warning(erro); }
            );
            return;
        }

        this.serviceGrupoPerguntaCondicao[acao](this.condicaoSelecionada['id'], requestCondicao).subscribe(
            (condicaoResponse) => {
                this.toastr.success('Condição editada com sucesso');
                this.buscarPerguntasCondicaoPaginado();
                if (this.modalBaseInstancia && this.modalBaseInstancia.close){
                    this.modalBaseInstancia.close();
                }
            }, (erro) => { this.toastr.warning(erro); }
        );
    }

    fechaModal(res) {
        this.bEditarCondicao = false;
        this[this.tipoDependente+'Condicao'] = new Object();
        this.condicaoSelecionada = [];
    }

    abreModalEditarCondicao(condicao) {
        let fnModalClose = this.fechaModal.bind(this);

        this.bEditarCondicao = true;
        this.condicaoSelecionada = condicao;
        this.condicaoSelecionada['sexo'] = condicao.sexo || '';
        this.condicaoSelecionada['idadeFim'] = condicao.idadeFim || '';
        this.condicaoSelecionada['idadeInicio'] = condicao.idadeInicio || '';

        let jsonResposta = JSON.parse(condicao.resposta);
        this.perguntaCondicao = condicao.grupoPergunta.pergunta;
        this.tipoDependente = (condicao.perguntaFilho) ? 'pergunta' : 'formulario';
        this[this.tipoDependente+'Condicao'] = condicao;
        this.condicao = jsonResposta.condicao;
        this.valorCondicao = jsonResposta.valor;

        this.modalBaseInstancia = this.modalService.open(NgbdModalContent, {size: 'lg'});
        this.modalBaseInstancia.componentInstance.modalHeader = 'Editar Condição';

        this.modalBaseInstancia.componentInstance.templateRefBody = this.modalEditarCondicao;
        this.modalBaseInstancia.componentInstance.templateBotoes = this.modalEditarCondicaoBotoes;
        this.modalBaseInstancia.result.then(fnModalClose, fnModalClose);
    }
    abreModalRemoverCondicao(condicao) {
        let fnModalClose = this.fechaModal.bind(this);

        this.condicaoSelecionada = condicao;

        this.modalBaseInstancia = this.modalService.open(NgbdModalContent, {size: 'lg'});
        this.modalBaseInstancia.componentInstance.modalHeader = 'Excluir Condição';

        this.modalBaseInstancia.componentInstance.templateRefBody = this.modalRemoverCondicao;
        this.modalBaseInstancia.componentInstance.templateBotoes = this.modalRemoverCondicaoBotoes;
        this.modalBaseInstancia.result.then(fnModalClose, fnModalClose);
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

    objFormulario;
    fnCfgFormularioRemote(term) {
        this.serviceFormulario.formularioPaginado({ simples: true, like : term }).subscribe(
            (retorno) => {
                this.objFormulario = retorno.dados || retorno;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        )
    }

    gruposPerguntaSelecionado;
    idGrupoPerguntaSelecionada;
    getGrupoPerguntaCondicao(grupoPergunta){
        console.log(grupoPergunta);
        this.gruposPerguntaSelecionado = grupoPergunta.pergunta ? grupoPergunta.pergunta.descricao : '';
        this.grupoPerguntaCondicao = grupoPergunta;
    }

    validaOpcoes(){
        if(this.tipoValor == 'BOOLEAN'){
            this.opcoes = undefined
        }
    }

    validaMascaraExpressaoRegular(){
        if( this.mascaraValor && this.tipoValor == 'TEXTO'){
            if( this.mascaraValor.indexOf('/g') >= 0 ){
                this.expressaoRegular = true;

                this.mascaraValor = this.mascaraValor.replace(/\/g|\//g, '');

            }
        }
    }
}