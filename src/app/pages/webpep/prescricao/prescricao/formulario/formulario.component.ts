import { Component, Input, ViewContainerRef, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Servidor, Sessao, PrescricaoItemService, ProdutoService, EspecialidadeService, PrescricaoItemEspecialidadeService, ProdutoItemService, LocalAtendimentoService, PrescricaoItemUnidadeService, DicionarioTissService} from '../../../../../services';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';

import { NgbdModalContent, FormatosData } from '../../../../../theme/components';

@Component({
    selector: 'item-prescricao',
    templateUrl: './formulario.html',
    styleUrls: ['./formulario.scss'],
    providers:[EspecialidadeService]
})
export class ItensPrescricao implements OnInit {

    @Input() idPrescricao = 'novo';

    novaPrescricao:any ={};

    formatosDeDatas;
    colorPicker;

    tamanhoMaximo = 120;

    dosePadrao;
    opcoesDmTissUnidadeMedica;
    opcoesUnidadeMedida = [];
    opcoesFrequencia = [];
    opcoesViaAcesso = [];

    constructor(
        private toastr: ToastrService, 
        private vcr: ViewContainerRef,
        private modalService: NgbModal,
        private route: ActivatedRoute,
        private service: PrescricaoItemService,
        private servicePrescricaoItemUnidade: PrescricaoItemUnidadeService,
        private serviceItemEspecialidade: PrescricaoItemEspecialidadeService,
        private serviceEspecialidade: EspecialidadeService,
        private serviceItemProduto: ProdutoItemService,
        private serviceTISS: DicionarioTissService,
        private localAtendimentoService: LocalAtendimentoService,
        private serviceProduto: ProdutoService,
        private router: Router) 
    {
        
        if( this.idPrescricao ){
            this.route.params.subscribe(params => {
                this.idPrescricao = (params["idprescricao"] != 'novo') ? params["idprescricao"] : undefined
            });
        }

        this.novaPrescricao['frequencia'] = {  };        

    }

    ngOnInit() {
        this.dosePadrao = Sessao.getEnum('DosePadrao').lista;

        this.serviceTISS.getUnidadeMedida().subscribe(
            (retorno ) => {
                this.opcoesDmTissUnidadeMedica = retorno.dados || retorno;
            }
        )

        this.formatosDeDatas = new FormatosData();

        if( this.idPrescricao ){
            this.setPrescricao();
        }

        this.getFrequencias();
        this.getUnidades();
        this.getViasAcesso();
        this.getUnidadesAtendimento();

    }

    salvarProdutoPrescricao(){
        let novoProduto = this.validaNovoProdutoPrescricao(this.objParamAddProduto);

        this.serviceItemProduto.salvar(novoProduto).subscribe(
            () => {
                this.router.navigate([`/${Sessao.getModulo()}/itemprescricao/${this.idPrescricao}`]);
                this.toastr.success("Produto adicionado com sucesso");
                this.setPrescricao();
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        ) 
    }

    removerProduto(produtoObj){
        if( confirm("Deseja remover " + produtoObj.produto.nome + " ?") ){
            this.serviceItemProduto.excluir( produtoObj.id ).subscribe(
                () => {
                    this.toastr.success("Produto removido com sucesso");
                    this.novaPrescricao['produtos'] = this.novaPrescricao['produtos'].filter((produto) => {
                        return produto.id != produtoObj.id;
                    });
                }
            )
        }
    }

    validaNovoProdutoPrescricao(obj){

        obj['prescricaoItem'] = { id : this.idPrescricao };

        return obj;
    }

    salvarPrescricao(){

        this.novaPrescricao = this.validaNovaPrescricao(this.novaPrescricao);

        // if( !this.novaPrescricao['mensagemLembrando'] || this.novaPrescricao['mensagemLembrando'].trim() == '' ){
        //     this.toastr.warning("Mensagem lembrando do agendamento é obrigatória");
        //     return;
        // }

        if(!this.idPrescricao){
            this.service.salvar(this.novaPrescricao).subscribe(
                retorno => {
                    this.idPrescricao = retorno;
                    this.router.navigate([`/${Sessao.getModulo()}/itemprescricao/${retorno}`]);
                    this.toastr.success("Item de Prescrição "+this.novaPrescricao['nome']+" adicionado com sucesso");
                    this.setPrescricao();
                }
            ) 
        }else{
            this.service.atualizar( this.idPrescricao, this.novaPrescricao).subscribe(
                () => {
                    this.toastr.success("Item de Prescrição Prescrição " + this.novaPrescricao['nome'] + " atualizado com sucesso");
                }
            ) 
        }
    }

    objUnidadesItem = new Object();
    setPrescricao(){

        //MUDAR PARA GETATENDIMENTOTIPOPORID
        this.service.get( { id : this.idPrescricao } ).subscribe(
            (tipo) => {
                let objPrescricao = tipo.dados[0];
                this.serviceItemProduto.get( { idPrescricaoItem : this.idPrescricao } ).subscribe(
                    (produtos)=> {
                        objPrescricao['produtos'] = produtos.dados || produtos;
                        
                        this.serviceItemEspecialidade.get( { idPrescricaoItem : this.idPrescricao } ).subscribe(
                            (especialidades) => {
                                objPrescricao['especialidades'] = especialidades.dados || especialidades;

                                this.servicePrescricaoItemUnidade.get( { idPrescricaoItem : this.idPrescricao } ).subscribe(
                                    (unidades) => {
                                        objPrescricao['unidadesAtendimento'] = (unidades.dados || unidades).map(
                                            (unidade) => {
                                                let obj = unidade;
                                                obj['idPrescricaoItemUnidade'] = unidade.id;
                                                this.objUnidadesItem[unidade.unidadeAtendimento.id] = unidade.id
                                                return obj;
                                            }
                                        );

                                        this.novaPrescricao = this.validaPrescricao( objPrescricao );

                                    }
                                )
                                
                            }
                        )

                    }
                )

            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        )
    }

    validaNovaPrescricao(obj){

        let objSalva = Object.assign({}, obj);

        delete objSalva.unidades;
        delete objSalva.unidadesAtendimento;
        delete objSalva.prescricaoItemEspecialidade;
        delete objSalva.especialidades;

        if( !objSalva.frequencia || ( objSalva.frequencia && !objSalva.frequencia.id )  ){
            delete objSalva.frequencia;
        }

        if( !objSalva.viaAcesso ){
            delete objSalva.viaAcesso;
        }

        return objSalva;
    }

    validaPrescricao(prescricao){
        console.log(prescricao);
        
        return prescricao;
    }

    valorProdutoSelecionado;
    objParamAddProduto = new Object();
    setObjParamProduto(evento){
        if( evento ){
            this.objParamAddProduto['produto'] = { 
                id : evento.id,
            };    

            this.valorProdutoSelecionado = evento.nome;

        }        
    }

    objProdutos;  
    fnCfgProdutoRemote(term) {
        this.serviceProduto.get({ like : term, principal : true }).subscribe(
            (retorno) => {
                this.objProdutos = retorno.dados || retorno;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        );
    }

    voltar(){
        this.router.navigate([`/${Sessao.getModulo()}/itemprescricao`]);
    }

    activeModal;
    adicionarEspecialidade(modalEspecialidades){
        this.activeModal = this.modalService.open(NgbdModalContent, {size: 'lg'})
        this.activeModal.componentInstance.modalHeader = 'Selecione uma especialidade';
        this.activeModal.componentInstance.templateRefBody = modalEspecialidades;
    }

    especialidades = [];
    getEspecialidade(evento) {

        if( evento.valor && evento.valor.length > 3 ){
            this.serviceEspecialidade.getEspecialidadeLike(evento.valor, 0, 10).subscribe(
                (especialidades) => {
                    this.especialidades = especialidades;
                }
            )
        }
    }

    selecionaEspecialidade(especialidade){

        var jaExiste = (this.novaPrescricao['especialidades'].filter(function(i) {
            return i.id == especialidade.id
        }).length > 0);
        
        if( jaExiste ){
            this.toastr.warning("Esse Item de Prescrição já possui essa especialidade");
            return;
        }        

        let objespecialidade = {
            "prescricaoItem" : {
                "id" : this.idPrescricao
            },
            "especialidade" : {
                "id": especialidade.id
            }
        }

        this.serviceItemEspecialidade.salvar(objespecialidade)
            .subscribe(() => {
                    this.toastr.success("Especialidade atualizada com sucesso");
                    this.novaPrescricao['especialidades'].push(especialidade);
                },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );
        
    }

    deleteEspecialidades(especialidade){

        if( confirm("Deseja realmente excluir essa especialidade?") ){

            this.serviceItemEspecialidade.excluir(especialidade.id)
                .subscribe(() => {
                        this.toastr.success("Especialidade removida com sucesso");
                        this.novaPrescricao['especialidades'] = this.novaPrescricao['especialidades'].filter(function (i) {
                            return i.id != especialidade.id;
                        });
                    },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                }
            );

        }
    }

    validaCheck(unidadeCheck){
        let estado = false;
        
        if( this.novaPrescricao['unidadesAtendimento'] && this.novaPrescricao['unidadesAtendimento'].length ){
            this.novaPrescricao['unidadesAtendimento'].forEach(
                (unidade) => {
                    if( (unidade.unidadeAtendimento || unidade).id == unidadeCheck.id ){
                        estado = true;
                    }
                }
            )
        }

        return estado;
    }

    salvarUnidadeAtendimento(valida, unidade){
        let obj = {
            "prescricaoItem" : {
                "id" : this.idPrescricao
            },
            "unidadeAtendimento" : {
                "id": unidade.id
            }
        }
        
        if( valida ){
            this.servicePrescricaoItemUnidade.salvar(obj)
                .subscribe((retornoIdUnidade) => {
                    this.objUnidadesItem[unidade.id] = retornoIdUnidade;
                    this.toastr.success("Unidade de Atendimento atualizada com sucesso");
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                }
            );
        }else{

            let idUnidadePrescricao = this.objUnidadesItem[unidade.id];

            this.servicePrescricaoItemUnidade.excluir( idUnidadePrescricao )
                .subscribe(() => {
                        delete this.objUnidadesItem[unidade.id];
                        this.toastr.success("Unidade de Atendimento removida com sucesso");
                    },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                }
            );
        }
    }

    produtoEdita = new Object();
    editaQuantidade(produto) {
        this.produtoEdita = {
            'id' : produto.id,
            'quantidade': produto.quantidade
        }
    }

    editaDosePadrao(produto) {
        this.produtoEdita = {
            'id' : produto.id,
            'dosePadrao': produto.dosePadrao
        }
    }

    valorQuantidade(evento) {
        this.produtoEdita['quantidade'] = evento.valor;
    }

    cancelQuantidade() {
        this.produtoEdita = {
            'id' : 0,
            'quantidade': 0
        }
    }

    salvarQuantidade(valor) {
        let param = { quantidade: valor};
        
        this.serviceItemProduto.atualizar(this.produtoEdita['id'], param).subscribe(
            () => {
                this.toastr.success("Quantidade editada com sucesso");
                this.serviceItemProduto.get({ idPrescricaoItem: this.idPrescricao }).subscribe((produtos) => {
                    this.novaPrescricao['produtos'] = produtos.dados || produtos;
                    this.cancelQuantidade();
                });
            },
            () => {
                this.toastr.error("Houve um erro ao editar quantidade do produto");
            }
        );
    }

    // dosePadraoEdita = new Object()
    // editaDosePadrao(produto){
    //     this.dosePadraoEdita = {
    //         'id' : produto.id,
    //         // 'dosePadrao': produto.dosePadrao
    //     }
    // }

    // cancelDosePadrao() {
    //     this.dosePadraoEdita = {
    //         'id' : 0,
    //         // 'dosePadrao': 0
    //     }
    // }

    // salvarDosePadrao(valor) {
    //     let param = { dosePadrao: valor};
        
    //     this.serviceItemProduto.atualizar(this.dosePadraoEdita['id'], param).subscribe(
    //         () => {
    //             this.toastr.success("Dose Padrão editada com sucesso");
    //             this.serviceItemProduto.get({ idPrescricaoItem: this.idPrescricao }).subscribe((produtos) => {
    //                 this.novaPrescricao['produtos'] = produtos.dados || produtos;
    //                 this.cancelDosePadrao();
    //             });
    //         },
    //         () => {
    //             this.toastr.error("Houve um erro ao editar quantidade do produto");
    //         }
    //     );
    // }

    qtdEdita = new Object();
    editaUnidade(produto) {
        this.qtdEdita = {
            'id' : produto.id,
            'unidade': produto.unidade ? produto.unidade.id : null
        }
    }

    salvarUnidade(valor) {
        let param = { unidade: { id : valor } };
        
        this.serviceItemProduto.atualizar(this.qtdEdita['id'], param).subscribe(
            () => {
                this.toastr.success("Unidade editada com sucesso");
                this.serviceItemProduto.get({ idPrescricaoItem: this.idPrescricao }).subscribe((produtos) => {
                    this.novaPrescricao['produtos'] = produtos.dados || produtos;
                    this.cancelUnidade();
                }, (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                });
            },
            () => {
                this.toastr.error("Houve um erro ao editar unidade do produto");
            }
        );
    }

    setViaAcesso(evento){
        this.novaPrescricao['viaAcesso'] = evento.valor;
    }

    valorUnidade(evento) {
        this.qtdEdita['unidade'] = evento.valor;
    }

    cancelUnidade() {
        this.qtdEdita = {
            'id' : 0,
            'unidade': 0
        }
    }

    getFrequencias(){
        this.serviceItemProduto.getFrequencias({}).subscribe(
            (retorno) => {
                this.opcoesFrequencia = retorno.dados || retorno;
            }
        )
    }

    getUnidades(){
        this.serviceItemProduto.getUnidades({}).subscribe(
            (retorno) => {
                this.opcoesUnidadeMedida = retorno.dados || retorno;
            }
        )
    }

    getViasAcesso(){
        this.serviceItemProduto.getViasAcesso({}).subscribe(
            (retorno) => {
                this.opcoesViaAcesso = retorno.dados || retorno;
            }
        )
    }

    unidadesAtendimento = [];
    getUnidadesAtendimento(){
        this.unidadesAtendimento = Sessao.getVariaveisAmbiente('unidadesAtendimento');
    }

    converteHora(valor = 0) {
        let hora = Math.floor(valor / 60);
        let minuto = Math.floor(valor % 60);

        return `${("00" + hora).slice(-2)}:${("00" + minuto).slice(-2)}:00`;
    }
}