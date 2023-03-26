import { AfterViewInit, Component, ElementRef, HostListener, Input, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject, bufferCount, Observable, of, takeLast } from 'rxjs';
import { Sample } from '../teleinfo';

@Component({
  selector: 'app-chart[datas]',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.sass']
})
export class ChartComponent implements OnInit, AfterViewInit {

  width: number = 0
  height: number = 0

  history: number[] = []

  @Input()
  datas: Observable<number> = of(0)

  @Input()
  max_value: number = 3000

  @Input()
  max_count: number = 100

  @ViewChild('canvas', { static: true })
  canvas: ElementRef<HTMLCanvasElement> | undefined;

  private ctx: CanvasRenderingContext2D | null = null;

  ngOnInit(): void {
    this.onWindowResize()

    this.datas.subscribe(value => {
      if (this.ctx == null) { return }

      this.history.unshift(value)

      if (this.history.length > this.max_count) {
        this.history.pop()
      }

      console.log(this.history)
      this.draw(this.ctx, this.history)
    })



  }

  ngAfterViewInit(): void {
    if (this.canvas === undefined) {
      throw new Error("canvas is null")
    }
    this.ctx = this.canvas.nativeElement.getContext('2d');
    if (this.ctx === null) {
      throw new Error("context is null")
    }
  }

  draw(ctx: CanvasRenderingContext2D, values: number[]) {

    ctx.clearRect(0, 0, this.width, this.height);
    let index = 0
    for (const value of values) {
      this.draw_bar(ctx, value, index)
      index++
    }
  }

  draw_bar(ctx: CanvasRenderingContext2D, value: number, position: number) {
    const bar_height = this.height * value / this.max_value
    const bar_witdh = this.width / this.max_count
    const left = this.width - (bar_witdh * (position + 1))
    const top = this.height - bar_height

    ctx.fillStyle = this.getColor(Math.min(1, value / this.max_value))
    ctx.fillRect(left, top, bar_witdh, bar_height);

  }

  getColor(value: number): string {
    //value from 0 to 1
    var hue = ((1 - value) * 120).toString(10);
    return ["hsl(", hue, ",100%,50%)"].join("");
  }



  @HostListener('window:resize', ['$event'])
  onWindowResize() {
    this.width = window.innerWidth
    this.height = window.innerHeight

    console.log("new size is", this.width, this.height)
  }
}
