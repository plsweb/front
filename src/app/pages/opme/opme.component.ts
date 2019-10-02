import { Component, OnInit } from '@angular/core';
import { MaterialService } from 'app/services/opme/material.service';
import { ActivatedRoute } from '@angular/router';
import { Sessao } from 'app/services/sessao';

@Component({
    selector: 'app-opme',
    templateUrl: './opme.component.html',
    styleUrls: ['./opme.component.scss']
})
export class Opme implements OnInit {

    id;
    processo;
    material;
    request = {};

    constructor(
        private route: ActivatedRoute,
        private serviceMaterial: MaterialService,
    ) {
        localStorage.setItem("tema", "light_tema");
        $("head")["0"].innerHTML += `<link id="tema" href="assets/css/light_tema.css" rel="stylesheet">`;

        this.route.params.subscribe(params => {
            Sessao.setToken(params.token);
            this.processo = params.processo;
            this.route.queryParams.subscribe(queryParam => {
                if (queryParam['idMaterial']) {
                    this.id = queryParam['idMaterial'];
                }
            });
        });
    }

    ngOnInit() {
        this.serviceMaterial.get( this.processo, this.id ).subscribe(
            (material) => {
                this.request['id_fornecedor_material'] = this.processo;
                this.request['id'] = this.id;
                this.material = material;
            }
        );
    }

    setRecusa(valor) {
        this.request['recusa'] = valor;
        this.request['sugestao'].forEach(item => {item.marca = '';console.log(item.marca)});
        this.request['justificativa_recusa'] = '';
    }

    recusa(evento) {
        if (evento.recusa == '0') {
            return false;
        } else {
            return true;
        }
    }

    sugestao = [];
    setSugestao(valor, index) {
        this.sugestao[index] = {'marca' : valor};
        this.request['sugestao'] = this.sugestao;
    }

    setJustificativa(valor) {
        this.request['justificativa_recusa'] = valor;
    }

    salvar() {
        this.serviceMaterial.put(this.id, [this.request]).subscribe((material) => {
            this.material = material;
            console.log(this.material)
        });
    }
}