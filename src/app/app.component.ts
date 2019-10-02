import { Component, ViewContainerRef } from '@angular/core';
import * as $ from 'jquery';

import { GlobalState } from './global.state';
import { BaImageLoaderService, BaThemePreloader, BaThemeSpinner } from './theme/services';
import { BaThemeConfig } from './theme/theme.config';
import { layoutPaths } from './theme/theme.constants';

import { interval } from 'rxjs';

import { UpdateService } from './update.service';
import { CheckForUpdateService } from './check-for-update.service';
import { PromptUpdateService } from './prompt-update.service';
//import { SwPush , SwUpdate} from '@angular/service-worker';

import { ToastrService } from 'ngx-toastr';

/*
 * App Component
 * Top Level Component
 */
@Component({
  selector: 'app',
  styleUrls: ['./app.component.scss'],
  template: `
    <main [class.menu-collapsed]="isMenuCollapsed" baThemeRun>
      <div class="additional-bg"></div>
      <router-outlet></router-outlet>
    </main>
  `
})
export class App {

  isMenuCollapsed: boolean = false;

  constructor(
    private _state: GlobalState,
    private _imageLoader: BaImageLoaderService,
    private _spinner: BaThemeSpinner,
    private viewContainerRef: ViewContainerRef,
    private themeConfig: BaThemeConfig,
    private toastr: ToastrService, 

    //private update: UpdateService,
    //private swUpdate: SwUpdate
    //private checkForUpdate: CheckForUpdateService,
    //private promptUpdate: PromptUpdateService
  ) {
    themeConfig.config();
  }


  public ngOnInit():void {
    /*if (this.swUpdate.isEnabled) {
      
      this.swUpdate.available.subscribe((evt) => {
        if(confirm("Você esta rodando uma versão desatualizada. Deseja atualizar?")){
          this.swUpdate.activateUpdate().then(() => document.location.reload());
        }
      });
      
      this.swUpdate.checkForUpdate().then(() => {
        
        interval(6 * 60 * 60).subscribe(() => {
          this.swUpdate.checkForUpdate();
        });

      }).catch((err) => {
        
        console.error('Erro checando por atualizações', err);

      });
    }*/
    const channel = new BroadcastChannel('sw-messages');
    channel.addEventListener('message', event => {
      this.toastr.warning(event.data.title);
    });
  }

  public ngAfterViewInit(): void {
    this._state.subscribe('menu.isCollapsed', (isCollapsed) => {
      this.isMenuCollapsed = isCollapsed;
    });

    // hide spinner once all loaders are completed
    BaThemePreloader.load().then((values) => {
      this._spinner.hide();
    });
  }
}
