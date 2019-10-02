import {Injectable} from '@angular/core'
import { Http } from '@angular/http';
import { Router } from '@angular/router';

import { Servidor, Sessao } from '../../services';

@Injectable()
export class ChatService {

  url: string = 'web/chat/';
  private servidor;

  constructor(http: Http, router: Router) {
      this.servidor = new Servidor(http, router);
  }

  post(objParams) {
      const url = `${this.url}chat/${Sessao.getToken()}`;

      return this.servidor.realizarPost(url, objParams);
  }

  get(param = null) {
      const url = `${this.url}chat/${Sessao.getToken()}`;

      return this.servidor.realizarGetParam(url, param);
  }

  put(id, objParams) {
      const url = `${this.url}chat/${Sessao.getToken()}/${id}`;

      return this.servidor.realizarPut(url, objParams);
  }

  delete(id) {
      const url = `${this.url}chat/${Sessao.getToken()}/${id}`;

      return this.servidor.realizarDeleteSemBody(url);
  }
}
