import { ActivatedRoute } from '@angular/router';
import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef, SimpleChanges, OnInit, OnChanges } from '@angular/core';

import { ToastrService } from 'ngx-toastr';

import { Sessao, Servidor, PacientePrescricaoService, UtilService } from 'app/services';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbdModalContent } from 'app/theme/components';

@Component({
    selector: 'listaPrescricoesFiltro',
    templateUrl: './grid.component.html',
    styleUrls: ['./grid.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ListaPrescricoesFiltro implements OnInit, OnChanges {
  
    @Input() filtros;
    @Input() pacienteId;
    @Input() atendimentoId;
    @Input() visaoPaciente = false;
    @Input() adicionaPrescricao = false;
    @Input() mostraModelo = false;
    @Input() itensModeloSelecionado;
    @Input() validaEspecialidade = false;
    @Input() paginacaoScroll = true;
    @Input() novaPrescricaoSalva = [];
    @Input() modoDetalhado = true;
    @Input() somenteVisualizacao = true;
    @Input() visualizaHistoricoRealizacao = true;
    @Input() tamanhoVw = 5.3;

    prescricoes;
    expandido = false;
    
    requestBODY = new Object();


    constructor(
        private route: ActivatedRoute,
        private toastr: ToastrService,
        private cdr: ChangeDetectorRef,
        private modalService: NgbModal,
        private serviceUtil: UtilService,
        private servicePacientePrescricao: PacientePrescricaoService,
    ) { }

    ngOnInit() {
        this.buscarPrescricoes();
        this.cdr.markForCheck();
    }

    ngOnDestroy() {
        this.cdr.detach();
    }

    ngOnChanges(changes: SimpleChanges){
        if (changes && changes['novaPrescricaoSalva'] && changes['novaPrescricaoSalva']['currentValue'] && changes['novaPrescricaoSalva']['currentValue'].length) {   
            let idPrescricao = changes['novaPrescricaoSalva']['currentValue'][ changes['novaPrescricaoSalva']['currentValue'].length - 1 ]
            this.retornoPrescricao({ id: idPrescricao });
        }
    }

    totalPrescricoes;
    qtdItensTotal;
    paginaAtual = 1;
    itensPorPagina = 20;
    buscarPrescricoes(evento = null){
        let request = {
            pagina : evento ? evento.paginaAtual : this.paginaAtual,
            quantidade: this.itensPorPagina,
            // TODO validaEspecialidade: !Sessao.validaPapelUsuario("WEBPEP:ADMINISTRADOR")
            validaEspecialidade: this.validaEspecialidade
        }

        if( request['validaEspecialidade'] ){
            if( Sessao.validaPapelUsuario("WEBPEP:ADMINISTRADOR") ){
                request['validaEspecialidade'] = false;
            }

            this.filtros['usuario'] = {
                guid: Sessao.getUsuario()['guid']
            }
        }

        this.servicePacientePrescricao.postPrescricaoPacienteFiltro( this.filtros, request ).subscribe(
            (prescricoesPaciente) => {
                let retorno = prescricoesPaciente.dados || prescricoesPaciente;

                this.prescricoes = (request['pagina'] == 1 || !this.paginacaoScroll) ? retorno : this.prescricoes.concat([], retorno);
                this.totalPrescricoes = prescricoesPaciente.qtdItensTotal;

                this.cdr.markForCheck();
            },
            (error) => {
                Servidor.verificaErro(error, this.toastr);
                this.cdr.markForCheck();
            },
        )
    }

    idAbaPrescricao;
    abrirAbaPrescricao(idAba) {
        if (this.idAbaPrescricao == idAba) {
            this.idAbaPrescricao = "";
        } else {
            this.idAbaPrescricao = idAba;
        }

        this.cdr.markForCheck();
    }

    retornoPrescricao(novaPrescricao){
        this.paginaAtual = 1;
        this.buscarPrescricoes();
        this.idAbaPrescricao = novaPrescricao.id;
    }

    modalConfirmar
    atualizarPrescriscao(id, situacao, index) {
        this.modalConfirmar = this.modalService.open(NgbdModalContent);
        this.modalConfirmar.componentInstance.modalHeader = situacao;
        this.modalConfirmar.componentInstance.modalMensagem = `Confirma a mudança de status da prescrição?`;
        this.modalConfirmar.componentInstance.modalAlert = true;

        this.modalConfirmar.componentInstance.retorno.subscribe(
            (retorno) => {
                if (retorno) {
                    this.servicePacientePrescricao.atualizar(id, {status: situacao}).subscribe(
                        () => {
                            this.abrirAbaPrescricao(id);
                            this.prescricoes[index].status = situacao;
                            this.toastr.success("Prescrição atualizada com sucesso.");
                        }, (error) => {
                            Servidor.verificaErro(error, this.toastr);
                        }
                    );
                }
            }
        );
    }

    validaClasse(pos) {
        return ( pos % 2 == 0 );
    }

    validaStatus(status) {
        switch (status) {
            case 'ABERTO':
                return 'aberto';
            case 'PRESCRITO':
                return 'prescrito';
            case 'EXECUTADO':
                return 'executado';
            case 'CANCELADO':
                return 'cancelado';
            default:
                break;
        }
    }

    abrirLog(evento, id) {
        evento.stopPropagation();
        evento.preventDefault();
        console.log(evento)
        console.log(id)
    }

    abrirAnexo(ev, id) {
        ev.stopPropagation();
        ev.preventDefault();

        window.open(this.serviceUtil.getArquivo(id, true), '_blank');
    }
}