import { Component, ViewChild, OnInit, TemplateRef, QueryList } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { Servidor, Sessao,PrescricaoItemService, EspecialidadeService, ProdutoItemService, 
    PrescricaoModeloService, ItemPrescricaoModeloService, CidService, CiapService, 
    ModeloDiagnosticoService, DicionarioTissService, Util } from '../../../../../services';

import { NgbdModalContent, FormatosData } from 'app/theme/components';

import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'formulario',
    templateUrl: './formulario.html',
    styleUrls: ['./formulario.scss'],
    providers:[EspecialidadeService]
})
export class Formulario implements OnInit {

    idModelo;

    novoModelo = new Object();
    requestDiagnostico = new Object();

    formatosDeDatas;
    colorPicker;

    tamanhoMaximo = 120;

    opcoesFrequencia = [];
    opcoesUnidadeMedida = [];
    opcoesViaAcesso = [];
    localAtendimento;
    idUnidade;

    unidadePadrao = 'mg';

    @ViewChild("bodyModalConfirm", {read: TemplateRef}) bodyModalConfirm: QueryList<TemplateRef<any>>;

    constructor(
        private toastr: ToastrService, 
        private modalService: NgbModal,
        private route: ActivatedRoute,
        private service: PrescricaoModeloService,
        private serviceItemProduto: ProdutoItemService,
        private serviceItemPrescricao: PrescricaoItemService,
        private serviceItemPrescricaoModelo: ItemPrescricaoModeloService,
        private serviceTISS: DicionarioTissService,
        private serviceModeloDiagnostico: ModeloDiagnosticoService,
        private serviceCiap: CiapService,
        private serviceCid: CidService,
        private router: Router) 
    {

        this.route.params.subscribe(params => {
            this.idModelo = (params["idmodelo"] != 'novo') ? params["idmodelo"] : undefined
        });

        this.novoModelo['frequencia'] = {  };        

    }

    dosePadrao;
    opcoesDmTissUnidadeMedica;
    ngOnInit() {
        this.dosePadrao = Sessao.getEnum('DosePadrao').lista;

        this.serviceTISS.getUnidadeMedida().subscribe(
            (retorno ) => {
                this.opcoesDmTissUnidadeMedica = retorno.dados || retorno;
            }
        )

        this.formatosDeDatas = new FormatosData();

        if( this.idModelo ){
            this.setModeloPrescricao();
            this.getModeloDiagnostico();
        }else{
            this.novoModelo['ativo'] = true;
            this.novoModelo['obrigaOrdem'] = false;
        }

        this.getFrequencias();
        this.getUnidades();
        this.getViasAcesso();

        this.localAtendimento = Sessao.getVariaveisAmbiente('unidadeAtendimentoUsuario');
        this.requestDiagnostico['unidadeAtendimento'] = { id: Sessao.getIdUnidade()};
        this.idUnidade = Sessao.getIdUnidade();
    }

    salvarItemModeloPrescricao(){
        let novoModeloItem = this.validaNovoItemModeloPrescricao(this.objParamAddProcedimento);

        this.serviceItemPrescricaoModelo.salvar(novoModeloItem).subscribe(
            () => {
                this.toastr.success("Item adicionado com sucesso");
                this.setModeloPrescricao();
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        ) 
    }

    removerItem(produtoObj){
        this.modalConfirmar = this.modalService.open(NgbdModalContent);
        this.modalConfirmar.componentInstance.modalHeader = "Remover";
        this.modalConfirmar.componentInstance.modalMensagem = "Deseja remover " + produtoObj.prescricaoItem.nome + " ?";
        this.modalConfirmar.componentInstance.modalAlert = true;

        this.modalConfirmar.componentInstance.retorno.subscribe(
            (retorno) => {
                if (retorno) {
                    this.serviceItemPrescricaoModelo.excluir( produtoObj.id ).subscribe(
                        () => {
                            this.toastr.success("Item removido com sucesso");
                            this.novoModelo['itens'] = this.novoModelo['itens'].filter(
                                (produto) => {
                                    return produto.id != produtoObj.id
                                }
                            )
                        },
                        () => {
                            this.toastr.success("Item removido com sucesso");
                            this.novoModelo['itens'] = this.novoModelo['itens'].filter(
                                (produto) => {
                                    return produto.id != produtoObj.id
                                }
                            )
                        }
                    )
                }
            }
        );
    }

    validaNovoItemModeloPrescricao(obj){
        let novoObj = Object.assign({}, obj);

        novoObj['prescricaoModelo'] = { id : this.idModelo };
        novoObj['dosePadrao'] = obj.dosePadrao;

        delete novoObj.frequencia.descricao;
        delete novoObj.frequencia.tempo;
        ( novoObj.frequenciaMinima && !novoObj.frequenciaMinima.id ) ? delete novoObj.frequenciaMinima : null;
        ( novoObj.frequenciaMaxima && !novoObj.frequenciaMaxima.id ) ? delete novoObj.frequenciaMaxima : null;

        let objValidado = Util.retornaObjValidado(novoObj);

        return objValidado;
    }

    campoEdita = {
        'dosePadrao': { },
        'frequencia': { },
        'infusaoMaximo': { },
        'infusaoMinimo': { },
        'viaAcesso': { }
    }
    editaCampoItem(ev, label, id, valor) {
        ev.stopPropagation();
    
        if( !this.campoEdita[label]['id'] || ( id != this.campoEdita[label]['id'] ) ){
            this.campoEdita[label] = {
                'id' : id,
                'valor': valor
            }
        }
    }

    modalMensagem;
    modalConfirmar;
    salvarCampoEdita(label, item, valor) {
        let param = new Object();

        this.objParamAddProcedimento['padrao'] = item;

        switch (label) {
            case 'viaAcesso':
            case 'dosePadrao':
                param[label] = valor;
                this.salvarItem(param, label);
                break;

            case 'frequencia':
                this.modalConfirmar ? this.modalConfirmar.close() : null;
                
                this.opcoesFrequencia.filter((freq) => {
                    if (freq.id == valor && freq.minutos != 0) {
                        if (freq.minutos < this.objParamAddProcedimento['padrao'].frequencia.minutos) {
                            this.modalMensagem = `Frequência selecionada menor que a padrão, deseja continuar?`;
        
                            this.modalConfirmar = this.modalService.open(NgbdModalContent);
                            this.modalConfirmar.componentInstance.modalHeader = 'Divergência';
                            this.modalConfirmar.componentInstance.templateRefBody = this.bodyModalConfirm;
                            this.modalConfirmar.componentInstance.modalAlert = true;
        
                            this.modalConfirmar.componentInstance.retorno.subscribe(
                                (retorno) => {
                                    if (retorno) {
                                        this.objParamAddProcedimento['frequencia']['id'] = valor;
                                        param['frequencia'] = { id: valor };
                                        this.salvarItem(param, label);
                                    } else {
                                        this.objParamAddProcedimento['frequencia']['id'] = this.objParamAddProcedimento['padrao'].frequencia.id;
                                        $("#Frequência").val(this.objParamAddProcedimento['frequencia']['id']);
                                    }                        
                                }
                            );
                        }else{
                            param['frequencia'] = { id: valor };
                            this.salvarItem(param, label);
                        }
                    }
                });

                break;
            
            case 'infusaoMaximo':
            case 'infusaoMinimo':
                param[label] = valor;
                item[label] = valor;
                this.salvarItem(param, label);
                break;

            default:
                break;
        }
    }

    salvarItem(param, label){
        this.serviceItemPrescricaoModelo.atualizar(this.campoEdita[label]['id'], param).subscribe(
            () => {
                this.toastr.success("Item editado com sucesso");
                this.campoEdita[label]['id'] = undefined;
                this.setModeloPrescricao();
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
                this.campoEdita[label]['id'] = undefined;
                this.toastr.error("Houve um erro ao editar item");
            }
        );
    }

    salvarModeloPrescricao(){
        let novoModelo = this.validanovoModelo(this.novoModelo);

        // if( !this.novoModelo['mensagemLembrando'] || this.novoModelo['mensagemLembrando'].trim() == '' ){
        //     this.toastr.warning("Mensagem lembrando do agendamento é obrigatória");
        //     return;
        // }

        if(!this.idModelo){
            this.service.salvar(novoModelo).subscribe(
                retorno => {
                    this.idModelo = retorno;
                    this.router.navigate([`/${Sessao.getModulo()}/modelo/${retorno}`]);
                    this.toastr.success("Item de Prescrição "+this.novoModelo['nome']+" adicionado com sucesso");
                    this.setModeloPrescricao();
                }
            ) 
        }else{
            this.service.atualizar( this.idModelo, novoModelo).subscribe(
                () => {
                    this.toastr.success("Item de Prescrição Prescrição "+this.novoModelo['nome']+" atualizado com sucesso");
                }
            ) 
        }
    }


    modalEditarItem;
    @ViewChild("modalEditaItem", {read: TemplateRef}) modalEditaItem: TemplateRef<any>;
    itemSelecionado;
    editarItem(item){
        this.itemSelecionado = item.prescricaoItem.id
        this.modalEditarItem = this.modalService.open(NgbdModalContent, { size: 'lg' });
        this.modalEditarItem.componentInstance.modalHeader = `Editar Item ${ item.prescricaoItem.nome }`;
        this.modalEditarItem.componentInstance.templateRefBody = this.modalEditaItem;
        this.modalEditarItem.componentInstance.custom_lg_modal = true;


        this.modalEditarItem.result.then(
            ()=>{
                this.itemSelecionado = undefined;
            },
            () => {
                this.itemSelecionado = undefined;
            }
        )
    }

    setModeloPrescricao(){
        this.service.get( { id : this.idModelo } ).subscribe(
            tipo => {
                let objPrescricao = tipo.dados[0];
                this.novoModelo = this.validaModeloPrescricao( objPrescricao );
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        )
    }

    valorCidSelecionado;
    valorCiapSelecionado;
    setModelo(evento, opcao){
        if( evento ){
            this.requestDiagnostico['modelo'] = {id: this.idModelo};

            if (opcao == "unidade") {
                this.requestDiagnostico['unidadeAtendimento'] = {id: evento.valor}
            }

            if (opcao == "cid") {
                this.valorCidSelecionado = `${evento.codigo} - ${evento.descricao}`;
                this.requestDiagnostico['cid'] = {id: evento.id};
            }
    
            if (opcao == "ciap") {
                this.valorCiapSelecionado = `${evento.codigo} - ${evento.descricao}`;
                this.requestDiagnostico['ciap'] = {id: evento.id};
            }
        }
    }

    fnCfgModeloRemote(opcao, term) {
        if (opcao == "cid") {
            this.serviceCid.getCidLike(term).subscribe(
                (retorno) => {
                    this.requestDiagnostico['cid'] = retorno.dados || retorno;
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                },
            );
        }

        if (opcao == "ciap") {
            this.serviceCiap.get(term).subscribe(
                (retorno) => {
                    this.requestDiagnostico['ciap'] = retorno.dados || retorno;
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                },
            );
        }
    }

    salvaDiagnostico(request, idDiagnostico = false) {console.log(request)
        if ( !request.cid && !request.ciap ) {
            this.toastr.warning("CIP e/ou CIAP é obrigatório");
            return;
        }

        if (idDiagnostico) {
            this.serviceModeloDiagnostico.putModeloDiagnostico(idDiagnostico, request).subscribe(
                () => {
                    this.toastr.success("Modelo diagnostico atualizado com sucesso");
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                }
            );
        } else {
            this.serviceModeloDiagnostico.postModeloDiagnostico(request).subscribe(
                () => {
                    this.getModeloDiagnostico();
                    this.toastr.success("Modelo diagnostico inserido com sucesso");
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                }
            );
        }
    }

    editarDiagnostico(diagnostico) {
        console.log(diagnostico)
    }

    deleteDiagnostico(idDiagnostico, i) {
        this.serviceModeloDiagnostico.deleteModeloDiagnostico(idDiagnostico).subscribe(
            () => {
                this.toastr.success("Modelo diagnostico excluido com sucesso");
                delete this.objDiagnostico[i];
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );
    }

    valorProcedimentosSelecionado;
    objParamAddProcedimento:any = {
        frequencia : '',
        viaAcesso: '',
    };
    setObjParamProcedimentos(evento){
        if( evento ){
            
            this.produtosItemSelecionado = [];

            this.objParamAddProcedimento['prescricaoItem'] = {
                id : evento.id,
            };

            this.setProdutosItem(evento.id);

            this.valorProcedimentosSelecionado = evento.nome;
            this.objParamAddProcedimento['frequencia'] = evento.frequencia || { id : undefined};
            this.objParamAddProcedimento['frequenciaMinima'] = evento.frequenciaMinima || { };
            this.objParamAddProcedimento['frequenciaMaxima'] = evento.frequenciaMaxima || { };
            this.objParamAddProcedimento['viaAcesso'] = evento.viaAcesso ? evento.viaAcesso : 'SEM VIA ACESSO';
            this.objParamAddProcedimento['padrao'] = evento;
        }
    }

    produtosItemSelecionado = [];
    setProdutosItem(id){
        this.serviceItemProduto.get( { idPrescricaoItem : id } ).subscribe(
            (produtos)=> {
                this.produtosItemSelecionado = produtos.dados || produtos;
            }
        )
    }

    objProcedimentos;  
    fnCfgProcedimentosRemote(term) {
        this.serviceItemPrescricao.get({ like : term }).subscribe(
            (retorno) => {
                this.objProcedimentos = retorno.dados || retorno;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        );
    }

    validanovoModelo(obj){
        let novoObj = Object.assign({}, obj);
        delete novoObj.itens;

        return novoObj;
    }

    validaModeloPrescricao(prescricao){

        return prescricao;
    }

    voltar(){
        this.router.navigate([`/${Sessao.getModulo()}/modelo`]);
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

    objDiagnostico;
    getModeloDiagnostico(){

        // let objrequestPadrao = {
        //     idModelo: this.idModelo
        // }

        // request = Object.assign(objrequestPadrao, request);
        // this.serviceModeloDiagnostico.getModeloDiagnostico(request).subscribe(
        //     (retorno) => {
        //         this.objDiagnostico = retorno.dados || retorno;
        //     }
        // )
    }

    filtroCidSelecionado;
    filtroCiapSelecionado;
    filtroDiagnostico = new Object();
    setFiltroModelo(evento, opcao){
        if( evento ){
            if (opcao == "unidade") {
                this.filtroDiagnostico['unidadeAtendimento'] = (evento.valor != 0) ? evento.valor : '';
            }

            if (opcao == "cid") {
                this.filtroDiagnostico['cid'] = evento.id;
                this.filtroCidSelecionado = `${evento.codigo} - ${evento.descricao}`;
            }
    
            if (opcao == "ciap") {
                this.filtroDiagnostico['ciap'] = evento.id;
                this.filtroCiapSelecionado = `${evento.codigo} - ${evento.descricao}`;
            }
        }
    }

    filtrarDiagnostico() {

        this.getModeloDiagnostico();
    }

    limparFiltros(){
        this.requestDiagnostico['cid'] = 0;
        this.requestDiagnostico['ciap'] = 0;
        this.requestDiagnostico['unidadeAtendimento'] = 0;
        this.getModeloDiagnostico();
    }

    getViasAcesso(){
        this.serviceItemProduto.getViasAcesso({}).subscribe(
            (retorno) => {
                this.opcoesViaAcesso = retorno.dados || retorno;
            }
        )
    }

    converteHora(valor = 0) {
        let hora = Math.floor(valor / 60);
        let minuto = Math.floor(valor % 60);

        return `${("00" + hora).slice(-2)}:${("00" + minuto).slice(-2)}:00`;
    }

    ordemModelo(sobe, desce) {
        let request = {
            novoMaior: {
                id: desce
            },
            novoMenor: {
                id: sobe
            },
            prescricaoModelo: {
                id: this.idModelo
            }
        }

        this.serviceItemPrescricaoModelo.ordenar(request).subscribe(
            () => {
                this.setModeloPrescricao();
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }
}