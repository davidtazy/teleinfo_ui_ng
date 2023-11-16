import { Component, Input } from '@angular/core';
import { Sample, Teleinfo } from '../teleinfo';
import { InfluxService } from '../influx.service';
import { Observable, combineLatest, interval, map,of,share } from 'rxjs';


type CardData ={
  id:string
  icon:string
  value$:Observable<string>
  unit: string
  color$: Observable<string>
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.sass']
})
export class DashboardComponent {

  
  
  

  teleinfo$: Observable<Teleinfo>
  papp$ : Observable<string>
  solar$: Observable<string>
  hc$: Observable<string>
  hp$: Observable<string>
  clock$: Observable<string>
  solar_total$: Observable<string>
  papp_color$: Observable<string>

  cards : CardData[]
  

  constructor(private influx: InfluxService){
    
    this.teleinfo$  = combineLatest([influx.stream$,influx.offset$]).pipe(
        map( ([stream,offset])=>new Teleinfo(stream,offset)),
        share()
    )

    this.papp$ = this.teleinfo$.pipe(
      map(
        (teleinfo:Teleinfo) => teleinfo.getInstantPower().renderTokW()
      )
    )
    
    this.papp_color$ = this.teleinfo$.pipe(
      map(
        (teleinfo:Teleinfo) => teleinfo.getInstantPower().watts
      ),
      map(papp_watts =>{
        const percent = Math.min(1, papp_watts / 3000);
        return  this.getColor(percent);
      })
    )

    this.solar$ = this.teleinfo$.pipe(
      map(
        (teleinfo:Teleinfo) => teleinfo.getInstantSolarPower().renderTokW()
      )
    )

    this.hc$ = this.teleinfo$.pipe(
      map(
        (teleinfo:Teleinfo) => teleinfo.getNightlyConsumption().renderTokWh()
      )
    )

    this.hp$ = this.teleinfo$.pipe(
      map(
        (teleinfo:Teleinfo) => teleinfo.getDailyConsumption().renderTokWh()
      )
    )

    this.solar_total$ = this.teleinfo$.pipe(
      map(
        (teleinfo:Teleinfo) => teleinfo.getDailySolarProduction().renderTokWh()
      )
    )
    this.clock$ = interval(1000).pipe(
        map(tick => new Date()),
        map((date:Date) => `${date.getHours()}:${("0" + date.getMinutes()).slice(-2)}`)
    )



    this.cards = [
      {id:"0",icon:"assets/grid.png",unit:"kW", value$:this.papp$, color$:this.papp_color$},
      {id:"1",icon:"assets/solar-panel.png",unit:"kW", value$:this.solar$, color$:of("darkGrey")},

      {id:"2",icon:"assets/cheap.png",unit:"kWh", value$:this.hc$, color$:of("darkGrey")},
      {id:"3",icon:"assets/expensive.png",unit:"kWh", value$:this.hp$, color$:of("darkGrey")},

      {id:"4",icon:"assets/clock.png",unit:"", value$:this.clock$, color$:of("darkGrey")},
      {id:"5",icon:"assets/production.png",unit:"kWh", value$:this.solar_total$, color$:of("darkGrey")},
    ]
   
      
  }

  getColor(value: number): string {
    //value from 0 to 1
    var hue = ((1 - value) * 120).toString(10);
    return ["hsl(", hue, ",100%,50%)"].join("");
  }


}
