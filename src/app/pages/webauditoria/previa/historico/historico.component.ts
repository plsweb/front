import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { GuiaService } from 'app/services';

import * as moment from 'moment';
moment.locale('pt-br');

@Component({
    selector: 'historico',
    templateUrl: './historico.html',
    styleUrls: ['./historico.scss'],
    providers: []
})
export class Historico implements OnInit {  
    id;

    constructor(
        private route: ActivatedRoute,
        private guiaService: GuiaService,
    ) {

        this.route.params.subscribe(params => {
            this.id = params['id'] == 'novo' ? undefined : params['id'];
        });
    }

    guia;
    ngOnInit() {
        this.guiaService.getGuiaPorId(this.id).subscribe(
            (guia) => {
                this.guia = guia[0];
            }
        );
    }

    formataBeneficiario(guia){
        return `${guia.beneficiario.codigo} - ${guia.beneficiario.nome}, ${guia.beneficiario.nascimento} (${guia.beneficiario.idade})`;
    }

    formataPrestador(guia){
        return `${guia.prestador.codigo} - ${guia.prestador.nome}`;
    }

    formataGuia(guia) {
        if (guia && guia.ano && guia.mes && guia.numero) {
            return `${guia.ano}.${guia.mes}.${guia.numero}`;
        } 

        return '';
    }

    formataStatus(guia) {
        return guia ? guia.status : '';
    }
}