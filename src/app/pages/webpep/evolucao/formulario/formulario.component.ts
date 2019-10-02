import { Component, ViewContainerRef, ViewChild, ViewChildren, Input, Output, ChangeDetectionStrategy, ChangeDetectorRef, EventEmitter, ElementRef, QueryList, OnInit, OnDestroy, TemplateRef, SimpleChanges, SimpleChange } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { ToastrService } from 'ngx-toastr';

import { Sessao, Servidor, PacienteDocumentoService, FormularioModeloService, PacientePrescricaoService, PrescricaoModeloService, CidService, CiapService, ModeloDiagnosticoService, EspecialidadeService, PacienteEncaminhamentoService, UtilService, RespostaOpcaoService, ProfissionalService } from '../../../../services';

import { NgbdModalContent } from '../../../../theme/components/modal/modal.component';
import { FormatosData } from '../../../../theme/components/agenda/agenda';
import { FormularioPaciente } from '../../atendimento/formulario';

import * as moment from 'moment';
moment.locale('pt-br');

@Component({
    selector: 'paciente-formulario',
    templateUrl: './formulario.html',
    styleUrls: ['./formulario.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [FormularioPaciente]
})
export class Evolucao implements OnInit, OnDestroy {

    @Input() id;
    @Input() pacienteId;
    @Input() botoesSolicitacao = false;
    @Input() atendimento;
    @Input() formularioFilho = false;
    @Input() modelo = undefined;
    @Input() tipoDocumento = false;
    @Input() eDependente = false;
    @Input() ordemPrincipal;
    @Input() botaoSalvarFormulario = false;
    @Input() formularioId = undefined;
    @Input() idFormulario;

    @Input() respostasCabecalho;
    @Input() mostraPrescricoes = false;

    @Input() semBotoes;
    @Input() bloqueiaRequisicoes;
    @Input() componentePronto = false;
    @Input() status;

    @Input() respostas;

    @Output() salvaFormulario = new EventEmitter();
    @Output() salvandoResposta = new EventEmitter();
    @Output() finalizaDocumento = new EventEmitter();

    evolucao;
    formulariosDependentes = [];
    prescricaoItem = [];

    grupoRecorrencia = {};

    ordems:any;

    /* VARIAVEIS TIPO FUNÇÃO */
    temFuncao;
    elems = [];
    completeArray = false;
    formatosDeDatas;
    unidadeId;
    unidadesAtendimento;

    bloqueado;

    @ViewChildren("inputsForm") inputsForm: QueryList<ElementRef>;
    @ViewChildren("grupoFormulario") grupoFormulario: QueryList<ViewContainerRef>;

    constructor(
        private vcr: ViewContainerRef,
        private toastr: ToastrService,
        private route: ActivatedRoute,
        private cdr: ChangeDetectorRef,
        private modalService: NgbModal, 
        private serviceCid: CidService,
        private serviceCiap: CiapService,
        private serviceUtil: UtilService,
        private serviceModelo: FormularioModeloService,
        private serviceModelos: PrescricaoModeloService,
        private profissionalService: ProfissionalService,
        private atendimentoFormulario: FormularioPaciente,
        private serviceRespostaOpcao: RespostaOpcaoService,
        private serviceEspecialidade: EspecialidadeService,
        private serviceModeloDiagnostico: ModeloDiagnosticoService,
        private pacienteDocumentoService: PacienteDocumentoService,
        private encaminhamentoService: PacienteEncaminhamentoService,
        private servicePacientePrescricao: PacientePrescricaoService,
    ) {
        if (!this.id) {
            this.route.params.subscribe(params => {
                this.id = params['id'];
            });
        }
    }

    filtroMedicacao = new Object();
    filtroPrescricaoMedica = new Object();
    prescricoesUsoContinuo = [];
    novasPrescricoes = [];
    ngOnInit() {
        this.formatosDeDatas = new FormatosData;
        this.unidadeId = Sessao.getIdUnidade();
        this.unidadesAtendimento = JSON.parse( localStorage.getItem("variaveisAmbiente") ).unidadesAtendimento;

        this.filtroPrescricaoMedica = {
            paciente:{
                id: this.pacienteId
            },
            usoContinuo:false
        }

        this.filtroMedicacao = {
            paciente:{
                id: this.pacienteId
            },
            usoContinuo:true
        }

        if( this.atendimento && this.atendimento.id ){
            this.filtroPrescricaoMedica['atendimento'] = { id : this.atendimento.id };
            this.filtroMedicacao['atendimento'] = { id: this.atendimento.id };
        }
        
    }

    ngOnChanges(changes: SimpleChanges) {
        if ( changes['respostas'] ) {
            const resposta: SimpleChange = changes.respostas;
            this.respostas = resposta.currentValue;
    
            if ( !!this.respostas ) {
                this.preparaEvolucao(this.respostas);
                this.salvar();
            }
        }
    }

    // modelos = [];
    ngAfterViewInit() {
        // this.componentePronto = false;
        let pacienteDocumentoId = this.id;
        if (!pacienteDocumentoId) {
            this.toastr.error(`Formulário Id invalido. Valor: "${pacienteDocumentoId}"`);
            return;
        }

        if (!this.tipoDocumento) {
            this.carregaStatusDocumento();
        }
    }

    carregaStatusDocumento(){
        let request = {
            id: this.id,
            simples: true
        }
        this.pacienteDocumentoService.getId(request).subscribe(
            (evolucao) => {
                if( evolucao.dados && evolucao.dados.length ){
                    if( evolucao.dados[0].status == 'FINALIZADO' || evolucao.dados[0].status == 'EXCLUIDO' ){
                        // GET RESPOSTAS
                        let request = {
                            pacienteDocumentoId: this.id,
                            simples: true
                        }
                        this.pacienteDocumentoService.getFormularioRespostaOrdenado(request).subscribe(
                            (retorno) => {
                                let respostas = ( retorno.dados || retorno );
                                this.evolucao = new Object();
                                this.evolucao['status'] = evolucao.dados[0].status;
                                this.evolucao['formularioResposta'] = respostas.map(
                                    (resposta) => {
                                        let objresposta = resposta;
                    
                                        if ( objresposta.valor ) {
                                            return objresposta;
                                        }
                    
                                        if( objresposta.respostaOpcoes && objresposta.respostaOpcoes.length ){
                                            objresposta.pergunta.opcoes = objresposta.respostaOpcoes.map(
                                                (respostaOpcao)=>{
                                                    return respostaOpcao.perguntaOpcao;
                                                }
                                            )
                                        }
                    
                                        return objresposta;
                                    }
                                )
                                this.componentePronto = true;
                                this.cdr.markForCheck();
                            },
                            (erro) => {
                                Servidor.verificaErro(erro, this.toastr);
                            }
                        );
                    }else{
                        this.carregaEvolucao();
                    }
                }
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );
    }

    carregaEvolucao() {        
        this.pacienteDocumentoService.getId({ id: this.id }).subscribe((evolucao) => {

            // this.buscaPrescricoesAtendimento();

            if (!evolucao.dados[0]) {
                this.toastr.error(`Evolução não encontrada.`);
                return;
            }

            this.evolucao = evolucao.dados[0];
            this.verificaSeBloqueia();

            let idx = indexedDB.open('cacheRequest');

            idx.onsuccess = ($event:any) => {

                var db = $event.target.result;
                var transaction = db.transaction('formularios', 'readwrite');
                var formulariosStore = transaction.objectStore('formularios');
                let obj = evolucao.dados
                var salvou = formulariosStore.add(obj); // IDBRequest

            }
            this.preparaEvolucao(this.evolucao);

            // this.botaoSalvarFormulario = !this.bloqueado;
        },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
                if (erro.status == 412) {
                    this.toastr.error("Usuário não pode visualizar este formulário.");
                }else if (erro.status == 403) {
                    this.toastr.error("Usuário não pode inserir este formulário.");
                }else{
                    console.log("busca formualrio offline");

                    var request = indexedDB.open('cacheRequest');
                    request.onsuccess = ($event:any) => {

                        // get database from $event
                        var db = $event.target.result;

                        // create transaction from database
                        var transaction = db.transaction('formularios', 'readwrite');

                        var formulariosStore = transaction.objectStore('formularios');
                        console.log("Vou buscar");


                        formulariosStore.openCursor(null,'next').onsuccess = (event) => {
                            var cursor = event.target.result;
                            if(cursor) {
                                // console.log(cursor.value[0].formulario.id  + " =  " + cursor.value[0].formulario.titulo);

                                if( cursor.value[0].formulario.id == this.idFormulario ){
                                    console.log("Fomrulario encontrado offline");
                                    this.evolucao = cursor.value[0];

                                    this.validaRespostasModoOffline();
                                    this.cdr.markForCheck();
                                    this.preparaEvolucao(this.evolucao);
                                }else{
                                    cursor.continue();        
                                }

                            } else {
                                this.toastr.warning('Formulario nao encontrado offline');         
                                return
                            }
                        };

                    };

                }
            }
        );
    }

    prescricoesAtendimento;
    prescricoesAtendimentoCronicas;
    buscaPrescricoesAtendimento(){
        if( this.mostraPrescricoes ){
            let request = {
                pagina : 0,
                quantidade: 0,
                usoContinuo: false,
                validaEspecialidade: false
            }

            let requestBODY = new Object();
            (this.atendimento) ? requestBODY['atendimento'] = { id: this.atendimento.id } : null;
            (this.pacienteId) ? requestBODY['paciente'] = { id: this.pacienteId } : null;

            this.servicePacientePrescricao.postPrescricaoPacienteFiltro( requestBODY, request ).subscribe(
                (prescricoesPaciente) => {
                    this.prescricoesAtendimento = prescricoesPaciente.dados || prescricoesPaciente;
                    this.cdr.markForCheck();
                },
                (erro) => {
                    this.cdr.markForCheck();
                    Servidor.verificaErro(erro, this.toastr);
                }
            )

            requestBODY = { usoContinuo: true };
            this.servicePacientePrescricao.postPrescricaoPacienteFiltro( requestBODY, request ).subscribe(
                (prescricoesPaciente) => {
                    this.prescricoesAtendimentoCronicas = prescricoesPaciente.dados || prescricoesPaciente;
                    this.cdr.markForCheck();
                },
                (erro) => {
                    this.cdr.markForCheck();
                    Servidor.verificaErro(erro, this.toastr);
                }
            )
        }
    }

    validaClasse(pos){
        return ( pos % 2 == 0 );
    }

    preparaEvolucao(evolucao){
        let respostas = {};
        let ordem = '';
        this.cdr.markForCheck();
        this.ordems = (evolucao.status != 'ATIVO') ? [] : {}

        //  constroi respostas em branco
        evolucao.formulario.formularioGrupo.forEach((grpForm, index) => {

            let aResposta = evolucao.formularioResposta.slice();
            aResposta = aResposta.map((iResp) => { return iResp.pergunta.id });

            let counts = {};
            for (let i = 0; i < aResposta.length; i++) {
                let num = aResposta[i];
                counts[num] = counts[num] ? counts[num] + 1 : 1;
            }

            let aPerguntas = grpForm.grupoPergunta.slice();
            aPerguntas = aPerguntas.map((perg) => { return perg.pergunta.id });
            let iOrdem = 1;
            aPerguntas.forEach((perg) => {
                iOrdem = counts[perg] > iOrdem ? counts[perg] : iOrdem;
            });

            let aOrdem = [];
            for (let i = 0; i < iOrdem; i++) {
                aOrdem.push( parseFloat((index+1) + '.' + (i + 1)) );
            }
            if( evolucao.status == 'ATIVO' ){
                this.ordems[grpForm.id] = aOrdem;
            }else{
                this.ordems.push( aOrdem );
            }

            aOrdem.forEach((i) => {

                grpForm.grupoPergunta.forEach((grpPergunta) => {
                    let sResp = `${grpPergunta.pergunta.id}-${i}`;
                    
                    respostas[sResp] = {};

                    if (grpPergunta.condicoes) {
                        grpPergunta.condicoes.forEach((condicao) => {
                            if (condicao.perguntaFilho) {
                                respostas[`${condicao.perguntaFilho.id}-${i}`] = {};
                            }
                        });
                    }

                });

                if (grpForm.repetir) {
                    this.grupoRecorrencia[grpForm.id] = [0];
                }
            });
        });

        if( evolucao.status != 'ATIVO' ){
            this.ordems = [].concat.apply([], this.ordems);
        }

        // console.log(respostas);
        
        this.respostas = Object.assign({}, respostas);

        evolucao.formularioResposta.forEach((formResp) => {
            let ordemPergunta = this.pegarAOrdemDoElemento( formResp, formResp.ordemGrupo );
            let respId = `${formResp.pergunta.id}-${formResp.ordemGrupo}`;
            let resp = new Object({ 
                valor: formResp.valor,
                ordem: ordemPergunta
            });

            if (formResp.pergunta.tipo == 'UPLOAD' || formResp.pergunta.tipo == 'DESENHO') {
                resp['valor'] = JSON.stringify(formResp);
            }

            if ( evolucao.status == 'ATIVO' ) {
                if (formResp.pergunta.tipo == "SELECAO") {
                    if (formResp.respostaOpcoes && formResp.respostaOpcoes.length) {
                        let opcoesResposta = formResp.respostaOpcoes.map(
                            (resposta) => {
                                return resposta.perguntaOpcao.id;
                            }
                        )
                        resp['valor'] = opcoesResposta /*ENVIAR UM ARRAY COM ID DE OPÇÕES*/
                    } else {
                        resp['valor'] = [];
                    }
                } else if (formResp.pergunta.tipo == "RADIO") {
                    if (formResp.respostaOpcoes && formResp.respostaOpcoes.length) {
                        let opcoesResposta = formResp.respostaOpcoes.map(
                            (resposta) => {
                                return resposta.perguntaOpcao.id;
                            }
                        ).slice()
                        resp['valor'] = opcoesResposta.length ? opcoesResposta[0] : '' /*ENVIAR UM ARRAY COM ID DE OPÇÕES*/
                    } else {
                        resp['valor'] = '';
                    }
                }
            }

            this.respostas[respId] = resp;
        });

        // console.log(this.respostas);
        this.respostas = JSON.parse(JSON.stringify(this.respostas));
        this.componentePronto = true;

        this.cdr.markForCheck();
    }

    ngAfterViewChecked() {
        if (!this.completeArray) {

            this.inputsForm.forEach(
                (child: any) => {
                    this.completeArray = true;

                    if (child.tipo == "FUNCAO") {
                        this.temFuncao = true;
                        this.elems.push(child)
                    }
                }
            );

        }
    }

    ngOnDestroy() {
        this.cdr.detach();
    }

    verificaSeBloqueia() {
        //  pega a diferenca e ve se e maior que 24 horas
        let momentDataEvolucao = moment(this.evolucao.data, "DD/MM/YYYY HH:mm:ss");
        let agora = moment();

        let duration = moment.duration(agora.diff(momentDataEvolucao));
        let horas = duration.asHours();

        if (horas > 24) {
            this.bloqueado = true;
        }
    }

    repeteGrupo(grpForm) {
        let ultimoContador = this.ordems[grpForm.id][this.ordems[grpForm.id].length - 1];

        if (ultimoContador == '') {
            this.ordems[grpForm.id] = this.ordems[grpForm.id].concat([1]);
        } else {
            if( ultimoContador.toString().indexOf('.') > -1 ){
                let str = ultimoContador.toString();
                let ordem = str.split('.')[0];
                let subordem = str.split('.')[1];
                this.ordems[grpForm.id] = this.ordems[grpForm.id].concat([ parseFloat(ordem + '.' + (parseInt(subordem) + 1)) ]);
            }else{
                this.ordems[grpForm.id] = this.ordems[grpForm.id].concat([ parseFloat(parseInt(ultimoContador) + '.' + (parseInt(ultimoContador) + 1)) ]);
            }
        }
    }

    imprimir() {
        if (this.id && this.id.trim() != "") {
            window.open(this.pacienteDocumentoService.evolucaoPdf(this.id), "_blank");
        }
    }

    abreFormularioDependente(grupoPergunta, condicao) {
        if (!this.id) {
            this.toastr.error("Usuário não pode visualizar este formulário.");
            return;
        }

        //  Get Paciente Documento por paciente pai
        this.pacienteDocumentoService.getId({ pacienteDocumentoPaiId: this.id }).subscribe((resposta) => {

            let formularioCondicaoExiste = resposta.dados.filter(
                (form) => {
                    return form.formulario.id == condicao.formularioFilho.id;
                }
            )

            //  Se nao tiver documento criado cria um novo
            if ( !resposta.dados.length || ( resposta.dados.length && !formularioCondicaoExiste.length ) ) {

                let formularioId = condicao.formularioFilho.id;
                let pacienteId = this.pacienteId;
                let atendimentoId = this.atendimento ? this.atendimento.id : null; // this.atendimento.id

                let reqNovoDocumento = {
                    paciente: { id: pacienteId },
                    pacienteDocumentoPai: { id: this.id },
                    formulario: { id: formularioId },
                    data: moment().format(this.formatosDeDatas.dataHoraSegundoFormato)
                };

                if (atendimentoId) {
                    reqNovoDocumento['atendimento'] = { id: atendimentoId };
                }

                this.pacienteDocumentoService.inserir(reqNovoDocumento).subscribe(
                    (novoId) => {
                        if (novoId) {
                            this.formulariosDependentes[condicao.formularioFilho.id] = {
                                id: novoId
                            }
                            this.cdr.markForCheck();
                            //this.buscarPacienteDocumento();
                        }
                    }, (erro) => {
                        this.cdr.markForCheck();
                        Servidor.verificaErro(erro, this.toastr);
                    }
                );

            } else {

                resposta.dados.forEach((documento) => {

                    if (documento.formulario.id == condicao.formularioFilho.id) {
                        this.formulariosDependentes[condicao.formularioFilho.id] = {
                            id: documento.id
                        }

                    }

                });

                
            }
        });
    }

    excluiFormularioDependente(grupoPergunta, condicao, ordem) {

        if (this.formulariosDependentes[condicao.formularioFilho.id]) {

            if (!this.mostraDependente(grupoPergunta, condicao, ordem, false, 'formularioFilho', false)) {

                let idExclusao = this.formulariosDependentes[condicao.formularioFilho.id].id;

                this.pacienteDocumentoService.delete(idExclusao).subscribe(
                    (resposta) => {}, 
                    (err) => { Servidor.verificaErro(err, this.toastr); },
                    () => { }
                );

                delete this.formulariosDependentes[condicao.formularioFilho.id];
            }

        }
    }

    //  TODO: Excluir Resposta
    excluiRespostaDependente(grupoPergunta, condicao, ordem = '1.1', tipo) {
        if (!this.mostraDependente(grupoPergunta, condicao, ordem, false, tipo)) {
            let perguntaId = condicao.perguntaFilho.id || condicao.grupoPerguntaFilho.id;
            let request = JSON.parse(`{
                "formularioResposta":[
                    {"pergunta":{"id":${perguntaId}}, 
                    "ordem":${ordem},
                    "valor":""
                }]}`);
    
            this.pacienteDocumentoService.atualizar(this.id, request).subscribe((status) => {
                this.respostas[`${perguntaId}-${ordem}`].valor = "";
                this.cdr.markForCheck();
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            });
    
            return true;
        }
    }

    mostraPrincipal(grupo, pergunta) {
        let mesmaPergunta = true;

        grupo.grupoPergunta.forEach(grupoPergunta => {
            if( grupoPergunta.condicoes && grupoPergunta.condicoes.length ){
                grupoPergunta.condicoes.forEach(condicao => {
                    if (condicao.grupoPerguntaFilho && pergunta.id == condicao.grupoPerguntaFilho.pergunta.id) {
                        mesmaPergunta = false;
                    }
                });
            }
        });

        return mesmaPergunta;
    }

    perguntaCabecalho(condicao) {
        let mostrar = true;

        if (this.respostasCabecalho) {
            if (condicao.idadeInicio && condicao.idadeFim) {
                if ( ( this.respostasCabecalho['idade'] - condicao.idadeInicio < 0 ) ||
                     ( this.respostasCabecalho['idade'] - condicao.idadeFim ) > 0
                ) {
                    mostrar = false;
                }
            
            } else {
                if (condicao.idadeInicio && this.respostasCabecalho['idade'] < condicao.idadeInicio) {
                    mostrar = false;
                }

                if (condicao.idadeFim && this.respostasCabecalho['idade'] > condicao.idadeFim) {
                    mostrar = false;
                }
            }

            if (condicao.sexo && this.respostasCabecalho['genero'] != condicao.sexo) {
                mostrar = false;
            }
            
        } else {
            // this.toastr.error("Não foi possivel extrair informações do paciente: Idade, Sexo");
        }
        
        return mostrar;
    }

    mostraDependente(grupoPergunta, condicao, ordem = '1.1', eGrupoPergunta = false, tipoCondicao = null, excluiFormulario = true) {
        let oCondicao = JSON.parse(condicao.resposta);
 
        if (this.perguntaCabecalho(condicao)) {
            if (eGrupoPergunta) {
                let mesmoFormularioGrupo = this.evolucao.formulario.formularioGrupo.filter(
                    (formularioGrupo) => {
                        return formularioGrupo.id == condicao.grupoPerguntaFilho.formularioGrupo.id;
                    }
                ).length;

                if(!mesmoFormularioGrupo) {
                    return;
                }
            }

            if (grupoPergunta.pergunta.tipo != "SELECAO") {
                if (!!this.respostas[`${grupoPergunta.pergunta.id}-${ordem}`]) {
                    if( this.temFuncao && grupoPergunta.pergunta.tipo == 'FUNCAO' && this.elems && this.elems.length ){
                        let elem = this.elems[0];
                        let opcaoId= Object.getPrototypeOf(elem).validaScores(elem.opcoes, this.respostas[`${grupoPergunta.pergunta.id}-${ordem}`].valor, true);
                        return this.validaCondicao( oCondicao , opcaoId);
                    }
                    return this.validaCondicao( oCondicao , this.respostas[`${grupoPergunta.pergunta.id}-${ordem}`].valor);
                }

            } else {
                if (this.respostas[`${grupoPergunta.pergunta.id}-${ordem}`].valor) {
                    if(this.respostas[`${grupoPergunta.pergunta.id}-${ordem}`] && this.respostas[`${grupoPergunta.pergunta.id}-${ordem}`].valor) {
                        if( tipoCondicao ){
                            
                            let condicoesIguais = grupoPergunta.condicoes.filter(
                                (objcondicao) => {
                                    if( objcondicao[tipoCondicao] && objcondicao[tipoCondicao]['id'] ){
                                        return ( objcondicao[tipoCondicao]['id'] == condicao[tipoCondicao]['id'] )
                                    }
                                    return false;
                                }
                            )

                            // SE EU TENHO MAIS DE UMA CONDIÇÃO QUE MOSTRA O MESMO RESULTADO
                            if( condicoesIguais && condicoesIguais.length > 1 ){
                                if( this.respostas[`${grupoPergunta.pergunta.id}-${ordem}`].valor &&
                                    this.respostas[`${grupoPergunta.pergunta.id}-${ordem}`].valor.length
                                ){
                                    // ORDENO EM ORDEM DESCRESCENTE
                                    let ordenados = this.respostas[`${grupoPergunta.pergunta.id}-${ordem}`].valor.sort(
                                        (a,b) => {  return a >= b ? -1 : 1;  }
                                    );

                                    // PEGO A MAIOR CHECADA
                                    let maior = JSON.parse(ordenados[0]);

                                    // SE EU JÁ TENHO UMA OPÇÃO MARCADA COM CONDIÇÃO IGUAL ESSA QUE ESTOU VERIFICANDO NAO MOSTRA 2 VEZES
                                    // SE NÃO SEGUE PRA VALIDAÇÃO PADRÃO
                                    if( ( this.respostas[`${grupoPergunta.pergunta.id}-${ordem}`].valor.indexOf( parseInt(maior) ) >= 0 ) || 
                                        ( this.respostas[`${grupoPergunta.pergunta.id}-${ordem}`].valor.indexOf( maior.toString() ) >= 0 )
                                    ){
                                        let eUmaDasCondicoes = condicoesIguais.filter(
                                            (condicao) => {
                                                let json = JSON.parse( condicao.resposta )
                                                return parseInt(json.valor ) == parseInt(maior);
                                            }
                                        )

                                        // TA COM UM PROBLEMA QUANDO REMOVE EVOLUÇÃO E ADICIONAR NOVAMENTE PELA CONDIÇÃO
                                        if( (eUmaDasCondicoes && eUmaDasCondicoes.length) && (parseInt(maior) > parseInt(oCondicao.valor)) ){
                                            return ( !excluiFormulario );
                                        }
                                    }
                                }
                            }

                        }
                        let resposta = this.respostas[`${grupoPergunta.pergunta.id}-${ordem}`]
                        let bMostra = resposta.valor.indexOf((oCondicao.valor).toString()) >= 0 
                                        || resposta.valor.indexOf(parseInt(oCondicao.valor) ) >= 0;

                        return oCondicao.condicao == 'X ==' ? bMostra : ( (resposta.valor && resposta.valor.length) ? !bMostra : false ) 
                    }
                }
            }

            return false;
        }
    }

    validaCondicao(oCondicao, valorResposta){
        if (oCondicao.condicao == "X >") {
            return oCondicao.valor > valorResposta;
        }

        if (oCondicao.condicao == "X <") {
            return oCondicao.valor < valorResposta;
        }

        if (oCondicao.condicao == "X >=") {
            return oCondicao.valor >= valorResposta;
        }

        if (oCondicao.condicao == "X <=") {
            return oCondicao.valor <= valorResposta;
        }

        if (oCondicao.condicao == "X ==") {
            return oCondicao.valor == valorResposta;
        }

        if (oCondicao.condicao == "X !=") {
            return oCondicao.valor != valorResposta;
        }
    }

    getFormularioId(grupoPergunta, condicao, ordem = '') {
        ordem = '-' + ordem;
    }

    getValor(id, ordem = '1.1', tipo) {
        let objParam = {
            pergunta: { 
                id: id
            }
        }
        let ordemPergunta = this.pegarAOrdemDoElemento( objParam, ordem );
        // console.log("Ordem da Pergunta que to respondendo:  " + ordemPergunta);
        
        let resposta = this.respostas[`${id}-${ordem}`];
        if( resposta && ordemPergunta ){
            if( tipo == "UPLOAD" ){
                if( Object.keys(resposta).length ){
                    let respostaJson = JSON.parse(resposta);
                    respostaJson['ordem'] = ordemPergunta;
                    this.respostas[`${id}-${ordem}`] = respostaJson
                    resposta = respostaJson;
                }
            }else{
                resposta['ordem'] = ordemPergunta;
            }
            
        }

        if (tipo == "BOOLEAN" || tipo == "SIMNAO") {
            if( resposta && resposta.valor ){
                if ( resposta.valor == 'Não' || resposta.valor == 0 ) {
                    resposta.valor = "0";
                }

                if ( resposta.valor == 'Sim' || resposta.valor == 1 ) {
                    resposta.valor = "1";
                }
            }
        }

        if( tipo == 'SELECAO' ){
            return resposta ? resposta.valor : []
        }

        return resposta ? resposta.valor : '';
    }

    respostasFuncao = new Object();
    getResposta(ev, grupoPergunta, ordem = '1.1', formularioResposta = undefined) {
        ordem = '-' + ordem;
        let objPergunta = (grupoPergunta.pergunta || grupoPergunta);

        if (this.temFuncao) {
            this.execucaoFormulas();
            
            this.respostas[`${objPergunta.id}${ordem}`] = { valor: ev.valor };
        }

        if (objPergunta.tipo == "ESTRELA") {
            if (ev.valido) {
                this.respostas[`${objPergunta.id}${ordem}`] = { valor: ev.valor };
            }
        }

        if (objPergunta.tipo == "UPLOAD" || objPergunta.tipo == "DESENHO") {
            let oResp = formularioResposta.filter((resp) => resp.pergunta.id == objPergunta.id)[0];

            if (oResp) {
                this.respostas[`${objPergunta.id}${ordem}`] = JSON.stringify(Object.assign({}, oResp));
            }
        } else if (objPergunta.tipo != "SELECAO") {
            if (ev.valor) {
                this.respostas[`${objPergunta.id}${ordem}`] = { valor: ev.valor };   
            }
        } else {
            if (ev.valor) {
                this.respostas[`${objPergunta.id}${ordem}`] = { valor: ev.valor };
            }
        }

        this.respostas = Object.assign({}, this.respostas);
    }

    alteraDocumento(texto) {

        if (texto && texto != '') {

            let request = {
                "modelo": texto
            }

            this.pacienteDocumentoService.atualizar(this.id, request).subscribe((status) => {
                this.toastr.success("Modelo salvo com sucesso");
                this.cdr.markForCheck();
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            });

        } else {
            this.toastr.error("Modelo nao pode ser vazio");
        }

    }

    bloqueiaPerguta(grupoPergunta) {
        return this.bloqueado || this.bloqueiaRequisicoes;
    }

    selecionarModelo(documento, pos) {
        console.log("Busca modelo");

        this.serviceModelo.getModelos({ id: documento.id }).subscribe(
            (modelo) => {
                let modeloObj = modelo.dados[0];
                this.evolucao
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        )

    }

    submit() {
        //this.salvar(false);
    }

    salvar() {
        let request = { formularioResposta: [] };
        this.setSalvandoRespostas(true);
        Object.keys(this.respostas).forEach(
            (resposta) => {

                if (this.respostas[resposta] && this.respostas[resposta]['valor']) {

                    let valor = this.respostas[resposta]['valor'];

                    let resp = {
                        "pergunta": {
                            "id": resposta.split("-")[0]
                        },
                        "ordem": resposta.split("-")[1]
                    };

                    if (!Array.isArray(valor)) {
                        resp['valor'] = valor;
                    } else {
                        if (valor.length) {
                            // resp['valor'] = "+" + valor.join("+");  /*ENVIAR UM ARRAY COM ID DE OPÇÕES*/
                            resp['valor'] = valor
                        } else {
                            resp['valor'] = [];
                        }
                    }

                    if (resp.ordem != "undefined") {
                        request.formularioResposta.push(resp);
                    }
                }
            }
        )

        if (request.formularioResposta.length) {

            this.pacienteDocumentoService.atualizar(this.id, request).subscribe((status) => {
                console.log("salvaEvolucao")
                this.toastr.success("Resposta salva com sucesso");
                this.setSalvandoRespostas(false);
                this.cdr.markForCheck();
            }, (error) => {
                this.setSalvandoRespostas(false);
                Servidor.verificaErro(error, this.toastr);
            });
        }

        // this.salvaFormulario.emit(this.id);
    }

    setSalvandoRespostas(salvando){
        this.salvandoResposta.emit(salvando);
        this.salvando = salvando;
    }

    perguntasObrigatoriasNaoRespondidas = [];
    @ViewChild("bodyPerguntasNaoRespondidas", {read: TemplateRef}) bodyPerguntasNaoRespondidas: TemplateRef<any>;
    activeModal;
    salvando = false;
    finalizar(){
        if( this.salvando ){
            return;
        }
        this.perguntasObrigatoriasNaoRespondidas = [];

        let evolucao = this.evolucao;
        let iValidacao = 0;

        let objPerguntasNaoRespondidasPaciente = {
            formulario: evolucao.formulario.titulo,
            pergunta : []
        }

        evolucao.formulario.formularioGrupo.forEach((form) => {
            let aPerguntasObrigatorias = form.grupoPergunta.filter((grupoPergunta)=>{return grupoPergunta.obrigatorio});

            // objPerguntasNaoRespondidas['pergunta'] = [];

            aPerguntasObrigatorias.forEach((pergunta) => {
                let perguntaObrigatoria = pergunta.pergunta;

                if (this.respostas[`${perguntaObrigatoria.id}-1.1`] && /* TEM A PERGUNTA */
                    perguntaObrigatoria.id != 158 &&
                    (!this.respostas[`${perguntaObrigatoria.id}-1.1`].valor ||
                        (
                            perguntaObrigatoria.tipo.toUpperCase() != 'BOOLEAN' &&
                            this.respostas[`${perguntaObrigatoria.id}-1.1`].valor == '0'
                        )
                    )/* MAS NAO TEM A RESPOSTA */ 
                ) {
                    iValidacao--;// = false;
                    objPerguntasNaoRespondidasPaciente['pergunta'].push( perguntaObrigatoria );
                }
            });
        });

        if( objPerguntasNaoRespondidasPaciente['pergunta'] && objPerguntasNaoRespondidasPaciente['pergunta'].length ){
            this.perguntasObrigatoriasNaoRespondidas.push( objPerguntasNaoRespondidasPaciente );
        }

        let dataModificacaoEvolucao = moment('01/02/2019 23:59:59', this.formatosDeDatas.dataHoraSegundoFormato);
        let antesDataModificacaoEvolucao = moment( this.evolucao.data, this.formatosDeDatas.dataHoraSegundoFormato ).isBefore( dataModificacaoEvolucao );
        // VAI PERMITIR FINALIZAR FORMULÁRIOS DE ANTES DA DATA DE MODIFICAÇÃO DA ESTRUTURA DA EVOLUÇÃO
        if( (this.perguntasObrigatoriasNaoRespondidas.length && iValidacao < 0) && !antesDataModificacaoEvolucao ){

            this.toastr.error("Existem perguntas obrigatórias nao respondidas");

            this.activeModal = this.modalService.open(NgbdModalContent, {size: 'lg'});
            this.activeModal.componentInstance.modalHeader  = 'Perguntas Obrigatorias nao respondidas';
            this.activeModal.componentInstance.templateRefBody = this.bodyPerguntasNaoRespondidas;
            return;
        }else{

            let request = {
                status: 'FINALIZADO'
            }
            this.pacienteDocumentoService.atualizar(this.id, request).subscribe(
                (status) => {
                    this.toastr.success("O formulário foi finalizado");
                    this.carregaEvolucao();
                    this.cdr.markForCheck();
                    this.salvaFormulario.emit(
                        Object.assign({ 
                            id: this.id,
                            formulario: this.evolucao.formulario
                        }, request) 
                    )
                }, (error) => {
                    Servidor.verificaErro(error, this.toastr);
                }
            );
        }
    }

    idAbaAbertaPergunta;
    abrirAbaPergunta(idAba) {
        if (this.idAbaAbertaPergunta == idAba) {
            this.idAbaAbertaPergunta = "";
        } else {
            this.idAbaAbertaPergunta = idAba;
        }
    }

    salvaEvolucao(grupoPergunta, ordem = '1.1', valor, nomeArquivo = '') {
        if (this.bloqueado) {
            this.toastr.warning("Evolução bloqueada! Não é possivel editar");
            this.carregaEvolucao();
            return;
        }

        this.setSalvandoRespostas(true);
        let request = { formularioResposta: [] };

        let ordemElemento = this.pegarAOrdemDoElemento(grupoPergunta, ordem);
        console.log("Ordem do Elemento" + ordemElemento);
        
        this.evolucao.formulario.formularioGrupo.forEach((grupo) => {

            grupo.grupoPergunta.forEach((pergunta) => {
                let pergId = pergunta.pergunta.id;

                this.ordems[pergunta.formularioGrupo.id].forEach((ord) => {
                    let resp = {
                        "pergunta": {
                            "id": pergId
                        },
                        "perguntaDescricao": pergunta.pergunta.descricao,
                        "ordem": this.getOrdemSalvar(ordemElemento),
                        "ordemGrupo": ordem
                    };

                    if (grupoPergunta.pergunta.id == pergId && ord == ordem) {
                        if (pergunta.pergunta.tipo != "BOOLEAN") {

                            if (pergunta.pergunta.tipo == "DESENHO" || pergunta.pergunta.tipo == "UPLOAD") {
                                //servico = 'atualizarAnexo';
                                nomeArquivo = nomeArquivo || `${moment().format("DD/MM/YYYY_HH:mm:ss")}.png`;

                                let aNome = nomeArquivo.split(/\./g);
                                resp['anexos'] = [
                                    {
                                        "arquivoBase64": valor.replace(/^.*;base64,/, ''),
                                        "extensao": aNome[aNome.length -1] || 'png',
                                        "nome": nomeArquivo.replace(`.${aNome[aNome.length -1]}`, '')
                                    }
                                ];
                                resp['valor'] = nomeArquivo;

                            } else if (pergunta.pergunta.tipo != "SELECAO") {
                                if (pergunta.pergunta.tipo != "DATA") {

                                    if(pergunta.pergunta.tipo == "RADIO"){
                                        resp['respostaOpcoes'] = [
                                            {
                                                id: valor
                                            }
                                        ]
                                    }else{
                                        resp['valor'] = valor;
                                    }

                                } else {
                                    resp['valor'] = valor.replace(/\//g, "");
                                }
                            } else {
                                if (Array.isArray(valor) && valor.length) {
                                    // resp['valor'] = "+" + valor.join("+"); /*ENVIAR UM ARRAY COM ID DE OPÇÕES*/
                                    resp['valor'] = valor
                                } else {
                                    resp['valor'] = []
                                }

                                this.respostas[`${pergId}-${ord}`] = { valor: valor };
                            }

                        } else {
                            if (!valor || valor === 'undefined') {
                                return
                            } else {
                                resp['valor'] = valor;
                            }
                        }
                    } else {
                        return
                    }

                    request.formularioResposta.push(resp);
                });

                if (pergunta.condicoes) {

                    pergunta.condicoes.forEach(
                        (condicao, indiceCondicao) => {
                            let oCond = JSON.parse(condicao.resposta);

                            this.ordems[pergunta.formularioGrupo.id].forEach((ord) => {
                                if (
                                    this.respostas[`${pergId}-${ord}`].valor == oCond.valor && 
                                    (
                                        (condicao.perguntaFilho && condicao.perguntaFilho.id == grupoPergunta.pergunta.id) ||
                                        (condicao.grupoPerguntaFilho && condicao.grupoPerguntaFilho.id == grupoPergunta.pergunta.id)
                                    )
                                ) {

                                    let ordemPrincipal = this.pegarAOrdemDoElemento( pergunta, ordem );
                                    let objCondicao = ( condicao.perguntaFilho || condicao.grupoPerguntaFilho.pergunta );

                                    let objResp = {
                                        "pergunta": {
                                            "id": objCondicao.id
                                        },
                                        "perguntaDescricao": objCondicao.descricao,
                                        "ordem": this.getOrdemSalvar(ordemPrincipal, indiceCondicao+1),
                                        "ordemGrupo": ordem,
                                        "valor": valor
                                    }
                                    // this.formularioFilho ? this.getOrdemDependente(ordemElemento) : ordemElemento,

                                    if (objCondicao.tipo == "BOOLEAN") {
                                        if (!valor || valor === 'undefined') {
                                            return
                                        } else {

                                            if (objCondicao.tipo != "DATA") {
                                                objResp['valor'] = valor;
                                            } else {

                                                objResp['valor'] = valor.replace(/\//g, "");
                                            }


                                        }
                                    } else if (objCondicao.tipo == "SELECAO") {
                                        if (Array.isArray(valor) && valor.length) {
                                            // objResp['valor'] = "+" + valor.join("+"); /*ENVIAR UM ARRAY COM ID DE OPÇÕES*/
                                            objResp['valor'] = valor;
                                        } else {
                                            objResp['valor'] = []
                                        }
                                    }else if(objCondicao.tipo == "RADIO"){
                                        objResp['respostaOpcoes'] = [
                                            {
                                                id: valor
                                            }
                                        ]
                                    }
                                    
                                    request.formularioResposta.push(objResp);
                                }
                            });
                        }
                    );

                }
            });
        });

        if( grupoPergunta && grupoPergunta.condicoes ){
            grupoPergunta.condicoes.forEach(
                (respostas, indiceCondicao) => {
                    if (respostas.perguntaFilho && (respostas.perguntaFilho.id && respostas.perguntaFilho.id == grupoPergunta.pergunta.id)) {
                        let ordemPrincipal = this.pegarAOrdemDoElemento( grupoPergunta, ordem );
                        let objResp = {
                            "pergunta": {
                                "id": respostas.perguntaFilho.id
                            },
                            "perguntaDescricao": respostas.perguntaFilho.descricao,
                            "ordem": this.getOrdemSalvar(ordemPrincipal, indiceCondicao+1),
                            "ordemGrupo": ordem,
                            "valor": valor
                        }

                        if (respostas.perguntaFilho.tipo == "BOOLEAN") {
                            if (!valor || valor === 'undefined') {
                                return
                            } else {

                                if (respostas.perguntaFilho.tipo != "DATA") {
                                    objResp['valor'] = valor;
                                } else {

                                    objResp['valor'] = valor.replace(/\//g, "");
                                }
                            }

                        } else if (respostas.perguntaFilho.tipo == "SELECAO") {
                            if (Array.isArray(valor) && valor.length) {
                                // objResp['valor'] = "+" + valor.join("+"); /*ENVIAR UM ARRAY COM ID DE OPÇÕES*/
                                objResp['valor'] = valor
                            } else {
                                objResp['valor'] = []
                            }
                        }else if(respostas.perguntaFilho.tipo == "RADIO"){
                            objResp['respostaOpcoes'] = [
                                {
                                    id: valor
                                }
                            ]
                        }

                        request.formularioResposta.push(objResp);
                    }
                }
            );
        }

        request.formularioResposta = request.formularioResposta.filter((resposta) => {
            return (
                (
                    ( resposta.valor || (resposta.respostaOpcoes && resposta.respostaOpcoes.length) ) &&
                    (Array.isArray(resposta.valor) ? resposta.valor.length != 0 : true)
                ) || 
                resposta.valor == "" ||
                (
                    resposta.anexos &&
                    resposta.anexos[0] &&
                    resposta.anexos[0].arquivoBase64 &&
                    resposta.anexos[0].extensao &&
                    resposta.anexos[0].nome
                )
            );
        }).slice();

        request.formularioResposta = request.formularioResposta.map((resposta) => {
            if (resposta.valor && Array.isArray(resposta.valor)) {
                // resposta.valor = resposta.valor.join('+');  /*ENVIAR UM ARRAY COM ID DE OPÇÕES*/
                resposta.respostaOpcoes = [
                    {
                        id: resposta.valor[ resposta.valor.length - 1 ]
                    }
                ]
                // .map(
                //     (resposta) => {
                //         return {
                //             id: resposta
                //         }
                //     }
                // );
                delete resposta.valor;
            }


            return resposta;
        }).slice();

        Object.keys(this.respostasFuncao).forEach(
            (resposta) => {
                let objresposta = this.respostasFuncao[resposta];
                let objResp = {
                    "pergunta": {
                        "id": objresposta.pergunta
                    },
                    "perguntaDescricao": objresposta.perguntaDescricao,
                    "ordem": objresposta.ordem,
                    "ordemGrupo": ordem,
                    "valor": objresposta.valor
                }
                
                request.formularioResposta.push(objResp);
            }
        );

        this.pacienteDocumentoService.atualizar(this.id, request).subscribe(
            (status) => {
                console.log("salvaEvolucao")
                this.toastr.success("Resposta salva com sucesso");
                this.setSalvandoRespostas(false);
                this.cdr.markForCheck();
            }, (error) => {
                this.setSalvandoRespostas(false);
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    removePerguntaOpcao(idOpcao){
        this.serviceRespostaOpcao.deletarRespostaOpcao(this.id, idOpcao).subscribe(
            () => {
                console.warn("remove: " + idOpcao);
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        )
    }

    /* BLOCO EXECUÇÃO DE FÓRMULAS */
    execucaoFormulas(elems = undefined, retorno = false) {
        let elemVazio = false;
        let arrayElementos = elems || this.elems;
        
        if( arrayElementos && arrayElementos.length ){
            arrayElementos.forEach(
                (elem) => {
                    if (!!elem.elemFormula) {
                        elem.elemFormula.forEach(
                            (opcao, i) => {
                                if (opcao.length > 0) {
                                    let elemento: any = document.getElementById(opcao);

                                    if (elemento) {
                                        if (elemento.value == "") {
                                            elemVazio = true;
                                            elem.valor = "";
                                            elem.saida.valor = "";
                                        } else {
                                            elem.objParam[i]["valor"] = elemento.value;
                                        }
                                    } else {
                                        this.toastr.error("Pergunta " + elem.nome + " está com problemas na formula. Nome de campo " + opcao + " inexistente");
                                    }
                                }
                            }
                        )
                    }
                    if (!elemVazio) {
                        this.calculaResultado(elem);
                    }
                }
            )
        }

        if( retorno ){
            return this.respostasFuncao;
        }
    }

    concatenaElementosFormulaId(elemento, id){
        elemento.elemFormula.forEach(
            (elem, index) => {
                if( elem && elem.length ){
                    let arrayIdNome = elem.split('-');
                    if( arrayIdNome.length == 1 ){
                        elemento.elemFormula[index] = id+'-'+elem;
                    }else{
                        elemento.elemFormula[index] = id+'-'+arrayIdNome[1];
                    }
                }
            }
        )

        return elemento;
    }

    calculaResultado(elem) {
        try {
            let formula = elem.mascara;
            for (let e = 0; e < elem.objParam.length; e++) {
                let valor = (elem.objParam[e]["valor"]) ? elem.objParam[e]["valor"].split(' ')[0] : elem.objParam[e]["valor"];
                formula = formula.replace(elem.objParam[e]["nome"], valor);
            }
            formula = formula.replace(/\,/g, ".");


            if (elem.opEspecial)
                formula = this.validaExpressaoEspecial(formula);

            let resultadoFinal = (formula) ? eval(formula).toFixed(1).replace(/.0$/, "") : 'Sem resultado';

            let score;
            if (elem.opcoes.length > 0) {
                score = Object.getPrototypeOf(elem).validaScores(elem.opcoes, resultadoFinal);
                (score != undefined) ? elem.resultScore = score : elem.resultScore = "";
            }

            elem.valor = resultadoFinal;
            elem.saida.valor = resultadoFinal;

            this.salvaRespostaFuncao(elem, resultadoFinal);
            
            if ((resultadoFinal == "") || (resultadoFinal == undefined)) {
                elem.mostraScore = false;
            }
        } catch (e) {
            console.error(e);
        }
    }

    salvaRespostaFuncao(perguntaFuncao, resultadoFinal){

        let objPergunta = (perguntaFuncao.grupoPergunta.pergunta || perguntaFuncao.grupoPergunta);
        let respId = `${objPergunta.id}-${perguntaFuncao.ordemPergunta}`;
        if( this.respostasFuncao && this.respostasFuncao[respId] ){
            
        }else{
            this.respostasFuncao[respId] = new Object();
        }
        
        let ordemPergunta = this.pegarAOrdemDoElemento( { pergunta: objPergunta }, perguntaFuncao.ordemPergunta );
        let ordemPad;
        if( ordemPergunta ){
            ordemPad = this.getOrdemSalvar( ordemPergunta );
        }
        this.respostasFuncao[respId] = {
            valor: resultadoFinal,
            pergunta: objPergunta.id,
            perguntaDescricao: objPergunta.descricao,
            ordem: ordemPad || ''
        }
    }

    validaExpressaoEspecial(formula) {

        // let preFormula = formula.match(/\([\w|\^|\.|\,]*\)/g);      
        let preFormula = this.localizar_grupos_formula(formula);

        for (let e = 0; e < preFormula.length; e++) {

            if (preFormula[e].match(/\^/g)) {
                let elementos = preFormula[e].replace(/\(|\)/g, "").replace(/\,/g, ".").split("^");

                let resultado = Math.pow(eval(elementos[0]), eval(elementos[1]))

                formula = formula.replace(preFormula[e], resultado);
            }
        }

        return formula;
    }

    // PERMITE SOMENTE 1 FUNÇÃO DE POTÊNCIA NA FORMULA
    // MELHORAR PARA PERMITIR VARIAS
    localizar_grupos_formula(texto) {
        let grupos = new Array();
        let i = 0;

        let stringArray = texto.split("");
        let sizeMax = stringArray.length;

        let posPotencia = texto.indexOf("^");
        let ultimaPosGrupo;
        for (let l = posPotencia; l <= sizeMax; l++) {
            if (texto.charAt(l) == ")") {
                ultimaPosGrupo = l;
                break;
            }
        }

        let primeiraPosGrupo;
        for (let l = posPotencia; l >= 0; l--) {
            if (texto.charAt(l) == "(") {
                primeiraPosGrupo = l;
                break;
            }
        }

        let arrayGrupo = texto.substring(primeiraPosGrupo, ultimaPosGrupo).split("^");
        let grupo = texto.substring(primeiraPosGrupo + 1, ultimaPosGrupo);

        grupos.push(grupo);

        return grupos;
    }

    solicitacaoMedica(internacao = false){
        this.atendimentoFormulario.adicionarExame(internacao, this.atendimento);
    }

    @ViewChild("bodyModalEncaminhamento", {read: TemplateRef}) bodyModalEncaminhamento: QueryList<TemplateRef<any>>;
    @ViewChild("botoesModalEncaminhamento", {read: TemplateRef}) botoesModalEncaminhamento: QueryList<TemplateRef<any>>;
    
    modalEncaminhamento;
    realizarEncaminhamento(){
        let cfgGlobal:any = Object.assign(NgbdModalContent.getCfgGlobal(), {size: 'lg'});
        
        this.modalEncaminhamento = this.modalService.open(NgbdModalContent, cfgGlobal );
        this.modalEncaminhamento.componentInstance.modalHeader = `Encaminhar Paciente`;

        this.modalEncaminhamento.componentInstance.templateRefBody = this.bodyModalEncaminhamento;
        this.modalEncaminhamento.componentInstance.templateBotoes = this.botoesModalEncaminhamento;

        let fnSuccess = (agendamentoGrupoResposta) => {
            console.log("Modal Fechada!"); 
        };
        let fnError = (erro) => { console.log("Modal Fechada!"); };
        this.modalEncaminhamento.result.then((data) => fnSuccess, fnError);
    }

    idAbaPrescricao
    usoContinuo = false;
    profissional;
    profissionalPrescricaoSelecionado;
    transcricao = false;
    unidadeSelecionada = Sessao.getIdUnidade();
    novaPrescricao() {
        this.prescricaoItem = [];

        if( !this.unidadeSelecionada ){
            this.toastr.warning("Informe o local onde o paciente será medicado");
            return;
        }

        if( this.transcricao && !this.profissional ){
            this.toastr.warning("Transcrição deve ter um profissional selecionado");
            return;
        }

        if( this.transcricao && !this.arquivo ){
            this.toastr.warning("Transcrição deve ter o anexo da prescrição médica");
            return;
        }

        let param = {
            data : moment().format(this.formatosDeDatas.dataHoraSegundoFormato),
            usuario: {
                guid: Sessao.getUsuario()['guid']
            },
            unidadeAtendimento: { 
                id : this.unidadeSelecionada
            },
            paciente: {
                id: this.pacienteId
            },
            atendimento: {
                id: this.atendimento ? this.atendimento.id : undefined
            },
            usoContinuo: this.usoContinuo,
            transcricao: this.transcricao
        }

        if( this.transcricao ){
            param['profissional'] = this.profissional;
        }

        if (!this.atendimento) {
            delete param.atendimento;
        }

        // TODO
        // Perguntas chapadas por enquanto //
        // (2462, 2502) => (CIP e CIAP) //
            for (var key in this.respostas) {
                let pergunta = key.split("-");

                if (pergunta[0] == '2462' && this.respostas[key].valor) {
                    let resposta = this.respostas[key].valor.split(" - ");

                    this.serviceCid.getCidLike(resposta[1]).subscribe(
                        (retorno) => {
                            let request = {idCid: retorno[0].id, idUnidadeAtendimento: this.unidadeSelecionada}

                            this.serviceModeloDiagnostico.getModeloDiagnostico(request).subscribe(
                                (retorno) => {
                                    retorno.dados.forEach(diagnostico => {

                                        this.serviceModelos.get( {id: diagnostico.modelo.id} ).subscribe(
                                            (retorno) => {
                                                retorno.dados.forEach(modelo => {

                                                    modelo.itens.forEach(item => {
                                                        item.prescricaoItem.dias = 1;

                                                        this.prescricaoItem.unshift(item.prescricaoItem);
                                                    });
                                                });
                                            }, (erro) => {
                                                Servidor.verificaErro(erro, this.toastr);
                                                this.cdr.markForCheck();
                                            }
                                        );
                                    });
                                }, (erro) => {
                                    Servidor.verificaErro(erro, this.toastr);
                                    this.cdr.markForCheck();
                                }
                            );
                        }, (erro) => {
                            Servidor.verificaErro(erro, this.toastr);
                            this.cdr.markForCheck();
                        }
                    );
                }

                if (pergunta[0] == '2502' && this.respostas[key].valor) {
                    let resposta = this.respostas[key].valor.split(" - ");

                    this.serviceCiap.get({like:resposta[0]}).subscribe(
                        (retorno) => {
                            let request = {idCiap: retorno.dados[0].id, idUnidadeAtendimento: this.unidadeSelecionada}

                            this.serviceModeloDiagnostico.getModeloDiagnostico(request).subscribe(
                                (retorno) => {
                                    retorno.dados.forEach(diagnostico => {

                                        this.serviceModelos.get( {id: diagnostico.modelo.id} ).subscribe(
                                            (retorno) => {
                                                retorno.dados.forEach(modelo => {

                                                    modelo.itens.forEach(item => {
                                                        item.prescricaoItem.dias = 1;
                                                        item.prescricaoItem.unidade = this.unidadeSelecionada;

                                                        this.prescricaoItem.unshift(item.prescricaoItem);
                                                    });
                                                });
                                            }, (erro) => {
                                                Servidor.verificaErro(erro, this.toastr);
                                                this.cdr.markForCheck();
                                            }
                                        );
                                    });
                                }, (erro) => {
                                    Servidor.verificaErro(erro, this.toastr);
                                    this.cdr.markForCheck();
                                }
                            );
                        }, (erro) => {
                            Servidor.verificaErro(erro, this.toastr);
                            this.cdr.markForCheck();
                        }
                    );
                }
            }
        // Fim do codigo chapado


        if( this.transcricao  ){
            console.log(this.arquivo);
            
            this.serviceUtil.postArquivo(this.arquivo).subscribe(
                (arquivoId) => {
                    param['arquivo'] = {
                        id: arquivoId
                    }
                    this.salvarPrescricaoMedica(param);
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                    return;
                }
            );
        }else{
            this.salvarPrescricaoMedica(param);
        }
    }

    instanciaPrescricoes;
    instanciaUsoContinuo;
    retornoPrescricao(novaPrescricao){

        // Perguntas chapadas por enquanto //
        // (2462, 2502) => (CIP e CIAP) //
            for (var key in this.respostas) {
                let pergunta = key.split("-");

                if (pergunta[0] == '2462' && this.respostas[key].valor) {
                    let resposta = this.respostas[key].valor.split(" - ");

                    this.serviceCid.getCidLike(resposta[1]).subscribe(
                        (retorno) => {
                            let request = {idCid: retorno[0].id, idUnidadeAtendimento: this.unidadeSelecionada}

                            this.serviceModeloDiagnostico.getModeloDiagnostico(request).subscribe(
                                (retorno) => {
                                    retorno.dados.forEach(diagnostico => {

                                        this.serviceModelos.get( {id: diagnostico.modelo.id} ).subscribe(
                                            (retorno) => {
                                                retorno.dados.forEach(modelo => {

                                                    modelo.itens.forEach(item => {
                                                        item.prescricaoItem.dias = 1;

                                                        this.prescricaoItem.unshift(item.prescricaoItem);
                                                    });
                                                });
                                            }, (erro) => {
                                                Servidor.verificaErro(erro, this.toastr);
                                                this.cdr.markForCheck();
                                            }
                                        );
                                    });
                                }, (erro) => {
                                    Servidor.verificaErro(erro, this.toastr);
                                    this.cdr.markForCheck();
                                }
                            );
                        }, (erro) => {
                            Servidor.verificaErro(erro, this.toastr);
                            this.cdr.markForCheck();
                        }
                    );
                }

                if (pergunta[0] == '2502' && this.respostas[key].valor) {
                    let resposta = this.respostas[key].valor.split(" - ");

                    this.serviceCiap.get({like:resposta[0]}).subscribe(
                        (retorno) => {
                            let request = {idCiap: retorno.dados[0].id, idUnidadeAtendimento: this.unidadeSelecionada}

                            this.serviceModeloDiagnostico.getModeloDiagnostico(request).subscribe(
                                (retorno) => {
                                    retorno.dados.forEach(diagnostico => {

                                        this.serviceModelos.get( {id: diagnostico.modelo.id} ).subscribe(
                                            (retorno) => {
                                                retorno.dados.forEach(modelo => {

                                                    modelo.itens.forEach(item => {
                                                        item.prescricaoItem.dias = 1;
                                                        item.prescricaoItem.unidade = this.unidadeSelecionada;

                                                        this.prescricaoItem.unshift(item.prescricaoItem);
                                                    });
                                                });
                                            }, (erro) => {
                                                Servidor.verificaErro(erro, this.toastr);
                                                this.cdr.markForCheck();
                                            }
                                        );
                                    });
                                }, (erro) => {
                                    Servidor.verificaErro(erro, this.toastr);
                                    this.cdr.markForCheck();
                                }
                            );
                        }, (erro) => {
                            Servidor.verificaErro(erro, this.toastr);
                            this.cdr.markForCheck();
                        }
                    );
                }
            }
        // Fim do codigo chapado

        if( novaPrescricao.usoContinuo ){
            this.prescricoesUsoContinuo = this.prescricoesUsoContinuo.concat( [], [novaPrescricao.id] );
        }else{
            this.novasPrescricoes = this.novasPrescricoes.concat( [], [novaPrescricao.id] );
        }
    }

    salvarPrescricaoMedica(param){

        this.servicePacientePrescricao.salvar(param).subscribe(
            (retorno) => {
                let tipo = this.transcricao ? 'Transcrição' : 'Prescrição';
                this.toastr.success( tipo + ' criada com sucesso' );
                // this.buscaPrescricoesAtendimento();
                this.usoContinuo = false;
                this.transcricao = false;
                this.profissional = undefined;
                this.profissionalPrescricaoSelecionado = '';
                this.idAbaPrescricao = retorno;
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );
    }

    arquivo;
    enviarAnexo(anexo) {
        this.arquivo = anexo;
    }

    anexaArquivo(anexo){
        if( !anexo )
            this.arquivo = undefined
    }

    abrirAnexo(ev, id) {
        ev.stopPropagation();
        ev.preventDefault();

        window.open(this.serviceUtil.getArquivo(id, true), '_blank');
    }

    validaRespostasModoOffline(){
        this.evolucao.formularioResposta = [];
    }

    replace(string){
        string = string.replace(/ /g, "");
        string = string.replace(/\//, "");
        return string;
    }

    objEncaminhamento = new Object();
    arrayEncaminhamentos = [{}];
    objEspecialidades
    fnCfgEspecialidadeRemote(term) {
        return this.serviceEspecialidade.getEspecialidadeLike(term, 0, 10).subscribe(
            (retorno)=>{
                this.objEspecialidades = retorno.dados || retorno;
            }
        );
    }

    especialidadeSelecionada;
    getEspecialidade(especialidade, encaminhamento) {
        encaminhamento.especialidadeSelecionada = especialidade.descricao;
        encaminhamento['especialidade'] = {
            id : especialidade.id
        }
    }

    validaTipoCondicao(condicao){
        return ( condicao.perguntaFilho ) ? 'PERGUNTA(FORMULARIO)' /*'PERGUNTA(GLOBAL)'**/ : ( ( condicao.grupoPerguntaFilho ) ? 'PERGUNTA(FORMULARIO)' : 'FORMULARIO DP');
    }

    validaDependente(condicao){
        return ( condicao.perguntaFilho ) ? condicao.perguntaFilho.descricao : ( ( condicao.grupoPerguntaFilho ) ? condicao.grupoPerguntaFilho.pergunta.descricao : condicao.formularioFilho.descricao );
    }

    getObservacao(observacao,encaminhamento){
        encaminhamento.observacao = observacao
    }

    validaDesabilitar(encaminhamento){
        return !encaminhamento.observacao || !encaminhamento.especialidade
    }

    naoPreencheuUltimoEncaminhamento = true;
    novoEncaminhamento(){
        
        let encaminhamento = this.arrayEncaminhamentos[ this.arrayEncaminhamentos.length-1 ];

        if( !this.pacienteId && !this.atendimento ){
            this.toastr.error("Nao há paciente");
            return;
        }

        let params = {
            paciente: {
                id: (!this.atendimento) ? this.pacienteId : (this.atendimento.paciente) ? this.atendimento.paciente.id : 0
            }
        }
        let request = Object.assign(params, encaminhamento)
        delete request['especialidadeSelecionada'];
        
        this.encaminhamentoService.post( request ).subscribe(
            (retorno) => {
                this.toastr.success("Encaminhamento criado com sucesso");
                this.arrayEncaminhamentos.push( {} );
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr)
            }
        )

    }

    pegaOrdemPrincipalFormulario( grupoPergunta, ordem ){        
        return (this.eDependente) ? this.ordemPrincipal +'.'+ this.pegarAOrdemDoElemento(grupoPergunta, ordem) : this.pegarAOrdemDoElemento(grupoPergunta, ordem);
    }

    pegarAOrdemDoElemento(grupoPergunta, ordem){
        let perguntasFormulario = jQuery('.formulario_evolucao entrada');
        // console.log(perguntasFormulario);

        let ordemRetornada = ordem;
        let identificador = '[data-identificador="'+this.id+''+grupoPergunta.pergunta.id+''+ordem+'"]';
        // console.log(identificador);
        
        let nodes = Array.prototype.slice.call( document.querySelectorAll('.formulario_evolucao entrada') );
        let element = document.querySelector(identificador);
        if( !(element && nodes && nodes.length) ){
            // O FORMULÁRIO AINDA NAO FOI CARREGADO AINDA
            return null;
        }
        ordemRetornada = nodes.indexOf( element.parentElement ) + 1;
        // console.log("Indice:  " + ordemRetornada);
        
        // for (let i = 0; i < perguntasFormulario.length; i++) {

        //     const element = jQuery(perguntasFormulario[i]).find( identificador );
        //     console.log(element);
        //     if( jQuery(element) && jQuery(element).length ){
        //         ordemRetornada = i;
        //         console.log("No FOR o indice e:  " + ordemRetornada);
        //         break;
        //     }
        // }

        return ordemRetornada;
    }

    getOrdemDependente( ordemAtual, indiceCondicao = null ){
        return this.ordemPrincipal+'.'+( indiceCondicao ? ( ordemAtual+'.'+indiceCondicao ) : ordemAtual );
    }

    getOrdemSalvar(ordemPrincipal, indiceCondicao = null){
        let ordemRetorno = (this.formularioFilho ? this.getOrdemDependente(ordemPrincipal, (indiceCondicao)) : ( indiceCondicao ? ( ordemPrincipal+'.'+indiceCondicao ) : ordemPrincipal )).toString();
        
        let arrayStrPad = ordemRetorno.split('.');
        let pad = '000';

        let ordemPadArray = [];
        arrayStrPad.forEach( (nr) => {
            ordemPadArray.push(pad.substring(0, pad.length - nr.length) + nr);
        } )

        return ordemPadArray.join('.');
    }
}