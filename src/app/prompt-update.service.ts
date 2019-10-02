import { SwUpdate } from '@angular/service-worker';
import { Injectable } from '@angular/core';
import { interval } from 'rxjs';

@Injectable()
export class PromptUpdateService {

	constructor(updates: SwUpdate) {
		updates.available.subscribe(event => {
			//if (confirm(event)) {
				updates.activateUpdate().then(() => document.location.reload());
			//}
		});
	}
}