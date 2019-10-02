import { Http } from '@angular/http';
import { Router } from '@angular/router';
import { Component } from '@angular/core';
import { ToastrService } from 'ngx-toastr';

import { UsuarioService, FormularioService, EnumApi, LocalAtendimentoService, TabelaApi } from '../../../services';

import { Sessao, Servidor, Util } from 'app/services';

@Component({
	selector: 'login',
	templateUrl: './login.html',
	styleUrls: ['./login.scss'],
})
export class Login {
	usuario;
	senha;
	codigo;
	novaSenha;
	reNovaSenha;
	formularioValido;
	submitted: boolean = false;
	mensagem: string;
	recuperarSenha: boolean = false;
	cache_formularios = [];
	servidorInstancia;

	constructor(private service: UsuarioService, private router: Router,
		private formularioService: FormularioService,
		private localService: LocalAtendimentoService,
        private serviceTabelaApi: TabelaApi,
        private toastr: ToastrService,
		private enumApi: EnumApi,
		http: Http
		) {
		this.servidorInstancia = new Servidor(http,router);
	}

	submit() {

		let url = this.servidorInstancia.getUrl();

		let encodedPassword = this.senha.valor;

		if( url.match( /:/g ).length >= 2 ){
			encodedPassword = btoa(this.senha.valor);
		}

		this.service.logar(this.usuario.valor, encodedPassword).subscribe(
            (login) => {
                this.mensagem = login.mensagem;

                localStorage.removeItem('filtrosAuditoria');

                localStorage.setItem('alterarSenha', login.alterarSenha);
                localStorage.setItem('token', login.token);

                //  Carrega TipoContato Paciente Enum
                this.enumApi.get().subscribe(
                    (enums) => {

                        if( enums && enums.length ){
                            localStorage.setItem('enums', JSON.stringify(enums));
                        }else{
                            localStorage.setItem('enums', JSON.stringify( Util.enumsBackup() ));
                        }
                    },
                    (erro) => {
                        console.error("Erro ao buscar ENUNS!");

                        localStorage.setItem('enums', JSON.stringify( Util.enumsBackup() ));
                    });

                this.serviceTabelaApi.get().subscribe(
                    (resposta) => {
                        localStorage.setItem('tabelaApi', JSON.stringify(resposta));
                    },
                    (erro) => {
                        localStorage.setItem('tabelaApi', JSON.stringify([]));
                    }
                    )

                this.inicializaVariaveisAmbiente();

                this.service.usuarioSessao().subscribe( usuario => {
                    localStorage.setItem("usuario", JSON.stringify({ id : usuario.id, guid : usuario.guid }) );

                    localStorage.setItem('papeis', usuario.papeis.map(papel => {
                        return papel.nome;
                    }));

                    if (login.autorizado) {
                        Sessao.setToken(login.token);
                        if(login.ordemFilaAtendimento){
                            Sessao.setOrdemFilaAtendimento(login.ordemFilaAtendimento);
                        }

                        // console.log("Limpando dat sd dfg as");
                        // let idx = indexedDB.open('cacheRequest', 1);
                        // idx.onsuccess = ($event:any) => {
                            //     var db = $event.target.result;
                            //     var transaction = db.transaction('formularios', 'readwrite');
                            //     var formulariosScore = transaction.objectStore('formularios');
                            //     console.log("Limpando datas");
                            //     formulariosScore.clear();
                            // }
                            // this.inicializaEnums();
                            // this.salvaEnumsCache();

                            this.router.navigate([`/${Sessao.getModulo()}/dashboard`]);
                        }
                    });

            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );
	}

	esqueceuSenha() {
		if (!this.usuario.valor) {
			this.mensagem = 'O usuário deve ser informado';
		} else {
			this.recuperarSenha = true;
			this.mensagem = '';
		}
	}

	alterarSenha() {
		if (this.novaSenha.valor !== this.reNovaSenha.valor) {
			this.mensagem = 'A confirmação da senha falhou';
		}
	}

	getUsuario(evento) {
		this.usuario = evento;
		this.validar();
	}

	getSenha(evento) {
		this.senha = evento;
		this.validar();
	}

	getCodigo(evento) {
		this.codigo = evento;
		this.validar();
	}

	getNovaSenha(evento) {
		this.novaSenha = evento;
		this.validar();
	}

	getReNovaSenha(evento) {
		this.reNovaSenha = evento;
		this.validar();
	}

	validar() {
		if (!this.usuario || !this.senha) {
			this.formularioValido = false;
			return;
		}
		if (this.usuario.valido === false) {
			this.formularioValido = false;
			return;
		}
		if (this.senha.valido === false) {
			this.formularioValido = false;
			return;
		}
		this.formularioValido = true;
	}

	salvaEnumsCache(){

		this.cache_formularios.forEach(
			(cacheEnum) => {
				console.log(cacheEnum);

				console.log(Sessao.getToken());

				cacheEnum.servico.subscribe(
					(retorno) => {
						console.log("SUBSRIBE");

						let idx = indexedDB.open('cacheRequest', 1);

						idx.onsuccess = ($event:any) => {

							var db = $event.target.result;

							var transaction = db.transaction('formularios', 'readwrite');

							var formulariosScore = transaction.objectStore('formularios');

							let obj = { nome: cacheEnum.nome, retorno: retorno }
							var salvou = formulariosScore.add(obj); // IDBRequest

						}

					}

				)

			}

		)
	}

	inicializaEnums(){
		this.cache_formularios = [{nome: 'formulario', servico : this.formularioService.get()}];
    }
    
    inicializaVariaveisAmbiente(){

        this.service.usuarioSessao().subscribe( (usuario) => {
            this.service.getUsuarioUnidadeAtendimento({ usuarioGuid : usuario.guid }).subscribe((unidades) => {
                Sessao.setVariaveisAmbiente( 'unidadeAtendimentoUsuario', (unidades.dados || unidades).map((unidade) => {
                        return {
                            id: unidade.unidadeAtendimento.id,
                            descricao: unidade.unidadeAtendimento.descricao,
                            cidade: unidade.unidadeAtendimento.cidade,
                            cadastroBasico: unidade.unidadeAtendimento.obrigaCadastroBasico,
                            copiaEvolucao: unidade.unidadeAtendimento.copiaEvolucao,
                            codigoVisual: unidade.unidadeAtendimento.codigoVisual,
                            ignoraFeriados: unidade.unidadeAtendimento.ignoraFeriados,
                            tempoLimite: unidade.unidadeAtendimento.tempoLimite,
                            vinculaGuia: unidade.unidadeAtendimento.vinculaGuia,
                            peso: unidade.peso,
                        }
                    })
                )
            });
        });

        this.localService.getUnidades().subscribe((unidades) => {
            Sessao.setVariaveisAmbiente( 'unidadesAtendimento', (unidades.dados || unidades));
        });
    }

	validaExisteEnum(formularios, nome){
		return formularios.filter( (enumobj) => { return nome == enumobj.nome } ).length;
	}

	clearEnums(){
	}
}