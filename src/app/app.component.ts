import { ViewportScroller } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { BehaviorSubject, delay, interval, map, Observable, switchMap, tap, timer } from 'rxjs';
import { InfluxService, S } from './influx.service';
import { Sample, Teleinfo } from './teleinfo';




@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent implements OnInit {

  scroll_position: number = 0
  autoscroll: boolean = true
  pivot_screen_size = 800

  day_char_offset$: BehaviorSubject<number> = new BehaviorSubject<number>(0)
  day_char_offset: number

  offset: Sample[] = [];

  daily: S[] = []

  date_label: string = "???"


  toggleDarkTheme(dark:boolean): void {
    document.body.classList.toggle('dark-theme',dark);
  }


  constructor(private influx: InfluxService, private scroller: ViewportScroller) {

    
    timer(0,60*60*1000).subscribe(tick =>{
      const date = new Date()
      const dark = date.getHours() > 20 || date.getHours() < 7
      this.toggleDarkTheme(dark)
    })

    this.day_char_offset = 0

    this.day_char_offset$.pipe(
      switchMap(day_offset => {
        return influx.daylyreport$(day_offset)
      })
    ).subscribe(tt => {
      this.daily = tt
    })

    this.day_char_offset$.subscribe(
      offset => {
        let d = new Date()
        d.setDate(d.getDate() - offset);
        const ret = d.toLocaleDateString('fr-FR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          weekday: 'long'
        })
        console.log("date label ", ret)


        if (offset == 0) {
          this.date_label = `Aujourd'hui, ${ret}`
        } else if (offset == 1) {
          this.date_label = `Hier,  ${ret}`
        } else {
          this.date_label = `il y a ${offset} jours,  ${ret}`
        }
      }
    )






    

  

   


  }
  ngOnInit(): void {
    const wide_screen = (window.innerWidth >= this.pivot_screen_size)

    if (wide_screen) {
      interval(4000).subscribe(counter => {
        if (this.autoscroll) {
          if (this.scroll_position == 0 && counter % 5 == 0) {
            this.scroll_position = 6
          } else {
            this.scroll_position = 0
          }
          this.scroller.scrollToAnchor(this.scroll_position.toString())
        }
      })

      interval(60000).subscribe(_ => {
        if (this.autoscroll) {
          //refresh chart periodically in auto scroll on the current day
          this.day_char_offset$.next(0)
        }
      })


    } else {
      interval(5000).subscribe(_ => {
        if (this.autoscroll) {
          this.scroll_position++;
          this.scroll_position %= 5
          this.scroller.scrollToAnchor(this.scroll_position.toString())
        }
      })
    }
  }

  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    this.autoscroll = (window.innerWidth <= this.pivot_screen_size)
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
