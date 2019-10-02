import { Component, HostListener, Input, OnChanges, Output, OnInit, EventEmitter, SimpleChanges, ViewChild } from '@angular/core';
import { LocalData } from 'ng2-completer';

@Component({
	selector: 'autocomplete',
	styleUrls: ['./autocomplete.scss'],
	templateUrl: './autocomplete.html',
})
export class Autocomplete implements OnInit, OnChanges {

	@Input() requerido;
	@Input() bloqueado;
	@Input() placeholder;
	@Input() valor: any = [];
	@Input() minimo;
	@Input() titulo;
	@Input() customElement;
	@Input() semTitulo = false;

	@Input() camposFiltro;
	@Input() fnCfgRemote;

	@Output() fnOnSelected = new EventEmitter();
	@Input() valorSelecionado;

	@Input() fnSearch;
	@Input() idFiltro;
	@Input() initialValue;
	@Input() disableInput;
	@Input() limitWidth;
	@Input() custom_class;

	@Input() dataField = "";
	@Input() fnOnSearch;

	@Output() searching = new EventEmitter();
	@Output() onKeyUp = new EventEmitter();
	@Output() onClear = new EventEmitter();

	@ViewChild("elementAutocomplete") elementAutocomplete;
	@ViewChild("inputAutocomplete") inputAutocomplete;

	protected searchStr: string;
	protected searchStrTemp: string;
	protected dataService: LocalData;
	protected selecionei;

	private selecionou;

	camposLabel = [];
	objFiltros = [];
	digitando;
	buscando = false;
	foco = false;
	fazBusca = true;

	constructor() {
		(!this.minimo) ? this.minimo = 5 : null;
	}

	@HostListener('document:click', ['$event.target'])
	public onClick(targetElement) {
		const clickedInside = this.elementAutocomplete.nativeElement.contains(targetElement);
		if (!clickedInside) {
			this.foco = false;
		}
	}

	ngOnInit() {
	}

	ngOnChanges(changes: SimpleChanges) {
		if (changes.valor && !changes.valor.firstChange) {
			this.buscando = false
		}
	}

	searchData() {
		if (!this.valorSelecionado) {
			this.onClear.emit();
		}

		this.onKeyUp.emit(this.valorSelecionado);
		clearTimeout(this.digitando);
		if (this.valorSelecionado) {
			if (this.valorSelecionado.length >= this.minimo && this.fazBusca) {
				this.buscando = true;
				this.digitando = setTimeout(() => {
					this.doneTyping();
				}, 1000);
			}
		}
	}

	doneTyping() {
		if (this.valorSelecionado.length >= this.minimo) {
			if (this.fnSearch) {
				this.fnSearch(this.valorSelecionado);
				this.foco = true;
			} else {
				this.filtraLocal();
				this.foco = true;
			}
		}
	}

	selectItem(ev, item) {
		this.selecionou = true;
		this.fnOnSelected.emit(item);

		if (this.fnSearch) {
			this.valor = [];
			this.foco = false;
			this.bMouseEnter = false;
		}
	}

	onBlur(ev) {
		this.focoCampo = false;
		if (!this.bMouseEnter || (this.valor && !this.valor.length && !this.customElement)) {
			this.foco = false;
		}
		this.bMouseEnter = true;

	}

	focoCampo = false;
	onFocus(ev) {
		this.focoCampo = true;
		this.foco = true;
	}

	bMouseEnter = true;
	mouseEnter(ev) {

		this.bMouseEnter = true;
	}

	mouseLeave(ev) {
		if (this.bMouseEnter) {
			this.foco = false
		}
		this.bMouseEnter = false;
	}

	mouseEnterCampo(ev) {
		if (this.valor && this.valor.length && !this.customElement) {
			if (this.focoCampo) {
				this.foco = true;
			}
		}
	}

	mouseLeaveCampo(ev) {
	}

	@HostListener('keyup', ['$event'])
	validaDigito($event) {
		this.selecionou = false;
		this.foco = true;
		if ((this.valorSelecionado && this.valorSelecionado.length < this.minimo) || (!this.valorSelecionado)) {
			if (this.fnSearch) {
				this.valor = [];
			}
		}
	}

	@HostListener('keypress', ['$event'])
	@HostListener('keydown', ['$event'])
	validaDigitoEspecial($event) {
		if ($event.key == 'Tab') {
			this.foco = false
			return
		}

		if ($event.key && $event.key.length > 1 && $event.key != 'Backspace') {
			this.fazBusca = false;
		} else {
			this.fazBusca = true;
		}
	}

	ngAfterViewInit() {
		if (this.camposFiltro.length) {
			this.camposFiltro.forEach((campo) => {
				if (campo.name) {
					this.camposLabel.push((campo.label) ? campo.label : campo.name);
					this.objFiltros.push(campo.name);
				} else {
					this.camposLabel.push(campo);
					this.objFiltros.push(campo);
				}
			});
		} else {
			console.error("Campo nao possui array de filtro")
		}
	}

	formataValor(itemLista, pos) {
		let valor;

		if (pos && pos.indexOf(".") > 0) {
			let arrayPos = pos.split(".");
			let valorFinal = itemLista;
			arrayPos.forEach((pos) => {
				if (valorFinal) {
					valorFinal = valorFinal[pos];
				}
			});

			valor = valorFinal;
		} else {
			if (itemLista[pos]) {
				valor = itemLista[pos];
			} else {
				valor = "";
			}
		}

		return valor;
	}

	valorLocal = [];
	filtraLocal() {
		if (this.valor) {
			let array = this.valor.dados || this.valor;

			this.valorLocal = this.valor.filter(
				(item) => {
					let valor = this.formataValor(item, this.objFiltros[0]);
					if (!valor) {
						return false;
					}

					return valor.toUpperCase().indexOf(this.valorSelecionado.toUpperCase()) >= 0;
				}
			);
		}
	}

	hide() {
		return setTimeout((ev) => {
			return true;
		}, 1000);
	}
}