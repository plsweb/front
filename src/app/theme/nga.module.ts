import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NgxUploaderModule } from 'ngx-uploader';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { BaThemeConfig } from './theme.config';
import { BaThemeConfigProvider } from './theme.configProvider';
import { Ng2CompleterModule } from 'ng2-completer';
import { TreeviewModule } from 'ngx-treeview';
import { AngularMultiSelectModule } from 'angular2-multiselect-dropdown/angular2-multiselect-dropdown';
// import { NgxEditorModule } from 'ngx-editor';
import { QRCodeModule } from 'angularx-qrcode';
import { NgxEditorModule } from './components/ngx-editor/ngx-editor.module';
import { ExcelService } from '../theme/services/ngx-excel-export/excel.service';
import {
    Agenda,
    Autocomplete,
    AutocompleteOLD,
    Assinatura,
    BaAmChart,
    Chat,
    BaCard,
    BaChartistChart,
    BaCheckbox,
    BaFileUploader,
    BaFullCalendar,
    BaMultiCheckbox,
    BaPictureUploader,
    BaSidebar,
    Botao,
    BotaoSearchAcoes,
    ColorPicker,
    DashboardLineChart,
    DashboardPieChart,
    DashboardTrafficChart,
    DatePicker,
    DropDown,
    Multiselect,
    DropdownTreeviewSelectComponent,
    Entrada,
    EntradaBuscar,
    PieChartComponent,
    BarChartComponent,
    LineChartComponent,
    Icone,
    IconeSelector,
    Paginacao,
    Paciente,
    ProgressBar,
    RepeteConteudo,
    InputCheckbox,
    InputAnexo,
    ImageEdit,
    NgbdModalContent,
    NgxUploader,
    ModalConfirm,
    Linque,
    Mensagem,
    Menu,
    Moldura,
    Navegacao,
    Recorrencia,
    Rodape,
    Tabela,
    Ordenacao,
    Slider,
    NouisliderComponent,
    TopoPagina,
    Timeline,
    Treeview,
    GuiaComponent,
} from './components';
import { BaCardBlur } from './components/baCard/baCardBlur.directive';
import {
    BaScrollPosition,
    BaSlimScroll,
    BaThemeRun,
    DebounceClick,
    CustomDropdown,
    NgExit,
    NgInit,
} from './directives';
import {
    SafePipe,
    NoSanitizePipe,
    ReplaceLineBreaks,
    TreeviewPipe,
    BaAppPicturePipe,
    BaKameleonPicturePipe,
    BaProfilePicturePipe,
} from './pipes';
import {
    BaImageLoaderService,
    BaThemePreloader,
    BaThemeSpinner,
} from './services';

import {
    Evolucao
} from '../pages/webpep/evolucao/formulario';

import {
    PlanoCuidado
} from '../pages/webpep/planoCuidado';

// Acoes
import {
    Acoes
} from '../pages/webpep/planoCuidado/totalAcoes';

import {
    GridPrescricoes
} from '../pages/webpep/prescricao/gridPrescricoes';

import {
    GridAdicionarPrescricoes
} from '../pages/webpep/prescricao/gridAdicionarPrescricoes';

import {
    ListaPrescricoesFiltro
} from '../pages/webpep/prescricao/listaPrescricoesFiltro';

import {
    GridProcedimentos
} from '../pages/webpep/faturamento/gridProcedimentos';

import {
    GridAdicionarProcedimento
} from '../pages/webpep/faturamento/gridAdicionarProcedimento';

import {
    ListaProcedimentos
} from '../pages/webpep/faturamento/listaProcedimentos';

import {
    ItensPrescricao
} from '../pages/webpep/prescricao/prescricao/formulario';

import {
    FormularioGrid
} from '../pages/webpep/formulario/formulario/formulario.component';

import {
    CallCenter
} from '../pages/webpep/callcenter';

import {
    Mensagens
} from '../pages/webauditoria/previa/mensagens';

import {
    LogAtendimento
} from '../pages/webpep/atendimento/logAtendimento';

import {
    FormularioPaciente
} from '../pages/webpep/atendimento/formulario';

import { 
    Login 
} from 'app/pages/usuario/login';

import {
    AgendamentoColetivoLocalService,
    AgendamentoColetivoService,
    ProfissionalPacienteService,
    ProfissionalService,
    MaterialService,
    AgendamentoColetivoUsuarioService,
    AgendamentoGrupoService,
    AtendimentoService,
    BeneficiarioFormularioService,
    BeneficiarioService,
    CallTipoContatoService,
    AtendimentoTipoTussService,
    ConfiguraHorarioTussService,
    CidService,
    CiapService,
    ChatService,
    ChatDestinatarioService,
    ChatMensagemService,
    ConfigService,
    ConsultorioService,
    CuidadoRiscoGrauService,
    CuidadoService,
    EstoqueService,
    CuidadoTipoService,
    DashboardAuditoriaService,
    DashboardPepService,
    DashboardService,
    DicionarioTissService,
    EnumApi,
    EstadoCivilService,
    ExameGrupoService,
    ExameService,
    FormularioService,
    FormularioModeloService,
    GuiaAdmissaoService,
    GuiaAuditoriaService,
    GuiaClassificacaoService,
    GuiaLogService,
    GuiaService,
    InternacaoService,
    ItemGuiaService,
    LeitoService,
    LocalAtendimentoService,
    MenorValorService,
    MenuService,
    ModeloDiagnosticoService,
    PacienteCoacherService,
    PacienteCuidadoExecucaoService,
    PacienteCuidadoService,
    PacienteRiscoService,
    PacienteDocumentoService,
    PacienteOperadoraService,
    PacienteParentescoService,
    PacienteService,
    ParticipacaoService,
    PainelSenhaService,
    PalavraChaveService,
    PapelPermissaoService,
    PerguntaCondicao,
    PerguntaOpcaoService,
    PerguntaService,
    PreExistenciaService,
    PrestadorService,
    PrestadorAtendimentoService,
    ProcedimentoService,
    MedicamentoService,
    LogAtendimentoService,
    PrescricaoModeloService,
    PrescricaoItemEspecialidadeService,
    PrescricaoItemUnidadeService,
    PrescricaoItemService,
    PrescricaoPacienteExecucaoService,
    PacientePrescricaoService,
    PacientePrescricaoItemService,
    PacientePrescricaoProdutoService,
    ItemPrescricaoModeloService,
    ComposicaoMedicamentoService,
    ProdutoItemService,
    ProdutoService,
    PrescricaoFrequenciaService,
    RelatorioFiltroService,
    RelatorioService,
    RemessaClassificacaoService,
    ResponsavelAcaoService,
    RiscoCalculoService,
    RiscoGrauService,
    RiscoService,
    SegurancaService,
    Sessao,
    TabelaApi,
    ServiceDinamico,
    TemaGrupoService,
    TratamentoService,
    TipoMovimentoService,
    UsuarioService,
    UnidadeAtendimentoService,
    PontuacaoUnidadeService,
    UtilService,
    GrupoPerguntaService,
    GrupoPerguntaCondicao,
    PanicoPapelService,
    PacienteEncaminhamentoService,
    EspecialidadeService,
    RespostaOpcaoService,
    ProgramaService,
    CobrancaService,
    ItemCobrancaService,
    ComposicaoItemCobrancaService,
    ProgramaSaudePacienteService,
    ProdutoTussService,
    CentroCustoService,
    CentroCustoRegrasService,
    TipoAtendimentoService,
    GoogleChartsBaseService,
    ParametrosGrafico,
} from '../services';

const NGA_COMPONENTS = [
    Agenda,
    Assinatura,
    Autocomplete,
    AutocompleteOLD,
    BaAmChart,
    Chat,
    BaCard,
    BaChartistChart,
    BaCheckbox,
    BaFileUploader,
    BaFullCalendar,
    BaMultiCheckbox,
    BaPictureUploader,
    BaSidebar,
    Botao,
    BotaoSearchAcoes,
    ColorPicker,
    CallCenter,
    DashboardLineChart,
    DashboardPieChart,
    DashboardTrafficChart,
    DatePicker,
    DropDown,
    Multiselect,
    DropdownTreeviewSelectComponent,
    Entrada,
    EntradaBuscar,
    PieChartComponent,
    BarChartComponent,
    LineChartComponent,
    Evolucao,
    FormularioPaciente,
    Icone,
    IconeSelector,
    InputCheckbox,
    ImageEdit,
    InputAnexo,
    Linque,
    Login,
    Mensagem,
    Mensagens,
    LogAtendimento,
    Menu,
    ModalConfirm,
    Moldura,
    Navegacao,
    NgbdModalContent,
    NgxUploader,
    Ordenacao,
    Paginacao,
    Paciente,
    PlanoCuidado,
    ProgressBar,
    RepeteConteudo,
    Acoes,
    GridPrescricoes,
    ListaPrescricoesFiltro,
    GridAdicionarPrescricoes,
    GridProcedimentos,
    GridAdicionarProcedimento,
    ListaProcedimentos,
    ItensPrescricao,
    FormularioGrid,
    Recorrencia,
    Rodape,
    Tabela,
    Timeline,
    TopoPagina,
    Treeview,
    Slider,
    NouisliderComponent,
    GuiaComponent,
];

const NGA_DIRECTIVES = [
    BaCardBlur,
    BaScrollPosition,
    BaSlimScroll,
    BaThemeRun,
    DebounceClick,
    CustomDropdown,
    NgExit,
    NgInit,
];

const NGA_PIPES = [
    BaAppPicturePipe,
    BaKameleonPicturePipe,
    BaProfilePicturePipe,
    NoSanitizePipe,
    ReplaceLineBreaks,
    SafePipe,    
    TreeviewPipe,
];

const NGA_SERVICES = [
    BaImageLoaderService,
    BaThemePreloader,
    BaThemeSpinner,
];

const SERVICES = [
    AgendamentoColetivoLocalService,
    AgendamentoColetivoService,
    AgendamentoColetivoUsuarioService,
    AgendamentoGrupoService,
    ProfissionalPacienteService,
    ProfissionalService,
    MaterialService,
    AtendimentoService,
    BeneficiarioService,
    BeneficiarioFormularioService,
    CallTipoContatoService,
    AtendimentoTipoTussService,
    ConfiguraHorarioTussService,
    CidService,
    CiapService,
    ChatService,
    ChatDestinatarioService,
    ChatMensagemService,
    ConfigService,
    ConsultorioService,
    CuidadoRiscoGrauService,
    CuidadoService,
    CuidadoTipoService,
    DashboardAuditoriaService,
    DashboardPepService,
    DashboardService,
    DicionarioTissService,
    EnumApi,
    EstadoCivilService,
    ExameGrupoService,
    ExameService,
    EspecialidadeService,
    EstoqueService,
    FormularioService,
    FormularioModeloService,
    CobrancaService,
    ItemCobrancaService,
    ComposicaoItemCobrancaService,
    GuiaAdmissaoService,
    GuiaAuditoriaService,
    GuiaClassificacaoService,
    GuiaLogService,
    GuiaService,
    InternacaoService,
    ItemGuiaService,
    LeitoService,
    LocalAtendimentoService,
    MenorValorService,
    MenuService,
    ModeloDiagnosticoService,
    PacienteCoacherService,
    PacienteCuidadoExecucaoService,
    PacienteCuidadoService,
    PacienteRiscoService,
    PacienteDocumentoService,
    PacienteOperadoraService,
    PacienteParentescoService,
    PacienteService,
    ParticipacaoService,
    ProgramaService,
    ProgramaSaudePacienteService,
    RespostaOpcaoService,
    PainelSenhaService,
    PalavraChaveService,
    PapelPermissaoService,
    PerguntaOpcaoService,
    PerguntaService,
    PreExistenciaService,
    PrestadorService,
    PrestadorAtendimentoService,
    ProcedimentoService,
    LogAtendimentoService,
    MedicamentoService,
    PrescricaoModeloService,
    PrescricaoItemEspecialidadeService,
    PrescricaoItemUnidadeService,
    PrescricaoItemService,
    PrescricaoPacienteExecucaoService,
    PacientePrescricaoService,
    PacientePrescricaoItemService,
    PacientePrescricaoProdutoService,
    ItemPrescricaoModeloService,
    ComposicaoMedicamentoService,
    ProdutoItemService,
    ProdutoService,
    PrescricaoFrequenciaService,
    ProdutoTussService,
    CentroCustoService,
    CentroCustoRegrasService,
    TipoAtendimentoService,
    GoogleChartsBaseService,
    ParametrosGrafico,
    RelatorioService,
    RelatorioFiltroService,
    RemessaClassificacaoService,
    ResponsavelAcaoService,
    RiscoCalculoService,
    RiscoGrauService,
    RiscoService,
    SegurancaService,
    Sessao,
    TabelaApi,
    ServiceDinamico,
    TemaGrupoService,
    TipoMovimentoService,
    TratamentoService,
    UsuarioService,
    UnidadeAtendimentoService,
    PontuacaoUnidadeService,
    UtilService,
    GrupoPerguntaService,
    GrupoPerguntaCondicao,
    PanicoPapelService,
    PacienteEncaminhamentoService,
    PerguntaCondicao,
    UtilService
];

@NgModule({
    declarations: [
        ...NGA_COMPONENTS,
        ...NGA_DIRECTIVES,
        ...NGA_PIPES,
    ],
    imports: [
        CommonModule,
        FormsModule,
        Ng2CompleterModule,
        AngularMultiSelectModule,
        NgxUploaderModule,
        NgbModule,
        ReactiveFormsModule,
        RouterModule,
        TreeviewModule.forRoot(),
        NgxEditorModule,
        QRCodeModule,
    ],
    exports: [
        ...NGA_COMPONENTS,
        ...NGA_DIRECTIVES,
        ...NGA_PIPES,
    ],
    entryComponents: [
        ...NGA_COMPONENTS,
    ],
})
export class NgaModule {
    static forRoot(): ModuleWithProviders {
        return <ModuleWithProviders>{
            ngModule: NgaModule,
            providers: [
                BaThemeConfigProvider,
                BaThemeConfig,
                ExcelService,
                ...NGA_SERVICES,
                ...SERVICES,
            ],
        };
    }
}
