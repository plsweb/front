import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { ToastrService } from 'ngx-toastr';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { Sessao, Servidor, CuidadoService, FormularioService, TabelaApi, CuidadoTipoService, UsuarioService, PapelPermissaoService, PerguntaService } from 'app/services';

import * as moment from 'moment';
import { NgbdModalContent } from 'app/theme/components';
moment.locale('pt-br');

@Component({
    selector: 'detalheCuidado',
    templateUrl: './detalheCuidado.html',
    styleUrls: ['./detalheCuidado.scss'],
    providers: []
})
export class DetalheCuidado implements OnInit {
    
    acao;
    acaoId;
    tiposAcoes;
    atual = "geral";
    opcoesConflitos = [];
    opcoesResolucao = [];
    permissoes = [];
    papeis = [];
    novaPermissao = new Object();

    constructor(
        private toastr: ToastrService, 
        private router: Router,
        private route: ActivatedRoute,
        private cuidadoService: CuidadoService,
        private cuidadoTipoService: CuidadoTipoService,
        private serviceFormulario: FormularioService,
        private tabelaApiService: TabelaApi,
        private servicePergunta: PerguntaService,
        private usuarioService: UsuarioService,
        private papelPermissaoService: PapelPermissaoService,
        private modalService: NgbModal,
    ) {
        this.route.params.subscribe(params => {
            this.acaoId = params['acaoid'] == 'novo' ? undefined : params['acaoid'];

            if (!this.acaoId){
                return;
            }
            this.carregaAcao();
        });

        this.iniciaAcao();
    }

    ngOnInit() {

        this.atual = 'geral';

        this.cuidadoService.getResolucaoConflito().subscribe(
            (resolucoes) => {
                this.opcoesResolucao = resolucoes.dados || resolucoes;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        )
        
        this.opcoesConflitos = [
            { descricao:'E', id:'E'},
            { descricao:'OU', id:'OU'},
        ];

        this.iniciaTiposCuidado();
        this.iniciaPapeis();
    }

    ngAfterViewInit() {

    }

    //  =============================================
    //                  GETs and SETs
    //  =============================================
    getNome(evento) {
        this.acao.descricao = evento.valor;
    }
    eFormulario = false;
    ePergunta = false;
    getTipoAcao(evento) {
        if (!this.acao){
            return;
        }

        if( evento.valor ){
            this.acao.tipo = {id:evento.valor};

            this.cuidadoTipoService.get( { id : evento.valor } ).subscribe(
                (retorno) => {
                    // let idTabelApi = retorno.dados.length ? retorno.dados[0]
                    if( retorno.dados.length ){
                        if( retorno.dados[0].tabela ){
                            this.tabelaApiService.get( { id : retorno.dados[0].tabela.id } ).subscribe(
                                (retorno)=>{
                                    this.validaTipoAcaoTabela(retorno)
                                }
                            )
                        }
                    }
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                },
            )
        }

    }
    getConflito(evento) {
        this.acao.conflito = evento.valor;
    }

    validaTipoAcaoTabela(retorno){
       if( retorno.dados.length ){
            if( (retorno.dados[0].nome.indexOf("Formulario") >= 0) || (retorno.dados[0].nome.indexOf("Atendimento") >= 0) ){
                this.eFormulario = true;
            }else if( retorno.dados[0].nome.indexOf("Pergunta") >= 0 ){
                this.ePergunta= true;
            }
        }
    }

    papel;
    papelSelecionado;
    objPapeis;
    getPapel(papel) {
        this.papel = papel;
        if( papel ){
            this.papelSelecionado = papel.descricao.trim() || papel.nome;
        }
    }
    fnCfgPapelRemote(term) {
        this.usuarioService.papel({like: term}).subscribe(
            (retorno) => {
                this.objPapeis = retorno.dados || retorno;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        )
    }

    formularioSelecionado;
    formulario = [];
    getFormulario(formulario) {
        this.acao['formulario'] = { id : formulario.id };
        this.formularioSelecionado = formulario.descricao
    }

    objFormularios;
    fnCfgFormularioRemote(term) {
        this.serviceFormulario.getFormularioLike(term).subscribe(
            (retorno) => {
                this.objFormularios = retorno.dados || retorno;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        );
    }

    perguntaSelecionada;
    pergunta = [];
    getPergunta(pergunta) {
        this.acao['pergunta'] = { id : pergunta.id };
        this.perguntaSelecionada = pergunta.descricao
    }

    objPerguntas;
    fnCfgPerguntaRemote(term) {
        let request = {
            like: term
        }
        this.servicePergunta.pergunta(request).subscribe(
            (retorno) => {
                this.objPerguntas = retorno.dados || retorno;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        );
    }

    //  =============================================
    //                  Componentes dados
    //  =============================================
    iniciaAcao() {
        this.acaoId = undefined;
        this.acao = new Object();
    }

    carregaAcao() {
        let id = this.acaoId;
        let request = {id: id};

        this.cuidadoService.get(request).subscribe(
            (acaoResponse) => { 
                this.acao = acaoResponse.dados[0];
                this.acaoId = this.acao.id;
                if( this.acao.formulario ){
                    this.formularioSelecionado = this.acao.formulario.descricao;
                }
                this.iniciaPapeisPermissao();
            },
            (erro) => {
                
                Servidor.verificaErro(erro, this.toastr);
            }
        );
    }

    abreModalEditarFormulario(){
        
    }

    iniciaPapeis() {
        this.usuarioService.papel().subscribe((papeis)=> {
            this.papeis = papeis.dados;
        });
    }

    iniciaPapeisPermissao() {
        let request = {
            permissaoNome: this.acao.permissao.nome
        };
        this.papelPermissaoService.get(request).subscribe((resposta) => {
            this.permissoes = resposta.dados;
        });
    }

    iniciaTiposCuidado() {
        this.cuidadoTipoService.get().subscribe((cuidados)=> {
            this.tiposAcoes = cuidados.dados;
        },
        (erro) => {
            Servidor.verificaErro(erro, this.toastr);
        });
    }

    //  =============================================
    //              Eventos components
    //  =============================================
    navegar(aba) {
        this.atual = aba;
    }

    voltar() {
        this.router.navigate([`/${Sessao.getModulo()}/acaocuidado`]);
    }

    //  =============================================
    //                  Ações
    //  =============================================

    validaPapelPermissao() {
        if (!this.papelSelecionado) {
            this.toastr.warning('Informe o papel');
            return;
        }

        return true;
    }

    validaAcao() {
        
        if (!this.acao.descricao) {
            this.toastr.warning('Informe o nome');
            return;
        }

        if (!this.acao.tipo) {
            this.toastr.warning('Informe o tipo da Ação');
            return;
        }

        if (!this.acao.conflito) {
            this.toastr.warning('Informe o conflito da Ação');
            return;
        }

        if (this.eFormulario && !this.acao['formulario']) {
            this.toastr.warning('Tipo da ação precisa ter um Formulário');
            return;
        }

        if( this.ePergunta && !this.acao['pergunta'] ){
            this.toastr.warning('Tipo da ação precisa ter uma Pergunta');
            return;
        }

        return true;
    }

    atualizaPermissao($event, permissao, acao){
        let request = {
            "papel": {
                "guid": permissao.papel.guid
            },
            "permissao": {
                "nome": permissao.permissao.nome
            }
        };
        request[acao] = $event ? "PERMITIR" : "NEGAR";

        this.papelPermissaoService.put(request).subscribe((resposta) => {
            this.iniciaPapeisPermissao();
            this.toastr.success(`Permissão atualizada com sucesso`);
        }, (erro) => {
            Servidor.verificaErro(erro, this.toastr);
        });
    }

    salvarPapelPermissao() {
        if (!this.validaPapelPermissao()) {
            return;
        }
        
        let request = {
            "papel": {
                "guid": this.papel.guid
            },
            "permissao": {
                "nome": this.acao.permissao.nome
            }
        };

        this.papelPermissaoService.post(request).subscribe((resposta) => {
            this.iniciaPapeisPermissao();
            this.toastr.success(`Permissão atualizada com sucesso`); 
        }, (erro) => {
            Servidor.verificaErro(erro, this.toastr);
        });
    }

    salvarAcao() {

        if (!this.validaAcao()) {
            return;
        }

        let id = this.acaoId;
        let request = {
            id: id,
            descricao: this.acao.descricao,
            conflito: this.acao.conflito,
            diasInicio: this.acao.diasInicio,
            resolucaoConflito: this.acao.resolucaoConflito,
            tipo: {id: this.acao.tipo.id}
        };

        if( this.acao.formulario && this.acao.formulario.id ){
            request['formulario'] = { id: this.acao.formulario.id};
        }else if( this.acao.pergunta && this.acao.pergunta.id ){
            request['pergunta'] = { id: this.acao.pergunta.id};
        }

        if (this.acaoId) {
            this.cuidadoService.put(request).subscribe(
                () => { 
                    this.toastr.success(`Ação atualizada com sucesso`); 
                },
                (erro) => { 
                    Servidor.verificaErro(erro, this.toastr);
                }
            );
        } else {
            this.cuidadoService.post(request).subscribe(
                (cuidadoResponse) => {
                    this.router.navigate([`/${Sessao.getModulo()}/acaocuidado/cuidado/${cuidadoResponse}`]);
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                }
            );
        }
    }

    modalConfirmar;
    excluir() {
        this.modalConfirmar = this.modalService.open(NgbdModalContent);
        this.modalConfirmar.componentInstance.modalHeader = `${this.acao.descricao}`;
        this.modalConfirmar.componentInstance.modalMensagem = `Tem certeza que deseja excluir esse cuidado?`;
        this.modalConfirmar.componentInstance.modalAlert = true;

        this.modalConfirmar.componentInstance.retorno.subscribe(
            (retorno) => {
                if (retorno) {
                    this.cuidadoService.delete(this.acaoId).subscribe(
                        () => {
                            this.toastr.success("Cuidado removido com sucesso.");
                            this.voltar();
                        }, (error) => {
                            Servidor.verificaErro(error, this.toastr);
                        }
                    );
                }
            }
        );
    }
}