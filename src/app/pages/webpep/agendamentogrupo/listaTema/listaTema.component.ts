import { Component, ViewChild, ViewContainerRef, EventEmitter, ElementRef, Renderer, OnInit, AfterViewInit, TemplateRef, QueryList } from '@angular/core';
import { NgxUploaderModule } from 'ngx-uploader';
import { BrowserHelpers, AtendimentoService, FormularioService, TemaGrupoService, AgendamentoGrupoService, PacienteDocumentoService, ExameService, PainelSenhaService, UsuarioService } from '../../../../services';

import { Servidor } from '../../../../services/servidor';
import { Sessao } from '../../../../services/sessao';

import { ActivatedRoute, Router } from '@angular/router';

import { NgbdModalContent } from '../../../../theme/components/modal/modal.component';
import { NgbModal, NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';

import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'listatema',
    templateUrl: './listaTema.html',
    styleUrls: ['./listaTema.scss'],
    providers: [TemaGrupoService, AgendamentoGrupoService]
})
export class ListaTema implements OnInit {

    temas = [];
    qtdItensTotal;
    paginaAtual = 1;
    itensPorPagina = 15;
    temaSelecionado;
    objFiltro = [];

    constructor(
        private toastr: ToastrService, 
        private vcr: ViewContainerRef,
        private router: Router,
        private route: ActivatedRoute,
        private service: AtendimentoService,
        private serviceTemaGrupo: TemaGrupoService,
        private serviceAgendamentoGrupo: AgendamentoGrupoService,
    ) { }

    ngOnInit() {
    }

    ngAfterViewInit() {
        this.buscarPaginado();
    }


    buscaGrupos(evento){

        if( evento.searchStr && evento.searchStr.length > 3 ){    
            this.objFiltro = [ 'nome', 'nome' ];
            this.serviceAgendamentoGrupo.getGrupoLike(evento.searchStr).subscribe(
                (temas) => {
                    this.temas = temas;
                },
                (erro) => {
                    this.toastr.warning(erro);
                }
            );
        }
    }

    abrir(tema) {
        let sId = tema ? tema.id : 'novo';
        Sessao.setPreferenciasUsuario('agendamentoGrupoTema', tema);
        this.router.navigate([`/${Sessao.getModulo()}/agendamentogrupo/tema/${sId}`]);
    }

    filtrar(el){
        this.buscarPaginado(null, el.value);
    }

    buscarPaginado(evento = null, like = null) {
        this.paginaAtual = evento ? evento.paginaAtual : this.paginaAtual;

        let request = {pagina: this.paginaAtual, quantidade: this.itensPorPagina};

        if (like) {
            request['like'] = like;
        }

        this.serviceTemaGrupo.get(request).subscribe(
            (tema) => {
                this.temas = this.temas.concat([],tema.dados);
                this.qtdItensTotal = tema.qtdItensTotal;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
                this.toastr.warning(erro);
            }
        );
    }

    voltar() {
        this.router.navigate([`/${Sessao.getModulo()}/agendamentogrupo`]);
    }
}
