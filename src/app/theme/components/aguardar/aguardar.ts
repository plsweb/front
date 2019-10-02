import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';

export class Aguardar{

    constructor(
        private route: ActivatedRoute,
        private router: Router){
    }

    static aguardar(segundos, router=null) {
        return new Promise((resolve, reject) => {
            let myFunction = setInterval(resolve, segundos * 1000)

            if( router ){
                router.events.subscribe((evt) => {
                    if (!(evt instanceof NavigationEnd)) {
                        clearInterval(myFunction);
                        return;
                    }
                });
            }

        });
    }
}