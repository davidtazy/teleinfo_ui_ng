import { Component } from '@angular/core';
import { map, Observable } from 'rxjs';
import { InfluxService } from '../influx.service';
import { Teleinfo } from '../teleinfo';

@Component({
  selector: 'app-tempo-notifier',
  templateUrl: './tempo-notifier.component.html',
  styleUrls: ['./tempo-notifier.component.sass']
})
export class TempoNotifierComponent {
  tempoColor: string = "blue"
  tempoLabel: string = "Bleue"
  show: boolean = false

  constructor(private influx: InfluxService) {

    influx.stream$.subscribe(

      samples => {
        const teleinfo = new Teleinfo(samples, [])
        this.show = true
        if (teleinfo.isRedPeriod()) {
          this.tempoColor = "red"
          this.tempoLabel = "Rouge"
          return
        }
        if (teleinfo.isWhitePeriod()) {
          this.tempoColor = "orange"
          this.tempoLabel = "Blanc"
          return
        }
        this.show = false
        this.tempoColor = "blue"
        this.tempoLabel = "Bleu"
      }
    )
  }

}
