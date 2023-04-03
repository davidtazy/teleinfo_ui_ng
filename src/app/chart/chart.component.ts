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
      { data: [], label: 'Consommation de la journée', backgroundColor: '#9BD0F5' }
    ]
  };
  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
  };
  @Input()
  datas: S[] = []



  ngOnChanges(changes: SimpleChanges): void {

    if (this.datas.length == 0) {
      return
    }

    console.log("ng on change")

    const samples = this.datas

    //console.log(JSON.stringify(samples))

    this.barChartData.datasets[0].data = []
    this.barChartData.labels = []

    //fill dataset
    for (const sample of samples) {
      this.barChartData.datasets[0].data.push(sample.value)

      const label = `${("0" + sample.date.getHours()).slice(-2)}:${("0" + sample.date.getMinutes()).slice(-2)}`;
      this.barChartData.labels.push(label)
    }

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
