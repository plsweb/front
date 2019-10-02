import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';

import { Sessao, Servidor, UsuarioService, ConsultorioService , UnidadeAtendimentoService, PanicoPapelService,
    PainelSenhaService, UtilService, PontuacaoUnidadeService, CentroCustoService, CentroCustoRegrasService,
    PacienteOperadoraService, ProgramaService, TipoAtendimentoService } from 'app/services';

import { FormatosData, NgbdModalContent } from 'app/theme/components';
import { Login } from 'app/pages/usuario/login';


@Component({
    selector: 'formulario',
    templateUrl: './formulario.html',
    styleUrls: ['./formulario.scss'],
    providers: [Login]
})
export class Formulario implements OnInit {

    idUnidade;
    
    novaUnidade = new Object();
    
    objParamsAddProfissional = new Object();
    objParamsAddLocal = new Object();
    
    addUser;
    formatosDeDatas;

    operadoras = [];
    programaSaude = [];

    @ViewChild("bodyModalCentrodeCusto", {read: TemplateRef}) bodyModalAdicionaCentrodeCusto: TemplateRef<any>;
    @ViewChild("modalCentrodeCustoBotoes", {read: TemplateRef}) modalAdicionaCentrodeCustoBotoes: TemplateRef<any>;

    // TODO TESTAR UNIDADE ATENDIMENTO 
    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private toastr: ToastrService,
        private modalService: NgbModal,
        private serviceLocal: UtilService,
        private usuarioService: UsuarioService,
        private servicePrograma: ProgramaService,
        private serviceConsult: ConsultorioService,
        private serviceOperadora: PacienteOperadoraService,
        private servicePainelSenha: PainelSenhaService,
        private serviceLogin: Login,
        private servicePapelPanico: PanicoPapelService,
        private serviceCentroCusto: CentroCustoService,
        private unidadeService: UnidadeAtendimentoService,
        private serviceAtendimentoTipo: TipoAtendimentoService,
        private servicePontuacaoUnidade: PontuacaoUnidadeService,
        private serviceCentroCustoRegras: CentroCustoRegrasService,
    ) 
    {
        this.route.params.subscribe(params => {
            this.idUnidade = (params["idunidade"] != 'novo') ? params["idunidade"] : undefined
        });
    }

    ngOnInit() {
        this.formatosDeDatas = new FormatosData();

        if( this.idUnidade ){
            this.setUnidade();
        }

        this.serviceOperadora.getOperadoraPaginado().subscribe(
            (operadora) => {
                this.operadoras = operadora.dados;
            }
        );

        this.servicePrograma.get().subscribe(
            (programa) => {
                this.programaSaude = programa.dados;
            }
        );
    }

    salvarUnidade(){
        this.novaUnidade = this.validaPreSalvamento(this.novaUnidade);

        if (this.idUnidade) { 
            this.unidadeService.put(this.idUnidade, this.novaUnidade).subscribe(
                () => {
                    this.toastr.success("Unidade " + this.novaUnidade['descricao'] + " atualizada com sucesso");
                    this.serviceLogin.inicializaVariaveisAmbiente();
                }, (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                }
            );
        } else {
            this.unidadeService.post(this.novaUnidade).subscribe(
                (retorno) => {
                    this.idUnidade = retorno;
                    this.router.navigate([`/${Sessao.getModulo()}/unidadeatendimento/${retorno}`]);
                    this.toastr.success("Unidade "+this.novaUnidade['descricao']+" adicionada com sucesso");
                    this.serviceLogin.inicializaVariaveisAmbiente();                    
                    this.setUnidade();
                }, (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                }
            );
        }
    }

    validaPreSalvamento(objUnidade){
        if (objUnidade['cidade']) {
            objUnidade['cidade'] = {
                id : objUnidade['cidade']['id']
            }
        }

        return objUnidade;
    }

    setUnidade(){
        this.unidadeService.get({ id : this.idUnidade }).subscribe(
            (unidade) => {
                this.cidadeSelecionada = (this.novaUnidade['cidade']) ? this.novaUnidade['cidade']['nome'] : '';
                this.novaUnidade = (unidade.dados || unidade)[0];
                
                this.buscarProfissionais(null);
                this.iniciaPapeisPermissao(null);
                this.buscarPontuacoes(null);
                this.buscarRegras(null);
                this.inicializaTela();
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );   
    }

    paginaAtualProfissionais = 1;
    itensPorPaginaProfissionais = 25;
    profissionais = [];
    profissionaisFiltro;
    qtdItensTotalProfissionais;
    buscarProfissionais(evento, like = false){
        this.paginaAtualProfissionais = evento ? (evento.paginaAtual || 1) : this.paginaAtualProfissionais;
        let obj = { 
            unidadeAtendimentoId: this.idUnidade, 
            pagina: this.paginaAtualProfissionais, 
            quantidade: this.itensPorPaginaProfissionais 
        }
        if( like && evento ){
            obj['like'] = evento.like
        }

        this.usuarioService.getUsuarioUnidadeAtendimento( obj ).subscribe( 
            (profissionais) => {
                this.profissionais = this.profissionais = (profissionais.dados || profissionais);
                this.qtdItensTotalProfissionais = profissionais.qtdItensTotal || profissionais.length;
            
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );
    }

    objProfissionais
    fnCfgprofissionalRemote(term) {
        this.usuarioService.usuarioPaginadoFiltro( 1, 10, term ).subscribe(
            (retorno) => {
                this.objProfissionais = retorno.dados || retorno;
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
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

    papel;
    papelSelecionado;
    objPapeis;
    getPapel(papel) {
        this.papel = papel;
        if( papel ){
            this.papelSelecionado = papel.nome;
            this.objParamPanicoPapel['papel'] = {
                guid: papel.guid
            }
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

    cidadeSelecionada
    getCidadeSelect(evento){
        if( evento ){
            this.cidadeSelecionada = evento.nome
            this.novaUnidade['cidade'] = { id : evento['id'] } 
        }else{
            this.novaUnidade['cidade'] = undefined
        }
    }

    objCidades;
    fnCfgCidadeRemote(term) {
        this.serviceLocal.getCidades({ like : term}).subscribe(
            (retorno) => {
                this.objCidades = retorno.dados || retorno;
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );
    }

    objParamPanicoPapel = new Object();
    salvarPapelPermissao() {
        if (!this.validaPapelPermissao()) {
            return;
        }
        
        this.objParamPanicoPapel['unidadeAtendimento'] = { id: this.idUnidade };

        this.servicePapelPanico.post(this.objParamPanicoPapel).subscribe(
            () => {
                this.iniciaPapeisPermissao({ paginaAtual: 1 });
                this.toastr.success(`Permissão atualizada com sucesso`); 
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
                this.toastr.success(`Erro ao atualizar permissão`); 
            }
        );
    }

    paginaAtualPapelPanico = 1;
    qtdItensPorPaginaPapelPanico = 20;
    papeisPanico = [];
    iniciaPapeisPermissao(evento){
        this.paginaAtualPapelPanico = evento ? evento.paginaAtual : this.paginaAtualPapelPanico;

        let request = { 
            unidadeAtendimentoId: this.idUnidade, 
            pagina: this.paginaAtualPapelPanico, 
            quantidade: this.qtdItensPorPaginaPapelPanico 
        }

        this.servicePapelPanico.get(request).subscribe(
            (retorno) => {
                this.papeisPanico = retorno.dados || retorno;
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        )
    }

    paginaAtualPontuacao = 1;
    itensPorPaginaPontuacao = 20;
    pontuacoesUnidade = [];
    qtdItensTotalPontuacao;
    buscarPontuacoes(evento = null){
        this.paginaAtualPontuacao = evento ? evento.paginaAtual : this.paginaAtualPontuacao;

        let request = { 
            unidadeAtendimentoId: this.idUnidade, 
            pagina: this.paginaAtualPontuacao, 
            quantidade: this.itensPorPaginaPontuacao 
        }

        this.servicePontuacaoUnidade.get(request).subscribe(
            (retorno) => {
                this.pontuacoesUnidade = retorno.dados || retorno;
                this.qtdItensTotalPontuacao = retorno.qtdItensTotal || retorno.length;
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        )
    }

    paginaAtualRegras = 1;
    itensPorPaginaRegras = 20;
    regrasUnidade = [];
    qtdItensTotalRegras;
    buscarRegras(evento = null){
        this.paginaAtualRegras = evento ? evento.paginaAtual : this.paginaAtualRegras;

        let request = { 
            unidadeAtendimentoId: this.idUnidade, 
            pagina: this.paginaAtualRegras, 
            quantidade: this.itensPorPaginaRegras 
        }

        this.serviceCentroCustoRegras.get(request).subscribe(
            (retorno) => {
                this.regrasUnidade = retorno.dados || retorno;
                this.qtdItensTotalRegras = retorno.qtdItensTotal || retorno.length;
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        )
    }

    modalCentroCusto;
    adicionaCentroCusto(){
        this.modalCentroCusto = this.modalService.open(NgbdModalContent, {size: 'lg'});
        this.modalCentroCusto.componentInstance.modalHeader  = 'Salvar Novo Centro de Custo';
        this.modalCentroCusto.componentInstance.templateRefBody = this.bodyModalAdicionaCentrodeCusto;
        this.modalCentroCusto.componentInstance.templateBotoes = this.modalAdicionaCentrodeCustoBotoes;
    }

    objParamAddCentroCusto = new Object();
    salvarCentroCusto(centroCusto){
        this.serviceCentroCusto.post(centroCusto).subscribe(
            () => {
                this.modalCentroCusto.close();
                this.objParamAddCentroCusto = [];
                this.toastr.success("Centro de Custo adicionado com sucesso.");
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );
    }

    ordemRegra(sobe, desce) {
        let request = {
            novoMaior: {id: sobe},
            novoMenor: {id: desce},
            unidadeAtendimento: {id: this.idUnidade}
        }

        this.serviceCentroCustoRegras.ordenar(request).subscribe(
            () => {
                this.buscarRegras(null);
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    excluiRegra(id) {
        this.serviceCentroCustoRegras.delete(id).subscribe(
            () => {
                this.buscarRegras(null);
                this.toastr.success("Regra excluida com sucesso.");
            }, (error) => {
                Servidor.verificaErro(error, this.toastr);
            }
        );
    }

    objParamAddRegra = {unidadeAtendimento: {id: this.idUnidade}};
    salvarRegrasUnidade() {
        this.objParamAddRegra['unidadeAtendimento'] = { id: this.idUnidade };

        this.serviceCentroCustoRegras.post(this.objParamAddRegra).subscribe(
            () => {
                this.buscarRegras({paginaAtual: 1});
                this.toastr.success("Regra criada com sucesso");
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );
    }

    objCentroCusto;
    fnCfgCentroCustoRemote(term) {
        this.serviceCentroCusto.get({like: term}).subscribe(
            (retorno) => {
                this.objCentroCusto = retorno.dados || retorno;
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );
    }

    centroCustoSelecionado;
    getCentroCusto(centroCusto) {
        if (centroCusto) {
            this.centroCustoSelecionado = `${centroCusto.centroCusto} ${centroCusto.descricao}`;
            this.objParamAddRegra['centroCusto'] = {
                id: centroCusto.id
            };
        }
    }

    objAtendimentoTipo;
    fnCfgAtendimentoTipoRemote(term) {
        let request = {
            like: term,
            idUnidadeAtendimento: this.idUnidade,
        }

        this.serviceAtendimentoTipo.atendimentoTipo(request).subscribe(
            (tipo) => {
                this.objAtendimentoTipo = tipo.dados || tipo;
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );
    }

    atendimentoTipoSelecionado;
    getAtendimentoTipo(atendimentoTipo) {
        if (atendimentoTipo) {
            this.atendimentoTipoSelecionado = atendimentoTipo.descricao;
            this.objParamAddRegra['atendimentoTipo'] = {
                id: atendimentoTipo.id
            };
        }
    }

    validaPapelPermissao() {
        if (!this.papelSelecionado) {
            this.toastr.warning('Informe o papel');
            return;
        }

        return true;
    }

    objParamAddPontuacao = new Object();
    salvarPontuacaoUnidade(){

        if( !this.objParamAddPontuacao['idadeInicio'] ){
            this.toastr.warning("Informe a data inicial da faixa etária");
            return;
        }else if( !this.objParamAddPontuacao['idadeFim'] ){
            this.toastr.warning("Informe a data final da faixa etária");
            return;
        }else if( !this.objParamAddPontuacao['valor'] ){
            this.toastr.warning("Informe a pontuação da faixa etária");
            return;
        }

        if( parseInt(this.objParamAddPontuacao['idadeFim']) < parseInt(this.objParamAddPontuacao['idadeInicio']) ){
            this.toastr.warning("Idade final não pode ser menor que a inicial");
            return;
        }

        this.objParamAddPontuacao['unidadeAtendimento'] = { id: this.idUnidade };

        this.servicePontuacaoUnidade.salvar( this.objParamAddPontuacao ).subscribe(
            () => {
                this.buscarPontuacoes({paginaAtual: 1});
                this.toastr.success("Pontuação criada com sucesso");
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        )

    }

    paginaAtualLocais = 1;
    itensPorPaginaLocais = 15;
    locais = [];
    locaisFiltro;
    qtdItensTotalLocais;
    buscarLocais(evento){
        this.paginaAtualLocais = evento ? evento.paginaAtual : this.paginaAtualLocais;
        let request = { 
            pagina: this.paginaAtualLocais, 
            quantidade: this.itensPorPaginaLocais, 
            idUnidadeAtendimento : this.idUnidade 
        }

        this.serviceConsult.getGuicheAtendimento( request ).subscribe(
            (locais) => {
                this.locais = locais.dados || locais;
                this.qtdItensTotalLocais = locais.qtdItensTotal;
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );
    }

    adicionarProfissional(){
        this.objParamsAddProfissional['unidadeAtendimento'] = { id : this.idUnidade };

        this.usuarioService.setUsuarioUnidadeAtendimento( this.objParamsAddProfissional ).subscribe(
            () => {
                this.toastr.success("Profissional salvo com sucesso");
                this.setUnidade();
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        )
    }

    salvarLocal(){

        this.objParamsAddLocal['unidadeAtendimento'] = { id : this.idUnidade };

        this.serviceConsult.postGuicheAtendimento( this.objParamsAddLocal ).subscribe(
            () => {
                this.toastr.success("Local salvo com sucesso");
                this.setUnidade();
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        )
    }

    getConsultorio(evento) {
        if( evento && evento.valor ){
            this.objParamsAddLocal['descricao'] = evento.valor;
        }else{
            this.objParamsAddLocal['descricao'] = '';
        }
    }

    opcoesCodigoVisualUsuario = [];
    opcoesCodigoVisual = [];
    inicializaTela(){
        if (this.novaUnidade['codigoVisual']) {
            this.servicePainelSenha.getAtendentes(this.novaUnidade['codigoVisual']).subscribe(
                (atendentes) => {
                    this.opcoesCodigoVisualUsuario = atendentes.atendente;
                }, (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                }
            );
                
            this.servicePainelSenha.getGuiche(this.novaUnidade['codigoVisual']).subscribe(
                (codigos) => {
                    this.opcoesCodigoVisual = codigos.guiche;
                }, (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                }
            );

            this.buscarLocais({ paginaAtual: 1 });
        } else {
            console.warn("Nao possui codigo visual");
        }

    }

    removeItem( id, nome, tipo ){

        if( confirm(`Deseja remover ${nome} ?`) ){
            if( tipo == 'profissional' ) {
                this.removeProfissional(id) 
             }else if( tipo == 'local' ){
                this.removeLocal(id);
             }else if( tipo == 'pontuacao' ){
                this.removePontuacao(id);
             }
        }

    }

    removeProfissional(guid){

        let obj = {
            "unidadeAtendimento": {
                "id": this.idUnidade
            },
            "usuario": {
                "guid": guid
            }
        }

        this.usuarioService.excluirUsuarioUnidadeAtendimento( obj ).subscribe(
            () => {
                this.toastr.success("Profissional removido com sucesso");
                this.setUnidade();
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );

    }

    removeLocal(id){

        this.serviceConsult.deleteGuicheAtendimento(id).subscribe(
            () => {
                this.toastr.success("Consultório removido com sucesso");
                this.setUnidade();
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );

    }

    removePontuacao(id){
        this.servicePontuacaoUnidade.excluir( id ).subscribe(
            () => {
                this.toastr.success("Pontuação Removida com sucesso");
                this.setUnidade();
            }, (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );
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

    pesquisarProfissional(nome){
        this.buscarProfissionais( (nome && nome.length ? { like: nome } : null), true);
    }

    voltar(){
        this.router.navigate([`/${Sessao.getModulo()}/unidadeatendimento`]);
    }
}