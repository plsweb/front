import { Component, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';

@Component({
    selector: 'paginacao',
    templateUrl: './paginacao.html',
    styleUrls: ['./paginacao.scss'],
    providers: []
})
export class Paginacao {
    @Input() qtdItensTotal: number = 0;
    @Input() itensPorPagina: number = 10;
    @Input() ultimoRegistro: number = 1;
    @Input() paginaAtual: number = 1;
    @Input() contaRegistro: boolean = false;
    @Input() scrollPagination: boolean = false;
    paginas: any;

    paginaRequest = 1;
    minimaPaginaCentral: number;
    maximaPaginaCentral: number;

    @Output() getPaginacao = new EventEmitter();
    @Output() atualizaDados: EventEmitter<any> = new EventEmitter();

    ngOnInit() {
        if (!this.itensPorPagina) {
            console.error("erro nos parâmetros da paginação: itensPorPagina");
        } else if (!this.paginaAtual) {
            console.error("erro nos parâmetros da paginação: paginaAtual");
        }
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes && changes.paginaAtual && changes.paginaAtual.currentValue) {
            this.paginaRequest = changes.paginaAtual.currentValue;
        }
    }

    carregaMaisDados() {
        if (this.qtdItensTotal >= this.paginaAtual * this.itensPorPagina - 1) {
            this.paginaAtual = Number(this.paginaAtual) + 1;

            this.atualizaDados.emit({
                qtdItensTotal: this.qtdItensTotal,
                itensPorPagina: this.itensPorPagina,
                paginaAtual: this.paginaAtual
            });
        }
    }

    getScrollTop() {
        return (window.pageYOffset !== undefined) ? window.pageYOffset : (document.documentElement || document.body.parentNode || document.body)['scrollTop'];
    }

    getDocumentHeight() {
        const body = document.body;
        const html = document.documentElement;

        return Math.max(
            body.scrollHeight, body.offsetHeight,
            html.clientHeight, html.scrollHeight, html.offsetHeight
        );
    };

    ngAfterViewInit() {
        if (this.scrollPagination) {
            window.onscroll = () => {
                if (Math.round(this.getScrollTop()) < Math.round(this.getDocumentHeight()) - Math.round(window['innerHeight'])) {
                    return;
                }

                this.carregaMaisDados();
            };
        }
    }

    ngAfterContentChecked() {
        this.atualizaUltimoRegistro();
    }

    atualizaUltimoRegistro() {
        let ultimoregistro = this.paginaAtual * this.itensPorPagina;

        if (ultimoregistro > this.qtdItensTotal ? this.qtdItensTotal : ultimoregistro) {
            this.ultimoRegistro = ultimoregistro > this.qtdItensTotal ? this.qtdItensTotal : ultimoregistro;
        }
    }

    eventoClique(event, pagina) {
        event.stopPropagation();

        if (
            (this.paginaAtual == 1 && pagina == -1) ||
            (this.paginaAtual * this.itensPorPagina >= this.qtdItensTotal && pagina == 1)
        ) {
            if (!this.itensPorPagina) {
                console.error("erro nos parâmetros da paginação: itensPorPagina");
            } else if (!this.paginaAtual) {
                console.error("erro nos parâmetros da paginação: paginaAtual");
            } else if (!this.qtdItensTotal) {
                console.error("erro nos parâmetros da paginação: qtdItensTotal");
            }
            return;
        }

        this.paginaAtual = Number(this.paginaAtual) + Number(pagina);

        this.atualizaDados.emit({
            qtdItensTotal: this.qtdItensTotal,
            itensPorPagina: this.itensPorPagina,
            paginaAtual: this.paginaAtual
        });
    }

    paginaAtiva(pagina) {
        return this.paginaAtual == pagina.numero;
    }
}