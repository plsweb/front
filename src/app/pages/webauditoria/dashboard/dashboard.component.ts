import { Component, ViewChild, ViewContainerRef, TemplateRef, QueryList } from '@angular/core';
import { DashboardAuditoriaService, ConsultorioService, UsuarioService } from '../../../services';

import { Servidor } from '../../../services/servidor';
import { Sessao } from '../../../services/sessao';

import { NgbdModalContent } from '../../../theme/components/modal/modal.component';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';

@Component({
	selector: 'dashboard',
	templateUrl: './dashboard.html',
	styleUrls: ['./dashboard.scss'],
})
export class Dashboard {
	dashboards = [];
	activeModal:any;

	@ViewChild("bodyModalConsult", {read: TemplateRef}) bodyModal: QueryList<TemplateRef<any>>;
	@ViewChild("templateBotoesConsult", {read: TemplateRef}) templateBotoes: QueryList<TemplateRef<any>>;

	@ViewChild("bodyModalSenha", {read: TemplateRef}) bodyModalSenha: QueryList<TemplateRef<any>>;
	@ViewChild("botoesModalSenha", {read: TemplateRef}) botoesModalSenha: QueryList<TemplateRef<any>>;

	constructor(private modalService: NgbModal,
		private service: DashboardAuditoriaService,
		private serviceUsu: UsuarioService,
		private serviceConsult: ConsultorioService,
		private toastr: ToastrService, ) {
	}

	ngOnInit() {

		this.service.getDashboard().subscribe(
			(dashboards) => {
				this.dashboards = dashboards;
			},
			(erro) => {
				Servidor.verificaErro(erro, this.toastr);
			},
		);
	}

	usuarioId
	ngAfterViewInit(){
		let bAlterarSenha = localStorage.getItem('alterarSenha') == 'true';
		this.usuarioId = JSON.parse(localStorage.getItem('usuario')).guid;

		if (bAlterarSenha) {
			this.alterarSenha(this.bodyModalSenha, this.botoesModalSenha);
			return;
		}
	}

	alterarSenha(bodyModal, templateBotoes){
        this.activeModal = this.modalService.open(NgbdModalContent, {size: 'sm'})
        this.activeModal.componentInstance.modalHeader = 'Alteração de Senha';
        this.activeModal.componentInstance.templateRefBody = bodyModal;
        this.activeModal.componentInstance.templateBotoes = templateBotoes;

        let fnModalFechada = (erro) => { 
            if( localStorage.getItem('alterarSenha') == 'false' ){
                // this.abreConsultorio();
            }else{
                this.alterarSenha(this.bodyModalSenha, this.botoesModalSenha);
            }
        };
        this.activeModal.result.then(
            fnModalFechada, 
            fnModalFechada
        );
	}
	
	senha;
	novasenha;
	confirmacao;
	salvarSenha(){
        this.senha = ( this.novasenha.valido && ( this.novasenha.valor == this.confirmacao.valor ) ) ? this.novasenha.valor : null;
        if( this.senha ){
            var objUsuario = {
                "senha" : this.senha,
                "alterarSenha" : false,
            }

			if( this.senha.length < 8 ){
                this.toastr.warning("Senha deve ter no mínimo 8 caracteres");
                return;
            }

            this.serviceUsu.atualizar(this.usuarioId, objUsuario).subscribe(
                (guid) => {
					localStorage.setItem('alterarSenha', 'false');
					this.toastr.success("Senha alterada com sucesso");
					this.activeModal.close();
				},
				(erro) => {
					this.toastr.error("Houve um erro ao alterar a senha");
				}
			);
        
        }else{
			this.toastr.warning("Senhas informadas não coincidem");
        }
	}
	
	getNovaSenha(evento){
        this.novasenha = evento;        
    }

    getConfirmacao(evento){
        this.confirmacao = evento;        
    }

}