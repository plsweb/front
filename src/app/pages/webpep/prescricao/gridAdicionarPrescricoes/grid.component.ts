import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef, EventEmitter, Output } from '@angular/core';

import { ToastrService } from 'ngx-toastr';

import { Sessao, Servidor, PacientePrescricaoService, PrescricaoModeloService, UtilService,
         ModeloDiagnosticoService, CidService, CiapService, ProfissionalService } from 'app/services';

import { FormatosData } from 'app/theme/components';

import * as moment from 'moment';
moment.locale('pt-br');

@Component({
    selector: 'gridAdicionarPrescricoes',
    templateUrl: './grid.component.html',
    styleUrls: ['./grid.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GridAdicionarPrescricoes {
  
    @Input() pacienteId;
    @Input() atendimentoId;
    @Input() respostas = undefined

    @Output() onSave = new EventEmitter();
    @Output() prescricaoItensCidCiad = new EventEmitter();

    prescricoes = [];
    expandido = false;
    
    requestBODY = new Object();

    modoDetalhado = false;
    visualizaHistoricoRealizacao = true;

    constructor(
        private toastr: ToastrService,
        private cdr: ChangeDetectorRef,
        private serviceCid: CidService,
        private serviceUtil: UtilService,
        private serviceCiap: CiapService,
        private serviceModelos: PrescricaoModeloService,
        private profissionalService: ProfissionalService,
        private serviceModeloDiagnostico: ModeloDiagnosticoService,
        private servicePacientePrescricao: PacientePrescricaoService,
    ) {
        setInterval(() => {
            this.cdr.markForCheck();
        }, 500);
    }

    formatosDeDatas;
    unidadesAtendimento = [];
    ngOnInit() {
        this.cdr.reattach();
        this.formatosDeDatas = new FormatosData();
        this.unidadesAtendimento = Sessao.getVariaveisAmbiente('unidadesAtendimento');
    }
    
    profissional;
    prescricaoItem
    usoContinuo = false;
    obrigaOrdem = false;
    transcricao = false;
    profissionalPrescricaoSelecionado;
    unidadeSelecionada = Sessao.getIdUnidade();
    novaPrescricao() {
        this.prescricaoItem = [];

        if (!this.unidadeSelecionada) {
            this.toastr.warning("Informe o local onde o paciente será medicado");
            return;
        }

        if (this.transcricao && !this.profissional) {
            this.toastr.warning("Transcrição deve ter um profissional selecionado");
            return;
        }

        if (this.transcricao && !this.arquivo) {
            this.toastr.warning("Transcrição deve ter o anexo da prescrição médica");
            return;
        }

        let param = {
            data: moment().format(this.formatosDeDatas.dataHoraSegundoFormato),
            usuario: {
                guid: Sessao.getUsuario()['guid']
            },
            unidadeAtendimento: { 
                id: this.unidadeSelecionada
            },
            paciente: {
                id: this.pacienteId
            },
            atendimento: {
                id: this.atendimentoId ? this.atendimentoId : undefined
            },
            usoContinuo: this.usoContinuo,
            obrigaOrdem: this.obrigaOrdem,
            transcricao: this.transcricao,
        }

        if (this.transcricao) {
            param['profissional'] = this.profissional;
        }

        if (!this.atendimentoId){
            delete param.atendimento;
        }

        if (this.respostas) {
            this.validaRespostasCidCiap();
        }

        if (this.transcricao) {
            this.serviceUtil.postArquivo(this.arquivo).subscribe(
                (arquivoId) => {
                    param['arquivo'] = {
                        id: arquivoId
                    }
                    this.salvarPrescricaoMedica(param);
                }, (error) => {
                    Servidor.verificaErro(error, this.toastr);
                    return;
                }
            );
        } else {
            this.salvarPrescricaoMedica(param);
        }
    }

    salvarPrescricaoMedica(param) {
        this.servicePacientePrescricao.salvar(param).subscribe(
            (retorno) => {
                let tipo = this.transcricao ? 'Transcrição' : 'Prescrição';
                this.toastr.success( tipo + ' criada com sucesso' );
                
                param['id'] = retorno;
                this.cdr.markForCheck();
                this.onSave.emit( param );
                this.prescricaoItensCidCiad.emit( retorno );
                
                this.usoContinuo = false;
                this.transcricao = false;
                this.profissional = undefined;
                this.profissionalPrescricaoSelecionado = '';
                this.cdr.markForCheck();
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    arquivo;
    enviarAnexo(anexo) {
        this.arquivo = anexo;
        this.cdr.markForCheck();
    }

    anexaArquivo(anexo){
        if (!anexo) {
            this.arquivo = undefined
        }

        this.cdr.markForCheck();
    }

    abrirAnexo(ev, id) {
        ev.stopPropagation();
        ev.preventDefault();

        window.open(this.serviceUtil.getArquivo(id, true), '_blank');
    }

    objProfissionalPrescricao;
    fnCfgprofissionalPrescricaoRemote(term) {

        let objParam: Object;
        if (!term.match(/\D/g)) {
            objParam = { conselhoNumero : term };
        }else{
            objParam = { like : term };
        }

        objParam['pagina'] = 1;
        objParam['quantidade'] = 10;

        this.profissionalService.get(objParam).subscribe(
            (retorno) => {
                this.objProfissionalPrescricao = retorno.dados || retorno;
                this.cdr.markForCheck();
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }
    
    getProfissionalPrescricao(evento){
        if (evento) {
            this.profissional = { id : evento['id'] };
            this.profissionalPrescricaoSelecionado = evento['nome'];
        }else{
            this.profissional = undefined;
        }

        this.cdr.markForCheck();
    }

    
    validaRespostasCidCiap(){
        // TODO Perguntas chapadas por enquanto //
        // (2462, 2502) => (CIP e CIAP) //
        for (var key in this.respostas) {
            let pergunta = key.split("-");

            if (pergunta[0] == '2462' && this.respostas[key].valor) {
                let resposta = this.respostas[key].valor.split(" - ");

                this.serviceCid.getCidLike(resposta[1]).subscribe(
                    (retorno) => {
                        let request = {idCid: retorno[0].id, idUnidadeAtendimento: this.unidadeSelecionada}

                        this.serviceModeloDiagnostico.getModeloDiagnostico(request).subscribe(
                            (retorno) => {
                                retorno.dados.forEach(diagnostico => {

                                    this.serviceModelos.get( {id: diagnostico.modelo.id} ).subscribe(
                                        (retorno) => {
                                            retorno.dados.forEach(modelo => {

                                                modelo.itens.forEach(item => {
                                                    item.prescricaoItem.dias = 1;

                                                    this.prescricaoItem.unshift(item.prescricaoItem);
                                                });
                                            });
                                        }, (erro) => {
                                            Servidor.verificaErro(erro, this.toastr);
                                            this.cdr.markForCheck();
                                        }
                                    );
                                });
                            }, (erro) => {
                                Servidor.verificaErro(erro, this.toastr);
                                this.cdr.markForCheck();
                            }
                        );
                    }, (erro) => {
                        Servidor.verificaErro(erro, this.toastr);
                        this.cdr.markForCheck();
                    }
                );
            }

            if (pergunta[0] == '2502' && this.respostas[key].valor) {
                let resposta = this.respostas[key].valor.split(" - ");

                this.serviceCiap.get({like:resposta[0]}).subscribe(
                    (retorno) => {
                        let request = {idCiap: retorno.dados[0].id, idUnidadeAtendimento: this.unidadeSelecionada}

                        this.serviceModeloDiagnostico.getModeloDiagnostico(request).subscribe(
                            (retorno) => {
                                retorno.dados.forEach(diagnostico => {

                                    this.serviceModelos.get( {id: diagnostico.modelo.id} ).subscribe(
                                        (retorno) => {
                                            retorno.dados.forEach(modelo => {

                                                modelo.itens.forEach(item => {
                                                    item.prescricaoItem.dias = 1;
                                                    item.prescricaoItem.unidade = this.unidadeSelecionada;

                                                    this.prescricaoItem.unshift(item.prescricaoItem);
                                                });
                                            });
                                        }, (erro) => {
                                            Servidor.verificaErro(erro, this.toastr);
                                            this.cdr.markForCheck();
                                        }
                                    );
                                });
                            }, (erro) => {
                                Servidor.verificaErro(erro, this.toastr);
                                this.cdr.markForCheck();
                            }
                        );
                    }, (erro) => {
                        Servidor.verificaErro(erro, this.toastr);
                        this.cdr.markForCheck();
                    }
                );
            }
        }
    // Fim do codigo chapado
    }
}