import { Component, ViewChild, Input, Output, ViewContainerRef, EventEmitter, ElementRef, Renderer, OnInit, AfterViewInit, TemplateRef, QueryList } from '@angular/core';
import { NgxUploaderModule } from 'ngx-uploader';
import { AtendimentoService, FormularioService, AgendamentoGrupoService, PacienteDocumentoService, ExameService, PainelSenhaService, UsuarioService } from '../../../../services';

import { Servidor } from '../../../../services/servidor';
import { Sessao } from '../../../../services/sessao';


import { ActivatedRoute, Router } from '@angular/router';
import { Saida } from '../../../../theme/components/entrada/entrada.component';

import { ToastrService } from 'ngx-toastr';

import { NgbdModalContent } from '../../../../theme/components/modal/modal.component';
import { NgbModal, NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { Aguardar } from 'app/theme/components';
import * as sha1 from 'js-sha1';

@Component({
    selector: 'listaGrupo',
    templateUrl: './listaGrupo.html',
    styleUrls: ['./listaGrupo.scss'],
    providers: [AgendamentoGrupoService]
})
export class ListaGrupo implements OnInit {

    idGrupo;
    temaGrupo;

    grupos = [];
    grupoSelecionado;
    encerrado = false;

    like;
    qtdItensTotal;
    paginaAtual = 1;
    itensPorPagina = 15;

    constructor(
        private service: AtendimentoService,
        private route: ActivatedRoute,
        private router: Router,
        private toastr: ToastrService, 
        private vcr: ViewContainerRef,
        private serviceAgendamentoGrupo: AgendamentoGrupoService,
    ) { }

    ngOnInit() {
        let evento = {'paginaAtual': 1};
        this.buscaListaGrupos(evento);
    }

    ngAfterViewInit() { }

    buscaListaGrupos(evento = null){
        this.paginaAtual = !!evento ? evento.paginaAtual : 1;

        this.serviceAgendamentoGrupo.get({like: this.like, pagina: this.paginaAtual, quantidade: this.itensPorPagina, encerrado: this.encerrado, simples: true}).subscribe(
            (grupos) => {
                this.grupos = !!evento ? this.grupos.concat([], grupos.dados) : grupos.dados;
                this.qtdItensTotal = grupos.qtdItensTotal;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        );
    }

    fnCfgGrupoRemote(term) {
        this.like = term;
        return this.serviceAgendamentoGrupo.get( { like: term, pagina: 1, quantidade: this.itensPorPagina, encerrado: this.encerrado } ).subscribe(
            (retorno) => {
                this.grupos = retorno.dados || retorno;
            }
        )
    }

    removeGrupo(id, pos, event){
        if( confirm("Deseja excluir esse grupo?") ){
            this.serviceAgendamentoGrupo.deletarGrupo(id).subscribe(
                retorno => {
                    this.grupos[pos].excluido = true;
                    this.toastr.success("Grupo foi desativado com sucesso")
                },
                erro => {
                }
            ) 
            event.stopPropagation();
        }
    }

    situacao($event) {
        this.encerrado = $event.valor;
        this.buscaListaGrupos();
    }

    getGrupo(evento){
        if( evento ){
            this.grupoSelecionado = evento;
            this.router.navigate([`/${Sessao.getModulo()}/agendamentogrupo/grupo/${this.grupoSelecionado.id}`]);
        }
    }

    abrir(grupo) {
        let sId = grupo ? grupo.id : 'novo';        
        this.router.navigate([`/${Sessao.getModulo()}/agendamentogrupo/grupo/${sId}`]);
    }

    voltar() {
        this.router.navigate([`/${Sessao.getModulo()}/agendamentogrupo`]);
    }
}