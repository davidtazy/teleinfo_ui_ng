import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { ChartConfiguration } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { concatAll, groupBy, map, mergeMap, Observable, of, pairwise, reduce } from 'rxjs';
import { Sample } from '../teleinfo';

interface S {
  date: Date,
  value: number
}

@Component({
  selector: 'app-chart[datas]',
  templateUrl: './chart.component.html',
  styleUrls: ['./chart.component.sass']
})
export class ChartComponent implements OnInit {



  @ViewChild(BaseChartDirective) chart!: BaseChartDirective;

  barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      { data: [], label: 'Consommation de la journée' }
    ]
  };
  barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: false,
  };
  @Input()
  datas: Observable<Sample[]> = of([])

  ngOnInit(): void {

    this.onRefresh()
  }

  compare(a: S, b: S) {
    if (a.date < b.date) {
      return -1;
    }
    if (a.date > b.date) {
      return 1;
    }
    return 0;
  }

  onRefresh() {
    console.log("refresh")
    this.datas.pipe(

      // Need to sum all the consumationsm "heure creuse", "heures pleines"...
      concatAll(),// Obs<Sample[]> ==> Obs<Samples> 
      groupBy(sample => sample.date), // group samples by date
      mergeMap(group$ => group$.pipe(
        //for each date sum the values
        reduce((acc: S, cur: Sample) => {
          acc.date = new Date(cur.date)
          acc.value += Number.parseInt(cur.value)
          return acc
        }, { date: new Date(), value: 0 } as S))
      ),// ==> Obs<Samples> 

      //Need to  sort by date all samples
      reduce((acc: S[], cur: S) => [...acc, cur], [] as S[]),// ==> Obs<Samples[]> 
      map(ss => ss.sort(this.compare)),// sort by time
      concatAll(), // ==> Obs<Samples> 

      //process the consumption by step
      pairwise(), // a,b,c ==> (a,b),(b,c)
      map(([a, b]) => {
        const ret: S = {
          date: a.date,
          value: b.value - a.value
        }
        return ret
      }),
      reduce((acc: S[], cur: S) => [...acc, cur], [] as S[]),//==> Obs<Samples[]> 

    )
      .subscribe(samples => {

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

      })
  }

  getColor(value: number): string {
    //value from 0 to 1
    var hue = ((1 - value) * 120).toString(10);
    return ["hsl(", hue, ",100%,50%)"].join("");
  }
}
