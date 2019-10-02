let guia;
let xhttp = new XMLHttpRequest();

const aUrl = window.location.href.split('/');
const token = aUrl[aUrl.length-1];
const url = `https://plsweb.unimeduberaba.com.br/webresources/web/erp/guiaPorToken/${token}`;
const ItenStatus = {
	"0": "Negado",
	"1": "Autorizado"
};
const GuiaStatus = {
    "AUTORIZADA": 1,
    "AUTORIZADAPARCIALMENTE": 2,
    "NAOAUTORIZADA": 3
};

Date.prototype.addDays = function(days) {
	var data = new Date(this.valueOf());
	data.setDate(data.getDate() + days);
	return data;
}

let fnIniciaHeader = () => {
	let protocolo = guia.protocolo ? `${guia.protocolo}` : '';
	document.getElementById('protocolo').innerHTML = protocolo;
	document.getElementById('guia').innerHTML = guia.impresso;
};

let fnIniciaTimeLine = () => {
	fnClearElement(document.getElementById('timeline'));

	let atualizaStatus = (logs) => {
		logs.map((log) => {
			log.status = 'completo';
		});

		return logs;
	}
	/*let guia = {
		'digitacao': '06/04/2018',
		'ultimaAutorizacao': '06/04/2018',
		'status': 'AUTORIZADA',
		'auditoria': true
	};*/

	let logs = [{
		data: guia.digitacao,
		descricao: 'Autorização',
		status: 'completo'
	}];

	logs.push({
		data: guia.ultimaAutorizacao ? guia.ultimaAutorizacao : '',
		descricao: 'Em análise',
		status: 'pendente'
	});

	if (!guia.auditoria) {
		atualizaStatus(logs);
	}

	if (guia.auditoria) {
		var dateStr = guia.digitacao;
		var parts = dateStr.split("/");
		var dataInicio = new Date(parts[2], parts[1] - 1, parts[0]);
		
		dataInicio = dataInicio.addDays(7);

		var dia = dataInicio.getDate();
    	var mes = dataInicio.getMonth()+1;
    	var ano = dataInicio.getFullYear();  
    		
    	if (dia.toString().length == 1){
      		dia = "0"+dia;
    	}

    	if (mes.toString().length == 1){
      		mes = "0"+mes;
    	}

		logs.push({
			data: (dia+"/"+mes+"/"+ano),
			descricao: 'Prazo final',
			status: 'pendente'
		});

	} else if (guia.status == 'NAOAUTORIZADA' ) {
		atualizaStatus(logs);
		logs.push({
			data: guia.ultimaAutorizacao,
			descricao: 'Não autorizado',
			status: 'negado'
		});
	} else if (guia.status == 'AUTORIZADAPARCIALMENTE') {
		atualizaStatus(logs);
		logs.push({
			data: guia.ultimaAutorizacao,
			descricao: 'Autorizado parcialmente',
			status: 'parcial'
		});
	} else {
		logs.push({
			data: guia.ultimaAutorizacao,
			descricao: 'Autorizada',
			status: 'completo'
		});
	}


	logs.forEach((log) => {
		let elLi = document.createElement('li');
		elLi.classList.add(log.status);

		let elDot = document.createElement('div');
		elDot.classList.add('dot');
		let elSpanBarra = document.createElement('span');
		elSpanBarra.classList.add('barra');
		elDot.appendChild(elSpanBarra);

		let elEvento = document.createElement('div');
		elEvento.classList.add('evento');
		let elSpanData = document.createElement('span');
		elSpanData.classList.add('data');
		let elSpanConteudo = document.createElement('span');
		elSpanConteudo.classList.add('conteudo');
		elSpanData.innerHTML = log.data;
		elSpanConteudo.innerHTML = log.descricao;
		elEvento.appendChild(elSpanData);
		elEvento.appendChild(elSpanConteudo);
		
		elLi.appendChild(elDot);
		elLi.appendChild(elEvento);

		document.getElementById('timeline').appendChild(elLi);
	});

}

let fnIniciaItens = () => {
	let tabelaItens = document.getElementById('itens-guia');
	
	fnClearElement(tabelaItens.querySelector('tbody'));
	guia.itens.forEach((item) => {
		fnConstroiLinhaIten(item);
	});
}

let screenShot = () => {
	/*html2canvas(document.querySelector("body")).then((canvas) => {
	    document.querySelector('#screenshot').appendChild(canvas);
	    canvas.toDataURL('image/png');
	});*/
}

let formataColunaStatus = (item) => {
	if (item.auditoria) {
		return "Em Análise";
	}
	return ItenStatus[item.status];
}

let fnConstroiLinhaIten = (item) => {
	let tabelaItens = document.getElementById('itens-guia');
	var linha = tabelaItens.insertRow();

	var tdDescricao = linha.insertCell(0);
	var tdQuantidade = linha.insertCell(1);
	var tdStatus = linha.insertCell(2);

	// Add some text to the new cells:
	tdDescricao.innerHTML = item.procedimento.descricao;
	tdQuantidade.innerHTML = item.quantidadeAutorizada;
	tdStatus.innerHTML = formataColunaStatus(item);
}

let fnClearElement = (el) => {
	while(el.firstChild){
    	el.removeChild(el.firstChild);
	}
}

xhttp.onreadystatechange = function() {
	
	if (this.readyState == 4 && this.status == 200) {		
		guia = JSON.parse(this.responseText);
		console.log(guia);
		fnIniciaHeader();
		fnIniciaTimeLine();
		fnIniciaItens();

		document.querySelector('.loading').style.display = 'none';
		setTimeout(()=>{
			screenShot();
		}, 1000);

	} else if(this.status == 500) {
		alert('Erro ao processar guia! Tente novamente mais tarde');
	}
};

xhttp.open("GET", url, true);
xhttp.send();