import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { Servidor, Sessao, MenuService } from 'app/services';
import { GlobalState } from '../../../global.state';

@Component({
    selector: 'menu',
    templateUrl: './menu.html',
    providers: [],
    styleUrls: ['./menu.scss']
})
export class Menu {
    @Input() sidebarCollapsed: boolean = false;
    @Input() menuHeight: number;

    @Output() expandirMenu = new EventEmitter<any>();

    itens: any[];
    protected _menuItemsSub: Subscription;
    showHoverElem: boolean;
    hoverElemHeight: number;
    hoverElemTop: number;
    protected _onRouteChange: Subscription;
    pagina: string;
    isMenuCollapsed: boolean = false;

    constructor(private _router: Router, private service: MenuService, private _state: GlobalState) {

    }

    ngOnInit(): void {
        
        this._state.subscribe('menu.isCollapsed', (isCollapsed) => {
          this.isMenuCollapsed = isCollapsed;
        });

        this.service.getItens()
            .subscribe((itens) => {
                
                let aFinalItens = [];
                let fAgrupa = (aItems) => {
                    if (!aItems.length) {
                        return
                    }

                    let aItemsTemp = [];
                    aItems.forEach((item) => {
                        if (item.menuPai) {
                            
                            let paiPos;
                            
                            let menuPai = aFinalItens.filter((menuItem, i) => {
                                
                                let bPaiNaLista = menuItem.id == item.menuPai;
                                ( menuItem.id == item.menuPai ) ? paiPos = i : null;
                                return bPaiNaLista;
                            })[0];

                            if (menuPai){
                                aFinalItens[paiPos]["item"] = aFinalItens[paiPos]["item"] || [];
                                aFinalItens[paiPos]["item"].push(item);
                            } else {
                                //aItemsTemp.push(item);
                                aFinalItens.push(item);
                            }
                            
                        } else {
                            
                            aFinalItens.push(item);
                        }
                    });

                    fAgrupa(aItemsTemp);
                };

                fAgrupa(itens);

                this.itens = aFinalItens;
            },
            erro => {
                if (erro.status === 401) {
                    this._router.navigate(['/login'])
                }
            }
        );

        this.pagina = Sessao.getPagina();
    }

    selecionado($event, item) {
        let submenu = jQuery($event.currentTarget).next();

        if (item.item) {
            item.expanded = !item.expanded;
            submenu.slideToggle();
            
            this._state.notifyDataChanged('menu.isCollapsed', false);
        }
        else {
            this.pagina = item.uri;
        }
    }

    menuAtual(menu) {
        let reg = new RegExp(menu, 'i');
        return this.pagina.match(reg);
    }
}