import { Component } from '@angular/core';
import { InfluxService } from '../influx.service';

@Component({
  selector: 'app-debug',
  templateUrl: './debug.component.html',
  styleUrls: ['./debug.component.sass']
})
export class DebugComponent {
  public constructor(public influx: InfluxService) { }
}
