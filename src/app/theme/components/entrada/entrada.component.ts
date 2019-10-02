import { Component, ViewChild, Input, ChangeDetectorRef, Output, EventEmitter, ElementRef, OnInit, HostListener, OnChanges } from '@angular/core';

import { ToastrService } from 'ngx-toastr';

import { UtilService, Servidor } from 'app/services';

import { FormatosData } from 'app/theme/components';

import * as jQuery from 'jquery';

import * as moment from 'moment';
moment.locale('pt-br');

@Component({
    selector: 'entrada',
    templateUrl: './entrada.html',
    styleUrls: ['./entrada.scss'],

})
export class Entrada implements OnInit, OnChanges {
    @Input() bloqueado;
    @Input() completar: string = 'off';
    @Input() expressaoRegular;
    @Input() icone: string;
    @Input() posicaoIconeObjeto: string;
    @Input() tipoRetorno;
    @Input() id: string;
    @Input() incluirMascara;
    @Input() grupoPergunta;
    @Input() somenteVisualizacao = false;
    @Input() ordemPergunta;
    @Input() mascara: string;
    @Input() retornarObjetoFull = false;
    @Input() maximo: number;
    @Input() minimo: number;
    @Input() nome: string;
    @Input() consultaNomeLike = false;
    @Input() objId: string;
    @Input() attrDsc: string;
    @Input() fnAttrDsc: Function;
    @Input() opcional: boolean = false;
    @Input() opcoes;
    @Input() multiple = false;
    @Input() qtdRows;
    @Input() semData = false;
    @Input() qtdCols;
    @Input() range: boolean = false;
    @Input() urlParam;
    @Input() naoValidaScore = true;
    @Input() noLabels = false;
    @Input() searchFilter = false;
    @Input() copyToClipboard;
    @Input() readonly = false;
    @Input() classe;
    @Input() classeData;
    @Input() classeHora;
    @Input() mostraData = true;
    @Input() horaComSegundos = false;
    @Input() identificador: string

    @Input() tabela;
    @Input() tabelaCampos;

    @Input() requerido = false;
    @Input() salvarMascara = false;
    @Input() semTitulo = false;
    @Input() tamanho: string;
    @Input() tamanhoMaximo: number;
    @Input() tema: string = "";
    @Input() temaEntrada: string = "";
    @Input() opcaoZeroLabel;
    @Input() tipo: string = 'text';
    @Input() hora = false;
    @Input() formatoData;
    @Input() valor;
    @Input() valorRange;
    @Input() mostraOpcaoEmBranco = false;
    @Input() opcoesBoolean = true;
    @Input() mostraScore: boolean = true;

    @Input() fnOnChange: Function;
    @Input() fnRemoveCheckbox: Function;
    @Input() editorConfig: {};

    @Input() itemList = [];
    @Input() selectedItems = [];
    @Input() multiFiltro = true;

    @Input() objMultiselect = [];

    bkpFormula = this.mascara;
    bkpMask: any;
    mascaraGlobal = false;
    checks: any;
    classeDiv: string;
    elemFormula: any;
    objFiltroTabela = [];
    objTabela = new Object();
    mascaraValida: boolean;
    objParam = [];
    onTouched: any;
    opEspecial: boolean = false;
    parametros: any;
    resultScore: string;
    saida: Saida = new Saida();
    type: string;
    valorSimples: any;
    valorMostrar;
    objValor = new Object();
    previews = [];
    instancia;
    formatosDeDatas = new FormatosData();
    mascaraInicial = 1;

    settingsMultiselect = {}

    match = false;
    @Output() getValor = new EventEmitter();
    @ViewChild("divParams", { read: ElementRef }) divParams: ElementRef;

    constructor(
        private serviceEntrada: UtilService,
        private ref: ChangeDetectorRef,
        private toastr: ToastrService,

    ) {
        this.toastr.toastrConfig.preventDuplicates = true;
    }

    @HostListener('change', ['$event'])
    @HostListener('keyup', ['$event'])
    alterouValor($event: any) {

        if (this.retornarObjetoFull && this.opcoes) {
            let oValor = this.opcoes.filter((op) => {
                let id = this.objId ? op[this.objId] : op.id;

                return id == this.valor
            })[0];

            this.getValor.emit(oValor);
            return;
        }

        if ($event && $event.target && $event.target.classList.contains('range')) {
            console.log($event.target.classList.contains('range'));
        }
        if (this.mascara && this.valorRange && !(this.tipo == "FUNCAO") && $event && $event.target && $event.target.classList.contains('range')) {
            this.gerarMascara($event, 'Range');

        } else if (this.mascara && this.valor && this.tipo != "FUNCAO") {
            if (this.mascara.indexOf('/g') >= 0) {
                // if( !this.expressaoRegular ){
                this.tamanhoMaximo = undefined;
                this.expressaoRegular = this.converteParaExpressaoRegularValida();
                // }
            } else {
                this.tamanhoMaximo = this.mascara.length;

                this.gerarMascara($event);
            }

        } else {
            if (this.bkpMask !== undefined) this.mascara = this.bkpMask;
            this.valorSimples = this.valor;
        }

        if (this.tipo == "FUNCAO" && this.valor == "") {
            this.resultScore = "";
        }

        if (this.tipo == "TABELA") {
            this.minimo = 2;
        }

        if (this.tipo == 'multiselect' || this.tipo == 'datepicker' || this.tipo == 'estrela') {
            return;
        }

        if (this.incluirMascara === true) {
            this.saida.valor = this.valor;
        } else {
            if (this.expressaoRegular && this.mascara && this.valor) {
                this.saida.valor = this.valor;
            } else {
                this.saida.valor = this.valorSimples;
            }
        }

        this.validar();

        if (this.valor && this.mascara) {
            if (this.valor[this.valor.length - 1] == ',' || this.valor[this.valor.length - 1] == '.' || this.valor[this.valor.length - 1] == ', ' || this.valor[this.valor.length - 1] == '. ') {
                this.valor = this.valor.replace(/\,/g, '').replace(/\./g, '');
            }
        }

        if (this.valor && this.expressaoRegular && !this.saida.valido) {
            if (this.classeDiv && this.classeDiv.indexOf('erro_mascara') == -1) {
                this.classeDiv = this.classeDiv + ' erro_mascara';
                this.toastr.warning(`Informe um valor correto para ${this.nome}`);
            }
        } else {
            if (this.classeDiv) {
                this.classeDiv = this.classeDiv.replace(/erro_mascara/g, '');
            }

            if (this.mascaraGlobal) {
                if (this.incluirMascara) {
                    this.getValor.emit(this.saida);
                } else {
                    if (this.mascara && this.saida.valor) {
                        this.saida.valor = this.saida.valor.replace(this.mascara.split('?')[this.mascaraInicial], '');
                        this.getValor.emit(this.saida);
                    } else {
                        this.getValor.emit(this.saida);
                    }
                }
            }

            this.getValor.emit(this.saida);
        }
    }

    gerarMascara($event, range = '') {
        let valor;
        let tecla;
        let backspace = 8;

        if ($event) {
            valor = $event.target.value.replace(/\D/g, '');
            tecla = $event.keyCode;

            if (this.mascaraGlobal) {

                if (tecla === backspace) {
                    // Caso precise de alguma validação
                } else {

                    if ($event.key && $event.key.length == 1) {
                        let valor = this.valor.toString().replace(this.mascara.split('?')[this.mascaraInicial], '');
                        if (this.valor.indexOf(this.mascara.split('?')[this.mascaraInicial]) > -1) {
                            valor += $event.key
                        }
                        this.valorSimples = valor;
                        this.valor = valor + this.mascara.split('?')[this.mascaraInicial];
                    }
                }

                return;
            }

        } else {

            if (this.mascaraGlobal) {
                if (this.valor && this.mascara) {
                    let valor = this.valor.toString().replace(this.mascara.split('?')[this.mascaraInicial], '')
                    this.valorSimples = valor;
                    this.valor = valor + this.mascara.split('?')[this.mascaraInicial];
                }

                return;
            }

            valor = this[`valor${range}`].toString().replace(/\D/g, '');
        }

        let pad = this.mascara.replace(/\D/g, '').replace(/9/g, '_');

        let valorMascara = valor + pad.substring(0, pad.length - valor.length);

        let obgTotal = this.mascara.split('').reduce((a, b, c) => b === "9" ? a.concat(c) : a, []).length;
        let obgRestantes = valorMascara.split('').reduce((a, b, c) => b === "_" ? a.concat(c) : a, []).length;

        if ((obgRestantes == 0) && (obgTotal < valorMascara.length)) {
            this.mascaraValida = true;
            this.mascara = this.mascara.replace("#", "9");
            let pad = this.mascara.replace(/\D/g, '').replace(/9/g, '_');
            let valorMascara = valor + pad.substring(0, pad.length - valor.length);
        } else {
            this.mascaraValida = true;
        }

        if (tecla === backspace) {
            this.valorSimples = valor;
            return;
        }

        if (valor.length <= pad.length) {
            this.valorSimples = valor;
        }

        let valorMaskPos = 0;
        valor = '';
        for (let i = 0; i < this.mascara.length; i++) {
            if (isNaN(parseInt(this.mascara.charAt(i)))) {
                valor += this.mascara.charAt(i);
            } else {
                valor += valorMascara[valorMaskPos++];
            }
        }

        if (valor.indexOf('_') > -1) {
            valor = valor.substr(0, valor.indexOf('_'));
        }

        //$event.target.value = valor;
        this[`valor${range}`] = valor.replace(/#/g, "");
    }

    @HostListener('blur', ['$event'])
    onBlur($event: any) {
        if ($event.target.value.length === this.mascara.length) {
            return;
        }

        this.valorSimples('');
        $event.target.value = '';
    }

    @HostListener('blur', ['$event'])
    salvaEdicao(innerHeight) {
        this.getValor.emit(innerHeight);
        this.fnOnChange(innerHeight);
    }

    ordemReplace;
    ngOnInit() {
        if (this.tipo == 'EDICAO') {
            $("input#" + this.id).hide();
        }

        if (this.mascara) {
            if (this.mascara.indexOf('?') < 0) {
                this.bkpMask = this.mascara;
            } else if (this.mascara.indexOf('?') == 0) {
                this.mascaraInicial = 0;
                this.bkpMask = this.mascara;
            } else {
                this.mascaraGlobal = true;
                this.mascaraInicial = 1;
            }
        }

        if (this.tipo == 'datepicker') {

            if (!this.formatoData) {
                this.formatoData = this.formatosDeDatas.dataFormato;
            }

            if (this.valor && !this.semData) {
                if (this.mostraData) {
                    let hora = moment(this.valor, this.formatosDeDatas.dataHoraSegundoFormato).format(this.formatosDeDatas.horaFormato);
                    this.valorHora = hora;
                } else {
                    this.valorHora = moment(this.valor, this.formatosDeDatas.horaFormato).format(this.formatosDeDatas.horaFormato);
                }

                if (this.mostraData) {
                    this.valorData = moment(this.valor, this.formatosDeDatas.dataHoraSegundoFormato).format(this.formatosDeDatas.dataFormato);
                }

                this.saida.valor = moment(this.valor, this.formatosDeDatas.dataHoraSegundoFormato).format( this.hora ? this.formatosDeDatas.dataHoraSegundoFormato : this.formatoData );
                this.saida.valido = true;
                this.getValor.emit( this.saida );
            }
        }

        if (this.valor == "hora") {
            this.valorHora = this.getHoraValor();
        }

        this.processarTipo();
        this.selecionaClasse();
    }

    ngAfterViewInit() {
        if (!this.valor && this.type == 'select') {
            this.valor = (this.tipo == "simnao") ? this.valor : '0';
        }

        if ((this.tipo == "FUNCAO") && (this.valor != undefined)) {
            this.resultScore = this.validaScores(this.opcoes, this.valor);
        }

        if (this.tipo == 'UPLOAD' && this.valor) {
            try {
                let oUpload = JSON.parse(this.valor);
                let nomeArquivo = oUpload.valor;
                let arquivo = oUpload.anexos[0].arquivoBase64;

                this.criaArquivo(nomeArquivo, arquivo);
            }
            catch (err) {
                console.error(err.message);
            }
        }

        if (this.tipo == 'DESENHO' && this.valor) {
            try {
                let oUpload = JSON.parse(this.valor);
                let nomeArquivo = oUpload.valor;
                let arquivo = oUpload.anexos[0].arquivoBase64;
                //this.fnOnChange(arquivo);
                this.instancia.carregaImagem(arquivo)
            }
            catch (err) {
                console.error(err.message);
            }
        }

        if (this.tipo == 'EDICAO') {
            $("input#" + this.id).hide();
        }

        this.saida.valor = this.valor;

        if (!this.id && this.nome) {
            this.id = this.nome.replace(/ /g, "");
            this.id = this.id.replace(/\//, "");
        }

        setTimeout(() => {
            this.getCheckeds();
        }, 2000);
    }

    ngAfterViewChecked() {
        if( this.ordemPergunta ){
            this.ordemReplace = this.ordemPergunta.toString().replace('.', '');
        }
        this.getCheckeds();
    }

    getInstancia(instancia) {
        this.instancia = instancia;
    }

    getCheckeds() {
        if (this.valor && this.valor.length && this.type == 'selecao') {

            let checkeds = this.valor;
            if (!Array.isArray(this.valor)) {
                checkeds = this.valor.split("+");
            }

            checkeds.forEach(
                (check) => {
                    if (check) {
                        let input = jQuery(`.ordem${this.ordemReplace} .${check}`);
                        setTimeout(function () {
                            input.prop('checked', true);
                            jQuery(".somente-visualizacao .selecao input:not(:checked)").parent('.opcoes').addClass("some")
                            input.parent('.opcoes').removeClass('some');
                        }, 500);
                    }
                }
            )
        }
    }

    processarTipo() {
        if (this.tipo)
            switch (this.tipo.toLowerCase()) {
                case ('senha'):
                    this.type = 'password';
                    break;
                case ('datepicker'):
                    this.type = "datepicker";
                    break;
                case ('estrela'):
                    this.type = "estrela";
                    this.maximo = 5;
                    break;
                case ('data'):
                    this.mascara = '99/99/9999';
                    this.tamanhoMaximo = 10;
                    break;
                case ('datahora'):
                    this.mascara = '99/99/9999 99:99:99';
                    this.tamanhoMaximo = 19;
                    break;
                case ('hora'):
                    this.expressaoRegular = /^[\d]{2}:[\d]{2}:[\d]{2}$/gi;
                    this.mascara = '99:99:99';
                    this.tamanhoMaximo = 8;
                    break;
                case ('telefone'):
                    this.mascara = '(99) 9999-9999';
                    this.tamanhoMaximo = 14;
                    break;
                case ('celular'):
                    this.mascara = '(99) 99999-9999';
                    this.tamanhoMaximo = 15;
                    break;
                case ('email'):
                    this.expressaoRegular = /^([\w.]+)(@)([\w]+)(\.([\w]+))+$/gi;
                    this.type = 'text';
                    break;
                case ('url'):
                    this.expressaoRegular = /[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/gi;
                    this.type = 'text';
                    break;
                case ('selecao'):
                    this.type = 'selecao';
                    break;
                case ('desenho'):
                    this.type = 'desenho';
                    break;
                case ('upload'):
                    this.type = 'upload';
                    break;
                case ('funcao'):
                    this.type = 'funcao';
                    this.retornaParametrosFormula(null);
                    break;
                case ('radioselect'):
                    this.type = 'radio';
                    break;
                case ('seleciona'):
                case ('radio'):
                    this.type = 'select';
                    break;
                case ('simnao'):
                case ('boolean'):
                    this.type = 'boolean';
                    if (this.opcoesBoolean) {
                        this.opcoes = [{ id: 'true', nome: 'Sim' }, { id: 'false', nome: 'Não' }];
                    } else {
                        this.opcoes = [{ id: '1', nome: 'Sim' }, { id: '0', nome: 'Não' }];
                    }
                    break;
                case ('area'):
                    this.type = 'area';
                    break;
                case ('numero'):
                    this.type = 'number';
                    break;
                case ('checkbox'):
                    this.type = 'checkbox';
                    break;
                case ('cid'):
                    this.type = 'entradaBuscar';
                    break;
                case ('multiselect'):
                    this.type = "multiselect";
                    this.settingsMultiselect = {
                        text: this.nome,
                        selectAllText: 'Todos',
                        unSelectAllText: 'Nenhum',
                        enableSearchFilter: (this.searchFilter) ? true : false,
                        badgeShowLimit: 1,
                        classes: "custom_multiselect_entrada" + (this.noLabels) ? ' no-labels' : ''
                    };

                    if (this.objMultiselect && this.objMultiselect.length) {
                        this.settingsMultiselect['primaryKey'] = this.objMultiselect[0];
                        this.settingsMultiselect['labelKey'] = this.objMultiselect[1];
                        this.settingsMultiselect['icone'] = this.posicaoIconeObjeto;
                    } else {
                        console.error("Nao há opcoes para label MULTISELECT");
                    }

                    if (this.selectedItems && this.selectedItems.length && this.multiFiltro) {
                        this.setItensSelected();
                    }

                    break;
                case ('tabela'):
                    this.semTitulo = true;
                    this.type = "tabela";
                    if (this.tabelaCampos) {
                        this.objTabela = (typeof this.tabelaCampos == "string") ? JSON.parse(this.tabelaCampos) : this.tabelaCampos;
                        this.objFiltroTabela = this.objTabela['filtroAdicional'].split(',');

                        if (this.valor) {

                            if (this.isJson(this.valor)) {
                                this.objValor = JSON.parse(this.valor);
                                this.valorMostrar = this.objValor[this.objFiltroTabela[0]];
                            } else {
                                this.valorMostrar = this.valor;
                            }

                        } else {
                            this.valorMostrar = '';
                        }

                    } else {
                        console.warn("Campo Autocomplete sem filtros. nome:" + this.nome);
                    }
                    break;
                case ('titulo'):
                    this.type = 'titulo';
                    break;
                case ('edicao'):
                    this.type = 'edicao';
                    this.editorConfig = {
                        editable: true,
                        spellcheck: true,
                        placeholder: this.nome,
                        translate: 'no',
                        height: 'auto',
                        minHeight: '80px',
                        width: 'auto',
                        minWidth: '300px',
                        enableToolbar: true,
                        showToolbar: true,
                        imageEndPoint: '',
                        toolbar: [
                            ['print'],
                            ['bold', 'italic', 'underline'],
                            ['justifyLeft', 'justifyCenter', 'justifyRight', 'justifyFull', 'indent', 'outdent'],
                            ['horizontalLine', 'orderedList', 'unorderedList'],
                            ['fontSize', 'color'],
                        ]
                    };
                    break;
                default:
                    this.type = 'text';
                    break;
            }
    }

    ngOnChanges(changes) {
        this.alterouValor(null);
    }

    click(input) {
        if (this.copyToClipboard) {
            input.select();
            document.execCommand('copy');
            // input.setSelectionRange(0, 0);

            this.toastr.success("Copiado para área de transferência");
        }
    }

    onChange(ev, check = false) {

        if (check) {
            // this.getValor.emit(ev);
            this.fnOnChange(ev);
            return;
        }

        if (ev.target.classList.contains('range-pai') && ev.target.value && ev.target.value != '' && ev.target.value != '0') {

            let rangePai = ev.target.parentElement.querySelector('.range-pai');
            let rangePaiValue = rangePai.value;
            let range = ev.target.parentElement.querySelector('.range');
            let rangeValue = range.value;
            let valor = `${rangePaiValue}~${rangeValue}`;

            this.getValor.emit(valor);
            if (this.fnOnChange) {
                this.fnOnChange(valor);
            }
        } else if ((this.fnOnChange && ev.target.value && ev.target.value != '' && ((this.tipo == 'seleciona' && ev.target.value != '0') || (this.tipo != 'seleciona'))) || (this.fnOnChange && this.type == 'boolean' && ev.target.value && ev.target.value != "undefined")) {

            if (this.expressaoRegular) {
                if (this.saida && this.saida.valido) {
                    if (this.tipoRetorno == 'mm') {
                        this.validaTipoRetorno(ev.target.value)
                        this.fnOnChange(this.saida['valorSimples']);
                    } else {
                        this.fnOnChange(ev.target.value);
                    }


                } else {
                    console.error("Erro na expressão regular");
                }
            } else {

                this.fnOnChange(ev.target.value);
            }
        }
    }

    onItemSelect(evento) {
        // this.valor = { valor: evento }
        this.saida.valor = this.setItensSelected(evento);
        this.getValor.emit(this.saida);
    }

    setItensSelected(evento = undefined) {
        this.selectedItems = (evento || this.selectedItems).map(
            (resposta) => {
                let obj = new Object();
                obj[this.objMultiselect[0]] = resposta[this.objMultiselect[0]] || resposta;
                return obj;
            }
        )

        return this.selectedItems;
    }

    salvaDesenho(base64Img) {
        this.fnOnChange(base64Img);
    }

    uploadArquivo(arquivos) {
        // var reader = new FileReader();
        var reader;
        var reader: any = new FileReader();
        reader.readAsBinaryString(arquivos[0]);
        let nomeArquivo = arquivos[0].name;

        reader.onload = () => {
            //this.arquivo = btoa(reader.result); 
            let arquivo = btoa(reader.result);
            this.fnOnChange(arquivo, nomeArquivo);
            this.criaArquivo(nomeArquivo, arquivo)
        };
        reader.onerror = () => {
            console.log('Erro ao carregar arquivo');
        };
    }

    criaArquivo(nomeArquivo, arquivo) {
        if (nomeArquivo.match(/\.png|\.jpg|\.jpeg/)) {
            var img = new Image(100, 100);
            img.src = `data:image/png;base64,${arquivo}`;
            img.classList.add('img-preview');
            document.getElementById('preview').innerHTML = '';
            document.getElementById('preview').appendChild(img);
        } else {
            let downloadLink = document.createElement("a");
            downloadLink.download = nomeArquivo;

            let uri = 'data:charset=utf-8;base64,' + arquivo
            downloadLink.href = uri;
            downloadLink.text = nomeArquivo;
            downloadLink.classList.add('download');

            document.getElementById('preview').appendChild(downloadLink);
        }
    }

    onChangeRange(ev) {
        if (ev.target.value && ev.target.value != '' && ev.target.value != '0') {
            let rangePai = ev.target.parentElement.querySelector('.range-pai');
            let rangePaiValue = rangePai.value;
            let range = ev.target.parentElement.querySelector('.range');
            let rangeValue = range.value;
            let valor = `${rangePaiValue}~${rangeValue}`;

            this.getValor.emit(valor);
            if (this.fnOnChange) {
                this.fnOnChange(valor);
            }
        }
    }

    onRateChange(rating: number = 0) {
        this.getValor.emit({ valido: true, valor: rating });
    }

    selecionaClasse() {
        if (this.icone) {
            this.classeDiv = 'input-group';
        } else {
            this.classeDiv = 'form-group';
        }
    }

    validar() {
        this.validaTipoRetorno();

        if (!this.saida.valor && this.opcional) {
            this.saida.valido = true;
            return;
        }
        if (this.saida.valor && !this.expressaoRegular) {
            this.saida.valido = true;
            return;
        }
        if ((this.saida.valor || this.valor) && this.expressaoRegular) {
            let valor = (this.valor || this.saida.valor);
            if (this.mascaraGlobal) {
                valor = this.valorSimples;
            }

            var expressaoRegular = new RegExp(this.expressaoRegular, 'g');
            this.saida.valido = expressaoRegular.test(valor);
            return;
        }
        if (this.mascaraValida && !this.opcional) {
            this.saida.valido = true;
            return;
        }

        this.saida.valido = false;
    }

    validaTipoRetorno(valor = undefined) {
        switch (this.tipoRetorno) {
            case "number":
                this.saida.valor = parseInt(this.saida.valor);
                break;
            case "mm":
                if (this.saida.valido) {
                    let minutos = (!valor) ? this.saida.valor : valor;
                    if (!isNaN(parseFloat(minutos)) && isFinite(minutos)) {
                        this.valorHora = this.getHoraValor(this.saida.valor);
                        this.saida.valor = this.getHoraValor(this.saida.valor);
                    }
                    this.saida['valorSimples'] = ((parseInt(minutos.slice(0, 2)) * 60) + parseInt(minutos.slice(3, 5)));
                }

                break;
            default:
                break;
        }
    }

    getCheckbox(evento) {

        let el = evento.target;
        if (el.checked) {
            if (this.valor != undefined && Array.isArray(this.valor)) {
                this.valor.push(el.id);
            } else {
                this.valor = [el.id];
            }

            this.onChange(this.valor, true);

        } else {

            if (!Array.isArray(this.valor)) {
                this.valor = [];
            } else {
                this.valor = this.valor.filter(
                    (checks) => {
                        return checks != el.id;
                    }
                )

                if (this.fnRemoveCheckbox) {
                    this.fnRemoveCheckbox(el.id);
                }
            }

        }

    }

    datepickerInstancia
    getDatepickerInstancia(instancia) {
        this.datepickerInstancia = instancia;
    }

    valorData = undefined;
    setDataValor(valor) {
        this.valorData = valor[0].format(this.formatosDeDatas.dataFormato);

        let valorDataEmit = valor[0].format(this.formatoData);
        let valorHora = '';
        if (this.hora) {
            valorHora = ' ' + this.valorHora;
        }
        this.saida.valor = ((valorDataEmit) + (valorHora)).trim();
        this.getValor.emit(this.saida);
    }

    valorHora = null;
    setHoraValor(hora = '00:00', evento) {
        console.log(hora)
        console.log(evento)
        this.valorHora = hora;
        let valorData = this.mostraData ? this.valorData + ' ' : ''

        this.saida.valor = valorData + this.valorHora;
        if (this.horaComSegundos && this.hora) {
            this.saida.valor += ':00';
        }

        if (this.tipoRetorno == "mm") {
            console.log(this.tipoRetorno);

            this.validaTipoRetorno();
            this.getValor.emit(this.saida);
            return;
        }

        this.getValor.emit(this.saida);
    }

    getHoraValor(hora = null) {
        let valor = parseInt(hora) || parseInt(this.valorHora);
        if (this.tipoRetorno == "mm") {
            let hora = valor / 3600;
            let minuto = (valor % 3600) / 60;
            return `${hora}:${minuto}:00`;
        }
        return valor;
    }

    retornaParametrosFormula(mascara) {
        if (this.mascara) {
            this.elemFormula = this.mascara.replace(/[0-9]|\)|\(/g, "").split(/[+/^*\-]/);
            this.opEspecial = (this.mascara.match(/\^/g) != null);

            for (let i = 0; i < this.elemFormula.length; i++) {
                if (this.elemFormula[i].length > 0) {
                    let objTemp = {
                        "nome": this.elemFormula[i],
                        "valor": ""
                    }
                    this.objParam.push(objTemp);
                }
            }
        }

        return this.objParam;

    }

    concatenaElementosFormulaId(elemento, id) {
        elemento.elemFormula.forEach(
            (elem, index) => {
                if (elem && elem.length) {
                    console.log("Ver pq ta concatenando 2 vezes");
                    elemento.elemFormula[index] = id + '-' + elem;
                }
            }
        )

        return elemento;
    }

    getParamFormula(evento) {

        var elementoFormula = jQuery(this.divParams.nativeElement.children["0"].children["0"].children[1].children);
        for (var e = 0; e < (elementoFormula.length); e++) {
            if (elementoFormula.eq(e).val() == "") {
                return;
            }
        }

        this.calculaResultado();
    }

    calculaResultado() {
        this.bkpFormula = this.mascara;

        for (var e = 0; e < this.objParam.length; e++) {
            this.bkpFormula = this.bkpFormula.replace(this.objParam[e]["nome"], this.objParam[e]["valor"]);
        }
        this.bkpFormula = this.bkpFormula.replace(/\,/g, ".");

        if (this.opEspecial) {
            this.bkpFormula = this.validaExpressaoEspecial(this.bkpFormula);
        }

        var resultadoFinal = eval(this.bkpFormula).toFixed(1).replace(/.0$/, "");
        this.valor = resultadoFinal;
        this.saida.valor = resultadoFinal;

        return resultadoFinal;
    }

    validaExpressaoEspecial(formula) {

        var preFormula = formula.match(/\([\w|\^|\.|\,]*\)/g);

        for (var e = 0; e < preFormula.length; e++) {

            if (preFormula[e].match(/\^/g)) {
                var elementos = preFormula[e].replace(/\(|\)/g, "").replace(/\,/g, ".").split("^");
                var resultado = Math.pow(elementos[0], elementos[1]);
                formula = formula.replace(preFormula[e], resultado);
            }

        }

        return formula;
    }

    validaScores(opcoes, result, retornaId = false) {
        if (!this.naoValidaScore) {
            var score;
            if (opcoes.length) {
                for (var o = 0; o < opcoes.length; o++) {
                    var arrayOpcao = opcoes[o]["descricao"].split("|");

                    var valida = arrayOpcao[0].replace(/X/g, result);

                    try {
                        if (eval(valida.trim())) {
                            score = (!retornaId) ? arrayOpcao[1].trim() : opcoes[o]['id'];
                        }
                    } catch (e) {
                        // console.error("Problema no retorno do valo: " + valida.trim());
                    }
                }
                return score;

            } else {
                console.warn("Nao ha opções para essa funcao:  nome: " + this.nome);
            }

            return undefined;
        }

        return undefined;

    }

    objRetorno;
    fnCfgEntradaRemote(term) {
        let search = this.objFiltroTabela[0];
        let filtroAdicional = this.objTabela['filtroAdicional'];

        if (term && term.match(/\d/g) && term.match(/\d/g).length) {
            this.objFiltroTabela.forEach(
                (filtro) => {
                    if ((filtro.indexOf('CODIGO') >= 0) || (filtro.indexOf("ID") >= 0) || (filtro.indexOf("GUID") >= 0) || (filtro.indexOf("CHAVE") >= 0) || (filtro.indexOf("CPF") >= 0) || (filtro.indexOf("NUMERO") >= 0)) {
                        search = filtro;
                        filtroAdicional = this.objFiltroTabela[0];
                    }
                }
            )
        }

        this.serviceEntrada.getUrlBuscaTabelaEntradaNomeLike(this.tabela, term, search, filtroAdicional).subscribe(
            (retorno) => {
                this.objRetorno = (retorno.dados) ? retorno.dados : retorno;
                this.ref.markForCheck();
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    getEntradaValorAutocomplete(obj) {
        if (obj) {
            let objResposta = { chave: (obj['ID'] || obj['CODIGO']) || (obj['GUID'] || obj['CPF'] || obj['CHAVE']) }
            objResposta[this.objFiltroTabela[0]] = obj[this.objFiltroTabela[0]] + ((this.objFiltroTabela.length == 2 && obj[this.objFiltroTabela[1]]) ? (' - ' + obj[this.objFiltroTabela[1]]) : '');

            this.valorMostrar = objResposta[this.objFiltroTabela[0]]
            // this.saida.valor = JSON.stringify( objResposta );  SALVA JSON COMO RESPOSTA
            this.saida.valor = this.valorMostrar;

            if (!this.retornarObjetoFull) {
                this.getValor.emit(this.saida);
                this.fnOnChange(this.valorMostrar);
            } else {
                this.getValor.emit(obj)
            }

        }
    }

    converteParaExpressaoRegularValida() {
        let regex = this.mascara.split(' ')[0].trim();

        regex = regex.replace(/\,/g, '\\,\?').replace(/\./g, '\\.\?');
        regex = regex.replace(/9/g, '([\\d]){0,}');
        regex = regex.replace('/g', '').substr(1);
        regex = `^${regex}$`;

        return regex;
    }

    isJson(str) {
        try {
            JSON.parse(str);
        } catch (e) {
            return false;
        }

        return true;
    }

    formataDescricaoOpcao(opcao, iOpcao) {

        if (opcao[this.attrDsc]) {
            return opcao[this.attrDsc];
        }

        if (this.fnAttrDsc) {
            return this.fnAttrDsc(opcao, iOpcao);
        }

        if (opcao.nome) {
            return opcao.nome;
        }

        if (opcao.descricao) {
            return opcao.descricao;
        }

        return ' -- ';
    }
}

export class Saida {
    valido: boolean = false;
    valor;
}