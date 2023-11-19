import { Injectable } from '@angular/core';
import { QueryApi, InfluxDB } from "@influxdata/influxdb-client";
import { bufferTime, filter, from, groupBy, interval, map, mergeMap, Observable, share, switchMap, tap, timer, reduce, concatAll, pairwise } from 'rxjs';
import { Sample } from "./teleinfo"
import { environment } from '../environments/environment';
import { InfluxClientService } from './influx-client.service';
export interface InfluxQueryState {
  values: Sample[];
  isLoading: boolean;
};


export interface S {
  date: Date,
  import_power: number
  solar_power: number
  color: string
}


@Injectable({
  providedIn: 'root'
})
export class InfluxService {

  private bucket = "teleinfo";
  private period_ms = 2000;

  private stream_cache: Observable<Sample[]> | null = null
  private offset_cache: Observable<Sample[]> | null = null

  constructor(private influx_client: InfluxClientService) { }

  public get stream$(): Observable<Sample[]> {

    if (this.stream_cache !== null) {
      return this.stream_cache
    }

    const fluxQuery = this.getPeriodicQuery()

    this.stream_cache = interval(this.period_ms).pipe(
      switchMap((_) => {

        return this.influx_client.query_rows(fluxQuery)
          .pipe(
            bufferTime(this.period_ms / 3),
            filter(samples => samples.length > 0),
            map(samples => samples.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0)))
          )
      }),
      share()
    )
    return this.stream_cache
  }

  public get offset$(): Observable<Sample[]> {
    if (this.offset_cache !== null) {
      return this.offset_cache
    }
    this.offset_cache = timer(1000, 60000).pipe(
      switchMap((_) => {
        return from(this.influx_client.query_rows(this.getOriginQuery(new Date())))
          .pipe(
            bufferTime(1000),
            map(samples => samples.sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0)))
          )
      }),
      share()
    )

    return this.offset_cache

  }

  public daylyreport$(offset: number): Observable<S[]> {

    const fluxQuery = (offset <= 0) ? this.getDailyReportQuery() : this.getPastReportQuery(offset)


    const tt: Observable<S[]> = this.influx_client.query_rows(fluxQuery)
      .pipe(
        bufferTime<Sample>(1000),
        filter<Sample[]>(samples => samples.length > 0),
        // Need to sum all the consumationsm "heure creuse", "heures pleines"...
        concatAll<Sample[]>(),// Obs<Sample[]> ==> Obs<Samples>

        groupBy<Sample, string>(sample => sample.date), // group samples by date

        mergeMap(group$ => group$.pipe(
          //for each date sum the values
          reduce((acc: S, cur: Sample) => {

            if (cur.name == "PTEC") {
              acc.color = cur.value
            }else if(cur.name == "total_solar_production_wh"){
              
              acc.solar_power += (cur.value as unknown as number)
            } else {
              acc.date = new Date(cur.date)
              acc.import_power += Number.parseInt(cur.value)
            }

            return acc
          }, { date: new Date(), import_power: 0,solar_power:0 } as S))
        ),// ==> Obs<Samples> 

        tap(sample => this.price_to_color(sample)),

        // split the pipe to avoid compilation error https://github.com/ReactiveX/rxjs/issues/5599  
      ).pipe(

        //Need to  sort by date all samples
        reduce((acc: S[], cur: S) => [...acc, cur], [] as S[]),// ==> Obs<Samples[]> 
        map(ss => ss.sort(this.compare)),// sort by time

        //process the consumption by period of subsequent samples
        concatAll<S[]>(), // ==> Obs<Samples> 
        pairwise<S>(), // a,b,c ==> (a,b),(b,c)
        map(([a, b]) => ({ date: a.date, import_power: b.import_power - a.import_power,solar_power:b.solar_power - a.solar_power, color: b.color })),
        //regroup in one array
        reduce<S, S[]>((acc: S[], cur: S) => [...acc, cur], [] as S[])//==> Obs<Samples[]> 

      )

    return tt

  }
  price_to_color(sample: S): void {

    if (sample.color === undefined) {
      sample.color = "black"
      return
    }

    let color = ""
    if (sample.color.startsWith("HC")) {
      color = "light"
    }

    if (sample.color.endsWith("JB")) {
      color += "blue"
    }
    else if (sample.color.endsWith("JW")) {
      color += "grey"
    }
    else if (sample.color.endsWith("JR")) {
      color += "red"
    }
    else {
      color += "black"
    }

    sample.color = color
  }

  getDailyReportQuery() {
    return `import "timezone"
import "date"
option location = timezone.location(name: "Europe/Paris")
from(bucket: "teleinfo")
  |> range(start: date.sub( d:150m, from:today() ) )
  |> filter(fn: (r) => r._measurement =~  /BBR[A-Z]*/ or r._measurement == "PTEC" or r._measurement == "total_solar_production_wh" )
  |> keep(columns: ["_time", "_measurement","_value"])
  |> aggregateWindow(every: 30m, fn: last)`;
  }

  getPastReportQuery(delta: number) {

    const begin = `${delta}d`
    const end = `${delta - 1}d`

    return `import "timezone"
import "date"
option location = timezone.location(name: "Europe/Paris")
 
delta= date.sub( d:150m, from:today() )
begin = date.sub(d:${begin} , from:delta )
end= date.sub( d:${end}, from:today() )
 
from(bucket: "teleinfo")
    |> range(start: begin, stop:end )
    |> filter(fn: (r) => r._measurement =~  /BBR[A-Z]*/ or r._measurement == "PTEC" or r._measurement == "total_solar_production_wh")
    |> keep(columns: ["_time", "_measurement","_value"])
    |> aggregateWindow(every: 30m, fn: last)`
  }

  getPeriodicQuery() {
    return `import "timezone"
option location = timezone.location(name: "Europe/Paris")
from(bucket: "${this.bucket}")
|> range(start: -1h)
|> filter(fn: (r) => r["_field"] == "value")
|> last()`;
  }


  getOriginQuery(now: Date): string {
    // HEURES CREUSE begins at 10pm to 6AM
    let first_query = `import "timezone"
import "date"
option location = timezone.location(name: "Europe/Paris")
from(bucket: "${this.bucket}")
|> range(start: date.sub( d:2h, from:today() ) )
|> filter(fn: (r) => r["_field"] == "value")
|> first()`;

    let evening_query = `import "timezone"
import "date"
option location = timezone.location(name: "Europe/Paris")
from(bucket: "${this.bucket}")
|> range(start: date.add( d:6h, to:today() ) )
|> filter(fn: (r) => r["_field"] == "value")
|> first()`;
    if (now.getHours() >= 22) {
      // in the evening (from  10pm to midnight)
      // nightly counter is reset for the new night
      // dayly counter is kept untill midnight
      return evening_query;
    } else {
      // from midnight to 10pm
      // nightly counter count from 10pm the previous day
      // daily counter too
      return first_query;
    }
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
}
