import { Component, ViewChild, Input, Output, ElementRef, EventEmitter, OnInit } from '@angular/core';
import {ReactiveFormsModule, FormControl, FormBuilder, FormsModule, FormGroup} from '@angular/forms';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';

@Component({
    selector: 'moldura',
    templateUrl: './moldura.html',
    styleUrls: ['./moldura.scss'],
    providers: [],
})
export class Moldura implements OnInit {
    @Input() titulo: String;
    @Input() registros: Number;
    @Input() selecionado: String;
    @Input() pesquisar;
    @Input() filtrar;
    @Input() pesquisarKeydown: Function;
    @Input() editar: Function;
    @Input() clear: Function;
    @Input() limparFiltros: Function;
    @Input() sub: boolean = false;
    @Input() oculto: boolean;
    @Input() podeOcultar: boolean;
    @Input() elementoAcoes;
    @Input() elementoAcoesTitulo;
    @Input() elementoAcoesContext;
    @Input() semDropdown= false;
    @Input() labelRegistros = 'registros';
    @Input() customFiltro;
    @Input() customAcoes;
    @Input() variavelLoagin;

    @Input() somenteTitulo: boolean = false;
    @Input() mostraPesquisar: boolean = true;
    @Input() mostraFiltrar: boolean = true;
    @Input() mostraInfo: boolean = false;

    searchField = new FormControl();

    jaDigitou = false;
    ngOnInit() {
        if (this.oculto) {
            this.podeOcultar = true;
        }

        let fnSearch = this.pesquisarKeydown ? this.pesquisarKeydown : this.pesquisar;

        this.searchField.valueChanges.pipe(
            debounceTime(1000))
            .pipe(distinctUntilChanged())
            .pipe(
                    map( term => {
                        if( (!this.jaDigitou && !!term) || ( this.jaDigitou ) ){
                            this.jaDigitou = true
                            fnSearch(term)
                        }
                    }
                )
            )
            .subscribe();        
            
    }

    fn = false;
    ngAfterViewChecked() {
        if (!this.fn) {
            let elem =  $('autocomplete .table_autocomplete');
            if( $(elem) ){
                $(elem).click( (ev)=>{
                    ev.stopPropagation();
                    ev.preventDefault();
                } )
            }
        }
    }

    hide = false;
    mostrarOcultarFiltros(ev, dropdown) {
        if( $(dropdown).hasClass('show') ){
            $("#filtro-campos").attr("aria-expanded","false");
            $(dropdown).removeClass("show");
            $("#fundo").attr("hidden","true");
            this.hide = true;
        }else{

            if( ev.target.id != 'fundo'){
                $("#filtro-campos").attr("aria-expanded","true");
                $(dropdown).addClass("show");
                $("#filtro-campos").addClass("show");
                $("#fundo").removeAttr("hidden");
                this.hide = false;
            }

        }
        
        $("#fundo").width($(".al-content").width());
        $("#fundo").height($(".al-content").height());
    }

    filtrarClick(searchInputValue) {        
        this.filtrar(searchInputValue);
        $("#filtro-campos").removeClass("show");
        $("#filtro-campos").attr("aria-expanded","false");
        $("#fundo").attr("hidden","true");
        this.hide = true;
    }

    pesquisaClick(texto) {
        if( !!texto ){
            ( this.pesquisarKeydown ) ? this.pesquisarKeydown(texto) : this.pesquisar(texto);
        }
    }

    clickTest(evento){
        evento.stopPropagation();
    }

    valorPesquisar = '';
    limparFiltrosAcao(searchInput) {
        $('#searchInput').val('');
        this.limparFiltros(false);
        this.pesquisar('');
    }

    abrir() {
        if (this.podeOcultar)
            this.oculto = !this.oculto;
    }

    formatRegistros() {
        let reg = parseInt(this.registros + '');
        return Math.floor(reg).toLocaleString();
    }
}