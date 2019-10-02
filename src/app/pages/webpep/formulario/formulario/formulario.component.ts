import { ActivatedRoute, Router } from '@angular/router';
import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';

import { ToastrService } from 'ngx-toastr';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { Sessao, Servidor, FormularioService, UsuarioService, PerguntaService, GrupoPerguntaService, TabelaApi, FormularioModeloService } from 'app/services';

import { Saida, NgbdModalContent } from 'app/theme/components';


@Component({
    selector: 'formulario-grid',
    templateUrl: './formulario.html',
    styleUrls: ['./formulario.scss'],
    providers: [GrupoPerguntaService]
})
export class FormularioGrid implements OnInit {

    @Input() id;
    @Input() modoSelecaoPerguntas = false;
    @Input() perguntasSelecionadas;

    ativo: Saida;
    ativoValor;
    descricao: Saida;
    bloquear;
    descricaoValor;
    formularioPapeis;
    grupo: Saida;
    grupos;
    papeis = [];
    papeisCriar;
    naoEncontrouPergunta
    objFiltroPergunta = ['descricao', 'descricao'];
    papeisVer;
    papelCriar: Saida;
    modelos = [];
    papelVer: Saida;
    pergunta;
    saidaValor;
    searchById;
    titulo: Saida;
    tituloValor;
    tipoFormularioValor;

    modalConfirmar;

    tiposFormulario = [
        { id: 'EVOLUCAO', descricao: 'EVOLUÇÃO' },
        { id: 'MODELO', descricao: 'MODELO' },
    ]

    @Output() fnSelecionaPerguntas = new EventEmitter();

    scorecomp = [
        { "id": "X >", "descricao": "maior que" },
        { "id": "X <", "descricao": "menor que" },
        { "id": "X >=", "descricao": "maior/igual" },
        { "id": "X <=", "descricao": "menor/igual" },
        { "id": "X ==", "descricao": "igual a" },
        { "id": "X !=", "descricao": "diferente de" }
    ];

    scoreoper = [
        { "id": "||", "descricao": "OU" },
        { "id": "&&", "descricao": "E" }
    ]

    opcSexo = [
        { 'id': 'M', 'descricao': 'Masculino' },
        { 'id': 'F', 'descricao': 'Feminino' }
    ];

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private toastr: ToastrService,
        private modalService: NgbModal,
        private serviceGrupoPergunta: GrupoPerguntaService,
        private serviceModelo: FormularioModeloService,
        private serviceFormulario: FormularioService,
        private servicePergunta: PerguntaService,
        private usuarioService: UsuarioService,
        private serviceApiColuna: TabelaApi,
    ) {
        if (!this.id) {
            this.route.params.subscribe(params => {
                this.id = params['id'];
                sessionStorage.setItem('idFormulario', this.id);
            });
        } else {
            sessionStorage.setItem('idFormulario', this.id);
        }
    }

    ngOnInit() {
        this.usuarioService.papel().subscribe(
            (papeis) => {
                this.papeis = papeis.dados;
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );

        if (this.id) {
            this.serviceFormulario.getRoles(this.id).subscribe(
                (formularioPapeis) => {
                    this.formularioPapeis = formularioPapeis;
                    this.papeisCriar = this.filtrarPapeis('CRIAR');
                    this.papeisVer = this.filtrarPapeis('VER');
                }, (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                }
            );

            this.getGruposFormulario();

            this.buscarTags();

            this.serviceFormulario.getId(this.id).subscribe(
                (formulario) => {
                    let retorno = formulario.dados[0];

                    this.grupoPerguntasLocal(retorno);

                    this.bloquear = retorno.utilizadoNoCuidado;
                    this.ativoValor = retorno.ativo;
                    this.descricaoValor = retorno.descricao;
                    this.tituloValor = retorno.titulo;
                    this.tipoFormularioValor = retorno.tipo;
                    this.modelos = retorno.modelos;
                }, (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                }
            );
        } else {
            this.ativoValor = true;
            this.tipoFormularioValor = 'EVOLUCAO';
            console.log(this.tipoFormulario)
        }
    }

    objPerguntas;
    fnCfgPerguntaRemote(term) {
        this.servicePergunta.pergunta({ pagina: 1, quantidade: 10, like: term, simples: true }).subscribe(
            (retorno) => {
                let dados = retorno.dados || retorno;

                dados.forEach(pergunta => {
                    if (pergunta.tipo == "BOOLEAN") {
                        pergunta.tipo = "SIM OU NÃO"
                    }
                });

                this.objPerguntas = dados;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        )
    }

    grupoPerguntasLocal(retorno) {
        let gruposPergunta = [];

        retorno.formularioGrupo.forEach(
            (formularioGrupo) => {
                gruposPergunta = gruposPergunta.concat([], formularioGrupo.grupoPergunta);
            }
        )

        sessionStorage.setItem('gruposPergunta', JSON.stringify(gruposPergunta));
    }

    getGruposFormulario() {
        this.serviceFormulario.getGrupos(this.id).subscribe(
            (grupos) => {
                this.grupos = grupos;
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );
    }

    mostraPrincipal(grupo, pergunta) {
        let mesmaPergunta = true;

        if (grupo.grupoPergunta && grupo.grupoPergunta.length) {

            grupo.grupoPergunta.forEach(grupoPergunta => {

                if (grupoPergunta.pergunta && grupoPergunta.pergunta.condicoes && grupoPergunta.pergunta.condicoes.length) {

                    grupoPergunta.pergunta.condicoes.forEach(condicao => {

                        if (!!pergunta && condicao.grupoPerguntaFilho && pergunta.id == condicao.grupoPerguntaFilho.pergunta.id) {
                            mesmaPergunta = false;
                        }
                    });
                }
            });
        }

        return mesmaPergunta;
    }

    mostraCondicaoDependente(dados) {
        let tipo = "";
        let nome = "";

        if (dados.perguntaFilho) {
            tipo = "Dependente (Global)";
            nome = dados.perguntaFilho.descricao;
        } else if (dados.grupoPerguntaFilho) {
            tipo = "Dependente (Formulário)";
            nome = dados.grupoPerguntaFilho.pergunta.descricao;
        } else if (dados.formularioFilho) {
            tipo = "Formulário";
            nome = dados.formularioFilho.titulo;
        }

        return `${tipo} "${nome}"`;
    }

    mostraRespostaDependente(dados, opcoes) {
        let jsonResposta = JSON.parse(dados.resposta);
        let valor = jsonResposta.valor;

        if (opcoes && opcoes.length) {
            console.log(opcoes)
            let tmpValor = opcoes.filter((opcao) => { return opcao.id == valor })[0];

            if (tmpValor) {
                valor = tmpValor.descricao;
            }
        }
        let sCondicao = this.scorecomp.filter((score) => { return score.id == jsonResposta.condicao })[0];
        // let sCondicao = jsonResposta.condicao.replace(/X /, ``);
        return `${sCondicao.descricao} ${valor}`;
    }

    idAbaAberta;
    abrirAbaPergunta(idAba) {
        if (this.idAbaAberta == idAba) {
            this.idAbaAberta = "";
        } else {
            this.idAbaAberta = idAba;
        }
    }

    abrirCarregar() {
        $("#preloader").fadeIn(10);
    }

    fecharCarregar() {
        $("#preloader").fadeOut(10);
    }

    filtrarPapeis(tipo: string) {

        let tmp;
        if (this.formularioPapeis)
            tmp = this.formularioPapeis.filter(function (papel) {
                return papel.tipo === tipo;
            });

        return tmp;
    }

    validar() {

    }

    validaClasse(pos) {
        return (pos % 2 == 0);
    }

    getTitulo(evento) {
        this.titulo = evento;
        this.validar();
    }

    getDescricao(evento) {
        this.descricao = evento;
        this.validar();
    }

    tipoFormulario;
    getTipoFormulario(evento) {
        this.tipoFormulario = evento.valor;
        this.tipoFormularioValor = evento.valor;
        this.validar();
    }

    getAtivo(evento) {
        this.ativo = evento;
        this.validar();
    }

    getPapelCriar(evento) {
        this.papelCriar = evento;
        this.validar();
    }

    getPapelVer(evento) {
        this.papelVer = evento;
        this.validar();
    }

    getGrupo(evento) {
        this.grupo = evento;
        this.validar();
    }

    criarGrupo() {
        if (this.grupo.valido) {
            let grupo = {
                formulario: { id: this.id },
                ordem: null,
                descricao: this.grupo.valor
            };

            this.serviceFormulario.addGrupo(grupo).subscribe(
                (status) => {

                    let tmp = {
                        id: status,
                        descricao: this.grupo.valor
                    };

                    // if( !this.grupos.length ){
                    //     this.inserePerguntasCabecalho(status);
                    // }

                    this.grupos.push(tmp);
                    this.grupo.valor = "";

                }, (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                }
            );
        } else {
            alert("Insira o nome do grupo");
        }
    }

    addPapelCriar() {
        if (this.papelCriar.valido && this.papelCriar.valor != 0) {
            let papel = {
                formulario: { id: this.id },
                papel: { guid: this.papelCriar.valor },
                tipo: "CRIAR"
            };

            this.serviceFormulario.addRole(papel).subscribe(
                (status) => {
                    if (status) {
                        this.serviceFormulario.getRoles(this.id).subscribe(
                            (formularioPapeis) => {
                                this.toastr.success("Papel adicionado com sucesso");
                                this.formularioPapeis = formularioPapeis;
                                this.papeisCriar = this.filtrarPapeis('CRIAR');
                                this.papeisVer = this.filtrarPapeis('VER');
                            }, (erro) => {
                                Servidor.verificaErro(erro, this.toastr);
                            }
                        );

                        this.papelCriar = new Saida();
                    }
                }, (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                }
            );
        }
    }

    addPapelVer() {
        if (this.papelVer.valido && this.papelVer.valor != 0) {
            let papel = {
                formulario: { id: this.id },
                papel: { guid: this.papelVer.valor },
                tipo: "VER"
            };

            this.serviceFormulario.addRole(papel).subscribe(
                (status) => {
                    if (status) {
                        this.serviceFormulario.getRoles(this.id).subscribe(
                            (formularioPapeis) => {
                                this.toastr.success("Papel adicionado com sucesso");
                                this.formularioPapeis = formularioPapeis;
                                this.papeisCriar = this.filtrarPapeis('CRIAR');
                                this.papeisVer = this.filtrarPapeis('VER');
                            }, (erro) => {
                                Servidor.verificaErro(erro, this.toastr);
                            }
                        );

                        this.papelVer = new Saida();
                    }
                }, (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                }
            );
        }
    }

    submit() {
        let formulario = {
            "titulo": this.titulo.valor,
            "descricao": this.descricao.valor,
            "ativo": this.ativo.valor || this.ativo.valor == "true",
            "tipo": this.tipoFormularioValor
        };

        if (!this.id) {
            this.serviceFormulario.inserir(formulario).subscribe(
                (status) => {
                    if (status) {
                        this.toastr.success("Formulário criado com sucesso");
                        this.router.navigate([`/${Sessao.getModulo()}/formulario/formulario/` + status]);
                        sessionStorage.setItem('idFormulario', status);
                    }
                }, (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                }
            );
        } else {
            this.serviceFormulario.atualizar(this.id, formulario).subscribe(
                (status) => {
                    if (status) {
                        this.toastr.success("Formulário atualizado com sucesso");
                        this.router.navigate([`/${Sessao.getModulo()}/formulario/formulario/` + status]);
                    }
                }, (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                }
            );
        }
    }

    removerPapel(papel) {
        this.modalConfirmar = this.modalService.open(NgbdModalContent);
        this.modalConfirmar.componentInstance.modalHeader = `${papel.papel.nome}`;
        this.modalConfirmar.componentInstance.modalMensagem = `Deseja mesmo remover a permissão?`;
        this.modalConfirmar.componentInstance.modalAlert = true;

        this.modalConfirmar.componentInstance.retorno.subscribe(
            (retorno) => {
                if (retorno) {
                    this.serviceFormulario.removeRole(papel.id).subscribe(
                        (status) => {
                            if (status) {
                                this.serviceFormulario.getRoles(this.id).subscribe(
                                    (formularioPapeis) => {
                                        this.formularioPapeis = formularioPapeis;
                                        this.papeisCriar = this.filtrarPapeis('CRIAR');
                                        this.papeisVer = this.filtrarPapeis('VER');
                                    }, (erro) => {
                                        Servidor.verificaErro(erro, this.toastr);
                                    }
                                );
                            }
                        }, (erro) => {
                            Servidor.verificaErro(erro, this.toastr);
                        }
                    );
                }
            }
        );
    }

    deletarGrupo(grupo) {
        this.modalConfirmar = this.modalService.open(NgbdModalContent);
        this.modalConfirmar.componentInstance.modalHeader = `${grupo.descricao}`;
        this.modalConfirmar.componentInstance.modalMensagem = `Tem certeza que deseja excluir esse grupo?`;
        this.modalConfirmar.componentInstance.modalAlert = true;

        this.modalConfirmar.componentInstance.retorno.subscribe(
            (retorno) => {
                if (retorno) {
                    this.serviceFormulario.deleteGrupo(grupo.id).subscribe(
                        () => {
                            this.grupos = this.grupos.filter(function (i) {
                                return i != grupo
                            });
                        }, (erro) => {
                            Servidor.verificaErro(erro, this.toastr);
                        }
                    );
                }
            }
        );
    }

    editarPergunta(grupoPergunta, idFormularioGrupo) {
        if (this.modoSelecaoPerguntas)
            return;

        sessionStorage.setItem('idFormularioGrupo', idFormularioGrupo);
        this.router.navigate([`/${Sessao.getModulo()}/pergunta/formulario/${grupoPergunta.pergunta.id}`],  {queryParams: {grupoPergunta: grupoPergunta.id}});
    }

    adicionarPergunta(grupo) {
        this.router.navigate([`/${Sessao.getModulo()}/pergunta/formulario/0/${grupo.id}`]);
    }

    removerModelo(id) {
        this.serviceModelo.deletarModelo(id).subscribe(
            () => {
                this.modelos = this.modelos.filter(
                    (modelo) => {
                        return modelo.id != id;
                    }
                )
                this.editando = undefined;
                this.toastr.success("Modelo removido com sucesso");
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        )
    }

    excluirPergunta(grupoPergunta) {
        this.modalConfirmar = this.modalService.open(NgbdModalContent);
        this.modalConfirmar.componentInstance.modalHeader = `${grupoPergunta.pergunta.descricao}`;
        this.modalConfirmar.componentInstance.modalMensagem = `Tem certeza que deseja excluir essa pergunta?`;
        this.modalConfirmar.componentInstance.modalAlert = true;

        this.modalConfirmar.componentInstance.retorno.subscribe(
            (retorno) => {
                if (retorno) {
                    this.servicePergunta.excluirDeUmGrupo(grupoPergunta.id).subscribe(
                        () => {
                            this.toastr.success("Pergunta excluida");
                            this.grupos.forEach(
                                function (val) {
                                    val.grupoPergunta = val.grupoPergunta.filter(function (i) {
                                        return i != grupoPergunta;
                                    });
                                }
                            );

                            this.getGruposFormulario();
                        }, (error) => {
                            Servidor.verificaErro(error, this.toastr);
                        }
                    );
                }
            }
        );
    }

    clickMolduraGrupoPergunta(ev) {
        ev.stopPropagation();
        this.naoEncontrouPergunta = false;
    }

    trocaEstadoPerguntaObrigatoria($event, pergunta) {
        if (this.modoSelecaoPerguntas)
            return;

        pergunta.obrigatorio = $event;

        let grupoPerguntaRequest = {
            "obrigatorio": pergunta.obrigatorio
        };

        this.serviceGrupoPergunta.put(grupoPerguntaRequest, pergunta.id).subscribe(
            (resposta) => {
                let desmarcada = pergunta.obrigatorio ? 'marcada' : 'desmarcada';
                this.toastr.success(`Pergunta foi \"${desmarcada}\" como obrigatória`);
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );
    }

    validaEstadoPerguntaRelatorio(idpergunta) {
        // validar se essa pergunta já foi adicionada no relatorio

        let retorno = false
        if (this.perguntasSelecionadas && this.perguntasSelecionadas.length) {
            retorno = this.perguntasSelecionadas.indexOf(idpergunta) >= 0
        }

        return retorno;

    }

    trocaEstadoGrupoRepetir($event, formGrupo) {
        let grupoRequest = {
            "repetir": $event
        };

        this.serviceFormulario.putformularioGrupoPorId(formGrupo.id, grupoRequest).subscribe(
            (resposta) => {
                let repetir = $event ? 'com' : 'sem';
                this.toastr.success(`Grupo ${repetir} repetição de perguntas`);
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        );
    }

    visualizar() {
        this.router.navigate([`/${Sessao.getModulo()}/formulario/visualizar/${this.id}`]);
    }

    voltar() {
        this.router.navigate([`/${Sessao.getModulo()}/formulario`]);
    }

    perguntaSelecionada
    getPergunta(evento, idGrupo) {
        this.pergunta = evento;
        if (evento) {
            this.perguntaSelecionada = evento.descricao
        }

        this.buscaConfiguracoes(this.pergunta, idGrupo);
    }

    buscaConfiguracoes(objpergunta, grupoId, abrirCarregar = true) {

        let dadosPergunta = {
            "formularioGrupo": {
                "id": grupoId
            },
            "pergunta": {
                "id": objpergunta.id
            },
            "obrigatorio": false
        }

        if (abrirCarregar) {
            this.abrirCarregar();
        }

        this.servicePergunta.adicionarEmUmGrupo(dadosPergunta).subscribe(
            (idpergunta) => {

                this.criaCondicao(idpergunta);

                this.grupos.map(
                    (grupo, idx) => {
                        if (grupo.id == grupoId) {
                            dadosPergunta["id"] = idpergunta;
                            dadosPergunta["pergunta"] = objpergunta;
                            if (this.grupos[idx].grupoPergunta) {
                                this.grupos[idx].grupoPergunta.push(dadosPergunta)
                            } else {
                                this.grupos[idx].grupoPergunta = [dadosPergunta]
                            }
                        }
                    }
                )
                this.fecharCarregar()
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
                this.fecharCarregar();
            }
        )
    }

    getSearchById(evento) {
        this.searchById = evento;
    }

    tags = [];
    pesquisarTags(text) {
        this.serviceApiColuna.getColunas({ pagina: 1, quantidade: 10, like: text, palavrasChave: true }).subscribe(
            (retorno) => {
                this.tags = retorno.dados
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        )
    }

    paginaAtual = 1;
    itensPorPagina = 10;
    qtdItensTotal;
    buscarTags(evento = null, like = undefined) {
        this.paginaAtual = evento ? evento.paginaAtual : this.paginaAtual;

        let request = {
            pagina: this.paginaAtual,
            quantidade: this.itensPorPagina,
            palavrasChave: true
        };

        this.serviceApiColuna.getColunas(request).subscribe(
            (retorno) => {
                this.tags = (request.pagina == 1) ? retorno.dados : this.tags.concat([], retorno.dados);
                this.tags = retorno.dados;
                this.qtdItensTotal = retorno.qtdItensTotal;
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        )
    }

    ordenar(sobe, desce, idObj, label, service = 'serviceGrupoPergunta', posObj = undefined) {
        console.log("ID DE CIMA:  " + sobe);
        console.log("ID DE BAIXO:  " + desce);

        let request = {
            novoMaior: { id: desce },
            novoMenor: { id: sobe }
        }

        request[label] = {
            id: idObj
        }

        // serviceGrupoPergunta
        // serviceFormulario
        this[service].ordenar(request).subscribe(
            () => {
                if (service != 'serviceGrupoPergunta') {
                    this.getGruposFormulario();
                } else {
                    let params = {
                        formularioGrupoId: idObj
                    }
                    this[service].get(params).subscribe(
                        (gruposPergunta) => {
                            this.grupos[posObj].grupoPergunta = (gruposPergunta.dados || gruposPergunta);
                        }
                    )
                }
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );

    }

    textoModelo = '';
    salvarModelo() {
        if (this.textoModelo && this.textoModelo != '') {
            let request = {
                formulario: {
                    id: this.id
                },
                modelo: this.textoModelo
            }
            this.serviceModelo.salvarModelo(request).subscribe(
                (retorno) => {
                    this.serviceModelo.getModelos({ formularioId: this.id }).subscribe(
                        (modelos) => {
                            this.modelos = modelos.dados;
                            this.toastr.success("Modelo salvo com sucesso");
                        }, (erro) => {
                            Servidor.verificaErro(erro, this.toastr);
                        }
                    )
                }, (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                }
            )
        } else {
            this.toastr.warning("Necessario informar um texto para salvar o modelo de formulario");
        }
    }

    adicionarTag(palavra) {
        if (this.modelos[0].modelo) {

            this.modelos[0].modelo = this.textoModelo + ('§' + palavra + '§');
            this.alteraModelo(this.modelos[0], this.modelos[0].modelo);

        } else {
            this.toastr.warning("Não há modelos em edição no momento");
        }
    }

    editando;
    alteraModelo(id, textoModelo) {
        this.serviceModelo.atualizarModelo(this.id, { modelo: textoModelo }).subscribe(
            () => {
                this.textoModelo = textoModelo;
                this.modelos[0].modelo = textoModelo;
                this.toastr.success("Modelo foi atualizado com sucesso");
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );
    }

    editarModelo(opcao, modelo, textoModelo) {
        this.textoModelo = textoModelo;

        if (!opcao) {
            this.salvarModelo();

        } else {
            this.alteraModelo(modelo.id, textoModelo);
        }
    }

    valorPerguntaCondicao = new Object();
    criaCondicao(idpergunta) {

        /*
            {
                "pergunta":{
                    "id":"158"
                },
                "resposta":"{
                    \"condicao\":\"X ==\",\"valor\":\"123\"
                }",
                "formularioPai":{
                    "id":"188"
                },
                "perguntaFilho":{
                    "id":158
                    }
            }
        */

        // FOR EACH CADA PERGUNTA CADASTRO PACIENTE

        // Util.getPerguntasCabecalho().forEach(
        //     (perguntaCondicao) => {
        //         let resposta = {
        //             condicao: perguntaCondicao.condicao,
        //             valor: valorPerguntaCondicao[ perguntaCondicao.pergunta.nome ]
        //         };

        //         let requestCondicao = {
        //             pergunta: {id: perguntaCondicao.pergunta.id},
        //             resposta: JSON.stringify(resposta)

        //         };
        //     }
        // )
    }

    //ORDENAÇÃO GRUPO PERGUNTA
    dropPergunta(evento, pos) {
        if (this.modoSelecaoPerguntas) {
            return
        }

        evento.preventDefault();
        var data = evento;

        if (!data.target) {
            this.elementoDrag = undefined;
            return;
        }

        let elemento = data.target
        elemento = jQuery(elemento);

        let parentElement = jQuery(elemento).closest("tr.row-droppable")
        if (!jQuery(parentElement)) {
            this.elementoDrag = undefined;
            return;
        }

        let novaOrdem = parseInt(jQuery(parentElement).attr("data-index"));
        let ordemTrocada = parseInt(jQuery(this.elementoDrag).attr("data-index"));
        let idPergunta = jQuery(this.elementoDrag).attr("data-pergunta-id");
        let grupoId = jQuery(parentElement).attr("data-grupo-id");

        if (novaOrdem == ordemTrocada) {
            this.elementoDrag = undefined;
            return;
        }

        let linhasGrupo = jQuery(parentElement).closest(".table").find("tbody tr");

        if (novaOrdem > ordemTrocada) {
            let objOrdemMaior = ordemTrocada;
            for (var i = (ordemTrocada + 1); i <= novaOrdem; i++) {

                let idPerguntaAtt = jQuery(linhasGrupo).eq(i).attr("data-pergunta-id")
                this.serviceGrupoPergunta.put({ ordem: objOrdemMaior }, idPerguntaAtt).subscribe(
                    (retorno) => {

                    }, (erro) => {
                        Servidor.verificaErro(erro, this.toastr);
                    }
                );

                objOrdemMaior += 1;

            }
        } else {

            let objOrdemMenor = ordemTrocada;
            for (var p = (ordemTrocada - 1); p >= novaOrdem; p--) {

                let idPerguntaAtt = jQuery(linhasGrupo).eq(p).attr("data-pergunta-id")
                this.serviceGrupoPergunta.put({ ordem: objOrdemMenor }, idPerguntaAtt).subscribe(
                    (retorno) => {

                    }, (erro) => {
                        Servidor.verificaErro(erro, this.toastr);
                    }
                );

                objOrdemMenor -= 1;

            }

        }

        this.serviceGrupoPergunta.put({ ordem: novaOrdem }, idPergunta).subscribe(
            (status) => {
                this.getPerguntasGrupo(grupoId, pos);
                this.toastr.success("Ordem atualizada com sucesso");
                this.elementoDrag = undefined;
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );

    }

    getPerguntasGrupo(idGrupoAtualizado, pos) {
        if (!!idGrupoAtualizado) {
            let request = {
                formularioGrupoId: idGrupoAtualizado
            };
            this.serviceGrupoPergunta.get(request).subscribe(
                (retorno) => {
                    let perguntas = retorno.dados || retorno
                    this.grupos[pos].grupoPergunta = perguntas;
                }, (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                }
            )
        }
    }

    allowDropPergunta(evento) {
        if (this.modoSelecaoPerguntas)
            return

        evento.preventDefault();
    }

    elementoDrag;
    dragStartPergunta(evento) {
        if (this.modoSelecaoPerguntas)
            return

        evento.dataTransfer.setData('text', 'anything');
        this.elementoDrag = jQuery(evento.target);
    }

    // ORDENAÇÃO FORMULARIO GRUPO
    dropGrupo(evento, pos) {
        if (this.modoSelecaoPerguntas)
            return

        if (this.elementoDrag) {
            return;
        }

        evento.preventDefault();
        var data = evento;

        if (!data.target) {
            this.elementoDragGrupo = undefined;
            return;
        }

        let elemento = data.target

        elemento = jQuery(elemento);

        let parentElement = jQuery(elemento).closest(".bloco-grupo")
        if (!jQuery(parentElement)) {
            this.elementoDragGrupo = undefined;
            return;
        }


        let novaOrdem = parseInt(jQuery(parentElement).attr("data-index"));
        let ordemTrocada = parseInt(jQuery(this.elementoDragGrupo).attr("data-index"));
        let idGrupo = jQuery(this.elementoDragGrupo).attr("data-grupo-id");
        let formId = this.id;

        if (novaOrdem == ordemTrocada) {
            this.elementoDragGrupo = undefined;
            return;
        }

        let blocosGrupos = jQuery(parentElement).closest(".parent-blocos-grupo").find(".bloco-grupo");

        if (novaOrdem > ordemTrocada) {
            let objOrdemMaior = ordemTrocada;
            for (var i = (ordemTrocada + 1); i <= novaOrdem; i++) {

                let idGrupoAtt = jQuery(blocosGrupos).eq(i).attr("data-grupo-id")
                this.serviceFormulario.putGrupo(idGrupoAtt, { ordem: objOrdemMaior }).subscribe(
                    (retorno) => {

                    }, (erro) => {
                        Servidor.verificaErro(erro, this.toastr);
                    }
                );

                objOrdemMaior += 1;

            }
        }

        else {

            let objOrdemMenor = ordemTrocada;
            for (var p = (ordemTrocada - 1); p >= novaOrdem; p--) {

                let idGrupoAtt = jQuery(blocosGrupos).eq(p).attr("data-grupo-id")
                this.serviceFormulario.putGrupo(idGrupoAtt, { ordem: objOrdemMenor }).subscribe(
                    (retorno) => {

                    }, (erro) => {
                        Servidor.verificaErro(erro, this.toastr);
                    }
                );

                objOrdemMenor -= 1;

            }

        }

        this.serviceFormulario.putGrupo(idGrupo, { ordem: novaOrdem }).subscribe(
            (status) => {
                this.getGruposFormulario();
                this.toastr.success("Ordem do grupo atualizada com sucesso");
                this.elementoDragGrupo = undefined;
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        )

    }

    allowDropGrupo(evento) {

        if (this.modoSelecaoPerguntas)
            return

        evento.preventDefault();
    }

    elementoDragGrupo;
    dragStartGrupo(evento) {
        if (this.modoSelecaoPerguntas)
            return

        evento.dataTransfer.setData('text', 'anything');
        this.elementoDragGrupo = jQuery(evento.target);
    }

    // inserePerguntasCabecalho(idGrupoFormulario){
    //     this.perguntasCabecalho.forEach(
    //         (objPergunta) => {
    //             this.buscaConfiguracoes(objPergunta.pergunta, idGrupoFormulario, false)
    //         }
    //     )
    // }

    selecionaPergunta(pergunta, adiciona) {

        if (adiciona) {
            this.toastr.success("Pergunta adicionada com sucesso");
        } else {
            this.toastr.success("Pergunta removida com sucesso");
        }

        pergunta['formulario'] = {
            id: this.id,
            titulo: this.tituloValor,
            descricao: this.descricaoValor
        }

        pergunta['remover'] = !adiciona;
        this.fnSelecionaPerguntas.emit(pergunta);
    }

    setCondicaoPerguntaPrincipal(pergunta, label, valor ){
        if( valor || ( valor == '' || ( valor && parseInt(valor) == 0 ) ) ){
            let params = new Object();
            params[label] = valor;
            
            if( !this.validaParams(pergunta, label, valor ) ){
                return;
            }
            this.serviceGrupoPergunta.put( params, pergunta.id ).subscribe(
                (retorno) => {
                    this.toastr.success("Pergunta atualizada com sucesso");
                    pergunta[label] = valor;
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                }
            )
        }
    }

    validaParams(pergunta, label, valor){
        if( label != 'sexo' ){
            if( label != 'idadeFim' ){
                // VALIDA SE DATA INICIO É MAIOR QUE DATA FIM
                if( pergunta.idadeFim && ( parseInt(pergunta.idadeFim) < parseInt(valor) ) ){
                    this.toastr.error('Idade Fim é menor que a idade Inicio')
                    return;
                }
            }else{
                // VALIDA SE DATA FIM É MENOR QUE DATA INICIO
                if( pergunta.idadeInicio && ( parseInt(pergunta.idadeInicio) > parseInt(valor) ) ){
                    this.toastr.error('Idade Inicio é maior que a idade Final')
                    return;
                }
            }
        }
        
        return true
    }
}