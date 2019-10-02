import { Component, ViewChild, Input, Output, ViewContainerRef, EventEmitter, ElementRef, Renderer, OnInit } from '@angular/core';
import { NgxUploaderModule } from 'ngx-uploader';
import { Servidor } from '../../../../services/servidor';
import { Sessao } from '../../../../services/sessao';
import { TratamentoService, PacienteService} from '../../../../services';
import { ActivatedRoute, Router } from '@angular/router';
import { Saida } from '../../../../theme/components/entrada/entrada.component';

import { NgbdModalContent } from '../../../../theme/components/modal/modal.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';

import * as moment from 'moment';
import * as jQuery from 'jquery';
import { FormatosData } from '../../../../theme/components';


@Component({
    selector: 'formulario',
    templateUrl: './formulario.html',
    styleUrls: ['./formulario.scss'],
})
export class Formulario implements OnInit {

    idTratamento;

    novoTratamento = new Object();

    formatosDeDatas;
    colorPicker;

    tamanhoMaximo = 120;

    tiposEncerramento = [];
    opcoesUnidade = [{
        id: 1,
        descricao: 'kdf'
    }];
    tiposTratamento = [];
    evolucoes = [];
    documentos = [];
    guias = [];
    atendimentosPaciente = []
    prescricoes = [];
    profissionaisPaciente = [];


    objParamTratamento = new Object();

    atual = 'geral';

    constructor(
        private toastr: ToastrService, 
        private vcr: ViewContainerRef,
        private modalService: NgbModal,
        private route: ActivatedRoute,
        private service: TratamentoService,
        private servicePaciente: PacienteService,
        private router: Router
    ) {
        this.route.params.subscribe(params => {
            this.idTratamento = (params["idtratamento"] != 'novo') ? params["idtratamento"] : undefined
        });

        this.novoTratamento['frequencia'] = {  };
    }

    ngOnInit() {
        
        this.formatosDeDatas = new FormatosData();

        if( this.idTratamento ){
            this.setTratamento();
            this.getEvolucoes();
            this.getDocumentos();
            this.getGuias();
            this.getPrescricao();
            this.getAgenda();
            this.getProfissionais();
        }

        this.getTiposTratamento();
        this.getTiposEncerramento();

    }

    salvarTratamento(){

        let objParam = this.validaNovoTratamento(this.objParamTratamento);

        // if( !this.novoTratamento['mensagemLembrando'] || this.novoTratamento['mensagemLembrando'].trim() == '' ){
        //     this.toastr.warning("Mensagem lembrando do agendamento é obrigatória");
        //     return;
        // }

        if(!this.idTratamento){
            this.service.salvar(objParam).subscribe(
                retorno => {
                    this.idTratamento = retorno;
                    this.router.navigate([`/${Sessao.getModulo()}/itemprescricao/${retorno}`]);
                    this.toastr.success("Item de Prescrição "+this.novoTratamento['nome']+" adicionado com sucesso");
                    this.setTratamento();
                }
            ) 
        }else{
            this.service.atualizar( this.idTratamento, objParam).subscribe(
                retorno => {
                    this.toastr.success("Item de Prescrição Prescrição "+this.novoTratamento['nome']+" atualizado com sucesso");
                }
            ) 
        }
    }

    setTratamento(){

        //MUDAR PARA GETATENDIMENTOTIPOPORID
        this.service.get( { id : this.idTratamento } ).subscribe(
            tratamento => {
                this.novoTratamento = this.validaTratamento( tratamento.dados[0] );
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);

                this.novoTratamento = this.validaTratamento( 
                    {
                        id:1,
                        paciente:{
                            id: 32342,
                            nome:'Samuel Goncalves Miranda'
                        },
                        tratamento:{
                            id : 1,
                            descricao : 'Psicológico-Terapeutico'
                        },
                        cid:{
                            id : 1,
                            codigo: 'A505',
                            descricao : 'OUTRAS FORMAS TARDIAS E SINTOMATICAS DA SIFILIS CONGENITA'
                        },
                        unidadeAtendimento:{
                            id:1,
                            nome: 'Clínica UNIMED'
                        },
                        inicio: '01/01/2018',
                        fim: '',
                        // encerramento:{
                        //     id : 1,
                        //     descricao: 'encerramenot'
                        // }
                    }
                );

            },
        )
    }

    validaNovoTratamento(obj){
        return obj;
    }

    validaTratamento(tratamento){

        this.valorPacienteSelecionado = (tratamento.paciente) ? tratamento.paciente.nome : '';
        this.valorCidSelecionado = (tratamento.cid) ? tratamento.cid.descricao : '';

        return tratamento; 
    }

    validaCid(){
        return ( this.idTratamento && this.valorCidSelecionado ) || this.valorCidSelecionado == '' || !this.idTratamento;
    }

    voltar(){
        this.router.navigate([`/${Sessao.getModulo()}/tratamento`]);
    }

    getTiposEncerramento(){
        // this.serviceItemProduto.getFrequencias({}).subscribe(
        //     (retorno) => {
                this.tiposEncerramento = [
                    { id:1, descricao:'DKFFLGMD' }
                ]
        //     }
        // )
    }

    getTiposTratamento(){
        // this.serviceItemProduto.getUnidades({}).subscribe(
        //     (retorno) => {
                this.tiposTratamento = [
                    
                ]
        //     }
        // )
    }

    getEvolucoes(){
        // this.serviceItemProduto.getUnidades({}).subscribe(
        //     (retorno) => {
                this.evolucoes = [{"id":77725,"data":"06/08/2018 10:15:06","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":159,"titulo":"*Anotações técnicas Noripurum","descricao":"*Anotações técnicas Noripurum","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda",
                "nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77718,"data":"30/07/2018 09:55:44","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},
                "formulario":{"id":159,"titulo":"*Anotações técnicas Noripurum","descricao":"*Anotações técnicas Noripurum","ativo":true,"tipo":"EVOLUCAO"},
                "usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda",
                "nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77711,"data":"26/07/2018 13:56:11",
                "paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667",
                "nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":
                {"id":120,"titulo":"* Anotações Técnicas - Recursos Próprios",
                "descricao":"*Anotações Técnicas - Recursos Próprios","ativo":true,"tipo":"EVOLUCAO"},"usuario":
                {"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77710,"data":"26/07/2018 13:56:06","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":24,"titulo":"FICHA DE CONSULTA ADULTO","descricao":"FICHA DE CONSULTA ADULTO","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77709,"data":"26/07/2018 13:56:02","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":141,"titulo":" *Classificação do Nível de Risco GCC- Recursos Próprios","descricao":"Classificação do Nível de Risco GCC- Recursos Próprios","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77708,"data":"26/07/2018 13:55:37","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":38,"titulo":"CONSULTA GERIÁTRICA","descricao":"GERIATRIA","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77707,"data":"26/07/2018 13:49:32","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":
                "06/08/1996","idade":"22 ANOS"},"formulario":{"id":37,"titulo":"CONSULTA ORTOPÉDICA","descricao":"ORTOPEDIA","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77706,"data":"26/07/2018 13:46:19","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":56,"titulo":"CONSULTA NEURO","descricao":"NEUROLOGIA","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77705,"data":"26/07/2018 13:44:45","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":61,"titulo":"*Medicamentos Oncológicos Orais","descricao":"*Oncológicos e adjuvantes ","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77704,"data":"26/07/2018 13:44:36","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":30,"titulo":"CONSULTA UROLÓGICA","descricao":"UROLOGIA","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77703,"data":"26/07/2018 13:44:32","paciente":{"id":159561,
                "nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":39,"titulo":"CONSULTA CIRÚRGICA","descricao":"CIRURGIA GERAL, GASTRO, PROCTO E CAD","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77702,"data":"26/07/2018 13:34:04","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":49,"titulo":"CONSULTA DERMATOLÓGICA","descricao":"DERMATOLOGIA","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77701,"data":"26/07/2018 13:34:02","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":49,"titulo":"CONSULTA DERMATOLÓGICA","descricao":"DERMATOLOGIA","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77700,"data":"26/07/2018 13:33:57","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":49,"titulo":"CONSULTA DERMATOLÓGICA","descricao":"DERMATOLOGIA","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77698,"data":"26/07/2018 13:33:56","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":49,"titulo":"CONSULTA DERMATOLÓGICA","descricao":"DERMATOLOGIA","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77699,"data":"26/07/2018 13:33:56","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":49,"titulo":"CONSULTA DERMATOLÓGICA","descricao":"DERMATOLOGIA",
                "ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77697,"data":"26/07/2018 13:33:55","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":49,"titulo":"CONSULTA DERMATOLÓGICA","descricao":"DERMATOLOGIA","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77694,"data":"24/07/2018 11:46:21","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":129,"titulo":"* Evolução da sessão - Psicologia - Clínica","descricao":"* Evolução da sessão -Psicologia - Clínica","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77693,"data":"24/07/2018 11:45:26","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":129,"titulo":"* Evolução da sessão - Psicologia - Clínica","descricao":"* Evolução da sessão -Psicologia - Clínica","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77644,"data":"20/07/2018 12:03:12","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":129,"titulo":"* Evolução da sessão - Psicologia - Clínica","descricao":"* Evolução da sessão -Psicologia - Clínica","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77643,"data":"20/07/2018 12:03:11","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":129,"titulo":"* Evolução da sessão - Psicologia - Clínica","descricao":
                "* Evolução da sessão -Psicologia - Clínica","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77642,"data":"20/07/2018 12:03:08","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":129,"titulo":"* Evolução da sessão - Psicologia - Clínica","descricao":"* Evolução da sessão -Psicologia - Clínica","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77641,"data":"20/07/2018 12:02:58","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":129,"titulo":"* Evolução da sessão - Psicologia - Clínica","descricao":"* Evolução da sessão -Psicologia - Clínica","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77640,"data":"20/07/2018 12:02:34","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":129,"titulo":"* Evolução da sessão - Psicologia - Clínica","descricao":"* Evolução da sessão -Psicologia - Clínica","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77639,"data":"20/07/2018 12:02:33","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":129,"titulo":"* Evolução da sessão - Psicologia - Clínica","descricao":"* Evolução da sessão -Psicologia - Clínica","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77638,"data":"20/07/2018 12:02:30","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996",
                "idade":"22 ANOS"},"formulario":{"id":129,"titulo":"* Evolução da sessão - Psicologia - Clínica","descricao":"* Evolução da sessão -Psicologia - Clínica","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77637,"data":"20/07/2018 12:00:43","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":129,"titulo":"* Evolução da sessão - Psicologia - Clínica","descricao":"* Evolução da sessão -Psicologia - Clínica","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77636,"data":"20/07/2018 12:00:41","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":129,"titulo":"* Evolução da sessão - Psicologia - Clínica","descricao":"* Evolução da sessão -Psicologia - Clínica","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77635,"data":"20/07/2018 12:00:38","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":129,"titulo":"* Evolução da sessão - Psicologia - Clínica","descricao":"* Evolução da sessão -Psicologia - Clínica","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77634,"data":"20/07/2018 12:00:37","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":129,"titulo":"* Evolução da sessão - Psicologia - Clínica","descricao":"* Evolução da sessão -Psicologia - Clínica","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77633,"data":"20/07/2018 12:00:28",
                "paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":129,"titulo":"* Evolução da sessão - Psicologia - Clínica","descricao":"* Evolução da sessão -Psicologia - Clínica","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77632,"data":"20/07/2018 12:00:21","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":129,"titulo":"* Evolução da sessão - Psicologia - Clínica","descricao":"* Evolução da sessão -Psicologia - Clínica","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77631,"data":"20/07/2018 12:00:19","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":129,"titulo":"* Evolução da sessão - Psicologia - Clínica","descricao":"* Evolução da sessão -Psicologia - Clínica","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77630,"data":"20/07/2018 12:00:18","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":129,"titulo":"* Evolução da sessão - Psicologia - Clínica","descricao":"* Evolução da sessão -Psicologia - Clínica","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77629,"data":"20/07/2018 12:00:05","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":129,"titulo":"* Evolução da sessão - Psicologia - Clínica","descricao":"* Evolução da sessão -Psicologia - Clínica","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371",
                "username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77628,"data":"20/07/2018 12:00:03","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":129,"titulo":"* Evolução da sessão - Psicologia - Clínica","descricao":"* Evolução da sessão -Psicologia - Clínica","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77627,"data":"20/07/2018 12:00:01","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":129,"titulo":"* Evolução da sessão - Psicologia - Clínica","descricao":"* Evolução da sessão -Psicologia - Clínica","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77626,"data":"20/07/2018 11:59:58","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":129,"titulo":"* Evolução da sessão - Psicologia - Clínica","descricao":"* Evolução da sessão -Psicologia - Clínica","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77625,"data":"20/07/2018 11:59:54","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":129,"titulo":"* Evolução da sessão - Psicologia - Clínica","descricao":"* Evolução da sessão -Psicologia - Clínica","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77624,"data":"20/07/2018 09:38:45","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":159,"titulo":"*Anotações técnicas Noripurum",
                "descricao":"*Anotações técnicas Noripurum","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77623,"data":"20/07/2018 08:33:52","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":114,"titulo":" * Triagem Adulto -Psicologia - Clínica","descricao":" * Triagem Adulto -Psicologia - Clínica","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77622,"data":"20/07/2018 08:32:34","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":115,"titulo":" *Elegibilidade - Estratificação de risco - Recursos Próprios","descricao":"Elegibilidade - Estratificação de risco - Recursos Próprios","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77621,"data":"18/07/2018 14:52:59","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":53,"titulo":" *Classificação do nível de risco - Hipertensão arterial-Mais Vida","descricao":"Classificação do nível de risco - Hipertensão arterial-Mais Vida","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"31AA3146-AEAE-4864-9370-C3AF32F70B89","username":"bruno.rodrigues","celular":"34991914633","nome":"Bruno Rocha Rodrigues","email":"brunor@unimeduberaba.com.br","ativo":true,"bloqueado":false}},{"id":77620,"data":"18/07/2018 14:52:37","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":53,"titulo":" *Classificação do nível de risco - Hipertensão arterial-Mais Vida","descricao":"Classificação do nível de risco - Hipertensão arterial-Mais Vida","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"31AA3146-AEAE-4864-9370-C3AF32F70B89",
                "username":"bruno.rodrigues","celular":"34991914633","nome":"Bruno Rocha Rodrigues","email":"brunor@unimeduberaba.com.br","ativo":true,"bloqueado":false}},{"id":77619,"data":"18/07/2018 14:52:35","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":53,"titulo":" *Classificação do nível de risco - Hipertensão arterial-Mais Vida","descricao":"Classificação do nível de risco - Hipertensão arterial-Mais Vida","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"31AA3146-AEAE-4864-9370-C3AF32F70B89","username":"bruno.rodrigues","celular":"34991914633","nome":"Bruno Rocha Rodrigues","email":"brunor@unimeduberaba.com.br","ativo":true,"bloqueado":false}},{"id":77618,"data":"18/07/2018 14:52:14","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":58,"titulo":"AVALIAÇÃO AMPLA","descricao":"AVALIAÇÃO AMPLA","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"31AA3146-AEAE-4864-9370-C3AF32F70B89","username":"bruno.rodrigues","celular":"34991914633","nome":"Bruno Rocha Rodrigues","email":"brunor@unimeduberaba.com.br","ativo":true,"bloqueado":false}},{"id":77617,"data":"18/07/2018 14:51:57","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":58,"titulo":"AVALIAÇÃO AMPLA","descricao":"AVALIAÇÃO AMPLA","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"31AA3146-AEAE-4864-9370-C3AF32F70B89","username":"bruno.rodrigues","celular":"34991914633","nome":"Bruno Rocha Rodrigues","email":"brunor@unimeduberaba.com.br","ativo":true,"bloqueado":false}},{"id":77616,"data":"18/07/2018 14:51:54","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":58,"titulo":"AVALIAÇÃO AMPLA","descricao":"AVALIAÇÃO AMPLA","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"31AA3146-AEAE-4864-9370-C3AF32F70B89","username":"bruno.rodrigues","celular":"34991914633","nome":"Bruno Rocha Rodrigues","email":"brunor@unimeduberaba.com.br","ativo":true,"bloqueado":false}},
                {"id":77615,"data":"18/07/2018 14:51:37","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":129,"titulo":"* Evolução da sessão - Psicologia - Clínica","descricao":"* Evolução da sessão -Psicologia - Clínica","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"31AA3146-AEAE-4864-9370-C3AF32F70B89","username":"bruno.rodrigues","celular":"34991914633","nome":"Bruno Rocha Rodrigues","email":"brunor@unimeduberaba.com.br","ativo":true,"bloqueado":false}},{"id":77605,"data":"18/07/2018 14:41:58","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":120,"titulo":"* Anotações Técnicas - Recursos Próprios","descricao":"*Anotações Técnicas - Recursos Próprios","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"31AA3146-AEAE-4864-9370-C3AF32F70B89","username":"bruno.rodrigues","celular":"34991914633","nome":"Bruno Rocha Rodrigues","email":"brunor@unimeduberaba.com.br","ativo":true,"bloqueado":false}},{"id":77604,"data":"18/07/2018 14:41:57","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":120,"titulo":"* Anotações Técnicas - Recursos Próprios","descricao":"*Anotações Técnicas - Recursos Próprios","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"31AA3146-AEAE-4864-9370-C3AF32F70B89","username":"bruno.rodrigues","celular":"34991914633","nome":"Bruno Rocha Rodrigues","email":"brunor@unimeduberaba.com.br","ativo":true,"bloqueado":false}},{"id":77603,"data":"18/07/2018 14:41:55","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":120,"titulo":"* Anotações Técnicas - Recursos Próprios","descricao":"*Anotações Técnicas - Recursos Próprios","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"31AA3146-AEAE-4864-9370-C3AF32F70B89","username":"bruno.rodrigues","celular":"34991914633","nome":"Bruno Rocha Rodrigues","email":"brunor@unimeduberaba.com.br","ativo":true,"bloqueado":false}},{"id":77602,"data":"18/07/2018 14:41:45","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":120,"titulo":"* Anotações Técnicas - Recursos Próprios","descricao":"*Anotações Técnicas - Recursos Próprios","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"31AA3146-AEAE-4864-9370-C3AF32F70B89","username":"bruno.rodrigues","celular":"34991914633","nome":"Bruno Rocha Rodrigues","email":"brunor@unimeduberaba.com.br","ativo":true,"bloqueado":false}},{"id":77597,"data":"18/07/2018 14:37:24","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":63,"titulo":" * Escala ambiental de Risco de queda - Gerenciamento de risco - Mais Vida ","descricao":"Escala ambiental de Risco de queda - Gerenciamento de risco - Mais Vida ","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"31AA3146-AEAE-4864-9370-C3AF32F70B89","username":"bruno.rodrigues","celular":"34991914633","nome":"Bruno Rocha Rodrigues","email":"brunor@unimeduberaba.com.br","ativo":true,"bloqueado":false}},{"id":77598,"data":"18/07/2018 14:37:24","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":63,"titulo":" * Escala ambiental de Risco de queda - Gerenciamento de risco - Mais Vida ","descricao":"Escala ambiental de Risco de queda - Gerenciamento de risco - Mais Vida ","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"31AA3146-AEAE-4864-9370-C3AF32F70B89","username":"bruno.rodrigues","celular":"34991914633","nome":"Bruno Rocha Rodrigues","email":"brunor@unimeduberaba.com.br","ativo":true,"bloqueado":false}},{"id":77596,"data":"18/07/2018 14:37:23","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":63,"titulo":" * Escala ambiental de Risco de queda - Gerenciamento de risco - Mais Vida ","descricao":"Escala ambiental de Risco de queda - Gerenciamento de risco - Mais Vida ","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"31AA3146-AEAE-4864-9370-C3AF32F70B89","username":"bruno.rodrigues","celular":"34991914633","nome":"Bruno Rocha Rodrigues","email":"brunor@unimeduberaba.com.br","ativo":true,"bloqueado":false}},{"id":77595,"data":"18/07/2018 14:37:17","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":63,"titulo":" * Escala ambiental de Risco de queda - Gerenciamento de risco - Mais Vida ","descricao":"Escala ambiental de Risco de queda - Gerenciamento de risco - Mais Vida ","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"31AA3146-AEAE-4864-9370-C3AF32F70B89","username":"bruno.rodrigues","celular":"34991914633","nome":"Bruno Rocha Rodrigues","email":"brunor@unimeduberaba.com.br","ativo":true,"bloqueado":false}},{"id":77593,"data":"18/07/2018 14:37:16","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":63,"titulo":" * Escala ambiental de Risco de queda - Gerenciamento de risco - Mais Vida ","descricao":"Escala ambiental de Risco de queda - Gerenciamento de risco - Mais Vida ","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"31AA3146-AEAE-4864-9370-C3AF32F70B89","username":"bruno.rodrigues","celular":"34991914633","nome":"Bruno Rocha Rodrigues","email":"brunor@unimeduberaba.com.br","ativo":true,"bloqueado":false}},{"id":77594,"data":"18/07/2018 14:37:16","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":63,"titulo":" * Escala ambiental de Risco de queda - Gerenciamento de risco - Mais Vida ","descricao":"Escala ambiental de Risco de queda - Gerenciamento de risco - Mais Vida ","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"31AA3146-AEAE-4864-9370-C3AF32F70B89","username":"bruno.rodrigues","celular":"34991914633","nome":"Bruno Rocha Rodrigues","email":"brunor@unimeduberaba.com.br","ativo":true,"bloqueado":false}},{"id":77586,"data":"16/07/2018 16:25:58","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":109,"titulo":"A1 - Form Teste","descricao":"A1 - Form Teste","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":77585,"data":"16/07/2018 16:22:38","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":109,"titulo":"A1 - Form Teste","descricao":"A1 - Form Teste","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":75765,"data":"09/07/2018 08:38:04","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":115,"titulo":" *Elegibilidade - Estratificação de risco - Recursos Próprios","descricao":"Elegibilidade - Estratificação de risco - Recursos Próprios","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":74560,"data":"03/07/2018 09:55:53","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":129,"titulo":"* Evolução da sessão - Psicologia - Clínica","descricao":"* Evolução da sessão -Psicologia - Clínica","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":73814,"data":"29/06/2018 11:39:03","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"formulario":{"id":115,"titulo":" *Elegibilidade - Estratificação de risco - Recursos Próprios","descricao":"Elegibilidade - Estratificação de risco - Recursos Próprios","ativo":true,"tipo":"EVOLUCAO"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}
            }]
        //     }
        // )
    }

    getDocumentos(){
        // this.serviceItemProduto.getUnidades({}).subscribe(
        //     (retorno) => {
            this.documentos = [{
                "id": 77691,
                "data": "23/07/2018 11:55:46",
                "paciente": {
                    "id": 159561,
                    "nome": "SAMUEL GONCALVES MIRANDA",
                    "cpf": "09837270667",
                    "nascimento": "06/08/1996",
                    "idade": "22 ANOS"
                },
                "formulario": {
                    "id": 160,
                    "titulo": "TESTE MODELO CASSINAO MOTOBOI 2.0",
                    "descricao": "TESTEM MO CASSINAO MOTOBOI 2.0",
                    "ativo": true,
                    "tipo": "MODELO"
                },
                "usuario": {
                    "guid": "44074FED-5A38-4BBE-9E89-4066B2941371",
                    "username": "samuel.miranda",
                    "nome": "Samuel Miranda",
                    "ativo": true,
                    "bloqueado": false
                },
                "modelo": "TEKFN SLFN  SAMUEL GONCALVES MIRANDA SDFLJ AÇLKF REG\\n\\n 23/07/2018 11:55:46 CHUA CHUÁ"
            }, {
                "id": 77687,
                "data": "23/07/2018 11:54:51",
                "paciente": {
                    "id": 159561,
                    "nome": "SAMUEL GONCALVES MIRANDA",
                    "cpf": "09837270667",
                    "nascimento": "06/08/1996",
                    "idade": "22 ANOS"
                },
                "formulario": {
                    "id": 160,
                    "titulo": "TESTE MODELO CASSINAO MOTOBOI 2.0",
                    "descricao": "TESTEM MO CASSINAO MOTOBOI 2.0",
                    "ativo": true,
                    "tipo": "MODELO"
                },
                "usuario": {
                    "guid": "ED787DA0-E415-4851-A48A-4EAB9BAB0803",
                    "username": "cassiano.melo",
                    "telefone": " ",
                    "celular": "34988053453",
                    "nome": "Cassiano Prado Melo",
                    "email": "cassiano.melo@unimeduberaba.com.br",
                    "ativo": true,
                    "bloqueado": false
                },
                "modelo": "TEKFN SLFN  SAMUEL GONCALVES MIRANDA SDFLJ AÇLKF REG\\n\\n 23/07/2018 11:54:51 CHUA CHUÁ"
            }, {
                "id": 77686,
                "data": "23/07/2018 11:54:10",
                "paciente": {
                    "id": 159561,
                    "nome": "SAMUEL GONCALVES MIRANDA",
                    "cpf": "09837270667",
                    "nascimento": "06/08/1996",
                    "idade": "22 ANOS"
                },
                "formulario": {
                    "id": 160,
                    "titulo": "TESTE MODELO CASSINAO MOTOBOI 2.0",
                    "descricao": "TESTEM MO CASSINAO MOTOBOI 2.0",
                    "ativo": true,
                    "tipo": "MODELO"
                },
                "usuario": {
                    "guid": "ED787DA0-E415-4851-A48A-4EAB9BAB0803",
                    "username": "cassiano.melo",
                    "telefone": " ",
                    "celular": "34988053453",
                    "nome": "Cassiano Prado Melo",
                    "email": "cassiano.melo@unimeduberaba.com.br",
                    "ativo": true,
                    "bloqueado": false
                },
                "modelo": "TEKFN SLFN  SAMUEL GONCALVES MIRANDA SDFLJ AÇLKF REG\\n\\n 23/07/2018 11:54:10 CHUA CHUÁ"
            }, {
                "id": 77685,
                "data": "23/07/2018 11:48:24",
                "paciente": {
                    "id": 159561,
                    "nome": "SAMUEL GONCALVES MIRANDA",
                    "cpf": "09837270667",
                    "nascimento": "06/08/1996",
                    "idade": "22 ANOS"
                },
                "formulario": {
                    "id": 160,
                    "titulo": "TESTE MODELO CASSINAO MOTOBOI 2.0",
                    "descricao": "TESTEM MO CASSINAO MOTOBOI 2.0",
                    "ativo": true,
                    "tipo": "MODELO"
                },
                "usuario": {
                    "guid": "ED787DA0-E415-4851-A48A-4EAB9BAB0803",
                    "username": "cassiano.melo",
                    "telefone": " ",
                    "celular": "34988053453",
                    "nome": "Cassiano Prado Melo",
                    "email": "cassiano.melo@unimeduberaba.com.br",
                    "ativo": true,
                    "bloqueado": false
                },
                "modelo": "TEKFN SLFN  SAMUEL GONCALVES MIRANDA SDFLJ AÇLKF REG\\n\\n 23/07/2018 11:48:24 CHUA CHUÁ"
            }]
        //     }
        // )
    }

    getGuias(){
        // this.serviceItemProduto.getUnidades({}).subscribe(
        //     (retorno) => {
        this.guias = [{
            "id": 36018956,
            "paciente": {
                "id": 159561,
                "nome": "SAMUEL GONCALVES MIRANDA",
                "cpf": "09837270667",
                "nascimento": "06/08/1996",
                "idade": "22 ANOS"
            },
            "guia": {
                "id": 36018956,
                "impresso": "70007474254",
                "status": "AUTORIZADA",
                "indicacaoClinica": "PACIENTE REFERE TRAUMA ONTEM JOGANDO FUTEBOL REFERE TRAUMA DIRETO APOS DIVIDIA COM TRAUMA EM DORSO DO PE QUEIXA DOR LEVE COM DIFICULDADE PARA APOIAR NO SOLO.",
                "beneficiario": {
                    "id": 10095547,
                    "codigo": "00210040000691004",
                    "nome": "SAMUEL GONCALVES MIRANDA",
                    "nascimento": "06/08/1996",
                    "idade": "22 ANOS",
                    "estadoCivil": "Solteiro(a)",
                    "contratante": "UNIMED UBERABA LTDA - MATRIZ",
                    "endereco": "AV MEI MEI, N, 710 - LT 18 - QD 03 - ONEIDA MENDES - UBERABA",
                    "telefone": "33367480",
                    "plano": "REG-PP-PJ-AMBHOSP-OBST-RB-E-PARTICIPATIVO-FUNC UNIMED",
                    "inclusao": "23/11/2017",
                    "tempoContrato": "8 MESES E 14 DIAS"
                },
                "prestador": {
                    "id": 4894,
                    "codigo": "220023",
                    "nome": "HOSP. UNIVERSITARIO MARIO PALMERIO",
                    "endereco": "AVENIDA NENE SABINO, 2477 - S DUMONT - 38050501 - Uberaba - MG",
                    "telefone": "3352 1700"
                },
                "itens": [{
                    "guia": {
                        "id": 36018956,
                        "impresso": "70007474254",
                        "status": "Autorizada",
                        "prestador": "HOSP. UNIVERSITARIO MARIO PALMERIO",
                        "especialidade": "CRENDECIADOS - HOSPITAIS",
                        "digitacao": "25/01/2018",
                        "solicitanteNome": "HOSP. SOCIEDADE EDUCACIONAL UB",
                        "token": "6D61EA42-012D-AD72-E053-3C4A3A8C031B",
                        "anexos": 0,
                        "nivelAuditoria": "ADM"
                    },
                    "id": 30947781,
                    "procedimento": {
                        "id": 149724,
                        "codigo": "40804097",
                        "descricao": "RX - PE OU PODODACTILO",
                        "classe": {
                            "id": 38,
                            "codigo": "000038",
                            "descricao": "DIAGNOSE E TERAPIA - IMAGEM",
                            "ordem": 3
                        },
                        "altoCusto": false
                    },
                    "sequencia": "001",
                    "quantidadeSolicitada": 1,
                    "quantidadeAutorizada": 1,
                    "saldo": 0,
                    "liberacao": "23/01/2018 00:00:00",
                    "recno": 23243028,
                    "auditoria": false,
                    "status": "1",
                    "excluido": false,
                    "origem": "BE2010",
                    "criticas": []
                }],
                "local": {
                    "id": 187,
                    "cnes": "2195585",
                    "prestador": {
                        "id": 4894,
                        "codigo": "220023",
                        "nome": "HOSP. UNIVERSITARIO MARIO PALMERIO",
                        "endereco": "AVENIDA NENE SABINO, 2477 - S DUMONT - 38050501 - Uberaba - MG",
                        "telefone": "3352 1700"
                    },
                    "endereco": "AV NENE SABINO, n, 2477",
                    "cidade": "UBERABA",
                    "estado": "MG",
                    "codigo": "001",
                    "guiaMedico": true,
                    "telefone": "3352 1700",
                    "logradouro": "AV NENE SABINO, n",
                    "numero": "2477",
                    "bairro": "Santos Dumont",
                    "cep": "38050501",
                    "ddd": "34",
                    "descricao": "HOSPITAL"
                },
                "solicitanteNome": "HOSP. SOCIEDADE EDUCACIONAL UB",
                "digitacao": "25/01/2018 00:00:00",
                "validade": "26/03/2018 00:00:00",
                "tipo": "SADT",
                "cobrada": true,
                "admissao": "URGENCIA",
                "cancelada": false,
                "auditoria": false,
                "anoPagamento": "2018",
                "mesPagamento": "01",
                "numeroGuia": "00004897",
                "contaImportada": false,
                "ignoraPrazo": "25/05/2018 00:00:00",
                "origem": "70007459057",
                "especialidade": {
                    "id": 75,
                    "codigo": "079",
                    "descricao": "CRENDECIADOS - HOSPITAIS"
                },
                "ultimaAutorizacao": "25/01/2018 00:00:00",
                "token": "6D61EA42-012D-AD72-E053-3C4A3A8C031B",
                "anexos": 0,
                "nivelAuditoria": "ADM",
                "ano": "2018",
                "mes": "01",
                "numero": "00136507",
                "rn": false,
                "classificacao": {
                    "id": 3,
                    "descricao": "SADT",
                    "ordem": 3
                }
            },
            "redeatendimento": "HOSP. UNIVERSITARIO MARIO PALMERIO",
            "especialidade": "CRENDECIADOS - HOSPITAIS"
        }, {
            "id": 35997706,
            "paciente": {
                "id": 159561,
                "nome": "SAMUEL GONCALVES MIRANDA",
                "cpf": "09837270667",
                "nascimento": "06/08/1996",
                "idade": "22 ANOS"
            },
            "guia": {
                "id": 35997706,
                "impresso": "70007459057",
                "status": "AUTORIZADA",
                "indicacaoClinica": "CONSULTA",
                "beneficiario": {
                    "id": 10095547,
                    "codigo": "00210040000691004",
                    "nome": "SAMUEL GONCALVES MIRANDA",
                    "nascimento": "06/08/1996",
                    "idade": "22 ANOS",
                    "estadoCivil": "Solteiro(a)",
                    "contratante": "UNIMED UBERABA LTDA - MATRIZ",
                    "endereco": "AV MEI MEI, N, 710 - LT 18 - QD 03 - ONEIDA MENDES - UBERABA",
                    "telefone": "33367480",
                    "plano": "REG-PP-PJ-AMBHOSP-OBST-RB-E-PARTICIPATIVO-FUNC UNIMED",
                    "inclusao": "23/11/2017",
                    "tempoContrato": "8 MESES E 14 DIAS"
                },
                "prestador": {
                    "id": 4894,
                    "codigo": "220023",
                    "nome": "HOSP. UNIVERSITARIO MARIO PALMERIO",
                    "endereco": "AVENIDA NENE SABINO, 2477 - S DUMONT - 38050501 - Uberaba - MG",
                    "telefone": "3352 1700"
                },
                "itens": [{
                    "guia": {
                        "id": 35997706,
                        "impresso": "70007459057",
                        "status": "Autorizada",
                        "prestador": "HOSP. UNIVERSITARIO MARIO PALMERIO",
                        "especialidade": "CRENDECIADOS - HOSPITAIS",
                        "digitacao": "23/01/2018",
                        "solicitanteNome": "HOSP. SOCIEDADE EDUCACIONAL UB",
                        "token": "6D61EA3F-ADDF-AD72-E053-3C4A3A8C031B",
                        "anexos": 0,
                        "nivelAuditoria": "ADM"
                    },
                    "id": 30891938,
                    "procedimento": {
                        "id": 152782,
                        "codigo": "10101039",
                        "descricao": "Em pronto socorro",
                        "classe": {
                            "id": 1,
                            "codigo": "000001",
                            "descricao": "CONSULTAS",
                            "ordem": 2
                        },
                        "altoCusto": false
                    },
                    "sequencia": "001",
                    "quantidadeSolicitada": 1,
                    "quantidadeAutorizada": 1,
                    "saldo": 0,
                    "liberacao": "23/01/2018 00:00:00",
                    "recno": 23186931,
                    "auditoria": false,
                    "status": "1",
                    "excluido": false,
                    "origem": "BE2010",
                    "criticas": []
                }],
                "local": {
                    "id": 187,
                    "cnes": "2195585",
                    "prestador": {
                        "id": 4894,
                        "codigo": "220023",
                        "nome": "HOSP. UNIVERSITARIO MARIO PALMERIO",
                        "endereco": "AVENIDA NENE SABINO, 2477 - S DUMONT - 38050501 - Uberaba - MG",
                        "telefone": "3352 1700"
                    },
                    "endereco": "AV NENE SABINO, n, 2477",
                    "cidade": "UBERABA",
                    "estado": "MG",
                    "codigo": "001",
                    "guiaMedico": true,
                    "telefone": "3352 1700",
                    "logradouro": "AV NENE SABINO, n",
                    "numero": "2477",
                    "bairro": "Santos Dumont",
                    "cep": "38050501",
                    "ddd": "34",
                    "descricao": "HOSPITAL"
                },
                "solicitanteNome": "HOSP. SOCIEDADE EDUCACIONAL UB",
                "digitacao": "23/01/2018 00:00:00",
                "validade": "24/03/2018 00:00:00",
                "tipo": "SADT",
                "cobrada": true,
                "admissao": "URGENCIA",
                "cancelada": false,
                "auditoria": false,
                "anoPagamento": "2018",
                "mesPagamento": "02",
                "numeroGuia": "00000770",
                "contaImportada": false,
                "ignoraPrazo": "23/05/2018 00:00:00",
                "especialidade": {
                    "id": 75,
                    "codigo": "079",
                    "descricao": "CRENDECIADOS - HOSPITAIS"
                },
                "ultimaAutorizacao": "23/01/2018 00:00:00",
                "token": "6D61EA3F-ADDF-AD72-E053-3C4A3A8C031B",
                "anexos": 0,
                "nivelAuditoria": "ADM",
                "ano": "2018",
                "mes": "01",
                "numero": "00114803",
                "rn": false,
                "classificacao": {
                    "id": 32,
                    "descricao": "P.A.",
                    "ordem": 32
                }
            },
            "redeatendimento": "HOSP. UNIVERSITARIO MARIO PALMERIO",
            "especialidade": "CRENDECIADOS - HOSPITAIS"
        }, {
            "id": 30565398,
            "paciente": {
                "id": 159561,
                "nome": "SAMUEL GONCALVES MIRANDA",
                "cpf": "09837270667",
                "nascimento": "06/08/1996",
                "idade": "22 ANOS"
            },
            "guia": {
                "id": 30565398,
                "impresso": "00058620032",
                "status": "AUTORIZADA",
                "beneficiario": {
                    "id": 92104,
                    "codigo": "01066536109892106",
                    "nome": "SAMUEL GONCALVES MIRANDA",
                    "nascimento": "06/08/1996",
                    "idade": "22 ANOS",
                    "estadoCivil": "Solteiro(a)",
                    "contratante": "INTERCAMBIO EVENTUAL",
                    "plano": "INTERCAMBIO EVENTUAL",
                    "inclusao": "01/05/2008",
                    "tempoContrato": "10 ANOS, 3 MESES E 5 DIAS"
                },
                "prestador": {
                    "id": 757,
                    "codigo": "220007",
                    "nome": "HOSP E MAT. SAO DOM NA PROV DE DEUS",
                    "endereco": "CONTITUICAO, 751 - NSSA SRA ABADIA - 38025110 - Uberaba - MG",
                    "telefone": "3318 9200 3318 9207"
                },
                "itens": [{
                    "guia": {
                        "id": 30565398,
                        "impresso": "00058620032",
                        "status": "Autorizada",
                        "prestador": "HOSP E MAT. SAO DOM NA PROV DE DEUS",
                        "digitacao": "02/02/2010",
                        "solicitanteNome": "GAMANIEL DE OLIVEIRA",
                        "token": "6D61E9F0-2F79-AD72-E053-3C4A3A8C031B",
                        "anexos": 0
                    },
                    "id": 19850832,
                    "procedimento": {
                        "id": 116917,
                        "codigo": "00010073",
                        "descricao": "CONSULTA PRONTO SOCORRO   PRONTO ATENDIMENTO",
                        "classe": {
                            "id": 1,
                            "codigo": "000001",
                            "descricao": "CONSULTAS",
                            "ordem": 2
                        },
                        "altoCusto": false
                    },
                    "sequencia": "001",
                    "quantidadeSolicitada": 1,
                    "quantidadeAutorizada": 1,
                    "saldo": 0,
                    "liberacao": "31/01/2010 00:00:00",
                    "recno": 551768,
                    "auditoria": false,
                    "status": "1",
                    "excluido": false,
                    "origem": "BE2010",
                    "criticas": []
                }],
                "local": {
                    "id": 1943,
                    "cnes": "7647891",
                    "prestador": {
                        "id": 757,
                        "codigo": "220007",
                        "nome": "HOSP E MAT. SAO DOM NA PROV DE DEUS",
                        "endereco": "CONTITUICAO, 751 - NSSA SRA ABADIA - 38025110 - Uberaba - MG",
                        "telefone": "3318 9200 3318 9207"
                    },
                    "endereco": "CONSTITUICAO, 751",
                    "cidade": "UBERABA",
                    "estado": "MG",
                    "codigo": "001",
                    "guiaMedico": true,
                    "telefone": "3318 9200",
                    "logradouro": "CONSTITUICAO",
                    "numero": "751",
                    "bairro": "Nossa Senhora da Abadia",
                    "cep": "38025110",
                    "ddd": "034",
                    "descricao": "HOSPITAL"
                },
                "solicitanteNome": "GAMANIEL DE OLIVEIRA",
                "digitacao": "02/02/2010 00:00:00",
                "validade": "02/03/2010 00:00:00",
                "tipo": "SADT",
                "cobrada": false,
                "admissao": "ELETIVO",
                "cid": {
                    "id": 3512,
                    "codigo": "J039",
                    "descricao": "AMIGDALITE AGUDA NAO ESPECIFICADA",
                    "abreviacao": "AMIGDALITE AGUDA NAO ESPE"
                },
                "operadora": {
                    "id": 99,
                    "codigo": "0106",
                    "descricao": "UNIMED RONDONIA - COOPERATIVA DE TRABALHO MEDICO"
                },
                "cancelada": false,
                "auditoria": false,
                "anoPagamento": "2010",
                "mesPagamento": "01",
                "numeroGuia": "00000677",
                "contaImportada": false,
                "ignoraPrazo": "01/05/2010 00:00:00",
                "token": "6D61E9F0-2F79-AD72-E053-3C4A3A8C031B",
                "anexos": 0,
                "ano": "2010",
                "mes": "01",
                "numero": "00072817",
                "rn": false
            },
            "redeatendimento": "HOSP E MAT. SAO DOM NA PROV DE DEUS"
        }, {
            "id": 20904292,
            "paciente": {
                "id": 159561,
                "nome": "SAMUEL GONCALVES MIRANDA",
                "cpf": "09837270667",
                "nascimento": "06/08/1996",
                "idade": "22 ANOS"
            },
            "guia": {
                "id": 20904292,
                "impresso": "80002990281",
                "status": "AUTORIZADA",
                "indicacaoClinica": "AVALIACAO",
                "beneficiario": {
                    "id": 10003049,
                    "codigo": "00145035206896001",
                    "nome": "SAMUEL GONCALVES MIRANDA",
                    "nascimento": "06/08/1996",
                    "idade": "22 ANOS",
                    "estadoCivil": "Solteiro(a)",
                    "contratante": "INTERCAMBIO EVENTUAL",
                    "plano": "INTERCAMBIO EVENTUAL",
                    "inclusao": "08/08/2016",
                    "tempoContrato": "1 ANO, 11 MESES E 29 DIAS"
                },
                "prestador": {
                    "id": 1603,
                    "codigo": "000002",
                    "nome": "REDE DE ATENDIMENTO DE SOLICITACAO",
                    "endereco": ",  -  -  - Uberaba - MG"
                },
                "itens": [{
                    "guia": {
                        "id": 20904292,
                        "impresso": "80002990281",
                        "status": "Autorizada",
                        "prestador": "REDE DE ATENDIMENTO DE SOLICITACAO",
                        "digitacao": "08/08/2016",
                        "solicitanteNome": "JOAO EDUARDO CAIXETA RIBEIRO",
                        "token": "6D61E9E2-6B44-AD72-E053-3C4A3A8C031B",
                        "anexos": 0
                    },
                    "id": 16758529,
                    "procedimento": {
                        "id": 149509,
                        "codigo": "41301323",
                        "descricao": "TONOMETRIA - BINOCULAR",
                        "classe": {
                            "id": 43,
                            "codigo": "000043",
                            "descricao": "DIAGNOSE E TERAPIA - EXAMES ESPECIFICOS",
                            "ordem": 3
                        },
                        "altoCusto": false
                    },
                    "sequencia": "001",
                    "quantidadeSolicitada": 1,
                    "quantidadeAutorizada": 1,
                    "saldo": 0,
                    "liberacao": "08/08/2016 00:00:00",
                    "recno": 16758529,
                    "auditoria": false,
                    "status": "1",
                    "excluido": false,
                    "origem": "BE2010",
                    "criticas": []
                }, {
                    "guia": {
                        "id": 20904292,
                        "impresso": "80002990281",
                        "status": "Autorizada",
                        "prestador": "REDE DE ATENDIMENTO DE SOLICITACAO",
                        "digitacao": "08/08/2016",
                        "solicitanteNome": "JOAO EDUARDO CAIXETA RIBEIRO",
                        "token": "6D61E9E2-6B44-AD72-E053-3C4A3A8C031B",
                        "anexos": 0
                    },
                    "id": 16758532,
                    "procedimento": {
                        "id": 149519,
                        "codigo": "41301250",
                        "descricao": "MAPEAMENTO DE RETINA  OFTALMOSCOPIA INDIRETA  - MONOCULAR",
                        "classe": {
                            "id": 43,
                            "codigo": "000043",
                            "descricao": "DIAGNOSE E TERAPIA - EXAMES ESPECIFICOS",
                            "ordem": 3
                        },
                        "altoCusto": false
                    },
                    "sequencia": "002",
                    "quantidadeSolicitada": 2,
                    "quantidadeAutorizada": 2,
                    "saldo": 0,
                    "liberacao": "08/08/2016 00:00:00",
                    "recno": 16758532,
                    "auditoria": false,
                    "status": "1",
                    "excluido": false,
                    "origem": "BE2010",
                    "criticas": []
                }],
                "local": {
                    "id": 2011,
                    "prestador": {
                        "id": 1603,
                        "codigo": "000002",
                        "nome": "REDE DE ATENDIMENTO DE SOLICITACAO",
                        "endereco": ",  -  -  - Uberaba - MG"
                    },
                    "endereco": "R ALAOR PRATA, n, ",
                    "cidade": "UBERABA",
                    "estado": "MG",
                    "codigo": "001",
                    "guiaMedico": false,
                    "logradouro": "R ALAOR PRATA, n",
                    "bairro": "Estados Unidos",
                    "cep": "38015010",
                    "ddd": "034",
                    "descricao": "CONSULTORIO"
                },
                "solicitanteNome": "JOAO EDUARDO CAIXETA RIBEIRO",
                "digitacao": "08/08/2016 00:00:00",
                "validade": "07/10/2016 00:00:00",
                "tipo": "SADT",
                "cobrada": false,
                "admissao": "ELETIVO",
                "operadora": {
                    "id": 14,
                    "codigo": "0014",
                    "descricao": "UNIMED UBERLANDIA COOPERATIVA  REGIONAL  DE TRABALHO MEDICO"
                },
                "cancelada": false,
                "auditoria": false,
                "anoPagamento": "2016",
                "mesPagamento": "08",
                "numeroGuia": "00009064",
                "contaImportada": false,
                "ignoraPrazo": "06/12/2016 00:00:00",
                "token": "6D61E9E2-6B44-AD72-E053-3C4A3A8C031B",
                "anexos": 0,
                "ano": "2016",
                "mes": "08",
                "numero": "00041036",
                "rn": false,
                "classificacao": {
                    "id": 1,
                    "descricao": "OFTALMOLOGIA",
                    "ordem": 1
                }
            },
            "redeatendimento": "REDE DE ATENDIMENTO DE SOLICITACAO"
        }, {
            "id": 20903195,
            "paciente": {
                "id": 159561,
                "nome": "SAMUEL GONCALVES MIRANDA",
                "cpf": "09837270667",
                "nascimento": "06/08/1996",
                "idade": "22 ANOS"
            },
            "guia": {
                "id": 20903195,
                "impresso": "80002990239",
                "status": "AUTORIZADA",
                "beneficiario": {
                    "id": 10003049,
                    "codigo": "00145035206896001",
                    "nome": "SAMUEL GONCALVES MIRANDA",
                    "nascimento": "06/08/1996",
                    "idade": "22 ANOS",
                    "estadoCivil": "Solteiro(a)",
                    "contratante": "INTERCAMBIO EVENTUAL",
                    "plano": "INTERCAMBIO EVENTUAL",
                    "inclusao": "08/08/2016",
                    "tempoContrato": "1 ANO, 11 MESES E 29 DIAS"
                },
                "prestador": {
                    "id": 336,
                    "codigo": "110455",
                    "nome": "JOAO EDUARDO CAIXETA RIBEIRO",
                    "endereco": "SANTOS DUMONT, 409 - CENTRO - 38010370 - Uberaba - MG",
                    "telefone": "3332-3033"
                },
                "itens": [{
                    "guia": {
                        "id": 20903195,
                        "impresso": "80002990239",
                        "status": "Autorizada",
                        "prestador": "JOAO EDUARDO CAIXETA RIBEIRO",
                        "digitacao": "08/08/2016",
                        "solicitanteNome": "JOAO EDUARDO CAIXETA RIBEIRO",
                        "token": "6D61E9E2-7014-AD72-E053-3C4A3A8C031B",
                        "anexos": 0
                    },
                    "id": 16758275,
                    "procedimento": {
                        "id": 152781,
                        "codigo": "10101012",
                        "descricao": "EM CONSULTORIO (NO HORARIO NORMAL OU PREESTABELECIDO)",
                        "classe": {
                            "id": 1,
                            "codigo": "000001",
                            "descricao": "CONSULTAS",
                            "ordem": 2
                        },
                        "altoCusto": false
                    },
                    "sequencia": "001",
                    "quantidadeSolicitada": 1,
                    "quantidadeAutorizada": 1,
                    "saldo": 0,
                    "liberacao": "08/08/2016 00:00:00",
                    "recno": 16758275,
                    "auditoria": false,
                    "status": "1",
                    "excluido": false,
                    "origem": "BE2010",
                    "criticas": []
                }],
                "local": {
                    "id": 2061,
                    "cnes": "2165066",
                    "prestador": {
                        "id": 336,
                        "codigo": "110455",
                        "nome": "JOAO EDUARDO CAIXETA RIBEIRO",
                        "endereco": "SANTOS DUMONT, 409 - CENTRO - 38010370 - Uberaba - MG",
                        "telefone": "3332-3033"
                    },
                    "endereco": "SANTOS DUMONT, 409",
                    "cidade": "UBERABA",
                    "estado": "MG",
                    "codigo": "001",
                    "guiaMedico": true,
                    "telefone": "33348424",
                    "logradouro": "SANTOS DUMONT",
                    "numero": "409",
                    "bairro": "Sao Sebastiao",
                    "cep": "38060600",
                    "ddd": "034",
                    "descricao": "CONSULTORIO"
                },
                "solicitanteNome": "JOAO EDUARDO CAIXETA RIBEIRO",
                "digitacao": "08/08/2016 00:00:00",
                "validade": "07/10/2016 00:00:00",
                "tipo": "CONSULTA",
                "cobrada": true,
                "admissao": "ELETIVO",
                "operadora": {
                    "id": 14,
                    "codigo": "0014",
                    "descricao": "UNIMED UBERLANDIA COOPERATIVA  REGIONAL  DE TRABALHO MEDICO"
                },
                "cancelada": false,
                "auditoria": false,
                "anoPagamento": "2016",
                "mesPagamento": "08",
                "numeroGuia": "00000060",
                "contaImportada": false,
                "ignoraPrazo": "06/12/2016 00:00:00",
                "token": "6D61E9E2-7014-AD72-E053-3C4A3A8C031B",
                "anexos": 0,
                "ano": "2016",
                "mes": "08",
                "numero": "00040936",
                "rn": false,
                "classificacao": {
                    "id": 10,
                    "descricao": "CONSULTA",
                    "ordem": 10
                }
            },
            "redeatendimento": "JOAO EDUARDO CAIXETA RIBEIRO"
        }, {
            "id": 20902233,
            "paciente": {
                "id": 159561,
                "nome": "SAMUEL GONCALVES MIRANDA",
                "cpf": "09837270667",
                "nascimento": "06/08/1996",
                "idade": "22 ANOS"
            },
            "guia": {
                "id": 20902233,
                "impresso": "80002990290",
                "status": "AUTORIZADA",
                "indicacaoClinica": "AVALIACAO",
                "beneficiario": {
                    "id": 10003049,
                    "codigo": "00145035206896001",
                    "nome": "SAMUEL GONCALVES MIRANDA",
                    "nascimento": "06/08/1996",
                    "idade": "22 ANOS",
                    "estadoCivil": "Solteiro(a)",
                    "contratante": "INTERCAMBIO EVENTUAL",
                    "plano": "INTERCAMBIO EVENTUAL",
                    "inclusao": "08/08/2016",
                    "tempoContrato": "1 ANO, 11 MESES E 29 DIAS"
                },
                "prestador": {
                    "id": 336,
                    "codigo": "110455",
                    "nome": "JOAO EDUARDO CAIXETA RIBEIRO",
                    "endereco": "SANTOS DUMONT, 409 - CENTRO - 38010370 - Uberaba - MG",
                    "telefone": "3332-3033"
                },
                "itens": [{
                    "guia": {
                        "id": 20902233,
                        "impresso": "80002990290",
                        "status": "Autorizada",
                        "prestador": "JOAO EDUARDO CAIXETA RIBEIRO",
                        "digitacao": "08/08/2016",
                        "solicitanteNome": "JOAO EDUARDO CAIXETA RIBEIRO",
                        "token": "6D61EA61-B478-AD72-E053-3C4A3A8C031B",
                        "anexos": 0
                    },
                    "id": 16758553,
                    "procedimento": {
                        "id": 149509,
                        "codigo": "41301323",
                        "descricao": "TONOMETRIA - BINOCULAR",
                        "classe": {
                            "id": 43,
                            "codigo": "000043",
                            "descricao": "DIAGNOSE E TERAPIA - EXAMES ESPECIFICOS",
                            "ordem": 3
                        },
                        "altoCusto": false
                    },
                    "sequencia": "001",
                    "quantidadeSolicitada": 1,
                    "quantidadeAutorizada": 1,
                    "saldo": 0,
                    "liberacao": "08/08/2016 00:00:00",
                    "recno": 16758553,
                    "auditoria": false,
                    "status": "1",
                    "excluido": false,
                    "origem": "BE2010",
                    "criticas": []
                }, {
                    "guia": {
                        "id": 20902233,
                        "impresso": "80002990290",
                        "status": "Autorizada",
                        "prestador": "JOAO EDUARDO CAIXETA RIBEIRO",
                        "digitacao": "08/08/2016",
                        "solicitanteNome": "JOAO EDUARDO CAIXETA RIBEIRO",
                        "token": "6D61EA61-B478-AD72-E053-3C4A3A8C031B",
                        "anexos": 0
                    },
                    "id": 16758554,
                    "procedimento": {
                        "id": 149519,
                        "codigo": "41301250",
                        "descricao": "MAPEAMENTO DE RETINA  OFTALMOSCOPIA INDIRETA  - MONOCULAR",
                        "classe": {
                            "id": 43,
                            "codigo": "000043",
                            "descricao": "DIAGNOSE E TERAPIA - EXAMES ESPECIFICOS",
                            "ordem": 3
                        },
                        "altoCusto": false
                    },
                    "sequencia": "002",
                    "quantidadeSolicitada": 2,
                    "quantidadeAutorizada": 2,
                    "saldo": 0,
                    "liberacao": "08/08/2016 00:00:00",
                    "recno": 16758554,
                    "auditoria": false,
                    "status": "1",
                    "excluido": false,
                    "origem": "BE2010",
                    "criticas": []
                }],
                "local": {
                    "id": 2061,
                    "cnes": "2165066",
                    "prestador": {
                        "id": 336,
                        "codigo": "110455",
                        "nome": "JOAO EDUARDO CAIXETA RIBEIRO",
                        "endereco": "SANTOS DUMONT, 409 - CENTRO - 38010370 - Uberaba - MG",
                        "telefone": "3332-3033"
                    },
                    "endereco": "SANTOS DUMONT, 409",
                    "cidade": "UBERABA",
                    "estado": "MG",
                    "codigo": "001",
                    "guiaMedico": true,
                    "telefone": "33348424",
                    "logradouro": "SANTOS DUMONT",
                    "numero": "409",
                    "bairro": "Sao Sebastiao",
                    "cep": "38060600",
                    "ddd": "034",
                    "descricao": "CONSULTORIO"
                },
                "solicitanteNome": "JOAO EDUARDO CAIXETA RIBEIRO",
                "digitacao": "08/08/2016 00:00:00",
                "validade": "08/08/2016 00:00:00",
                "tipo": "SADT",
                "cobrada": true,
                "admissao": "ELETIVO",
                "operadora": {
                    "id": 14,
                    "codigo": "0014",
                    "descricao": "UNIMED UBERLANDIA COOPERATIVA  REGIONAL  DE TRABALHO MEDICO"
                },
                "cancelada": false,
                "auditoria": false,
                "anoPagamento": "2016",
                "mesPagamento": "08",
                "numeroGuia": "00000071",
                "contaImportada": false,
                "ignoraPrazo": "07/10/2016 00:00:00",
                "token": "6D61EA61-B478-AD72-E053-3C4A3A8C031B",
                "anexos": 0,
                "ano": "2016",
                "mes": "08",
                "numero": "00041051",
                "rn": false,
                "classificacao": {
                    "id": 1,
                    "descricao": "OFTALMOLOGIA",
                    "ordem": 1
                }
            },
            "redeatendimento": "JOAO EDUARDO CAIXETA RIBEIRO"
        }]
        //     }
        // )
    }

    getPrescricao(){
        // this.serviceItemProduto.getUnidades({}).subscribe(
        //     (retorno) => {
        this.prescricoes = [{"id":15,"excluido":false,"data":"26/07/2018 13:23:47","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":18,"excluido":false,"data":"27/07/2018 15:20:40","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}},{"id":6,"excluido":false,"data":"26/07/2018 09:41:01","paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false}}]
        //     }
        // )
    }

    getAgenda(){
        // this.serviceItemProduto.getUnidades({}).subscribe(
        //     (retorno) => {
            this.atendimentosPaciente = [{"id":109172,"paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"prestador":{"id":517,"codigo":"110649","nome":"LUCIANE SANTOS ABDANUR CARVALHO","endereco":"SAO SEBASTIAO, 550 - MERCES - 38060350 - Uberaba - MG","telefone":"3332-3100"},"local":{"id":3024,"prestador":{"id":517,"codigo":"110649","nome":"LUCIANE SANTOS ABDANUR CARVALHO","endereco":"SAO SEBASTIAO, 550 - MERCES - 38060350 - Uberaba - MG","telefone":"3332-3100"},"endereco":"AV DOM LUIS MARIA DE SANTANA, N, 260","codigo":"002","guiaMedico":false,"logradouro":"AV DOM LUIS MARIA DE SANTANA, N","numero":"260","bairro":"MERCES","cep":"38061080","ddd":"034","descricao":"CLINICA UNIMED - PMU"},"agendamento":"27/07/2018 08:45:00","usuario":{"guid":"FC9A4935-92C7-6D57-E043-3381AA8C034B","username":"110649","nome":"LUCIANE SANTOS ABDANUR CARVALHO","ativo":true,"bloqueado":false},"status":"PENDENTE","observacao":"asdfadf","editar":false,"UsuarioAgendamento":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false},"unidadeAtendimento":{"id":6,"codigoVisual":"05","descricao":"CLINICA CASU","busca":"%MARIA DE SANTANA%260","endereco":"R. DOM LUÍZ MARIA DE SANTANA, 260 - MERCÊS, UBERABA - MG, 38061-080","cidade":{"id":2169,"nome":"Uberaba","codigoIbge":"317010","estado":"MG"},"tempoLimite":15,"ignoraFeriados":false},"tipo":{"id":35,"descricao":"Angiologia - 15\u0027","tempo":15,"cor":"#bed700","obrigaTelefone":true,"enviaSms":false,"recepciona":false},"configuraHorario":{"id":1175,"tipo":"DISPONIVEL","dataInicio":"06/04/2018 00:00:00","horaInicio":"08:45","horaFim":"09:00","repetir":true,"diaTodo":false,"recorrencia":"5","local":{"id":3024,"prestador":{"id":517,"codigo":"110649","nome":"LUCIANE SANTOS ABDANUR CARVALHO","endereco":"SAO SEBASTIAO, 550 - MERCES - 38060350 - Uberaba - MG","telefone":"3332-3100"},"endereco":"AV DOM LUIS MARIA DE SANTANA, N, 260","codigo":"002","guiaMedico":false,"logradouro":"AV DOM LUIS MARIA DE SANTANA, N","numero":"260","bairro":"MERCES","cep":"38061080","ddd":"034","descricao":"CLINICA UNIMED - PMU"},"usuarioPrestador":{"guid":"FC9A4935-92C7-6D57-E043-3381AA8C034B","username":"110649","nome":"LUCIANE SANTOS ABDANUR CARVALHO","ativo":true,"bloqueado":false},"usuarioCadastro":{"guid":"E7C1B9EF-887E-4CDD-907C-90812D916666","username":"liliana.silva","nome":"Liliana Silva","ativo":true,"bloqueado":false},"unidadeAtendimento":{"id":6,"codigoVisual":"05","descricao":"CLINICA CASU","busca":"%MARIA DE SANTANA%260","endereco":"R. DOM LUÍZ MARIA DE SANTANA, 260 - MERCÊS, UBERABA - MG, 38061-080","cidade":{"id":2169,"nome":"Uberaba","codigoIbge":"317010","estado":"MG"},"tempoLimite":15,"ignoraFeriados":false},"atendimentoTipo":{"id":35,"descricao":"Angiologia - 15\u0027","tempo":15,"cor":"#bed700","obrigaTelefone":true,"enviaSms":false,"recepciona":false},"maxConcorrente":1},"telefone":"34996511926","especialidade":{"id":13,"codigo":"006","descricao":"ANGIOLOGIA"},"encaixe":false,"pacientePlano":{"id":30132,"excluido":false,"paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"operadora":{"id":1,"excluido":false,"nome":"UNIMED"},"beneficiario":{"id":10003049,"codigo":"00145035206896001","nome":"SAMUEL GONCALVES MIRANDA","nascimento":"06/08/1996","idade":"22 ANOS","estadoCivil":"Solteiro(a)","contratante":"INTERCAMBIO EVENTUAL","plano":"INTERCAMBIO EVENTUAL","inclusao":"08/08/2016","tempoContrato":"1 ANO, 11 MESES E 29 DIAS"},"codigo":"00145035206896001","principal":true}},{"id":109170,"paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"prestador":{"id":517,"codigo":"110649","nome":"LUCIANE SANTOS ABDANUR CARVALHO","endereco":"SAO SEBASTIAO, 550 - MERCES - 38060350 - Uberaba - MG","telefone":"3332-3100"},"local":{"id":3024,"prestador":{"id":517,"codigo":"110649","nome":"LUCIANE SANTOS ABDANUR CARVALHO","endereco":"SAO SEBASTIAO, 550 - MERCES - 38060350 - Uberaba - MG","telefone":"3332-3100"},"endereco":"AV DOM LUIS MARIA DE SANTANA, N, 260","codigo":"002","guiaMedico":false,"logradouro":"AV DOM LUIS MARIA DE SANTANA, N","numero":"260","bairro":"MERCES","cep":"38061080","ddd":"034","descricao":"CLINICA UNIMED - PMU"},"agendamento":"16/07/2018 17:45:00","usuario":{"guid":"FC9A4935-92C7-6D57-E043-3381AA8C034B","username":"110649","nome":"LUCIANE SANTOS ABDANUR CARVALHO","ativo":true,"bloqueado":false},"status":"PENDENTE","observacao":"reste","editar":false,"UsuarioAgendamento":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false},"unidadeAtendimento":{"id":6,"codigoVisual":"05","descricao":"CLINICA CASU","busca":"%MARIA DE SANTANA%260","endereco":"R. DOM LUÍZ MARIA DE SANTANA, 260 - MERCÊS, UBERABA - MG, 38061-080","cidade":{"id":2169,"nome":"Uberaba","codigoIbge":"317010","estado":"MG"},"tempoLimite":15,"ignoraFeriados":false},"tipo":{"id":35,"descricao":"Angiologia - 15\u0027","tempo":15,"cor":"#bed700","obrigaTelefone":true,"enviaSms":false,"recepciona":false},"configuraHorario":{"id":1185,"tipo":"DISPONIVEL","dataInicio":"09/04/2018 00:00:00","horaInicio":"17:45","horaFim":"18:00","repetir":true,"diaTodo":false,"recorrencia":"1","local":{"id":3024,"prestador":{"id":517,"codigo":"110649","nome":"LUCIANE SANTOS ABDANUR CARVALHO","endereco":"SAO SEBASTIAO, 550 - MERCES - 38060350 - Uberaba - MG","telefone":"3332-3100"},"endereco":"AV DOM LUIS MARIA DE SANTANA, N, 260","codigo":"002","guiaMedico":false,"logradouro":"AV DOM LUIS MARIA DE SANTANA, N","numero":"260","bairro":"MERCES","cep":"38061080","ddd":"034","descricao":"CLINICA UNIMED - PMU"},"usuarioPrestador":{"guid":"FC9A4935-92C7-6D57-E043-3381AA8C034B","username":"110649","nome":"LUCIANE SANTOS ABDANUR CARVALHO","ativo":true,"bloqueado":false},"usuarioCadastro":{"guid":"E7C1B9EF-887E-4CDD-907C-90812D916666","username":"liliana.silva","nome":"Liliana Silva","ativo":true,"bloqueado":false},"unidadeAtendimento":{"id":6,"codigoVisual":"05","descricao":"CLINICA CASU","busca":"%MARIA DE SANTANA%260","endereco":"R. DOM LUÍZ MARIA DE SANTANA, 260 - MERCÊS, UBERABA - MG, 38061-080","cidade":{"id":2169,"nome":"Uberaba","codigoIbge":"317010","estado":"MG"},"tempoLimite":15,"ignoraFeriados":false},"atendimentoTipo":{"id":35,"descricao":"Angiologia - 15\u0027","tempo":15,"cor":"#bed700","obrigaTelefone":true,"enviaSms":false,"recepciona":false},"maxConcorrente":1},"telefone":"34996511926","especialidade":{"id":13,"codigo":"006","descricao":"ANGIOLOGIA"},"encaixe":false,"pacientePlano":{"id":30132,"excluido":false,"paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"operadora":{"id":1,"excluido":false,"nome":"UNIMED"},"beneficiario":{"id":10003049,"codigo":"00145035206896001","nome":"SAMUEL GONCALVES MIRANDA","nascimento":"06/08/1996","idade":"22 ANOS","estadoCivil":"Solteiro(a)","contratante":"INTERCAMBIO EVENTUAL","plano":"INTERCAMBIO EVENTUAL","inclusao":"08/08/2016","tempoContrato":"1 ANO, 11 MESES E 29 DIAS"},"codigo":"00145035206896001","principal":true}},{"id":93882,"paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"prestador":{"id":499986,"codigo":"940004","nome":"MARCELO ADRIANO FACI","endereco":"AV DOM LUIS MARIA DE SANTANA, N, 260 - MERCES - 38061080 - Uberaba - MG"},"agendamento":"11/06/2018 09:00:00","usuario":{"guid":"567BB269-20AD-4ADB-84C9-98BAA7C9A3BE","username":"940004","nome":"Marcelo Adriano Facin","ativo":true,"bloqueado":false},"status":"DESMARCADO","observacao":"outro motivo pelo qual desmarquei","editar":false,"UsuarioAgendamento":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false},"unidadeAtendimento":{"id":2,"codigoVisual":"01","descricao":"CLINICA UNIMED","busca":"%RIO GRANDE DO NORTE%659","endereco":"R. RIO GRANDE DO NORTE, 659 - SANTA MARIA, UBERABA - MG, 38050-440","cidade":{"id":2169,"nome":"Uberaba","codigoIbge":"317010","estado":"MG"},"tempoLimite":15,"ignoraFeriados":false},"tipo":{"id":101,"descricao":"Cardiologista - Pré Operatório 10\u0027","tempo":10,"cor":"#683c0f","obrigaTelefone":true,"enviaSms":false,"recepciona":false},"configuraHorario":{"id":4581,"tipo":"DISPONIVEL","dataInicio":"11/06/2018 00:00:00","dataFim":"11/06/2018 00:00:00","horaInicio":"09:00","horaFim":"11:40","repetir":false,"diaTodo":false,"usuarioPrestador":{"guid":"567BB269-20AD-4ADB-84C9-98BAA7C9A3BE","username":"940004","nome":"Marcelo Adriano Facin","ativo":true,"bloqueado":false},"usuarioCadastro":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false},"unidadeAtendimento":{"id":2,"codigoVisual":"01","descricao":"CLINICA UNIMED","busca":"%RIO GRANDE DO NORTE%659","endereco":"R. RIO GRANDE DO NORTE, 659 - SANTA MARIA, UBERABA - MG, 38050-440","cidade":{"id":2169,"nome":"Uberaba","codigoIbge":"317010","estado":"MG"},"tempoLimite":15,"ignoraFeriados":false},"atendimentoTipo":{"id":39,"descricao":"Clinica Geral 15\u0027","tempo":15,"cor":"#bed700","obrigaTelefone":true,"enviaSms":false,"recepciona":false},"maxConcorrente":1,"observacao":"SDFGSD"},"telefone":"34996511926","especialidade":{"id":31,"codigo":"024","descricao":"PSIQUIATRIA"},"encaixe":false,"pacientePlano":{"id":30132,"excluido":false,"paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"operadora":{"id":1,"excluido":false,"nome":"UNIMED"},"beneficiario":{"id":10003049,"codigo":"00145035206896001","nome":"SAMUEL GONCALVES MIRANDA","nascimento":"06/08/1996","idade":"22 ANOS","estadoCivil":"Solteiro(a)","contratante":"INTERCAMBIO EVENTUAL","plano":"INTERCAMBIO EVENTUAL","inclusao":"08/08/2016","tempoContrato":"1 ANO, 11 MESES E 29 DIAS"},"codigo":"00145035206896001","principal":true}},{"id":94592,"paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"prestador":{"id":499986,"codigo":"940004","nome":"MARCELO ADRIANO FACI","endereco":"AV DOM LUIS MARIA DE SANTANA, N, 260 - MERCES - 38061080 - Uberaba - MG"},"agendamento":"10/06/2018 09:00:00","usuario":{"guid":"567BB269-20AD-4ADB-84C9-98BAA7C9A3BE","username":"940004","nome":"Marcelo Adriano Facin","ativo":true,"bloqueado":false},"status":"DESMARCADO","observacao":"teste 2","editar":false,"UsuarioAgendamento":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false},"unidadeAtendimento":{"id":2,"codigoVisual":"01","descricao":"CLINICA UNIMED","busca":"%RIO GRANDE DO NORTE%659","endereco":"R. RIO GRANDE DO NORTE, 659 - SANTA MARIA, UBERABA - MG, 38050-440","cidade":{"id":2169,"nome":"Uberaba","codigoIbge":"317010","estado":"MG"},"tempoLimite":15,"ignoraFeriados":false},"tipo":{"id":39,"descricao":"Clinica Geral 15\u0027","tempo":15,"cor":"#bed700","obrigaTelefone":true,"enviaSms":false,"recepciona":false},"configuraHorario":{"id":4580,"tipo":"DISPONIVEL","dataInicio":"10/06/2018 00:00:00","dataFim":"10/06/2018 00:00:00","horaInicio":"09:00","horaFim":"11:40","repetir":false,"diaTodo":false,"usuarioPrestador":{"guid":"567BB269-20AD-4ADB-84C9-98BAA7C9A3BE","username":"940004","nome":"Marcelo Adriano Facin","ativo":true,"bloqueado":false},"usuarioCadastro":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false},"unidadeAtendimento":{"id":2,"codigoVisual":"01","descricao":"CLINICA UNIMED","busca":"%RIO GRANDE DO NORTE%659","endereco":"R. RIO GRANDE DO NORTE, 659 - SANTA MARIA, UBERABA - MG, 38050-440","cidade":{"id":2169,"nome":"Uberaba","codigoIbge":"317010","estado":"MG"},"tempoLimite":15,"ignoraFeriados":false},"atendimentoTipo":{"id":39,"descricao":"Clinica Geral 15\u0027","tempo":15,"cor":"#bed700","obrigaTelefone":true,"enviaSms":false,"recepciona":false},"maxConcorrente":1,"observacao":"FDGHDF"},"telefone":"34996511926","especialidade":{"id":31,"codigo":"024","descricao":"PSIQUIATRIA"},"encaixe":false,"pacientePlano":{"id":30132,"excluido":false,"paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"operadora":{"id":1,"excluido":false,"nome":"UNIMED"},"beneficiario":{"id":10003049,"codigo":"00145035206896001","nome":"SAMUEL GONCALVES MIRANDA","nascimento":"06/08/1996","idade":"22 ANOS","estadoCivil":"Solteiro(a)","contratante":"INTERCAMBIO EVENTUAL","plano":"INTERCAMBIO EVENTUAL","inclusao":"08/08/2016","tempoContrato":"1 ANO, 11 MESES E 29 DIAS"},"codigo":"00145035206896001","principal":true}},{"id":93890,"paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"prestador":{"id":499986,"codigo":"940004","nome":"MARCELO ADRIANO FACI","endereco":"AV DOM LUIS MARIA DE SANTANA, N, 260 - MERCES - 38061080 - Uberaba - MG"},"agendamento":"10/06/2018 09:00:00","usuario":{"guid":"567BB269-20AD-4ADB-84C9-98BAA7C9A3BE","username":"940004","nome":"Marcelo Adriano Facin","ativo":true,"bloqueado":false},"status":"DESMARCADO","observacao":"Motivo pelo qual cancelei","editar":false,"UsuarioAgendamento":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false},"unidadeAtendimento":{"id":2,"codigoVisual":"01","descricao":"CLINICA UNIMED","busca":"%RIO GRANDE DO NORTE%659","endereco":"R. RIO GRANDE DO NORTE, 659 - SANTA MARIA, UBERABA - MG, 38050-440","cidade":{"id":2169,"nome":"Uberaba","codigoIbge":"317010","estado":"MG"},"tempoLimite":15,"ignoraFeriados":false},"tipo":{"id":39,"descricao":"Clinica Geral 15\u0027","tempo":15,"cor":"#bed700","obrigaTelefone":true,"enviaSms":false,"recepciona":false},"configuraHorario":{"id":4580,"tipo":"DISPONIVEL","dataInicio":"10/06/2018 00:00:00","dataFim":"10/06/2018 00:00:00","horaInicio":"09:00","horaFim":"11:40","repetir":false,"diaTodo":false,"usuarioPrestador":{"guid":"567BB269-20AD-4ADB-84C9-98BAA7C9A3BE","username":"940004","nome":"Marcelo Adriano Facin","ativo":true,"bloqueado":false},"usuarioCadastro":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false},"unidadeAtendimento":{"id":2,"codigoVisual":"01","descricao":"CLINICA UNIMED","busca":"%RIO GRANDE DO NORTE%659","endereco":"R. RIO GRANDE DO NORTE, 659 - SANTA MARIA, UBERABA - MG, 38050-440","cidade":{"id":2169,"nome":"Uberaba","codigoIbge":"317010","estado":"MG"},"tempoLimite":15,"ignoraFeriados":false},"atendimentoTipo":{"id":39,"descricao":"Clinica Geral 15\u0027","tempo":15,"cor":"#bed700","obrigaTelefone":true,"enviaSms":false,"recepciona":false},"maxConcorrente":1,"observacao":"FDGHDF"},"telefone":"34996511926","especialidade":{"id":31,"codigo":"024","descricao":"PSIQUIATRIA"},"encaixe":false,"pacientePlano":{"id":30132,"excluido":false,"paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"operadora":{"id":1,"excluido":false,"nome":"UNIMED"},"beneficiario":{"id":10003049,"codigo":"00145035206896001","nome":"SAMUEL GONCALVES MIRANDA","nascimento":"06/08/1996","idade":"22 ANOS","estadoCivil":"Solteiro(a)","contratante":"INTERCAMBIO EVENTUAL","plano":"INTERCAMBIO EVENTUAL","inclusao":"08/08/2016","tempoContrato":"1 ANO, 11 MESES E 29 DIAS"},"codigo":"00145035206896001","principal":true}}]
        //     }
        // )
    }

    getProfissionais(){
        // this.serviceItemProduto.getUnidades({}).subscribe(
        //     (retorno) => {
        this.profissionaisPaciente = [
            {"id":3,"excluido":false,"paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"usuario":{"guid":"30B40F42-38DD-4E1F-BC6C-52AE56BDC9AE","username":"joao.beirigo","telefone":"34991901414","nome":"Joao Beirigo","email":"joao.beirigo@unimeduberaba.com.br","ativo":true,"bloqueado":false},"especialidade":{"id":35,"codigo":"028","descricao":"CLINICA GERAL"},"inicio":"04/07/2018 17:35:30"},
            {"id":2,"excluido":false,"paciente":{"id":159561,"nome":"SAMUEL GONCALVES MIRANDA","cpf":"09837270667","nascimento":"06/08/1996","idade":"22 ANOS"},"usuario":{"guid":"44074FED-5A38-4BBE-9E89-4066B2941371","username":"samuel.miranda","nome":"Samuel Miranda","ativo":true,"bloqueado":false},"especialidade":{"id":35,"codigo":"028","descricao":"CLINICA GERAL"},"inicio":"04/07/2018 17:33:03"}
        ]
        //     }
        // )
    }

    getUnidadesTratamento(){
        // this.serviceItemProduto.getUnidades({}).subscribe(
        //     (retorno) => {
                this.opcoesUnidade = [
                    
                ]
        //     }
        // )
    }

    valorPacienteSelecionado
    getPaciente(paciente) {
        // this.paciente = paciente;

        if( paciente ) {
            this.valorPacienteSelecionado = paciente.nome;
            this.objParamTratamento['paciente'] = { id : paciente.id };
        }
    }

    objPacientes    
    fnCfgPacienteRemote(term) {

        let objParam;
        if( term.length == 11 ){
            objParam = { cpf : term };

        }else if( (term.length > 11) && !term.match(/\D/g) ){
            objParam = { carteirinha : term };

        }else{
            objParam = { like : term };

        }

        objParam['quantidade'] = 10;
        objParam['pagina'] = 1;

        this.servicePaciente.getPacienteLike(objParam).subscribe(
            (retorno) => {
                this.objPacientes = retorno.dados || retorno;
            }
        );

    }

    valorCidSelecionado;
    getCid(cid){
        if( cid ){
            this.valorCidSelecionado = cid.descricao;
            this.objParamTratamento['cid'] = { id : cid.id };
        }
    }

    navegar(destino) {
        this.atual = destino;
    }

}