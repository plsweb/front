import { Component, ViewChild, Input, Output, ViewContainerRef, EventEmitter, ElementRef, Renderer, OnInit } from '@angular/core';
import { NgxUploaderModule } from 'ngx-uploader';
import { UsuarioService, GuiaService, EspecialidadeService, LocalAtendimentoService, Login } from '../../../services';

import { Servidor } from '../../../services/servidor';
import { Sessao } from '../../../services/sessao';

import { ActivatedRoute, Router } from '@angular/router';
import { Saida } from '../../../theme/components/entrada/entrada.component';

import { NgbdModalContent } from '../../../theme/components/modal/modal.component';
import { NgbModal, NgbActiveModal, NgbModalOptions } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';


@Component({
    selector: 'formulario',
    templateUrl: './formulario.html',
    styleUrls: ['./formulario.scss'],
    providers: [EspecialidadeService]
})
export class Formulario implements OnInit {

    id:string;
    userName:Saida;
    nome:Saida;
    ativo:Saida;
    senha:Saida;
    bloqueado:Saida;    
    email:Saida;
    celular:Saida;
    nascimento:Saida;
    conselho:Saida;
    usuarioTipo: Saida;
    conselhos = [];
    ordensFilaAtendimento = [];
    registro:Saida;
    receberemail:Saida;
    recebersms:Saida;
    ordemfila:Saida;
    uf:Saida;
    papel;    
    novasenha:Saida;
    confirmacao:Saida;
    usuario:any;
    perfil:boolean=false;
    guid:string;
    activeModal:any;
    imagem:string;
    assinatura:string;
    objPapel= new Object();
    papeis = [];
    especialidades = [];
    unidadesAtendimento = [];
    tiposPessoa = [];
    campoEdita = {
        'peso': { },
    }

    constructor(
        private serviceUsuario: UsuarioService,
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
            let pagina = Sessao.getPagina();
            if(pagina.match(".*/perfil.*")){
                this.perfil = true;
            }else if (params['id'] != 0) {
                this.id = params['id'];
            }
        });

    }

    ngOnInit() {

        this.guiaService.getConselho()
            .subscribe((conselhos) => {
                this.conselhos = conselhos;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        );

        this.unidadesAtendimento = Sessao.getVariaveisAmbiente('unidadesAtendimento');

        this.serviceUsuario.getOrdemFilaAtendimento()
            .subscribe((ordensFilaAtendimento) => {
                this.ordensFilaAtendimento = ordensFilaAtendimento;
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        );

        this.tiposPessoa = Sessao.getEnum('TipoPessoa').lista || [
            {
                codigo:"JURIDICA",
                descricao: "Pessoa Jurídica"
            },
            {
                codigo:"FISICA",
                descricao: "Pessoa Física"
            }
        ];

        if (this.id || this.perfil) {
            
            if( this.perfil ){
                
                this.serviceUsuario.usuario().subscribe(
                    usuario => {
                        this.id = usuario.guid;
                        this.getUsuarioPorGuid();  
                        return ;                   
                    },
                    (erro) => {
                        Servidor.verificaErro(erro, this.toastr);
                    },
                )
            }else{
                this.getUsuarioPorGuid();
            }

        }else{
            this.usuario = {};
            this.validaValoresDefault();
        }        
    }

    submit() {
        this.salvar();
    }

    getImagemCompleta(objImagemBase64){
        
        let objImagem = { "imagem" : objImagemBase64["image"] }
        
        this.serviceUsuario.setImagemPorGuid(objImagem, objImagemBase64["tipo"], this.id).subscribe(
            (status) => {
                if (status) {
                    this.toastr.success("Imagem editada com sucesso.");
                }
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        );

    }

    salvar(){

        var objUsuario = new Object();

        (this.userName.valido)     ? objUsuario["userName"]     = this.userName.valor     : null;
        (this.nome.valido)         ? objUsuario["nome"]         = this.nome.valor         : null;
        if( !this.perfil ){
            (this.bloqueado.valido)    ? objUsuario["bloqueado"]    = this.bloqueado.valor    : null;
            (this.ativo.valido)        ? objUsuario["ativo"]        = this.ativo.valor        : null;
            

            if( this.novasenha.valido){
                if( this.novasenha.valor == this.confirmacao.valor ){
                    // objUsuario["senha"] = btoa(this.novasenha.valor || this.novasenha);
                    objUsuario["senha"] = (this.novasenha.valor || this.novasenha);
                }else{
                    this.toastr.warning("Confirme corretamente as senhas informadas");
                    return ;
                }
            }else if(!this.id){
                this.toastr.warning("Obrigatorio informar uma senha");
                return;
            }

            (this.ordemfila.valido && this.ordemfila.valor != "0")    ? objUsuario["ordemFilaAtendimento"]  = this.ordemfila.valor     : null;
            (this.receberemail.valido && this.receberemail.valor != "0") ? objUsuario["receberEmail"] = this.receberemail.valor : null;
            (this.recebersms.valido && this.recebersms.valor != "0")   ? objUsuario["receberSms"]   = this.recebersms.valor   : null;
        }
        (this.email.valido)        ? objUsuario["email"]        = this.email.valor        : null;
        (this.celular.valido && this.celular.valor != "")      ? objUsuario["celular"]      = this.celular.valor      : null;
        (this.usuarioTipo.valido)  ? objUsuario["usuarioTipo"]  = this.usuarioTipo.valor  : null;
        (this.nascimento.valido && this.nascimento.valor != "")  ? objUsuario["nascimento"] = this.nascimento.valor + " 00:00:00" : null;
        (this.conselho.valido   && this.conselho.valor != "0")     ? objUsuario["conselho"]     = { id : this.conselho.valor }     : null;
        (this.registro.valido)     ? objUsuario["conselhoRegistro"]      = this.registro.valor     : null;
        (this.uf.valido)           ? objUsuario["conselhoUf"]            = this.uf.valor     : null;

        if( this.id ){
            this.serviceUsuario.atualizar(this.id, objUsuario).subscribe(
                (guid) => {
                    if (guid) {
                        this.toastr.success("Usuario editado com sucesso");
                        if( !this.perfil )
                            this.router.navigate([`/${Sessao.getModulo()}/usuario/formulario/`+guid]);
                    }
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                },
            );
        }else{
            this.serviceUsuario.inserir(objUsuario).subscribe(
                (guid) => {
                    if (guid) {
                        this.toastr.success("Usuario cadastrado com sucesso");
                        this.router.navigate([`/${Sessao.getModulo()}/usuario/formulario/`+guid]);
                    }
                },                
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);

                    this.toastr.error("Houve um erro ao criar o Usuario")
                    this.toastr.error(erro);
                }
            );
        }
    }

    adicionarPapel(bodyModalPapeis){
        this.activeModal = this.modalService.open(NgbdModalContent, {size: 'lg'})
        this.activeModal.componentInstance.modalHeader = 'Selecione o papel';
        this.activeModal.componentInstance.templateRefBody = bodyModalPapeis;
    }

    getPapel(evento){
        this.papel = evento;

        if (evento.valor && evento.valor.length > 3) {
            this.serviceUsuario.papel({like: evento.valor})
                .subscribe((papeis) => {
                    this.papeis = papeis.dados;
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);

                }
            );
        } else {
            this.papeis = [];
        }

    }

    getUsuarioPorGuid(){

        this.serviceUsuario.getId(this.id).subscribe(
            (usuario) => {
                this.usuario = usuario;
                this.serviceUsuario.fotoPorGuid("FOTO", usuario.guid, true).subscribe(
                    (result) => {
                        if( !result.match(".*assets.*") ){
                            this.imagem = this.serviceUsuario.fotoPorGuid("FOTO", usuario.guid, false)
                        }
                    },
                );
                this.serviceUsuario.fotoPorGuid("ASSINATURA", usuario.guid, true).subscribe(
                    (result) => {
                        if( !result.match(".*assets.*") ){
                            this.assinatura = this.serviceUsuario.fotoPorGuid("ASSINATURA", usuario.guid, false)
                        }
                    }
                );
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
                console.error(erro);
            }
        );

    }

    validaValoresDefault(){
        this.usuario.usuarioTipo = "FISICA";
        this.usuario.receberSms = true;
        this.usuario.receberEmail = true;
        this.usuario.ativo = true;
        this.usuario.bloqueado = false;
        this.bloqueado = new Saida();
        this.bloqueado.valido = true;
        this.bloqueado.valor = false;
        this.usuario.ordemFilaAtendimento = "AGENDAMENTO"
    }

    clickLinha(papel){
        
        var jaExiste = (this.usuario.papeis.filter(function(i) {
            return i.guid == papel.guid
        }).length > 0);
        
        if( jaExiste ){
            this.toastr.error("Usuario ja possui esse papel");
            return;
        }        

        let objPapel = {
            "usuario" : {
                "guid" : this.id
            },
            "papel" : {
                "guid": papel.guid
            }
        }

        this.serviceUsuario.usuarioPapel(objPapel)
            .subscribe((papeis) => {
                this.toastr.success("Papel atualizado com sucesso");
                this.usuario.papeis.push(papel);

                console.log(Sessao.getUsuario()['guid']);
                
                if( this.id == Sessao.getUsuario()['guid'] ){
                    let objpapeis = Sessao.getPapelUsuario();
                    objpapeis.push(papel.nome)

                    localStorage.setItem('papeis', objpapeis.join(','));
                }
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);

            }
        );
    }

    modalConfirmar;
    deletePapel(papel){
        this.modalConfirmar = this.modalService.open(NgbdModalContent);
        this.modalConfirmar.componentInstance.modalHeader = `${papel.nome} - ${papel.descricao}`;
        this.modalConfirmar.componentInstance.modalMensagem = `Tem certeza que deseja deletar esse papel?`;
        this.modalConfirmar.componentInstance.modalAlert = true;

        this.modalConfirmar.componentInstance.retorno.subscribe(
            (retorno) => {
                if (retorno) {
                    let objPapel = {
                        "usuario" : {
                            "guid" : this.id
                        },
                        "papel" : {
                            "guid": papel.guid
                        }
                    }
            
                    this.serviceUsuario.deletarPapel(objPapel).subscribe(
                        () => {
                            this.usuario.papeis = this.usuario.papeis.filter(function(i) {
                                return i.guid != objPapel.papel.guid
                            });  
            
                            if( this.id == Sessao.getUsuario()['guid'] ){
                                let objpapeis = Sessao.getPapelUsuario();
                                let novoobjpapeis = objpapeis.filter( (nomepapel) => nomepapel != papel.nome );
            
                                localStorage.setItem('papeis', novoobjpapeis.join(','));     
                            }
                        }, (erro) => {
                            Servidor.verificaErro(erro, this.toastr);
                        }
                    );
                }
            }
        );
    }

    adicionarEspecialidade(modalEspecialidades){
        this.activeModal = this.modalService.open(NgbdModalContent, {size: 'lg'})
        this.activeModal.componentInstance.modalHeader = 'Selecione a especialidade';
        this.activeModal.componentInstance.templateRefBody = modalEspecialidades;
    }

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

        var jaExiste = (this.usuario.especialidades.filter(function(i) {
            return i.id == especialidade.id
        }).length > 0);
        
        if( jaExiste ){
            this.toastr.warning("Usuário já possui esse especialidade");
            return;
        }        

        let objespecialidade = {
            "usuario" : {
                "guid" : this.id
            },
            "especialidade" : {
                "id": especialidade.id
            }
        }

        this.serviceUsuario.setUsuarioEspecialidade(objespecialidade)
            .subscribe((papeis) => {
                this.toastr.success("Especialidade atualizada com sucesso");
                this.usuario.especialidades.push(especialidade);
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);

            }
        );
        
    }

    deleteEspecialidades(especialidade){

        let objespecialidade = {
            "usuario" : {
                "guid" : this.id
            },
            "especialidade" : {
                "id": especialidade.id
            }
        }

        this.serviceUsuario.excluirUsuarioEspecialidade(objespecialidade)
            .subscribe((especialidades) => {
                this.toastr.success("Especialidade removida com sucesso");
                this.usuario.especialidades = this.usuario.especialidades.filter(function(i) {
                    return i.id != objespecialidade.especialidade.id
                }); 
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );
    }

    objProfissionais
    fnCfgprofissionalRemote(term) {
        this.serviceUsuario.usuarioPaginadoFiltro( 1, 10, term, false ).subscribe(
            (retorno) => {
                this.objProfissionais = retorno.dados || retorno;
            }
        )
    }
    
    profissionalSelecionado;
    objParamAddDependente:any = {
        'eDependente': true
    }
    getProfissional(evento){
        if( evento ){
            this.objParamAddDependente['dependente'] = evento;
            this.profissionalSelecionado = evento['nome'];
        }else{
            this.objParamAddDependente['dependente'] = undefined;
        }

        console.log(this.objParamAddDependente);
    }

    adicionarDependente(dependente = true) {
        
        let titular;
        let guiddependente;

        if( !this.objParamAddDependente['dependente'] ){
            this.toastr.warning("Informe um usuario");
            return;
        }

        if( dependente ){
            titular = this.id;
            guiddependente = this.objParamAddDependente['dependente']['guid']
        }else{
            titular = this.objParamAddDependente['dependente']['guid'];
            guiddependente = this.id;
        }

        let request = {
            titular: {
                guid: titular
            }
        }

        this.serviceUsuario.atualizar( guiddependente, request ).subscribe(
            (retorno) => {
                console.log(retorno);
                if( this.objParamAddDependente['eDependente'] ){
                    this.usuario.usuarios.push( this.objParamAddDependente['dependente'] );
                }
                this.objParamAddDependente = new Object();
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
                this.toastr.error("Houve um erro ao adicionar dependente");
            }
        )
    }

    removerDependente(usuario){
        this.modalConfirmar = this.modalService.open(NgbdModalContent);
        this.modalConfirmar.componentInstance.modalHeader = `${usuario.nome}`;
        this.modalConfirmar.componentInstance.modalMensagem = `Tem certeza que deseja remover esse dependente?`;
        this.modalConfirmar.componentInstance.modalAlert = true;

        this.modalConfirmar.componentInstance.retorno.subscribe(
            (retorno) => {
                if (retorno) {
                    this.serviceUsuario.deleteUsuarioTitular(usuario.guid).subscribe(
                        () => {
                            this.usuario.usuarios = this.usuario.usuarios.filter(
                                (objusuario) => {
                                    return objusuario.guid != usuario.guid
                                }
                            )
                            this.toastr.success("Dependente removido com sucesso");
                        }, (erro) => {
                            Servidor.verificaErro(erro, this.toastr);
                        }
                    );
                }
            }
        );

    }

    validaCheck(unidadeCheck){
        let estado = false;
        this.usuario.unidadesAtendimento.forEach(
            (unidade) => {
                if( unidade.unidadeAtendimento.id == unidadeCheck.id ){
                    estado = true;
                }
            }
        )

        return estado;
    }

    unidadeSelecionada = new Object();
    salvarUnidadeAtendimento(valida = true, unidade = undefined){

        if( valida ){

            this.unidadeSelecionada['usuario'] = { guid : this.id };

            if( !this.unidadeSelecionada['unidadeAtendimento'] ){
                this.toastr.warning("Selecione uma unidade de atendimento")
                return;
            }else if( !this.unidadeSelecionada['peso'] ){
                this.toastr.warning("Informe um peso para esse usuario");
                return;
            }

            let existe = this.usuario.unidadesAtendimento.filter(
                (objunidade) => {
                    return objunidade.unidadeAtendimento.id == this.unidadeSelecionada['unidadeAtendimento']['id'];
                }
            )

            if( existe.length ){
                this.toastr.warning("Usuario já possui essa unidade");
                return;
            }

            this.serviceUsuario.setUsuarioUnidadeAtendimento(this.unidadeSelecionada)
                .subscribe((retorno) => {
                    this.toastr.success("Unidade de Atendimento atualizada com sucesso");

                    let unidadeSelecionada = this.unidadesAtendimento.filter(
                        (objunidade) => {
                            return objunidade.id == this.unidadeSelecionada['unidadeAtendimento']['id'];
                        }
                    )
                    this.usuario.unidadesAtendimento.push({
                        id: retorno,
                        unidadeAtendimento: unidadeSelecionada[0],
                        peso: this.unidadeSelecionada['peso']
                    })
                },
                (erro) => {
                    Servidor.verificaErro(erro, this.toastr);
                }
            );
        }else{

            if( confirm('Deseja remover essa unidade?') ){
                this.serviceUsuario.excluirUsuarioUnidadeAtendimento(unidade.id)
                    .subscribe((retorno) => {

                        this.usuario.unidadesAtendimento = this.usuario.unidadesAtendimento.filter(
                            (unidadeUsuario) => {
                                return unidadeUsuario.id != unidade.id
                            }
                        )
                        this.toastr.success("Unidade de Atendimento removida com sucesso");
                    },
                    (erro) => {
                        Servidor.verificaErro(erro, this.toastr);
                    }
                );
            }

        }
    
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

    salvarCampoEditaUsuario(label, valor){

        let param = new Object();
        param[label] = valor;
        
        this.serviceUsuario.atualizarUsuarioUnidadeAtendimento(this.campoEdita[label]['id'], param).subscribe(
            (produtoRet) => {
                this.toastr.success("Item editado com sucesso");
                this.campoEdita[label]['id'] = undefined;
                this.getUsuarioPorGuid();
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
                this.campoEdita[label]['id'] = undefined;
                this.toastr.error("Houve um erro ao editar item");
            }
        );
    }

    alterarSenha(bodyModalSenha, templateBotoesSenha){
        this.activeModal = this.modalService.open(NgbdModalContent, {size: 'sm'})
        this.activeModal.componentInstance.modalHeader = 'Alteração de Senha';
        this.activeModal.componentInstance.templateRefBody = bodyModalSenha;
        this.activeModal.componentInstance.templateBotoes = templateBotoesSenha;
    }

    salvarSenha(){
        this.senha = ( this.novasenha.valido && ( this.novasenha.valor == this.confirmacao.valor ) ) ? this.novasenha.valor : null;
        if( this.senha ){
            var objUsuario = new Object();
                // objUsuario["senha"] = btoa(this.senha.valor || this.senha);
                objUsuario["senha"] = (this.senha.valor || this.senha);

            this.serviceUsuario.atualizar(this.id, objUsuario).subscribe(
                (guid) => {
                    if (guid) {
                        this.toastr.success("Senha atualizada com sucesso");
                        this.activeModal.close();
                    }
                }
            );
        
        }else{
            this.toastr.error("Senhas informadas não coincidem");
        }
    }

    getNovaSenha(evento){
        this.novasenha = evento;        
    }

    getConfirmacao(evento){
        this.confirmacao = evento;
    }

    getUsername(evento){
        this.userName = evento;        
    }

    getNome(evento){
        this.nome = evento;        
    }

    getAtivo(evento){
        this.ativo = evento;
    }

    getBloqueado(evento){
        this.bloqueado = evento;
    }

    getEmail(evento){
        this.email = evento;
    }

    getCelular(evento){
        this.celular = evento;
    }

    getNascimento(evento){
        this.nascimento = evento;
    }

    getConselho(evento){
        this.conselho = evento;
    }

    getUsuarioTipo(evento){
        this.usuarioTipo = evento;
    }

    getRegistro(evento){
        this.registro = evento;
    }

    getReceberEmail(evento){
        this.receberemail = evento;
    }

    getReceberSms(evento){
        this.recebersms = evento;
    }

    getOrdemFila(evento){
        this.ordemfila = evento;
    }

    getUf(evento){
        this.uf = evento;
    }

}