import { Component, Input } from '@angular/core';

@Component({
  selector: 'ba-card',
  templateUrl: './baCard.html',
  styleUrls: ['./baCard.scss'],
})
export class BaCard {
  @Input() cardTitle: String;
  @Input() baCardClass: String;
  @Input() cardType: String;
}
