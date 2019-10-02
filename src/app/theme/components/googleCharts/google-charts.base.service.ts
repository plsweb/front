import { Injectable } from "@angular/core";

declare var google: any;

@Injectable()
export class GoogleChartsBaseService {
    constructor() { 
        google.charts.load('current', {'packages':['corechart']});
    }

    protected buildChart(data: any[], chartFunc: any, options: any, customFn: any = undefined) : void {
        var func = (chartFunc, options) => {
            var datatable = google.visualization.arrayToDataTable(data);
            chartFunc().draw(datatable, options);

            if( customFn ){
                customFn();
            }
        };
        var callback = () => func(chartFunc, options);
        google.charts.setOnLoadCallback(callback);
        
    }

    public montaGraficos(dados, parametrosGrafico:ParametrosGrafico){
        if( dados.length ){
            let titulos = [['Chave']];

            if( Array.isArray(parametrosGrafico.chartValores) ){
                parametrosGrafico.chartValores = parametrosGrafico.chartValores;
            }else{
                parametrosGrafico.chartValores = [parametrosGrafico.chartValores]
            }
            parametrosGrafico.chartValores.forEach( 
                (indice) => {
                    if( parametrosGrafico.colunasValores && parametrosGrafico.colunasValores.length ) {
                        titulos[0].push( parametrosGrafico.colunasValores[indice] ); 
                    }else{
                        titulos[0].push( 'Valor' ); 
                    }
                } 
            );
            let iChave = parametrosGrafico.chartLegendas;
            let iValor = parametrosGrafico.chartValores;

            let dadosGrafico = dados.slice();
            let total = 0;
            if( parametrosGrafico.tipoGrafico != 'bar' ){
                dadosGrafico.forEach(dado => total += dado[iValor[0]]);

                dadosGrafico = dadosGrafico.map(
                    (dado) => {
                        let obj = JSON.parse(JSON.stringify(dado));
                        let porcent = parseFloat(String((dado[iValor[0]] / total) * 100)).toFixed(1);
                        obj[iValor[0]] = dado[iValor[0]];
                        obj[iChave] = dado[iChave] + ': ' + dado[iValor[0]] + ' (' + porcent + '%)'
                        return obj;
                    }
                );
            }

            parametrosGrafico.dados = titulos.concat(dadosGrafico);

            let arrayCores = [];
            parametrosGrafico.dados = parametrosGrafico.dados.map(
                (dado, idx) => {
                    
                    if( idx == 0 ){
                        return dado;
                    }

                    let arrayColunas = [];
                    arrayColunas.push( dado[iChave] );
                    iValor.forEach(
                        (posicaoColuna) => {
                            let valor = dado[posicaoColuna]
                            if (dado && valor && valor.date && parametrosGrafico.fnFormataDataPorDate) {
                                arrayColunas.push( parametrosGrafico.fnFormataDataPorDate(valor) );
                            } else {
                                arrayColunas.push( valor );
                            }        
                        }
                    )
                
                    if( parametrosGrafico.objCoresDashboard && parametrosGrafico.objCoresDashboard[idx] ){
                        arrayCores.push( parametrosGrafico.objCoresDashboard[idx] );
                    }
                    return arrayColunas;
                }
            );

            if( parametrosGrafico.tipoGrafico != 'bar' ){
                parametrosGrafico.dados.push( ['TOTAL: ' + total, 0] );
            }

            parametrosGrafico.arrayCores = arrayCores
        }
        return parametrosGrafico
    }
}

@Injectable()
export class ParametrosGrafico{
    tipoGrafico?
    tituloGrafico?
    subtitulo1?
    subtitulo2?
    config?
    chartValores?
    chartLegendas?
    dados?
    objCoresDashboard?
    colunasValores?
    fnFormataDataPorDate?: Function
    arrayCores?
}