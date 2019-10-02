export class Sessao {
    static getToken(): string {
        return localStorage.getItem('token');
    }

    static setToken(token: string) {
        return localStorage.setItem('token', token);
    }

    static setCuidado(objCuidado: string) {
        return localStorage.setItem('cuidadoAgendamento', JSON.stringify(objCuidado));
    }

    static getCuidado() {
        return JSON.parse(localStorage.getItem('cuidadoAgendamento'));
    }

    static removeCuidadoAgendamento() {
        return localStorage.removeItem('cuidadoAgendamento');
    }

    static getIdUnidade() {
        return localStorage.getItem('idUnidade')
    }

    static setIdUnidade(unidade: string) {
        return localStorage.setItem('idUnidade', unidade);
    }

    static getUsuario() {
        let usuario = JSON.parse( localStorage.getItem('usuario') )
        return usuario;
    }

    static setUsuario(usuario) {
        return localStorage.setItem('usuario', usuario);
    }

    static setResponsavelPanico(bPanico) {
        return localStorage.setItem('responsavelPanico', bPanico);
    }

    static getResponsavelPanico() {
        return localStorage.getItem('responsavelPanico');
    }

    static getOrdemFilaAtendimento() {
        return localStorage.getItem('ordemFilaAtendimento');
    }

    static setOrdemFilaAtendimento(ordem: string) {
        return localStorage.setItem('ordemFilaAtendimento', ordem);
    }

    static deleteToken(): void {
        localStorage.removeItem('token');
    }

    static deletePreferenciasUsuario(): void {
        localStorage.removeItem('unidade');
        localStorage.removeItem('idUnidade');
        localStorage.removeItem('consultorio');
        localStorage.removeItem('idConsultorio');
        localStorage.removeItem('variaveisAmbiente');
        // sessionStorage.clear();
        // localStorage.clear();
    }

    static setPreferenciasUsuario(id, valor): void {
        let preferencias = this.getPreferenciasUsuario();

        preferencias[id] = valor;
        localStorage.setItem('preferenciaUsuario', JSON.stringify(preferencias));
    }

    static getPreferenciasUsuario(id = undefined) {
        let preferencias = localStorage.getItem('preferenciaUsuario') ? JSON.parse(localStorage.getItem('preferenciaUsuario')) : {};
        
        return id ? preferencias[id] : preferencias;
    }

    static validaPapelUsuario(nomePapel){
        if( localStorage.getItem('papeis') && localStorage.getItem('papeis').length ){
            let papeis = localStorage.getItem('papeis').split(',');

            return ( papeis.indexOf( nomePapel ) >= 0 )
        }

        return false;
    }

    static getPapelUsuario(){
        if( localStorage.getItem('papeis') ){
            return localStorage.getItem('papeis').split(',');
        }

        return [];
    }

    static getVariaveisAmbiente(id = undefined){
        let variaveisAmbiente = localStorage.getItem('variaveisAmbiente') ? JSON.parse(localStorage.getItem('variaveisAmbiente')) : {};

        return id ? variaveisAmbiente[id] : variaveisAmbiente;
    }

    static setVariaveisAmbiente(id, valor){
        let variaveis = this.getVariaveisAmbiente();

        variaveis[id] = valor;
        localStorage.setItem('variaveisAmbiente', JSON.stringify(variaveis));
    }

    static setPreferenciasUsuarioLocalStorage(id, valor): void {
        let preferencias = this.getPreferenciasUsuarioLocalStorage();

        preferencias[id] = valor;
        sessionStorage.setItem('preferenciaUsuario', JSON.stringify(preferencias));
    }

    static getPreferenciasUsuarioLocalStorage(id = undefined) {
        let preferencias = sessionStorage.getItem('preferenciaUsuario') ? JSON.parse(sessionStorage.getItem('preferenciaUsuario')) : {};

        return id ? preferencias[id] : preferencias;
    }

    static getModulo() {
        let modulo: string = window.location.toString();
        
        if( modulo.indexOf('http://localhost:8080/#/') > -1 ){
            return 'webpep';
        }else{
            modulo= modulo.replace(/.*\/\//, "");
        }
        return modulo.split(".")[0];
    }

    static getEnum(id = undefined){
        let enums = localStorage.getItem('enums') ? JSON.parse(localStorage.getItem('enums')) : [];
        let retorno = enums;

        if( id ){
            retorno = enums.filter(
                (item) => {
                    return item.nome == id
                }
            )
        }

        return id && retorno.length ? retorno[0] : retorno;
    }

    static getPermissoes(){
        return [
            'webpep/dashboard', 'webpep/atendimento', 'webpep/paciente'
        ]
    }

    static getPagina() {
        let pagina: string = window.location.toString();
        pagina= pagina.replace(/^.*br\//, "");
        pagina= pagina.replace(/^.*00\//, "");
        pagina= pagina.replace(/^.*dev\//, "");
        pagina= pagina.replace(/^.*hml\//, "");
        return pagina;
    }

    static getBase() {
        let pagina: string = window.location.toString();

        if(pagina.match(".*localhost.*")){
            return "local";
        }
        if(pagina.match(".*/dev/.*")){
            return "dev";
        }
        if(pagina.match(".*/hml/.*")){
            return "hml";
        }
        if(pagina.match(".*/rc/.*")){
            return "rc";
        }
        return "prd";
    }
}
