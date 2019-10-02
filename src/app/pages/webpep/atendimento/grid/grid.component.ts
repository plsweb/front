import { ActivatedRoute, Router } from '@angular/router';
import { Component, OnInit, ViewContainerRef, ViewChild, TemplateRef, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef  } from '@angular/core';

import { ToastrService } from 'ngx-toastr';
import { GlobalState } from 'app/global.state';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { Sessao, Servidor, AtendimentoTipoTussService, AtendimentoService, TipoFaltaService, PainelSenhaService, UsuarioService, PacienteService } from 'app/services';

import { Notificacao, Aguardar, NgbdModalContent } from 'app/theme/components';

import * as moment from 'moment';
moment.locale('pt-br');

@Component({
    selector: 'grid',
    templateUrl: './grid.html',
    styleUrls: ['./grid.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [TipoFaltaService]
})
export class Grid implements OnInit, OnDestroy {
    static ultimaAtualizacao: Date;
    
    configurarAgendaComponent;
    activeModal;
    intervalos = [];
    vinculaGuia;

    loading = false;
    hoje: Date = new Date();
    atendimentos;
    semana;
    perguntas;
    notificado: boolean = false;
    calendarioBloco;
    periodoMesAno;

    atendimentosPromise = null;
    diaAtualMiniCalendario;
    miniCalendarioDias;
    diaAtual;
    dataInicial;
    dataFinal;
    semanas;
    dias;
    horarios;
    visaoMes;
    tipoCalendario;
    diasDaSemana;
    ctrlClicado;
    mouseClicado;
    customizado;

    usuario;

    @ViewChild("cadastroPacienteModal", {read: TemplateRef}) cadastroPacienteModal: TemplateRef<any>;
    @ViewChild("pacienteChegouBotoes", {read: TemplateRef}) pacienteChegouBotoes: TemplateRef<any>;
    @ViewChild("pacienteChegouBody", {read: TemplateRef}) pacienteChegouBody: TemplateRef<any>;
    @ViewChild("pacienteFaltouBody", {read: TemplateRef}) pacienteFaltouBody: TemplateRef<any>;

    //  Legenda
    legendas = [
        { titulo: "PENDENTE", classe: "PENDENTE", icone: "event", estado: true },
        { titulo: "SALA DE ESPERA", classe: "SALADEESPERA", icone: "weekend", estado: true },
        { titulo: "EM ATENDIMENTO", classe: "EMATENDIMENTO", icone: "assignment", estado: true },
        { titulo: "ATENDIDO", classe: "ATENDIDO", icone: "check", estado: true },
        { titulo: "DESMARCADO", classe: "DESMARCADO", icone: "close", estado: false },
        { titulo: "FALTA", classe: "FALTA", icone: "close", estado: false }
    ];

    // TODO TESTAR UNIDADE ATENDIMENTO 
    constructor(
        private service: AtendimentoService, 
        private serviceAtendimento: AtendimentoService,
        private servicePaciente: PacienteService,
        private tipoFaltaService: TipoFaltaService,
        private serviceSenhasPainel: PainelSenhaService,
        private usuarioService: UsuarioService,
        private atendimentoTipoTussService: AtendimentoTipoTussService,
        private router: Router,
        private modalService: NgbModal,
        private cdr: ChangeDetectorRef,
        private _state: GlobalState,
        private route: ActivatedRoute,
        private toastr: ToastrService, 
        public vcr: ViewContainerRef) 
    {
        this.atendimentoTipoTussService;
        if (route.snapshot.data && route.snapshot.data[0])
        {
            this.configurarAgendaComponent = route.snapshot.data[0]['configurarAgenda'];
        }
    }

    abreContextMenu(ev, atendimento) {
        ev.preventDefault();

        $(ev.target).parents('.agendamento').find('.menu-context').show();
        $(ev.target).parents('.agendamento').find('.menu-context').css({"top": ev.clientY - 10, "left": ev.clientX - 10});
        
        // setTimeout(()=>{
        //     $(ev.target).parents('.agendamento').find('.menu-context').hide();
        // }, 5000);
        // this.validaMenus();
    }

    unidadePermitida = false;
    validaMenus(){
        let unidadeId = localStorage.getItem('idUnidade');
        if( unidadeId == '1' ){
            this.unidadePermitida = true;
        }
    }

    escondeContextMenu(){
        $('.menu-context').hide();
    }

    usuarioAdministrador:any = 'nao_carregou';
    usuarioGuid;
    unidadesAtendimento = [];
    tiposFalta = [];
    ngOnInit() {
        this.usuarioService.usuarioSessao().subscribe(
            (usuario) => {
                this.usuarioGuid = usuario.guid;
                let isAdm = usuario.papeis.filter(papel => {
                    
                    return papel.nome == "WEBPEP:ADMINISTRADOR" || papel.nome == "WEBPEP:VISUALIZAATENDIMENTOS";                    
                })
                this.usuarioAdministrador = (isAdm.length > 0);

                setTimeout(()=>{
                    this.buscaAtendimentos();
                }, 500);

            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            },
        );

        this.unidadesAtendimento = Sessao.getVariaveisAmbiente('unidadesAtendimento');

        this.tipoFaltaService.get().subscribe((tipos) => {
            this.tiposFalta = tipos.dados;
        })

        this.iniciaCalendario();
        this.inicializaArrastaeSolta();
        this.inicializaMultiplaSelecao();

        this.diasDaSemana = moment.weekdays().map((diaDaSemana) => {
            return {
                diaDaSemana: diaDaSemana,
                dia: diaDaSemana.substr(0,3),
                ativo: false
            }
        });
    }

    ngAfterViewInit() {

        Notificacao.request();

        //this.inicializaSelecaoDatasCliqueSegura();
        this._state.notifyDataChanged('menu.isCollapsed', true);

        let preferenciasUsuarios = Sessao.getPreferenciasUsuario();
        if (preferenciasUsuarios['legendas']) {
            let tempLegendas = preferenciasUsuarios['legendas'];
            
            // Descomentar para manter cache do dia selecionado no calendario
            // let tempDias = preferenciasUsuarios['dias'];
            
            this.legendas = tempLegendas;
            // this.dias = tempDias;

           
        }
    }

    ngOnDestroy() {
        this.cdr.detach();
    }

    instanciaDia(dia) {
        return {
            data: dia.data,
            diaDoMes: moment(dia.data).date(),
            diaDaSemana: moment(dia.data).format("ddd"),
            id: moment(dia.data).format("DD-MM-YYYY-T-HH-mm"),
            bloqueado: true
        }
    }

    inicializaMultiplaSelecao() {
        
        var draggable = document.querySelectorAll('[drag-multipla-selecao="true"]');
        var miniDias = document.querySelectorAll('.mini-dia');


        let handleOverDrop = (e) => {
            e.preventDefault(); 
            
            if (e.type != "drop") {
                return;
            }
            var draggedId = e.dataTransfer.getData("text");
            var draggedEl = document.getElementById(draggedId);

            if (draggedEl.parentNode == e.currentTarget) {
                return;
            }
            
            draggedEl.parentNode.removeChild(draggedEl);
            e.currentTarget.appendChild(draggedEl);
        }

        for(var i = 0; i < draggable.length; i++) {
            draggable[i].addEventListener("dragover", handleOverDrop);
        }

        for(var i = 0; i < miniDias.length; i++) {
            miniDias[i].addEventListener("click", handleOverDrop);
        }
    }


    miniDiaMouseDown($event, dia, eDetalhamento) {

        if (this.dias.filter((diaAtual)=>{ return moment(diaAtual.data).format("DD/MM/YYYY") == moment(dia.data).format("DD/MM/YYYY")}).length) {
            return;
        }

        if (!eDetalhamento) {
            this.mouseClicado = true;
        }


        this.visaoMes = false;
        this.tipoCalendario = "day";

        if ($event.ctrlKey && this.dias.length < 7) {
            //  Add dia para os ativos
            this.dias.push(this.instanciaDia(dia));
            this.customizado = true;            
            
            this["inicializa_" + this.tipoCalendario](moment(this.diaAtual).toDate());
            this.horarios = this.buscaAtendimentos();
            return;
        }

        this.dias = [this.instanciaDia(dia)];
        this.customizado = false;
        this.diaAtual =  moment(dia.data).toDate();

        this["inicializa_" + this.tipoCalendario](moment(this.diaAtual).toDate());


    }
    miniDiaMouseOver($event, dia) {
        if (this.dias.filter((diaAtual)=>{ return moment(diaAtual.data).format("DD/MM/YYYY") == moment(dia.data).format("DD/MM/YYYY")}).length) {
            return;
        }

        if (this.mouseClicado && this.dias.length < 7) {
            this.dias.push(this.instanciaDia(dia));
        }
    }
    miniDiaMouseUp($event, dia) {
        this.mouseClicado = false;
        this.horarios = this.buscaAtendimentos();
    }

    inicializaArrastaeSolta() {

        let handleDragStart = (e) => {
            e.dataTransfer.setData("text", e.currentTarget.id);
        }

        let handleDragEnterLeave = (e) => {
            if(e.type == "dragenter") {
                e.currentTarget.className = e.currentTarget.className + " drag-enter";
            } else {
                e.currentTarget.className = e.currentTarget.className.replace(" drag-enter", "");
            }
        }

        let handleOverDrop = (e) => {
            e.preventDefault(); 
            
            if (e.type != "drop") {
                return;
            }
            
            var draggedId = e.dataTransfer.getData("text");
            var draggedEl = document.getElementById(draggedId);

            if (draggedEl.parentNode == e.currentTarget) {
                return;
            }
            
            draggedEl.parentNode.removeChild(draggedEl);
            e.currentTarget.appendChild(draggedEl);
        }

        var draggable = document.querySelectorAll('[draggable="true"]')
        var targets = document.querySelectorAll('[data-drop-target="true"]');
        
        //Register event listeners for the"dragstart" event on the draggable elements:
        for(var i = 0; i < draggable.length; i++) {
            draggable[i].addEventListener("dragstart", handleDragStart);
        }

        //Register event listeners for "dragover", "drop", "dragenter" & "dragleave" events on the drop target elements.
        for(var i = 0; i < targets.length; i++) {
            targets[i].addEventListener("dragover", handleOverDrop);
            targets[i].addEventListener("drop", handleOverDrop);
            targets[i].addEventListener("dragenter", handleDragEnterLeave);
            targets[i].addEventListener("dragleave", handleDragEnterLeave);
        }
    }

    iniciaCalendario() {console.log("iniciaCalendario")
        this.dataInicial  = moment(new Date).toDate();
        this.dataFinal    = moment(new Date).toDate();
        this.diaAtual     = moment(new Date).toDate();
        this.dias = [];

        this.visaoMes = false;
		let calendarioOpt = JSON.parse(localStorage.getItem('preferenciaUsuario'));
        this.tipoCalendario = (calendarioOpt ? (calendarioOpt.visaoAtendimento || "day" ) : "day");

        this.diasDaSemana = moment.weekdays();

        this.inicializaMiniCalendario(moment().toDate());
        let tipocalendario = (this.tipoCalendario || "day");
        this["inicializa_" + tipocalendario](moment().toDate());
		this.periodoMesAno = this.formataVisaoData( moment(this.diaAtualMiniCalendario).toDate(), null);
        this.buscaAtendimentos();
    }

    formataVisaoData(dia, sFormato) {
        
        if (sFormato) {
            return moment(dia || this.diaAtual).format(sFormato);
        }

        //  Senao mostra intervalo de datas
        let sInicial    = moment(this.dataInicial).format("DD/MM");
        let sFinal      = moment(this.dataFinal).format("DD/MM");

        if (moment(this.dataInicial).month !== moment(this.dataFinal).month) {
            return moment(this.dataInicial).format("MMM") + " - " + moment(this.dataInicial).format("MMM YYYY");
        }

        return moment(dia || this.diaAtual).format("MMMM YYYY");
    }

    trocaTipoCalendario(tipo) {
        Sessao.setPreferenciasUsuario('visaoAtendimento', tipo);
        
        this.visaoMes = tipo == "month";
        this.tipoCalendario = tipo;

        this["inicializa_" + this.tipoCalendario](moment(this.diaAtual).toDate());
    }

    trocaMiniCalendarioMes(tipo) {
        this.diaAtualMiniCalendario = moment(this.diaAtualMiniCalendario)[tipo](1, "month").toDate();
        this.inicializaMiniCalendario(this.diaAtualMiniCalendario);
    }

    dataAnterior(tipoCalendario, param) {
        
        this.diaAtual =  moment(this.diaAtual).subtract(1, tipoCalendario).toDate();
        this["inicializa_" + this.tipoCalendario](moment(this.diaAtual).toDate());

        this.inicializaMiniCalendario(this.diaAtual);
    }

    dataPosterior(tipoCalendario, param) {
        
        this.diaAtual =  moment(this.diaAtual).add(1, tipoCalendario).toDate();
        this["inicializa_" + this.tipoCalendario](moment(this.diaAtual).toDate());

        this.inicializaMiniCalendario(null);
    }

    dataForaDoMes(data) {
        
        return moment(this.diaAtual).format("MMMM, YYYY") !== moment(data).format("MMMM, YYYY");
    }

    eDataAtual(data) {
        
        var bEDataAtual = false;

        if (this.dias.length >= 1) {
            bEDataAtual = this.dias.map((dia) => {
                return moment(dia.data).format("DD/MM/YYYY");
            }).indexOf(moment(data).format("DD/MM/YYYY")) !== -1;

        } else {
            bEDataAtual = moment(this.diaAtual).format("DD/MM/YYYY") === moment(data).format("DD/MM/YYYY");
        }

        return bEDataAtual;
    }

    buscarAtendimento(dia, horario) {
        let tmp;
        let atendimentos = [];

        if (this.atendimentos){

            tmp = this.atendimentos.filter(function (atendimento) {
                return (moment(atendimento.agendamento, 'DD/MM/YYYY HH:mm').format("DD/MM/YYYY HH:")).match(new RegExp(moment(dia).format("DD/MM/YYYY " + (horario ? horario.hora : "..") + ":")));
            });

            if (tmp.length > 1 && this.tipoCalendario == 'month') {

                for(let i = 0; i < this.legendas.length; i++) {
                    let tipoLegenda = this.legendas[i].classe;
                    let quantidade = tmp.filter((atendimento) => { return atendimento.status == tipoLegenda}).length;
                    if (quantidade) {
                        atendimentos.push({ agrupado: true, quantidade: quantidade, status: tipoLegenda});
                    }
                }
                
                return atendimentos;
            }
            
        }

        return tmp;
    }

    inicializaMiniCalendario(dataAtual) {

        this.miniCalendarioDias = [];
        dataAtual = dataAtual || (this.diaAtual || new Date());
        this.diaAtualMiniCalendario = moment(new Date(dataAtual.getTime())).toDate();

        let dataTemp = dataAtual;
        let mesAtual = dataTemp.getMonth();
        let qtdDias = 42; 
        var semana = [];
        let contadorDia = 0;
        let contadorDiaSemana = 0;

        //  Inicia Data temporaria como primeiro dia do mes
        dataTemp = moment(dataTemp).startOf('month').toDate();
        let diaDaSemana = dataTemp.getDay();

        dataTemp = moment(dataTemp).subtract(diaDaSemana, 'day').toDate();

        while(contadorDia < qtdDias) {
            semana.push({
                data: new Date(dataTemp.getTime()),
                diaDoMes: moment(dataTemp).date(),
                diaDaSemana: moment(dataTemp).format("ddd"),
                id: moment(dataTemp).format("DD-MM-YYYY-T-HH-mm"),
                bloqueado: true
            });

            dataTemp = moment(dataTemp).add(1, 'day').toDate();

            if (qtdDias <= 7) {
            } else {
                if(contadorDiaSemana >= 6) {
                    this.miniCalendarioDias.push(semana);
                    semana = [];
                    contadorDiaSemana = 0;
                } else {
                    contadorDiaSemana++;
                }
            }

            contadorDia++;
        }
    }

    inicializa_day(dataAtual) {
        this.dias = this.geraSemana(1, moment(this.diaAtual).startOf('day').toDate());
        
        this.periodoMesAno = this.formataVisaoData( moment(this.diaAtualMiniCalendario).toDate(), null);
        
        this.horarios = this.buscaAtendimentos();
    }

    inicializa_week(dataAtual) {
        this.dias = this.geraSemana(7, moment(this.diaAtual).startOf('week').toDate());
        this.periodoMesAno = this.formataVisaoData( moment(this.diaAtualMiniCalendario).toDate(), null);

        this.horarios = this.buscaAtendimentos();
    }

    inicializa_month(dataAtual) {
        this.dias = [];
        this.periodoMesAno = this.formataVisaoData( moment(new Date(dataAtual.getTime())).toDate(), null);
        
        dataAtual = (dataAtual || new Date());
        this.diaAtual = moment(new Date(dataAtual.getTime())).toDate();
        let dataTemp = dataAtual;
        let mesAtual = dataTemp.getMonth();
        let qtdDias = 42; 
        
        //  Inicia Data temporaria como primeiro dia do mes
        dataTemp = moment(dataTemp).startOf('month').toDate();
        let diaDaSemana = dataTemp.getDay();

        dataTemp =  moment(dataTemp).subtract(diaDaSemana, 'day').toDate();

        this.dias.push(this.geraSemana(qtdDias, dataTemp));
        this.horarios = this.buscaAtendimentos();
    }

    geraSemana(qtdDias, dataTemp) {
        var semana = [];
        let contadorDia = 0;
        let contadorDiaSemana = 0;

        while(contadorDia < qtdDias) {
            semana.push({
                data: new Date(dataTemp.getTime()),
                diaDoMes: moment(dataTemp).date(),
                diaDaSemana: moment(dataTemp).format("ddd"),
                id: moment(dataTemp).format("DD-MM-YYYY-T-HH-mm"),
                bloqueado: true
            });

            dataTemp =  moment(dataTemp).add(1, 'day').toDate();

            if (qtdDias > 7) {
                if(contadorDiaSemana >= 6) {
                    this.dias.push(semana);
                    semana = [];
                    contadorDiaSemana = 0;
                } else {
                    contadorDiaSemana++;
                }
            }

            contadorDia++;
        }

        return semana;
    }

    buscaAtendimentos() {

        if( this.usuarioAdministrador == 'nao_carregou' ){
            return;
        }

        if( this.loading ){
            return;
        }
        this.loading = true

        let inicio:Date;
        let fim:Date;
        if( this.dias && this.dias.length ){
            inicio = moment(this.dias[0].data).toDate();
            fim = moment(this.dias[this.dias.length-1].data).toDate();
        }
        let tmpDia:Date = new Date();
        let filtro = {
            agendamentoLista: null,
            agendamentoInicial: null, 
            agendamentoFinal: null, 
            statusNotIn: [
                'PREATENDIMENTO'
            ]
        };
  
        this.legendas.forEach(element => {
            if(!element.estado){
                filtro.statusNotIn.push(element.classe);
            }
        });

        if (this.dias.length > 1 && this.tipoCalendario == "day") {
            let agendamentoLista = [];
            this.dias.forEach((dia)=>{
                agendamentoLista.push(moment(dia.data).format("DD/MM/YYYY 00:00:00"));
            });
            filtro.agendamentoLista = agendamentoLista;

        } else if(this.tipoCalendario == "month" && this.dias && this.dias.length) {
            filtro.agendamentoInicial = moment(this.dias[0][0].data).format("DD/MM/YYYY 00:00:00");
            filtro.agendamentoFinal = moment(this.dias[this.dias.length-2][this.dias[this.dias.length-2].length-1].data).format("DD/MM/YYYY 00:00:00");
        } else {
            filtro.agendamentoInicial = moment(inicio).format("DD/MM/YYYY 00:00:00");
            filtro.agendamentoFinal =   moment(fim).format("DD/MM/YYYY 23:59:59");
        }

        if( !this.usuarioAdministrador ){
            let guid = this.usuarioGuid;
            filtro['usuario'] = { 'guid' : guid };
        }

        this.service.filtrar(filtro)
            .subscribe((atendimentos) => {
                let horarios = [];

                this.atendimentos = atendimentos.dados;

                for (let i = 0; i <= 23; i ++) {
                    horarios.push({
                        hora: ("0" + i).substr(-2)
                    });
                }

                horarios = horarios.filter((horario) => {
                    let a = this.atendimentos.filter((atendimento) => {
                        return !!moment(atendimento.agendamento, "DD/MM/YYYY HH:mm:ss").format("HH").match(horario.hora);
                    });

                    return !!a.length;
                });
                
                this.horarios = horarios;
                
                this.notificar();

                if (!this.cdr['destroyed']) {
                    this.cdr.detectChanges();
                    this.cdr.reattach();
                }

                Aguardar.aguardar(5, this.router)
                    .then(() => {
                        this.buscaAtendimentos();
                    }
                );

                // if (!this.atendimentosPromise) {
                //     this.atendimentosPromise = Aguardar.aguardar(5, this.router);

                //     this.atendimentosPromise.then(() => {
                //         this.buscaAtendimentos();
                //         this.atendimentosPromise = null;
                //     });
                // }
                this.loading = false;
            },
            erro => {
                this.loading = false;
                console.log(erro);
                if( erro.status == 0 ){
                    this.toastr.error("Houve uma falha na conexão. Tente novamente.");
                }
                Aguardar.aguardar(5, this.router)
                    .then(() => {
                        this.buscaAtendimentos();
                    }
                );
                Servidor.verificaErro(erro, this.toastr);
            },
        );
    }

    trackByFn(index, item) {
        return index;
    }

    notificar() {

        let tmp;
        if (this.atendimentos)
            tmp = this.atendimentos.filter(function (atendimento) {
                return atendimento.status === 'SALADEESPERA';
            });

        if (tmp.length > 0 && !this.notificado) {
            this.notificado= true;
            Notificacao.notificar('WebPep', 'Você tem ' + tmp.length + ' na sala de espera!');
        }
    }

    modalConfirmar;
    abrir(atendimento, somenteLeitura, ev = null) {

        if( ev ){
            ev.stopPropagation();
        }
        
        if( atendimento && !atendimento.paciente ){
            this.toastr.warning("Não há paciente nesse atendimento");
            return;
        }

        Sessao.setPreferenciasUsuario('legendas', this.legendas);
        Sessao.setPreferenciasUsuario('dias', this.dias);
        Sessao.setPreferenciasUsuario('atendimentoReadOnly', somenteLeitura);

        this.router.navigate([`/${Sessao.getModulo()}/atendimento/formulario/${atendimento.id}`]);
    }

    foraDoHorario;
    motivoCancelamento;
    senhasPainelDeSenha = [];
    naoPossuiSenha;
    atendimento;
    idAtendimento;
    acaoAtendimento;
    tipoAtendimentoFatura;
    atualizarStatusPaciente(atendimento, status, tipo) {
        this.atendimento = atendimento;

        if  (status != 'PENDENTE') {
            return;
        }

        this.motivoCancelamento = '';
        this.idAtendimento = atendimento.id;
        
        if ( tipo == "CHEGOU" ) {
            if (!atendimento.paciente) {
                this.toastr.warning("Paciente sem pré cadastro");
                
                this.activeModal = this.modalService.open(NgbdModalContent, {size: 'lg'});
                this.activeModal.componentInstance.modalHeader = 'Cadastro de Novo Paciente';
                this.activeModal.componentInstance.custom_lg_modal = true;

                this.activeModal.componentInstance.templateRefBody = this.cadastroPacienteModal;

                this.activeModal.result.then((data) => {
                    console.log(data);
                }, (reason) => {
                    console.log(reason);
                });

                return;
            }

            this.acaoAtendimento = "CHEGOU";
            let unidadeId = (this.atendimento.unidadeAtendimento && this.atendimento.unidadeAtendimento.id) ? this.atendimento.unidadeAtendimento.id : localStorage.getItem('idUnidade');
            if( !unidadeId ){
                this.toastr.error("Nao tem unidade de atendimento selecionada");
                setTimeout(() => {
                    this.router.navigate([`/${Sessao.getModulo()}/dashboard`]);
                }, 1000);

                return;
            }

            let unidade:any = this.unidadesAtendimento.filter((unidade)=>{ return unidade.id == unidadeId});
            let codigoVisual = ( unidade.length && unidade[0].codigoVisual ) ? unidade[0].codigoVisual : undefined;

            this.naoPossuiSenha = !(codigoVisual);

            this.serviceSenhasPainel.get(codigoVisual).subscribe((senhasPainelDeSenha) => {
                senhasPainelDeSenha = senhasPainelDeSenha.map((senha)=>{
                    senha.id = senha.numero;
                    return senha;
                })
                this.senhasPainelDeSenha = senhasPainelDeSenha;
            });

            this.vinculaGuia = unidade[0].vinculaGuia;
            this.tipoAtendimentoFatura = atendimento.tipo.faturar;

            this.activeModal = this.modalService.open(NgbdModalContent, {size: 'lg'});
            this.activeModal.componentInstance.modalHeader = 'Paciente Chegou';

            this.activeModal.componentInstance.templateRefBody = this.pacienteChegouBody;
            this.activeModal.componentInstance.templateBotoes = this.pacienteChegouBotoes;

        }else if(tipo == "FALTA" ){
           this.acaoAtendimento = "FALTA";

           this.activeModal = this.modalService.open(NgbdModalContent, {size: 'lg'});
           this.activeModal.componentInstance.modalHeader = 'Paciente Faltou';

           this.activeModal.componentInstance.templateRefBody = this.pacienteFaltouBody;
           this.activeModal.componentInstance.templateBotoes = this.pacienteChegouBotoes;

        }

    }

    setPacienteAtendimento(novoPaciente, confirma = false){
        novoPaciente = novoPaciente.dados || novoPaciente;

        let objAttPacienteAtendimento = {
            paciente: {
                id: novoPaciente.id
            }
        }
        
        if( !confirm("Confirma agendamento para " + novoPaciente.nome + " ?") ){
            return;
        }

        this.serviceAtendimento.atualizar( this.idAtendimento, objAttPacienteAtendimento ).subscribe(
            (retorno) => {
                this.activeModal.close();
                this.atendimento.paciente = novoPaciente;
                this.toastr.success("Atendimento atualizado com sucesso");
                this.atualizarStatusPaciente(this.atendimento, this.atendimento.status, 'CHEGOU');
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        )
    }

    paciente;
    objPacientes = [];
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

        this.paciente = null;
        this.servicePaciente.getPacienteLike(objParam).subscribe(
            (retorno) => {
                this.objPacientes = retorno.dados || retorno;
            }
        );
    }

    senhaPainel;
    tipoFalta;
    guiaVinculada;
    atendimentoTipoTussFaturar:Array<any>;
    alterarStatusAgendamento(){
        let observableItensFaturar:Promise<any>;
        let atendimentoRequest = {
            "status": (this.acaoAtendimento == "CHEGOU") ? "SALADEESPERA" : "FALTA"
        };

        if (this.senhasPainelDeSenha.length > 0 && !this.senhaPainel) {
            this.toastr.warning('colocar codigo painel de senha');
            return;
        }
        if( this.acaoAtendimento == "FALTA" && !this.tipoFalta ){
            this.toastr.warning('Selecione um tipo de falta');
            return;
        }

        if (this.acaoAtendimento == 'FALTA') {
            atendimentoRequest['tipoFalta'] = {"id": this.tipoFalta};
            atendimentoRequest['observacao'] = this.motivoCancelamento;
            atendimentoRequest['status'] = 'FALTA';
        }
        if( this.acaoAtendimento == "CHEGOU" ){
            atendimentoRequest['senha'] = this.senhaPainel;
            if (this.vinculaGuia && this.tipoAtendimentoFatura) {
                if( !this.guiaVinculada ){
                    this.toastr.warning("É obrigatório informar a guia");
                    return;
                }
                // atendimentoRequest['guia'] = { impresso: this.guiaVinculada };
                atendimentoRequest['guiaImpresso'] = this.guiaVinculada;

                if( !this.atendimentoTipoTussFaturar || ( this.atendimentoTipoTussFaturar && !this.atendimentoTipoTussFaturar.length ) ){
                    this.toastr.error("É obrigatório selecionar ao menos um procedimento para faturar");
                    return
                }else{
                    atendimentoRequest['requestFaturamento'] = {
                        atendimentoTipoTuss: this.atendimentoTipoTussFaturar
                    }
                }
            }
        }

        this.serviceAtendimento.atualizar(this.idAtendimento, atendimentoRequest).subscribe(
            (retorno)=>{

                if( observableItensFaturar ){
                    observableItensFaturar.then(
                        (itensFaturar)=>{
                            let requestFaturamento = {
                                atendimentoTipoTuss: itensFaturar
                            }
                            this.serviceAtendimento.atualizar(this.idAtendimento, requestFaturamento).subscribe( ()=>{} );
                        }
                    )
                }

                this.activeModal.close();
            },
            (erro) => {
                Servidor.verificaErro(erro, this.toastr);
            }
        );
    }

    icone(status) {
        switch (status) {
            case 'PENDENTE':
                return 'event';
            case 'SALADEESPERA':
                return 'weekend';
            case 'PREATENDIMENTO':
                return 'assignment';
            case 'EMATENDIMENTO':
                return 'assignment';
            case 'ATENDIDO':
                return 'check';
            case 'DESMARCADO':
                return 'close';
        }
    }

    descricao(status) {
        switch (status) {
            case 'PENDENTE':
                return 'Pendente';
            case 'SALADEESPERA':
                return 'Sala de espera';
            case 'PREATENDIMENTO':
                return 'Pré-atendimento';
            case 'EMATENDIMENTO':
                return 'Em atendimento';
            case 'ATENDIDO':
                return 'Atendido';
            case 'DESMARCADO':
                return 'Desmarcado';
            case 'FALTA':
                return 'Faltou';
        }
    }

    mostraTitle(atendimento) {
        return this.descricao(atendimento.status);// + (atendimento.observacao ? (" - " + atendimento.observacao) : "");
    }

    mostraAtendimento(status) {
        let legendaAtual = this.legendas.filter((legenda)=>{
            return legenda.classe == status;
        })[0];

        return (legendaAtual) ? legendaAtual.estado : false;
    }

    getHora(data, chegada): string {
        if ((Sessao.getOrdemFilaAtendimento() === 'Chegada') && (chegada)){
            return chegada.substring(11, 16);
        }
        return data.substring(11, 16);
    }

    trocaEstadoCheckbox($event, legenda) {
        (legenda) ? legenda.estado = $event : null; 
    }




    //  ============================================
    //              Configurar Agenda
    //  ============================================

    abreModalConfigurarAgenda(bodyModal, templateBotoes) {
        this.activeModal = this.modalService.open(NgbdModalContent, {size: 'lg'});
        this.activeModal.componentInstance.modalHeader = 'Configurar Agenda';

        this.activeModal.componentInstance.templateRefBody = bodyModal;
        this.activeModal.componentInstance.templateBotoes = templateBotoes;
    }

    adicionarIntervalo(novoInicio, novoFim) {
        this.intervalos.push({
            inicio: novoInicio.value, 
            fim: novoFim.value
        })
    }

    removeIntervalo(index) {
        this.intervalos.splice(index, 1);
    }

    salvarConfiguracao() {

    }
}