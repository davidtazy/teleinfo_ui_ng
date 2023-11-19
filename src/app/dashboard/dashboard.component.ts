import { Component } from '@angular/core';
import { Energy, Teleinfo } from '../teleinfo';
import { InfluxService } from '../influx.service';
import { BehaviorSubject, Observable, combineLatest, interval, map, of, share } from 'rxjs';
import Rainbow, { rainbow } from '@indot/rainbowvis';

type CardData = {
  id: string
  icon: string
  value$: Observable<string>
  unit$: Observable<string>
  color$: Observable<string>
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.sass']
})
export class DashboardComponent {


  solar_colors: Rainbow = rainbow().overColors('white', 'lightpink', 'deeppink', 'darkviolet').withRange(0, 100);


  teleinfo$: Observable<Teleinfo>
  papp$ = new BehaviorSubject("")
  solar$ = new BehaviorSubject("")
  hc$ = new BehaviorSubject("")
  hp$ = new BehaviorSubject("")
  clock$ = new BehaviorSubject("")
  solar_total$ = new BehaviorSubject("")
  papp_color$ = new BehaviorSubject("")
  solar_color$ = new BehaviorSubject("")
  total_solar_unit$ = new BehaviorSubject("")

  cards: CardData[]


  constructor(private influx: InfluxService) {

    this.teleinfo$ = combineLatest([influx.stream$, influx.offset$]).pipe(
      map(([stream, offset]) => new Teleinfo(stream, offset)),
      share()
    )

    this.teleinfo$.subscribe((teleinfo: Teleinfo) => {
      const instant_power = teleinfo.getInstantPower()
      this.papp$.next(instant_power.renderTokW())

      let percent = Math.min(1, instant_power.watts / 3000);
      this.papp_color$.next(this.getColor(percent))

      const solar_power = teleinfo.getInstantSolarPower()
      this.solar$.next(solar_power.renderTokW())
      percent = 100 * solar_power.watts / 2800
      const color = this.solar_colors.colorAt(percent)
      this.solar_color$.next("#" + color)

      this.hc$.next(teleinfo.getNightlyConsumption().renderTokWh())
      this.hp$.next(teleinfo.getDailyConsumption().renderTokWh())

      if (this.show_state()) {
        this.total_solar_unit$.next("")
        this.solar_total$.next(teleinfo.getSoftSolarState())
      } else {
        this.total_solar_unit$.next("kWh")
        this.solar_total$.next(teleinfo.getDailySolarProduction().renderTokWh())
      }

      const date = new Date()
      this.clock$.next(`${date.getHours()}:${("0" + date.getMinutes()).slice(-2)}`)

    }
    )

    this.cards = [
      { id: "0", icon: "assets/grid.png", unit$: of("kW"), value$: this.papp$, color$: this.papp_color$ },
      { id: "1", icon: "assets/solar-panel.png", unit$: of("kW"), value$: this.solar$, color$: this.solar_color$ },

      { id: "2", icon: "assets/cheap.png", unit$: of("kWh"), value$: this.hc$, color$: of("white") },
      { id: "3", icon: "assets/expensive.png", unit$: of("kWh"), value$: this.hp$, color$: of("white") },

      { id: "4", icon: "assets/clock.png", unit$: of(""), value$: this.clock$, color$: of("white") },
      { id: "5", icon: "assets/production.png", unit$: this.total_solar_unit$, value$: this.solar_total$, color$: of("white") },
    ]

  }

  getColor(value: number): string {
    //value from 0 to 1
    var hue = ((1 - value) * 120).toString(10);
    return ["hsl(", hue, ",100%,50%)"].join("");
  }

  show_state() {
    const date = new Date()
    const secs = date.getSeconds() % 10
    return secs < 7
  }


}
