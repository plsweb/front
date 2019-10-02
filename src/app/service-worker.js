let versao = 9
let arquivos = [
    "/"
]

self.addEventListener("install", () => {
    console.log('1Instalou')
})

self.addEventListener("activate", () => {
    caches.open("plsweb-" + versao).then(cache => {
        cache.addAll(arquivos)
            .then(function(){
                caches.delete("plsweb-" + (versao - 1 ))   
                caches.delete("plsweb")   
            })
        
    })
})


self.addEventListener("fetch", (event) => {
    console.log('1###############');
    let pedido = event.request
    let promiseResposta = caches.match(pedido).then(respostaCache => {
        console.log('1************');
        console.log(respostaCache)

        //if (event.request.mode === 'navigate') {
        let resposta = respostaCache ? respostaCache : fetch(pedido).catch((e) => {
            console.log('1============');
            console.log(e);
            //caches.match(OFFLINE_URL);
        })
        //}
        return resposta
    })

    event.respondWith(promiseResposta)

})

