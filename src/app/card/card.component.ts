import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-card',
  templateUrl: './card.component.html',
  styleUrls: ['./card.component.sass']
})
export class CardComponent {

  @Input()
  icon = "icon"
  @Input()
  unit = "kWh"
  @Input()
  value: string | null = ""
  @Input()
  color: string | null = ""
}
