import { Component, Input } from '@angular/core';
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

  @Input()
  tomorrow = false

  constructor(private influx: InfluxService) {

    influx.stream$.subscribe(

      samples => {
        const teleinfo = new Teleinfo(samples, [])
        this.show = true

        this.tempoLabel ="Aujourd'hui "
        if (this.isRed(teleinfo)) {
          this.tempoColor = "red"
          
          if (this.tomorrow){
            this.tempoLabel = "Demain "
          }
          this.tempoLabel += "Rouge"
          return
        }
        if (this.isWhite(teleinfo)) {
          this.tempoColor = "orange"
          if (this.tomorrow){
            this.tempoLabel = "Demain "
          }
          this.tempoLabel += "Blanc"
          return
        }
        this.show = false
        this.tempoColor = "blue"
        this.tempoLabel = "Bleu"
      }
    )
  }

  isRed(teleinfo:Teleinfo){
    return (!this.tomorrow && teleinfo.isRedPeriod()) || (this.tomorrow && teleinfo.isTomorrowRedPeriod())
  }

  isWhite(teleinfo:Teleinfo){
    return (!this.tomorrow && teleinfo.isWhitePeriod()) || (this.tomorrow && teleinfo.isTomorrowWhitePeriod())
  }

}
