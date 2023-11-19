import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { S } from '../influx.service';


@Component({
  selector: 'app-chart[datas]',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.sass']
})
export class ChartComponent implements OnChanges {


  @ViewChild(BaseChartDirective) chart!: BaseChartDirective;

  barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      { data: [], backgroundColor: [] },
      { data: [], backgroundColor: [] }
    ],

  };
  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales:{
      x:{
        stacked:true
      },
      y:{
        max:1100,
        suggestedMin:0,
        stacked:true
      }
    }
  };

  @Input()
  datas: S[] = []

  ngOnChanges(changes: SimpleChanges): void {

    if (this.datas.length == 0) {
      return
    }


    const samples = this.datas

    //console.log(JSON.stringify(samples))

    this.barChartData.datasets[0].data = []
    this.barChartData.datasets[0].backgroundColor = []
    this.barChartData.labels = []

    //fill dataset
    const colors: string[] = []
    const solar_colors: string[] = []
    for (const sample of samples) {
      const solar_power = Math.max(0,sample.solar_power)
      this.barChartData.datasets[0].data.push(solar_power)
      this.barChartData.datasets[1].data.push(sample.import_power)
      
      colors.push(sample.color)
      solar_colors.push("#FFD700")

      const label = `${("0" + sample.date.getHours()).slice(-2)}:${("0" + sample.date.getMinutes()).slice(-2)}`;
      this.barChartData.labels.push(label)
    }
    this.barChartData.datasets[0].backgroundColor = solar_colors
    this.barChartData.datasets[1].backgroundColor = colors

    //ensure abscisse always the same size
    const missing_labels = 52 - this.barChartData.labels.length
    for (let i = 0; i < missing_labels; i++) {
      this.barChartData.labels.push("--:--")
    }

    this.chart.update()


  }

  getColor(value: number): string {
    //value from 0 to 1
    var hue = ((1 - value) * 120).toString(10);
    return ["hsl(", hue, ",100%,50%)"].join("");
  }
}
