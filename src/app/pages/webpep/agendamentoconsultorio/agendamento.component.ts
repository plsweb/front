import { Component, OnInit, ViewChild, TemplateRef, } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';

import { ToastrService } from 'ngx-toastr';

import { NgbdModalContent } from '../../../theme/components/modal/modal.component';
import { Sessao, Servidor, AtendimentoService, PrestadorAtendimentoService, UsuarioService } from '../../../services';

import * as moment from 'moment';
moment.locale('pt-br');

@Component({
    selector: 'agendamento',
    templateUrl: './agendamento.html',
    styleUrls: ['./agendamento.scss'],
    providers: [PrestadorAtendimentoService],
})
export class Agendamento implements OnInit {

    ordem;
    pacientes;
    unidadeId;
    unidadeAtendimento;
    idPacienteSelecionado;
    variaveisDeAmbiente = {};
    objFiltroAtendimento = new Object();

    @ViewChild("bodyModalPaciente", {read: TemplateRef}) bodyModalPaciente: TemplateRef<any>;
    @ViewChild("botoesModalPaciente", {read: TemplateRef}) botoesModalPaciente: TemplateRef<any>;

    @ViewChild("bodyModalAtendimentosPaciente", {read: TemplateRef}) bodyModalAtendimentosPaciente: TemplateRef<any>;
    @ViewChild("botoesModalAtendimentosPaciente", {read: TemplateRef}) botoesModalAtendimentosPaciente: TemplateRef<any>;

    constructor( 
        public router: Router,
        private toastr: ToastrService,
        private modalService: NgbModal,
        private atendimentoService: AtendimentoService,
        private serviceUsuario: UsuarioService,
    ) {
        this.unidadeId = localStorage.getItem('idUnidade');
        this.variaveisDeAmbiente['unidades'] = JSON.parse( localStorage.getItem("variaveisAmbiente") ).unidadeAtendimentoUsuario;
        this.variaveisDeAmbiente['usuario'] = JSON.parse( localStorage.getItem("usuario") );

        this.objFiltroAtendimento['like'] = '';
        this.objFiltroAtendimento['quantidade'] = 30;
        this.objFiltroAtendimento['paginaAtual'] = 1,
        this.objFiltroAtendimento['qtdItensTotal'] = 0;
    }

    ngOnInit() {

        if( !localStorage.getItem('idUnidade') ){
            this.toastr.warning("Necessario selecionar uma unidade de atendimento");
            this.router.navigate([`/${Sessao.getModulo()}/dashboard`]);
            return
        }

        this.serviceUsuario.getUsuarioUnidadeAtendimento({ unidadeAtendimentoId: this.unidadeId }).subscribe( 
            (prestadores) => {
                if ( prestadores.qtdItensTotal == 1 ) {
                    this.variaveisDeAmbiente['prestadorSelecionado'] = prestadores.dados[0].usuario.nome;
                    this.variaveisDeAmbiente['prestadores'] = prestadores.dados[0].usuario;

                } else if( prestadores.qtdItensTotal > 1 ) {
                    let arrayPrestador = [];

                    prestadores.dados.forEach(
                        (prestador) => { arrayPrestador = arrayPrestador.concat([], prestador.usuario); }
                    )
                    this.variaveisDeAmbiente['prestadores'] = arrayPrestador;
                } else {
                    this.variaveisDeAmbiente['prestadores'] = [];
                }
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        );

        this.unidadeAtendimento = this.variaveisDeAmbiente['unidades'].filter( function(elem, i) {
            return elem.id == localStorage.getItem('idUnidade');
        });

        this.variaveisDeAmbiente['colunas'] = [
            {'titulo': ' ', 'icone': {'icn': 'date_range', 'click': this.agendarPaciente.bind(this), 'classe': 'text-success mx-auto'} },
            {'titulo': ' ', 'icone': {'icn': 'search', 'click': this.agendamentoPaciente.bind(this), 'classe': 'text-default mx-auto'} },
            {'titulo': 'NOME', 'chave': 'paciente.nome'},
            {'titulo': 'NASCIMENTO', 'chave': 'paciente.nascimento'},
            {'titulo': 'CPF', 'chave': 'paciente.cpf'},
            {'titulo': 'CONTATO', 'select': {'chave': 'paciente.contatos', 'click': this.contato.bind(this)} },
            {'titulo': 'VALOR', 'chave': 'valor'},
            {'titulo': 'ULTIMA CONSULTA', 'chave': 'agendamento'},
        ];
    }

    ngAfterViewInit() {
    }

    ngOnDestroy() {
    }

    getPaciente(ordem, unidade) {
        let param = {
            statusIn: ['ATENDIDO'],
            unidadeAtendimento: { id: unidade.id || unidade },
            ordernacao: 'paciente.nome ASC',
            usuario: this.objFiltroAtendimento['usuario'] ? { guid: this.objFiltroAtendimento['usuario']['guid'] } : undefined,
            like: this.objFiltroAtendimento['like'],
        };

        let ordenacao = {
            group: true,
            pagina: ordem.paginaAtual,
            quantidade: this.objFiltroAtendimento['quantidade'],
        };

        this.atendimentoService.filtrar(param, ordenacao)
            .subscribe((pacientes) => {
                this.pacientes = (pacientes.paginaAtual == 1) ? this.pacientes = pacientes.dados : this.pacientes.concat( [], pacientes.dados );
                this.objFiltroAtendimento['qtdItensTotal'] = pacientes.qtdItensTotal;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
                this.toastr.error("Houve um erro ao buscar Pacientes");
            });
    }

    getPrestadorFiltro(prestador){
        this.variaveisDeAmbiente['prestadorSelecionado'] = prestador.nome;
        this.objFiltroAtendimento['usuario'] = {
            guid: prestador.guid
        }

        this.getPaciente({ paginaAtual : 1 }, localStorage.getItem('idUnidade'));
    }

    pesquisar(texto) {
        this.objFiltroAtendimento['like'] = texto.like || '';

        this.getPaciente({paginaAtual: 1}, this.unidadeAtendimento[0]);
    }

    filtrarAtendimento(params = {}){
        this.objFiltroAtendimento['paginaAtual'] = 1;
        this.objFiltroAtendimento['itensPorPagina'] = 30;

        this.getPaciente(this.objFiltroAtendimento, this.unidadeAtendimento[0])
    }

    limparFiltros(event) {
        console.log(event)
    }

    contato(event, param) {
        event.preventDefault();
        event.stopPropagation();
    }

    agendarPaciente(event, param) {
        event.preventDefault();
        this.router.navigate([`/${Sessao.getModulo()}/agendamento/${this.unidadeId}`], {queryParams: {paciente: param.paciente.id}});
        event.stopPropagation();
    }

    novoAgendamento() {
        this.router.navigate([`/${Sessao.getModulo()}/agendamento/${this.unidadeId}`]);
    }

    modalAgendamento
    atendimentosPaciente = [];
    agendamentoPaciente(event, param) {
        event.preventDefault();

        this.atendimentosPaciente = [];
    
        let objParamPaginacao = {
            pagina: 1,
            quantidade: 30
        }
    
        let request = {
            "paciente": {
                "id": param.paciente.id
            },
            "ordernacao": "agendamento DESC, usuario.nome ASC",
            "ignoraRda": Sessao.validaPapelUsuario('WEBPEP:ADMINISTRATIVO VIVER BEM')
        }

        this.atendimentoService.filtrar(request, objParamPaginacao).subscribe(
            (agendas) => {
                this.atendimentosPaciente = agendas.dados;
            }
        );

        this.modalAgendamento = this.modalService.open(NgbdModalContent, {});
        this.modalAgendamento.componentInstance.modalHeader = 'Agendamentos';

        this.modalAgendamento.componentInstance.templateBotoes = this.botoesModalAtendimentosPaciente;
        this.modalAgendamento.componentInstance.templateRefBody = this.bodyModalAtendimentosPaciente;
        this.modalAgendamento.componentInstance.custom_lg_modal = true;

        this.modalAgendamento.result.then((data) => {console.log(data)}, (reason) => {console.log(reason)});

        event.stopPropagation();
    }

    abrirPaciente(atendimento) {

        if( Sessao.validaPapelUsuario('WEBPEP:MEDICO') ) {
            this.router.navigate([`/${Sessao.getModulo()}/paciente/formulario/${atendimento.paciente.id}`]);
            return;
        }

        this.idPacienteSelecionado = atendimento.paciente.id;
        
        this.modalAgendamento = this.modalService.open(NgbdModalContent, {size: 'lg'});
        this.modalAgendamento.componentInstance.modalHeader = 'Paciente';

        this.modalAgendamento.componentInstance.templateBotoes = this.botoesModalPaciente;
        this.modalAgendamento.componentInstance.templateRefBody = this.bodyModalPaciente;
        this.modalAgendamento.componentInstance.custom_lg_modal = true;

        this.modalAgendamento.result.then(
            (data) => {console.log(data)},
            (reason) => {console.log(reason)}
        );
    }
}