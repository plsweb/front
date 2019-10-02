import { Component, ViewChild, Input, Output, ViewContainerRef, EventEmitter, ElementRef, Renderer, OnInit } from '@angular/core';
import { NgxUploaderModule } from 'ngx-uploader';
import { UsuarioService, GuiaService, EspecialidadeService, ConsultorioService, LocalAtendimentoService, Login, AgendamentoColetivoService, AgendamentoColetivoUsuarioService, AgendamentoColetivoLocalService } from '../../../../../services';

import { Sessao } from '../../../../../services/sessao';
import { Servidor } from '../../../../../services/servidor';

import { ActivatedRoute, Router } from '@angular/router';
import { Saida } from '../../../../../theme/components/entrada/entrada.component';

import { NgbdModalContent } from '../../../../../theme/components/modal/modal.component';
import { NgbModal, NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';

import { ToastrService } from 'ngx-toastr';

import * as moment from 'moment';
import * as jQuery from 'jquery';
import { FormatosData } from '../../../../../theme/components';


@Component({
    selector: 'formulario',
    templateUrl: './formulario.html',
    styleUrls: ['./formulario.scss'],
    providers: [EspecialidadeService]
})
export class Formulario implements OnInit {

    
    idAgenda

    novaAgenda = new Object();

    objParamsAddProfissional = new Object();
    objParamsAddLocal = new Object();

    addUser;
    formatosDeDatas;
    atual = "geral"

    paginaAtualProfissionais = 1;
    itensPorPaginaProfissionais = 15;
    profissionais = [];
    profissionaisFiltro;
    qtdItensTotalProfissionais;

    paginaAtualLocais = 1;
    itensPorPaginaLocais = 15;
    locais = [];
    locaisFiltro;
    qtdItensTotalLocais;

    constructor(
        private usuarioService: UsuarioService,
        private serviceAgendaColetiva: AgendamentoColetivoService,
        private serviceAgendamentoColetivoUsuario: AgendamentoColetivoUsuarioService,
        private serviceAgendamentoColetivoLocal: AgendamentoColetivoLocalService,
        private serviceConsult: ConsultorioService,
        private toastr: ToastrService, 
        private vcr: ViewContainerRef,
        private modalService: NgbModal,
        private guiaService: GuiaService,
        private serviceEspecialidade: EspecialidadeService,
        private localAtendimentoService: LocalAtendimentoService,
        private route: ActivatedRoute,
        private router: Router) 
    {
        this.route.params.subscribe(params => {
            this.idAgenda = (params["idagenda"] != 'novo') ? params["idagenda"] : undefined
        });
    }

    ngOnInit() {
        
        this.formatosDeDatas = new FormatosData();

        if( this.idAgenda ){
            this.setAgenda();
        }

    }


    navegar(aba){
        this.atual = aba;

        switch (aba) {
            case 'geral': 
                // this.setAgenda();
                break;

            case 'profissionais':
                this.buscarProfissionais(null);
                break;
                
            case 'locais':
                this.buscarLocais(null);                
                break;

            default:
                break;
        }
    }


    salvarAgenda(){

        let requestAgenda = this.validaNovaAgenda(this.novaAgenda);

        if(!this.idAgenda){
            this.serviceAgendaColetiva.postAgendamentoColetivo(requestAgenda).subscribe(
                retorno => {
                    this.idAgenda = retorno;
                    this.router.navigate([`/${Sessao.getModulo()}/agendacoletiva/${retorno}`]);
                    this.toastr.success("Agenda "+this.novaAgenda['nome']+" adicionada com sucesso");
                    this.setAgenda();
                }
            ) 
        }else{
            this.serviceAgendaColetiva.putAgendamentoColetivo(this.idAgenda, requestAgenda).subscribe(
                retorno => {
                    this.toastr.success("Agenda "+this.novaAgenda['nome']+" atualizada com sucesso");
                }
            ) 
        }
    }

    validaNovaAgenda(obj){
        let request = Object.assign({}, obj);
        delete request.locais;

        return request;
    }


    setAgenda(){
        this.serviceAgendaColetiva.getAgendamentoColetivo({ id : this.idAgenda }).subscribe(
            agenda => {
                this.novaAgenda = this.validaAgenda(agenda.dados[0]);
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        )

        this.inicializaUnidades();
        
    }

    validaAgenda(agenda){
        
        this.especialidadeSelecionada = agenda.especialidade.descricao

        return agenda;
    }

    objEspecialidades
    fnCfgEspecialidadeRemote(term) {
        return this.serviceEspecialidade.getEspecialidadeLike(term, 0, 10).subscribe(
            (retorno)=>{
                this.objEspecialidades = retorno.dados || retorno;
            }
        );
    }
    especialidadeSelecionada;
    especialidade;
    getEspecialidade(especialidade) {
        this.novaAgenda['especialidade'] = { id:  especialidade.id };
        this.especialidadeSelecionada = especialidade.descricao
    }

    buscarProfissionais(evento){
    
        this.paginaAtualProfissionais = evento ? evento.paginaAtual : this.paginaAtualProfissionais;
        this.serviceAgendamentoColetivoUsuario.getAgendamentoColetivoUsuario( { pagina: this.paginaAtualProfissionais, quantidade: this.itensPorPaginaProfissionais} ).subscribe( profissionais => {
            
            this.profissionais = this.profissionais.concat([],profissionais.dados);

            this.profissionaisFiltro = this.profissionais.slice();
            this.qtdItensTotalProfissionais = profissionais.qtdItensTotal;
            
        });

        this.buscarLocais(null);
    }

    objProfissionais
    fnCfgprofissionalRemote(term) {
        this.usuarioService.usuarioPaginadoFiltro( 1, 10, term ).subscribe(
            (retorno) => {
                this.objProfissionais = retorno.dados || retorno;
            }
        )
    }
    
    profissionalSelecionado
    getProfissional(evento){
        if( evento ){
            this.objParamsAddProfissional['usuario'] = { guid : evento['guid'] };
            this.profissionalSelecionado = evento['nome'];
        }else{
            this.objParamsAddProfissional['usuario'] = undefined;
        }
    }

    buscarLocais(evento){
    
        this.paginaAtualLocais = evento ? evento.paginaAtual : this.paginaAtualLocais;
        this.serviceAgendamentoColetivoLocal.getAgendamentoColetivoLocal( { pagina: this.paginaAtualLocais, quantidade: this.itensPorPaginaLocais, agendamentoColetivoId : this.idAgenda, simples: true } ).subscribe( locais => {

            this.locais = this.locais.concat([],locais.dados);

            this.locaisFiltro = this.locais.slice();
            this.qtdItensTotalLocais = locais.qtdItensTotal;
            
        });

    }

    adicionarProfissional(idLocal){
        this.objParamsAddProfissional['agendamentoColetivo']       = { id : this.idAgenda };
        this.objParamsAddProfissional['agendamentoColetivoLocal']  = { id : idLocal };

        this.serviceAgendamentoColetivoUsuario.postAgendamentoColetivoUsuario( this.objParamsAddProfissional ).subscribe(
            (retorno) => {
                this.toastr.success("Profissional salvo com sucesso");
                this.setAgenda();
            }
        )
    }

    unidades;
    inicializaUnidades(){
        this.unidades = Sessao.getVariaveisAmbiente('unidadesAtendimento');
	}

    consultorios = [];
	getUnidade(evento) {
        if( evento.valor && evento.valor != '0' ){
            this.objParamsAddLocal['unidadeAtendimento'] = { id : evento.valor };

            this.serviceConsult.getConsultoriosPorUnidadeId(evento.valor)
                .subscribe((consultorios) => {
                    this.consultorios = consultorios;

                    if( this.consultorios.length ){
                        delete this.objParamsAddLocal['guiche'];
                    }

                },
                (erro) => {Servidor.verificaErro(erro, this.toastr);}
            );
        }
    }

    salvarLocal(){

        this.objParamsAddLocal['agendamentoColetivo'] = { id : this.idAgenda };

        this.serviceAgendamentoColetivoLocal.postAgendamentoColetivoLocal( this.objParamsAddLocal ).subscribe(
            (retorno) => {
                this.toastr.success("Local salvo com sucesso");
                this.setAgenda();
            }
        )
    }

    getConsultorio(evento) {
        this.objParamsAddLocal['guiche'] = { id : evento.valor };
    }

    removeItem( id, nome, tipo ){

        if( confirm(`Deseja remover ${nome} ?`) ){
            ( tipo == 'profissional' ) ? this.removeProfissional(id) : this.removeLocal(id);
        }

    }

    removeProfissional(id){

        this.serviceAgendamentoColetivoUsuario.deleteAgendamentoColetivoUsuario(id).subscribe(
            (retorno) => {
                this.toastr.success("Usuario removido com sucesso");
                this.setAgenda();
            }
        )

    }
    removeLocal(id){

        this.serviceAgendamentoColetivoLocal.deleteAgendamentoColetivoLocal(id).subscribe(
            (retorno) => {
                this.toastr.success("Local removido com sucesso");
                this.setAgenda();
            }
        )

    }

    idAbaAberta;
    abrirAbaLocal(idAba) {
        if (this.idAbaAberta == idAba) {
            this.idAbaAberta = "";
        } else {
            this.idAbaAberta = idAba;
        }
    }


    trocaAddUser(idAba) {
        if (this.addUser == idAba) {
            this.addUser = "";
        } else {
            this.addUser = idAba;
        }
    }

    voltar(){
        this.router.navigate([`/${Sessao.getModulo()}/agendacoletiva`]);
    }

}