import { ViewportScroller } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { interval, map, Observable } from 'rxjs';
import { InfluxService } from './influx.service';
import { Sample, Teleinfo } from './teleinfo';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent implements OnInit {

  papp_sample$: Observable<number>
  papp$: Observable<string | null>
  hc$: Observable<string | null>
  hp$: Observable<string | null>
  papp_color: string = "purple"
  scroll_position: number = 0
  autoscroll: boolean = true
  pivot_screen_size = 800

  offset: Sample[] = [];

  daily$: Observable<Sample[]>

  constructor(private influx: InfluxService, private scroller: ViewportScroller) {

    influx.offset$.subscribe(
      samples => this.offset = samples
    )

    this.daily$ = influx.daylyreport$

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

    this.papp_sample$ = influx.stream$.pipe(
      map(
        samples => {
          const teleinfo = new Teleinfo(samples, [])
          const papp = teleinfo.getInstantPower()
          return papp.watts
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

    const sub = interval(5000).subscribe(_ => {
      if (this.autoscroll) {
        this.scroll_position++;
        this.scroll_position %= 4
        this.scroller.scrollToAnchor(this.scroll_position.toString())
      }
    })
  }
  ngOnInit(): void {
    this.autoscroll = (window.innerWidth <= this.pivot_screen_size)
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    this.autoscroll = (window.innerWidth <= this.pivot_screen_size)
  }


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
