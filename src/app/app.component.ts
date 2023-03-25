import { ViewportScroller } from '@angular/common';
import { SafeCall } from '@angular/compiler';
import { Component } from '@angular/core';
import { interval, map, Observable, of, sample } from 'rxjs';
import { InfluxService } from './influx.service';
import { Sample, Teleinfo } from './teleinfo';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent {

  papp$: Observable<string | null>
  hc$: Observable<string | null>
  hp$: Observable<string | null>
  papp_color: string = "purple"
  scroll_position: number = 0

  offset: Sample[] = [];

  constructor(private influx: InfluxService, private scroller: ViewportScroller) {

    influx.offset$.subscribe(
      samples => this.offset = samples
    )

    this.papp$ = influx.stream$.pipe(
      map(
        samples => {
          const teleinfo = new Teleinfo(samples, [])
          const papp = teleinfo.getInstantPower()
          const percent = Math.min(1, papp.watts / 3000);
          this.papp_color = this.getColor(percent);
          return papp.renderTokW()
        }
      )
    )
    this.hc$ = influx.stream$.pipe(
      map(
        samples => {
          const teleinfo = new Teleinfo(samples, this.offset)

          return teleinfo.getNightlyConsumption().renderTokWh()
        }
      )
    )

    this.hp$ = influx.stream$.pipe(
      map(
        samples => {
          const teleinfo = new Teleinfo(samples, this.offset)
          return teleinfo.getDailyConsumption().renderTokWh()
        }
      )
    )
    /*
        interval(5000).subscribe(_ => {
          this.scroll_position++;
          this.scroll_position %= 4
          this.scroller.scrollToAnchor(this.scroll_position.toString())
        })
        */



  }

  title = 'teleinfo-ui-ng';

  getClock() {
    const date = new Date();
    return `${date.getHours()}:${("0" + date.getMinutes()).slice(-2)}`;
  }

  getColor(value: number): string {
    //value from 0 to 1
    var hue = ((1 - value) * 120).toString(10);
    return ["hsl(", hue, ",100%,50%)"].join("");
  }

}
