import { ViewportScroller } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { BehaviorSubject, interval, map, Observable, switchMap, tap } from 'rxjs';
import { InfluxService, S } from './influx.service';
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

  day_char_offset$: BehaviorSubject<number> = new BehaviorSubject<number>(0)
  day_char_offset: number

  offset: Sample[] = [];

  daily: S[] = []

  date_label: string = "???"


  constructor(private influx: InfluxService, private scroller: ViewportScroller) {

    this.day_char_offset = 0

    this.day_char_offset$.pipe(
      switchMap(day_offset => {
        console.log("received daily report request for day", day_offset)
        return influx.daylyreport$(day_offset)
          .pipe(
            tap(tt => console.log("fsdfsdfsdfsd", tt)),
          )
      })
    ).subscribe(tt => {
      console.log(tt)
      this.daily = tt as S[]
    }
    )

    this.day_char_offset$.subscribe(
      offset => {
        let d = new Date()
        d.setDate(d.getDate() - offset);
        const ret = d.toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
        console.log("date label ", ret)

        this.date_label = ret
      }
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

    influx.offset$.subscribe(
      samples => this.offset = samples
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

  onNext() {
    if (this.day_char_offset > 0) {
      this.day_char_offset--
      console.log("on next", this.day_char_offset)
      this.day_char_offset$.next(this.day_char_offset)
    }
  }
  onPrevious() {
    this.day_char_offset++
    console.log("on previous", this.day_char_offset)
    this.day_char_offset$.next(this.day_char_offset)
  }

}
