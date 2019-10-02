import { Component, ViewContainerRef, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { TipoAtendimentoService, ProgramaService, TemaGrupoService, ProgramaSaudePacienteService, PacienteService, DicionarioTissService} from '../../../../../services';

import { Servidor } from '../../../../../services/servidor';
import { Sessao } from '../../../../../services/sessao';

import { ActivatedRoute, Router } from '@angular/router';

import { ToastrService } from 'ngx-toastr';

import { FormatosData, NgbdModalContent } from '../../../../../theme/components';
import * as moment from 'moment';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
    selector: 'formulario',
    templateUrl: './formulario.html',
    styleUrls: ['./formulario.scss'],
    providers: [TipoAtendimentoService]
})
export class Formulario implements OnInit {

    idPrograma

    novoPrograma:any;
    unidadesAtendimento = [];
    programaStatus;
    tipoEncerramento;
    formatosDeDatas;
    colorPicker;

    unidadesSelecionadas = [];

    tamanhoMaximo = 150;

    momentjs = moment;

    constructor(
        private toastr: ToastrService, 
        private vcr: ViewContainerRef,
        private modalService: NgbModal,
        private route: ActivatedRoute,
        private service: ProgramaService,
        private servicePaciente: PacienteService,
        private serviceTemaGrupo: TemaGrupoService,
        private dicionarioService: DicionarioTissService,
        private servicePacienteSaude: ProgramaSaudePacienteService,
        private router: Router) {
            
        this.route.params.subscribe(params => {
            this.idPrograma = (params["idprograma"] != 'novo') ? params["idprograma"] : undefined
        });
    }

    ngOnInit() {
        this.formatosDeDatas = new FormatosData();
        console.log(Sessao.getEnum('ProgramaStatus').lista);
        
        this.programaStatus = Sessao.getEnum('ProgramaStatus').lista || [
            {
                codigo: 'ELEGIBILIDADE',
                descricao: 'ELEGIBILIDADE'
            },
            {
                codigo: 'ACOMPANHAMENTO',
                descricao: 'ACOMPANHAMENTO'
            },
            {
                codigo: 'INTERNACAO_HOSPITALAR',
                descricao: 'INTERNACAO_HOSPITALAR'
            },
            {
                codigo: 'VIAGEM',
                descricao: 'VIAGEM'
            },
            {
                codigo: 'INELEGIVEL',
                descricao: 'INELEGIVEL'
            },
            {
                codigo: 'ALTA',
                descricao: 'ALTA'
            }
        ];

        this.dicionarioService.getTipoEncerramento().subscribe(
            (tipoEncerramento) => {
                this.tipoEncerramento = tipoEncerramento
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );

        if( this.idPrograma ){
            this.setPrograma();
        }else{
            this.novoPrograma = this.validaPrograma({});
        }
    }

    salvarPrograma(){
        let requestPrograma = this.validaNovoPrograma(this.novoPrograma);

        if( !requestPrograma ){
            return;
        } else {
            requestPrograma.pacientes ? delete requestPrograma.pacientes : null;
        }

        if(!this.idPrograma){
            this.service.post(requestPrograma).subscribe(
                (retorno) => {
                    this.idPrograma = retorno;
                    this.router.navigate([`/${Sessao.getModulo()}/programa/${retorno}`]);
                    this.toastr.success("Programa " + requestPrograma['descricao'] + " adicionado com sucesso");
                    this.setPrograma();
                }, (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                }
            ) 
        }else{
            this.service.put( this.idPrograma, requestPrograma).subscribe(
                () => {
                    this.toastr.success("Programa " + requestPrograma['descricao'] + " atualizado com sucesso");
                }, (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                }
            ) 
        }
    }

    setPrograma(){
        this.service.get( { id : this.idPrograma } ).subscribe(
            programa => {
                this.novoPrograma = this.validaPrograma( ( programa.dados && programa.dados.length ) ? programa.dados[0] : programa[0]);

                this.buscarPacientePrograma({ paginaAtual: 1 });

            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
                Servidor.verificaErro(erro, this.toastr);
            }
        );
    }

    qtdItensTotal;
    paginaAtual = 1
    itensPorPagina = 100
    buscarPacientePrograma(evento = null, like = undefined) {
        
        this.paginaAtual = evento ? evento.paginaAtual : this.paginaAtual;

        let request = {
            programaSaudeId: this.idPrograma,
            pagina: this.paginaAtual,
            quantidade: this.itensPorPagina,
            simples: true,
            like: like
        };

        this.servicePacienteSaude.get(request).subscribe(
            (pacientePrograma) => {
                this.novoPrograma['programaSaudePaciente']  = (request.pagina == 1) ? pacientePrograma.dados : this.novoPrograma['programaSaudePaciente'].concat([],pacientePrograma.dados);
                
                this.qtdItensTotal = pacientePrograma.qtdItensTotal;
            },
            (erro) => {
                Servidor.verificaErro(erro);
                this.toastr.warning(erro);
            }
        );
    }

    validaNovoPrograma(programa){
        if( programa.dataInicio && programa.dataFim ){
            if( moment( programa.dataInicio, this.formatosDeDatas.dataFormato ).isAfter( moment( programa.dataFim, this.formatosDeDatas.dataFormato ) ) ){
                this.toastr.warning("Data final maior que inicial");
                return false;
            }
        }
        return programa;
    }

    validaPrograma(tipo){
        if( !this.idPrograma )
            tipo.ativo = true;

        return tipo;
    }

    trocaCor(valor) {
        if (valor.colorPicker) {
            this['colorPicker'] = valor['colorPicker'];
        }
    }

    validaCheck(unidadeCheck){
        let estado = false;
        
        if( this.novoPrograma['unidadesAtendimento'] && this.novoPrograma['unidadesAtendimento'].length ){
            this.novoPrograma['unidadesAtendimento'].forEach(
                (unidade) => {
                    if( unidade.id == unidadeCheck.id ){
                        estado = true;
                    }
                }
            )
        }

        return estado;
    }

    @ViewChild("modalEdita", {read: TemplateRef}) modalEdita: TemplateRef<any>;
    @ViewChild("modalEditaBotoes", {read: TemplateRef}) modalEditaBotoes: TemplateRef<any>;
    modalPacienteSaude;
    novaComposicao = new Object();
    abreModalPaciente(item){   

        let cfgGlobal:any = Object.assign(NgbdModalContent.getCfgGlobal(), {size: 'lg'});
        
        this.modalPacienteSaude = this.modalService.open(NgbdModalContent, cfgGlobal );
        this.modalPacienteSaude.componentInstance.modalHeader  = `Editar Paciente`;
        
        this.modalPacienteSaude.componentInstance.templateRefBody = this[`modalEdita`];
        this.modalPacienteSaude.componentInstance.templateBotoes = this[`modalEditaBotoes`];
        
        let context = new Object();
        
        context[`objPaciente`] = item;
        context[`criaNovo`] = false;
        this.modalPacienteSaude.componentInstance.contextObject = context;

        this.modalPacienteSaude.result.then(
            () => {
                this.novoPaciente = {};
                item = {};
            },
            () => {
                this.novoPaciente = {};
                item = {};
            }
        )
    }

    adicionarNovoPaciente(paciente = undefined){
        let novoPaciente = Object.assign({}, paciente);
        novoPaciente['programaSaude'] = { id : this.idPrograma };
        novoPaciente['paciente'] = { id: paciente['paciente'].id };
        novoPaciente['status'] = paciente['status'];

        novoPaciente = this.validaNovoPaciente(novoPaciente)
        if(!novoPaciente){
            return;
        }

        if( !novoPaciente.id ){
            this.servicePacienteSaude.post( novoPaciente ).subscribe(
                (retorno) => {
                    this.toastr.success("Novo paciente adicionado");
                    this.setPrograma();
                    paciente = new Object();
                    (this.modalPacienteSaude) ? this.modalPacienteSaude.dismiss() : null;
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                }
            )
        }else{
            if (novoPaciente['status'] == 'ALTA') {
                novoPaciente['alta'] = this.encerramento;

            }

            this.servicePacienteSaude.put( novoPaciente.id, novoPaciente ).subscribe(
                () => {
                    this.toastr.success("Paciente editado");
                    this.setPrograma();
                    paciente = new Object();
                    (this.modalPacienteSaude) ? this.modalPacienteSaude.dismiss() : null;
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                }
            )
        }
    }

    setStatus(evento, status){
        return evento.valido ? evento.valor : status;
    }

    validaNovoPaciente(paciente){

        return paciente
    }

    removePaciente(paciente){
        if( !confirm('Deseja remover paciente?') ){
            return;
        }

        this.servicePacienteSaude.delete( paciente.id ).subscribe(
            () => {
                this.toastr.success("Paciente removido com sucesso");
                this.setPrograma();
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
                Servidor.verificaErro(erro, this.toastr);
            }
        )
    }

    novoPaciente:any = new Object();
    setObjParamPaciente(paciente){
        if( paciente ){
            this.novoPaciente = paciente;
         }
    }

    objPacientes = [];
    fnCfgPacienteRemote(term) {

        let objParam;
        if( term.length == 11 ){
            objParam = { cpf : term };
        }else if( (term.length > 11) && !term.match(/\D/g) ){
            objParam = { carteirinha : term };
        }else{
            objParam = { like : term };
        }

        objParam['simples'] = true;
        objParam['pagina'] = 1;
        objParam['quantidade'] = 10;

        this.servicePaciente.getPacienteLike(objParam).subscribe(
            (retorno) => {
                this.objPacientes = retorno.dados || retorno;
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
                Servidor.verificaErro(erro, this.toastr);
            }
        );

    }

    fnCfgTemaRemote(term) {
        return this.serviceTemaGrupo.get( { like : term } ).subscribe(
            (retorno)=> {
                this.objPacientes = retorno.dados || retorno;
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
                Servidor.verificaErro(erro, this.toastr);
            }
        )
    }

    voltar(){
        this.router.navigate([`/${Sessao.getModulo()}/programa`]);
    }

    encerramento;
    getEncerramento(evento) {
        if (evento.valido) {
            this.encerramento = {id: evento.valor};
        }
    }

    validaErro(erro){
        if( erro._body && erro.status == 412 ){
            try{
                let response = JSON.parse(erro._body);
                this.toastr.error(response.message);
                return;
            }catch(e){
                console.error("Erro ao exibir mensagem");
            }
        }
    }
}