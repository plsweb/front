import { SwUpdate } from '@angular/service-worker';
import { Injectable } from '@angular/core';
import { interval } from 'rxjs';

@Injectable()
export class CheckForUpdateService {

	constructor(updates: SwUpdate) {
		alert('aaaaaaaa');
		interval(6 * 60 * 60).subscribe(() => updates.checkForUpdate());
	}
}