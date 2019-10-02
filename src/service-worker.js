
const version = 1;
const CACHE_NAME = `plsweb-cache-v${version}`;
const CACHE_PAGE = `pages-cache-v${version}`;
const CACHE_APIS = `apis-cache-v${version}`;
const metodosPermitidos = ['get', 'put'];
const docs = [
    '/',
    './'
];

let offlineTime = false;

const imagens = [
    '/favicon.ico',
    '/assets/img/no-photo.png',
    '/assets/img/unimed-uberaba.png',
    '/assets/images/logo-unimed/unimed-uberaba.png'
];

const styles = [
    './styles.css'
];

const scripts = [
    './scripts.js',
    './runtime.js',
    './service-worker.js'
];

var aConfigApiUrls = [
    {
  'url': 'pep/pacienteDocumento/',
  'metodo': 'PUT',
  'pai': [
            {
    'url': 'pep/pacienteDocumento/',
    'metodo': 'POST'
   }
  ]
 }
];


const urlsToPrefetch = [].concat(docs, imagens, styles, scripts);

self.addEventListener('install', (event) => {
    console.log("install");
    
    var requestDatabase = indexedDB.open('cacheRequest', 6);
    requestDatabase.onsuccess = function(event) {
        var db = event.target.result;

        try{
            db.createObjectStore('request', {keyPath: 'indice', autoIncrement: true, primaryKey: true});
        }catch(e){
            console.log(e);
        }

        try{
            db.createObjectStore('formularios', {keyPath: 'id', autoIncrement: true});
        }catch(e){
            console.log(e);
        }
    };
    requestDatabase.onupgradeneeded = function(event) {
        var db = event.target.result;

        try{
            db.createObjectStore('request', {keyPath: 'indice', autoIncrement: true});
        }catch(e){
            console.log(e);
        }
        
        try{
            db.createObjectStore('formularios', {keyPath: 'id', autoIncrement: true});
        }catch(e){
            console.log(e);
        }

    };

    self.skipWaiting();

    // Executa os passos de instalação
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('Opened cache');
            
            return cache.addAll(urlsToPrefetch);
        })
    );
});


self.addEventListener('fetch', function(event) {

    let req;

    if(navigator.onLine) {
        req = fetch(event.request).then(
            (response) => {
                let metodo = event.request.method.toLowerCase();
                let bMetodoInalido = metodosPermitidos.indexOf(metodo) == -1;
                if(
                    !response || 
                    response.status !== 200 ||
                    bMetodoInalido
                ) {
                    return response;
                }

                var responseToCache = response.clone();

                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            }
        );

    } else {
        
        if( event.request.method == 'GET' ) {

            //  Pega do cache
            req = caches.match(event.request).then((response) => {
                if (response) {
                    return response;
                }
            });

        } else {

            // var tx = db.transaction(DB_TB_NAME, 'readwrite');

            req = new Promise(function(resolve, reject) {

                var request = indexedDB.open('cacheRequest');
                request.onsuccess = function($evsuccess) {

                    // some sample products data
                    var fetchRequest = event.request;
                    
                    fetchRequest.json().then(
                        (data) => {
                            let objStore = {
                                url : event.request.url,
                                metodo : event.request.method,
                                body : data
                            }

                            var retorno = validaConfigApis($evsuccess , objStore);
                            console.log(retorno);

                            if( retorno ){

                                var init = {
                                    status:     511,
                                    statusText: 'Aplicação Offline',
                                    headers: {'Content-Type': 'application/json'}
                                };
                    
                                retorno.onsuccess = async function ($event) {
                                    console.log("sALVEI request");
                                    console.log($event);
                                    console.log("ID   " + $event.currentTarget.result);
                                    var id = $event.currentTarget.result

                                    let resp = new Response(JSON.stringify(id), init);

                                    resolve(resp);

                                }
                            }
                    });
                }
            });
        }

    }

    event.respondWith( req );
});

self.addEventListener('activate', (event) => {
    console.log("activate");
    //let cacheWhitelist = [CACHE_PAGE, CACHE_APIS];
    let cacheWhitelist = [];

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

function sync(){
    console.log("Sincroniza requisicoes...");

    try{
        var request = indexedDB.open('cacheRequest');

        request.onsuccess = function($event) {

            // get database from $event
            var db = $event.target.result;

            // create transaction from database
            var transaction = db.transaction('request', 'readwrite');
            transaction.onerror = ($event)=>{
                console.log("Houve um erro" , $event);
            }

            transaction.onsuccess = ()=>{
                var requestsStore = transaction.objectStore('request');

                requestsStore.getAll().onsuccess = function(event) {
                    console.log('Requisicao', event.target.result);
                    let requests = event.target.result;

                    let aPromises = [];

                    requests.forEach( (request) => {

                        var myHeaders = new Headers();
                        myHeaders.append('Content-Type', 'text/plain');

                        var myInit = {
                            headers: myHeaders,
                            method: request.metodo,
                            body: JSON.stringify(request.body)
                        };

                        var myRequest = new Request(request.url, myInit);

                        aPromises.push(
                            fetch(myRequest)
                        );
                    });

                    Promise.all(aPromises)
                        .then((data) => {
                            console.log(data);
                        })
                        .catch( (erro) => {
                            console.error(erro);
                        }
                    );            

                };

                console.log("Sincronização finalizada!!");
            }

        };
    }catch(e){
        console.log(e);
    }
    
}

function validaConfigApis($event, obj){
    var bMatched = false;
    var sUrlRequested = obj.url;
    var sMetodo = obj.metodo;

    console.log(bMatched);

    // get database from $event
    var db = $event.target.result;

    // create transaction from database
    var transaction = db.transaction('request', 'readwrite');

    // returns IDBObjectStore instance
    var productsStore = transaction.objectStore('request');

    aConfigApiUrls.forEach((config) => {
        console.log(config.url, config.metodo);
        var oReg = new RegExp(config.url, 'i');
        
        var bTemUrl = sUrlRequested.match(oReg);
        var bMesmoMetodo = config.metodo == sMetodo;
        if (bTemUrl && bMesmoMetodo) {
            bMatched = true;
        }
    });

    if( bMatched ){
        let idIndexedDB = obj.url.split('/')[obj.url.split('/').length-1]
        var objectStoreRequest = productsStore.get( parseInt(idIndexedDB) );        

        objectStoreRequest.onsuccess = (event) => {
            console.log("GET POSICAO 1");
            console.log(event);

            console.log(objectStoreRequest.result);
            
            var requisicaoPai = objectStoreRequest.result;
            requisicaoPai['dependentes'] = ( requisicaoPai['dependentes'] && requisicaoPai['dependentes'].length ) ? requisicaoPai['dependentes'].push( obj ) : requisicaoPai['dependentes'] = [ obj ] ;

            // delete requisicaoPai.id;
            // let id = requisicaoPai.id - 1;
            var att = productsStore.put( requisicaoPai, undefined );
            att.onsuccess = (ev) => {
                console.log("Atualizei normalmente");
                console.log(requisicaoPai['dependentes']);
                
                console.log(ev);
            }


            // formulariosStore.openCursor(null,'next').onsuccess = (event) => {
            //     var cursor = event.target.result;
            //     if(cursor) {
            //         console.log(cursor.value[0].formulario.id  + " =  " + cursor.value[0].formulario.titulo);
                    
            //         if( cursor.value[0].formulario.id == novoFormulario.formulario.id ){
            //             console.log("Fomrulario encontrado offline");
            //             let novaEvolucao = [
            //                 { 
            //                     id: id, 
            //                     data: moment().format(this.formatosDeDatas.dataHoraSegundoFormato), 
            //                     usuario: cursor.value[0].usuario,
            //                     formulario : cursor.value[0].formulario
            //                 }
            //             ]
                        
            //             this.evolucoes = novaEvolucao.concat( [], this.evolucoes );
            //             console.log(this.evolucoes);
            //             this.toastr.warning("Formulario adicionado em modo offline");
            //             this.abrirFormulario(id);

            //         }else{
            //             cursor.continue();        
            //         }

            //         // if(cursor.value.albumTitle === 'A farewell to kings') {
            //         //     var updateData = cursor.value;
                        
            //         //     updateData.year = 2050;
            //         //     var request = cursor.update(updateData);
            //         //     request.onsuccess = function() {
            //         //         console.log('A better album year?');
            //         //     };
            //         // };

            //     } else {
            //         this.toastr.warning('Formulario nao encontrado offline');         
            //         return
            //     }
            // };

        };


    }else{
        // Store Data in database IDBRequest
        var retorno = productsStore.add(obj); // IDBRequest

        return retorno;
    }

}

async function salvaRequisicaoOffline(event){

    let response = fetch(event.request).then(function(response){

        var request = indexedDB.open('cacheRequest');
        request.onsuccess = function($evsuccess) {
            // some sample products data
            var fetchRequest = event.request;
            
            fetchRequest.json().then(
                (data) => {
                    let objStore = {
                        url : event.request.url,
                        metodo : event.request.method,
                        body : data
                    }

                    var retorno = validaConfigApis($evsuccess , objStore);
                    console.log(retorno);

                    if( retorno ){
                        // event.respondWith(

                            // fetch(event.request).then(function(response){
                                var init = {
                                    status:     511,
                                    statusText: 'Aplicação Offline',
                                    // headers:    {'Content-Type': 'text/plain'}
                                };
                                // 'Content-Type', 'text/plain'
                    
                                // response.headers.forEach(function(v,k){
                                //     init.headers[k] = v;
                                // });
                    
                                retorno.onsuccess = async function ($event) {
                                    console.log("sALVEI request");
                                    console.log($event);
                                    console.log("ID   " + $event.currentTarget.result);
                                    var id = $event.currentTarget.result

                                    console.log(response);

                                    return response.text().then(function(body){
                                        console.log("RESPONSE.TEXT()");
                                        console.log("BODY");
                                        console.log(body);
                                        
                                        return new Response(id, init);
                                    });

                                }

                            // })

                        // )
                    }
                }
            );
        }
    })

    return response;
}